import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Zap, Activity, RefreshCw, Layers, ShieldCheck, Cpu, Globe, Sliders } from 'lucide-react';
import { Language } from '../../data/translations';

interface AhaNode extends d3.SimulationNodeDatum {
  id: string;
  labelRu: string;
  labelEn: string;
  ip: string;
  type: 'client' | 'router' | 'p2p' | 'compressor' | 'server' | 'fallback';
  status: 'active' | 'optimal' | 'standby';
  latency: string;
  detailsRu: string;
  detailsEn: string;
  color: string;
}

interface AhaLink extends d3.SimulationLinkDatum<AhaNode> {
  source: string | AhaNode;
  target: string | AhaNode;
  protocol: string;
  speed: string;
  type: 'ipv6-primary' | 'p2p-direct' | 'fallback-v4';
}

interface AhaProtocolDiagramProps {
  lang: Language;
}

const NODES_DATA: AhaNode[] = [
  {
    id: 'client',
    labelRu: 'Локальный узел (Client Host)',
    labelEn: 'Local Endpoint (Client Host)',
    ip: '2001:db8:85a3::1',
    type: 'client',
    status: 'optimal',
    latency: '0.2 ms',
    detailsRu: 'Инициатор AHA Protocol. Маркирует локальный сокет 20-битным Flow Label и согласует Jumbo MTU.',
    detailsEn: 'AHA Protocol initiator. Marks local socket with 20-bit Flow Label and negotiates Jumbo MTU.',
    color: '#ff4d4d'
  },
  {
    id: 'flow_labeler',
    labelRu: 'Аппаратный маркировщик (Flow Labeler)',
    labelEn: 'Hardware Flow Labeler (IPv6 Tag)',
    ip: '2001:db8:85a3::10',
    type: 'router',
    status: 'active',
    latency: '0.4 ms',
    detailsRu: 'Инжектирует утилитарный хэш 0x6AHA в поле Flow Label IPv6 кадра для аппаратной L3 коммутации.',
    detailsEn: 'Injects utility hash 0x6AHA into IPv6 Flow Label field for line-rate L3 hardware switching.',
    color: '#f59e0b'
  },
  {
    id: 'zero_nat_switch',
    labelRu: 'Zero-NAT P2P Маршрутизатор',
    labelEn: 'Zero-NAT Direct P2P Router',
    ip: '2001:db8:85a3::20',
    type: 'p2p',
    status: 'optimal',
    latency: '0.7 ms',
    detailsRu: 'Прямой P2P транспорт без CGNAT. Полностью устраняет задержки трансляции портов и адресов.',
    detailsEn: 'Direct P2P transport without CGNAT. Completely eliminates port/address translation latencies.',
    color: '#10b981'
  },
  {
    id: 'compressor',
    labelRu: 'Мультипотоковый Компрессор',
    labelEn: 'Multipath Stream Compressor',
    ip: '2001:db8:85a3::30',
    type: 'compressor',
    status: 'active',
    latency: '0.5 ms',
    detailsRu: 'Сжимает метаданные и распределяет полезную нагрузку по 4 параллельным виртуальным IPv6 потокам.',
    detailsEn: 'Compresses metadata and scatters payloads across 4 parallel virtual IPv6 transport streams.',
    color: '#a855f7'
  },
  {
    id: 'server',
    labelRu: 'AHA Cloud Gateway (Master Node)',
    labelEn: 'AHA Cloud Gateway (Master Node)',
    ip: '2001:db8:85a3::8a2e:370:7334',
    type: 'server',
    status: 'optimal',
    latency: '0.8 ms',
    detailsRu: 'Целевой облачный сервер AHA Core. Принимает гигабитные капли данных с полной аппаратной валидацией.',
    detailsEn: 'Destination AHA Core Cloud Server. Accepts gigabit data bursts with hardware validation.',
    color: '#06b6d4'
  },
  {
    id: 'fallback_relay',
    labelRu: 'Dual-Stack Relay (IPv4 Fallback)',
    labelEn: 'Dual-Stack Relay (IPv4 Fallback)',
    ip: '192.168.1.254 (6to4 Tunnel)',
    type: 'fallback',
    status: 'standby',
    latency: '4.2 ms',
    detailsRu: 'Резервный шлюз Dual-Stack для устаревших IPv4 сетей. Активируется только при сбое IPv6 маршрута.',
    detailsEn: 'Failover Dual-Stack gateway for legacy IPv4 segments. Engages only upon IPv6 route disruption.',
    color: '#6b7280'
  }
];

const LINKS_DATA: AhaLink[] = [
  { source: 'client', target: 'flow_labeler', protocol: 'IPv6-Flow-Tag', speed: '10 Gbps', type: 'ipv6-primary' },
  { source: 'flow_labeler', target: 'zero_nat_switch', protocol: 'Zero-NAT P2P', speed: '25 Gbps', type: 'p2p-direct' },
  { source: 'zero_nat_switch', target: 'compressor', protocol: 'Multipath-v6', speed: '40 Gbps', type: 'p2p-direct' },
  { source: 'compressor', target: 'server', protocol: 'AHA-HYPER-v6', speed: '100 Gbps', type: 'ipv6-primary' },
  { source: 'client', target: 'fallback_relay', protocol: 'IPv4 6to4 Tunnel', speed: '1 Gbps', type: 'fallback-v4' },
  { source: 'fallback_relay', target: 'server', protocol: 'Dual-Stack IPv4/v6', speed: '1 Gbps', type: 'fallback-v4' }
];

export const AhaProtocolDiagram: React.FC<AhaProtocolDiagramProps> = ({ lang }) => {
  const isRu = lang === 'ru';
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<AhaNode | null>(NODES_DATA[0]);
  const [animatingTraffic, setAnimatingTraffic] = useState(true);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 360;
    const isMobile = width < 500;
    const height = isMobile ? 320 : 400;

    // Clear previous SVG contents
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Create container group for zoom/pan
    const g = svg.append('g');

    // Create force simulation
    const nodesCopy = JSON.parse(JSON.stringify(NODES_DATA)) as AhaNode[];
    const linksCopy = JSON.parse(JSON.stringify(LINKS_DATA)) as AhaLink[];

    const linkDistance = isMobile ? 70 : 120;
    const chargeStrength = isMobile ? -200 : -400;
    const collideRadius = isMobile ? 30 : 40;

    const simulation = d3.forceSimulation<AhaNode>(nodesCopy)
      .force('link', d3.forceLink<AhaNode, AhaLink>(linksCopy).id(d => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(collideRadius));

    // Render Links
    const linkGroup = g.append('g').attr('class', 'links');

    const links = linkGroup.selectAll('line')
      .data(linksCopy)
      .enter()
      .append('line')
      .attr('stroke', d => d.type === 'ipv6-primary' ? '#ff4d4d' : d.type === 'p2p-direct' ? '#10b981' : '#4b5563')
      .attr('stroke-width', d => d.type === 'fallback-v4' ? 1.5 : 2.5)
      .attr('stroke-dasharray', d => d.type === 'fallback-v4' ? '4 4' : 'none')
      .attr('opacity', 0.8);

    // Render Link Labels
    const linkLabels = g.append('g')
      .selectAll('text')
      .data(linksCopy)
      .enter()
      .append('text')
      .text(d => d.protocol)
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', '#9ca3af')
      .attr('text-anchor', 'middle')
      .attr('dy', -4);

    // Render Animated Traffic Pulses along links
    const pulseGroup = g.append('g').attr('class', 'pulses');

    if (animatingTraffic) {
      linksCopy.forEach((link, idx) => {
        const pulse = pulseGroup.append('circle')
          .attr('r', 3.5)
          .attr('fill', link.type === 'p2p-direct' ? '#34d399' : link.type === 'ipv6-primary' ? '#ff6666' : '#9ca3af')
          .attr('shadow', '0 0 8px currentColor');

        function animatePulse() {
          pulse
            .attr('cx', typeof link.source === 'object' ? (link.source as AhaNode).x || 0 : 0)
            .attr('cy', typeof link.source === 'object' ? (link.source as AhaNode).y || 0 : 0)
            .transition()
            .duration(2000 + idx * 400)
            .ease(d3.easeLinear)
            .attr('cx', typeof link.target === 'object' ? (link.target as AhaNode).x || 0 : 0)
            .attr('cy', typeof link.target === 'object' ? (link.target as AhaNode).y || 0 : 0)
            .on('end', animatePulse);
        }

        // Start animation after layout tick settles
        setTimeout(animatePulse, 500);
      });
    }

    // Drag behavior
    const drag = d3.drag<SVGGElement, AhaNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // Render Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const nodes = nodeGroup.selectAll('g')
      .data(nodesCopy)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(drag as any)
      .on('click', (event, d) => {
        const original = NODES_DATA.find(n => n.id === d.id);
        if (original) setSelectedNode(original);
      });

    // Node Glowing Outer Ring
    nodes.append('circle')
      .attr('r', 22)
      .attr('fill', d => d.color)
      .attr('opacity', 0.15)
      .attr('class', 'animate-pulse');

    // Node Core Circle
    nodes.append('circle')
      .attr('r', 16)
      .attr('fill', '#15101e')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2.5);

    // Node Type Icon / Indicator
    nodes.append('circle')
      .attr('r', 6)
      .attr('fill', d => d.color);

    // Node Text Labels
    nodes.append('text')
      .text(d => isRu ? d.labelRu.split(' ')[0] : d.labelEn.split(' ')[0])
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif');

    // Node IP Address
    nodes.append('text')
      .text(d => d.ip)
      .attr('y', 42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    // Simulation Tick Listener
    simulation.on('tick', () => {
      links
        .attr('x1', d => (d.source as AhaNode).x || 0)
        .attr('y1', d => (d.source as AhaNode).y || 0)
        .attr('x2', d => (d.target as AhaNode).x || 0)
        .attr('y2', d => (d.target as AhaNode).y || 0);

      linkLabels
        .attr('x', d => (((d.source as AhaNode).x || 0) + ((d.target as AhaNode).x || 0)) / 2)
        .attr('y', d => (((d.source as AhaNode).y || 0) + ((d.target as AhaNode).y || 0)) / 2);

      nodes.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [lang, animatingTraffic]);

  return (
    <div className="my-6 p-4 sm:p-6 bg-[#120d1a] border border-[#3d2b4f] rounded-3xl space-y-4 shadow-xl">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#3d2b4f] pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#ff4d4d]/20 border border-[#ff4d4d]/40 rounded-xl text-[#ff4d4d]">
            <Zap size={20} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <span>{isRu ? 'Интерактивная архитектурная диаграмма D3 (AHA Protocol v6)' : 'Interactive D3 Architectural Diagram (AHA Protocol v6)'}</span>
            </h4>
            <p className="text-xs text-gray-400">
              {isRu ? 'Нажмите на любой узел для просмотра характеристик пакетов и IPv6 потока' : 'Click any node to inspect IPv6 flow characteristics'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnimatingTraffic(!animatingTraffic)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              animatingTraffic
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Activity size={13} />
            <span>{isRu ? (animatingTraffic ? 'Трафик: ВКЛ' : 'Трафик: ВЫКЛ') : (animatingTraffic ? 'Traffic: ON' : 'Traffic: OFF')}</span>
          </button>
        </div>
      </div>

      {/* D3 Canvas Container */}
      <div ref={containerRef} className="relative w-full bg-[#0a0710] border border-[#2d1b3d] rounded-2xl overflow-hidden min-h-[320px] sm:min-h-[380px] flex items-center justify-center">
        <svg ref={svgRef} className="w-full h-[320px] sm:h-[400px] cursor-grab active:cursor-grabbing" />

        {/* Floating Legend */}
        <div className="absolute top-3 left-3 p-2.5 bg-[#15101e]/80 backdrop-blur-md border border-[#3d2b4f] rounded-xl text-[10px] space-y-1.5 font-mono text-gray-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 bg-[#ff4d4d]" />
            <span>IPv6 Native High-Speed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 bg-[#10b981]" />
            <span>Zero-NAT Direct P2P</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 bg-gray-500 border-t border-dashed" />
            <span>Dual-Stack IPv4 Fallback</span>
          </div>
        </div>
      </div>

      {/* Selected Node Details Card */}
      {selectedNode && (
        <div className="p-4 bg-[#1a1226] border border-[#3d2b4f] rounded-2xl space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <span className="text-sm font-black text-white">
                {isRu ? selectedNode.labelRu : selectedNode.labelEn}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-gray-300">
                {selectedNode.ip}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {isRu ? `Задержка: ${selectedNode.latency}` : `Latency: ${selectedNode.latency}`}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {isRu ? selectedNode.detailsRu : selectedNode.detailsEn}
          </p>
        </div>
      )}
    </div>
  );
};
