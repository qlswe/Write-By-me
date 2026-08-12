import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  MapPin, 
  Compass, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Calendar, 
  Clock, 
  Sparkles, 
  Filter, 
  Crosshair, 
  Info,
  ChevronRight,
  Eye,
  Swords,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Language, translations } from '../../data/translations';
import { getEventProgress, formatCountdown } from '../../utils/time';

interface EventLocation {
  id: string;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  type: 'daily' | 'weekly' | 'special';
  icon?: string;
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  region?: string;
  time?: string;
  participantsCount?: number;
}

interface AhaMapProps {
  lang: Language;
  events?: any[];
  onSelectEvent?: (event: any) => void;
  className?: string;
  lowPerfMode?: boolean;
}

// Default fallback world hotspots for chronicle events if coordinates are not provided
const DEFAULT_HOTSPOTS: Omit<EventLocation, 'title' | 'description'>[] = [
  { id: 'tokyo-hub', type: 'daily', lat: 35.6762, lng: 139.6503, city: 'Токио', country: 'Япония', participantsCount: 1420 },
  { id: 'london-[#1]', type: 'weekly', lat: 51.5074, lng: -0.1278, city: 'Лондон', country: 'Великобритания', participantsCount: 890 },
  { id: 'reykjavik-core', type: 'daily', lat: 64.1466, lng: -21.9426, city: 'Рейкьявик', country: 'Исландия', participantsCount: 610 },
  { id: 'new-york-hq', type: 'weekly', lat: 40.7128, lng: -74.0060, city: 'Нью-Йорк', country: 'США', participantsCount: 2300 },
  { id: 'singapore-node', type: 'daily', lat: 1.3521, lng: 103.8198, city: 'Сингапур', country: 'Сингапур', participantsCount: 1750 },
  { id: 'geneva-[#1]', type: 'weekly', lat: 46.2044, lng: 6.1432, city: 'Женева', country: 'Швейцария', participantsCount: 940 },
  { id: 'sydney-hub', type: 'daily', lat: -33.8688, lng: 151.2093, city: 'Сидней', country: 'Австралия', participantsCount: 1120 },
  { id: 'cairo-[#1]', type: 'weekly', lat: 30.0444, lng: 31.2357, city: 'Каир', country: 'Египет', participantsCount: 780 },
  { id: 'dubai-node', type: 'daily', lat: 25.2048, lng: 55.2708, city: 'Дубай', country: 'ОАЭ', participantsCount: 1980 },
  { id: 'sao-paulo', type: 'weekly', lat: -23.5505, lng: -46.6333, city: 'Сан-Паулу', country: 'Бразилия', participantsCount: 1340 },
];

export const AhaMap: React.FC<AhaMapProps> = ({
  lang,
  events = [],
  onSelectEvent,
  className = '',
  lowPerfMode = false
}) => {
  const t = translations[lang] || translations['en'];
  const isRu = lang === 'ru';
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'daily' | 'weekly'>('all');
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [now, setNow] = useState(new Date());

  // Update time for countdown timer
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Merge provided events with geographical coordinates
  const processedEvents: EventLocation[] = React.useMemo(() => {
    if (!events || events.length === 0) {
      return DEFAULT_HOTSPOTS.map((spot, idx) => ({
        ...spot,
        title: {
          ru: `Хроника событие #${idx + 1}: ${spot.city}`,
          en: `Chronicle Event #${idx + 1}: ${spot.city}`
        },
        description: {
          ru: `Глобальный узел хроники Ахахи в регионе ${spot.country}. Активная зона синхронизации.`,
          en: `Global Ahaha chronicle node in ${spot.country}. Active synchronization zone.`
        }
      }));
    }

    return events.map((ev, idx) => {
      const fallbackSpot = DEFAULT_HOTSPOTS[idx % DEFAULT_HOTSPOTS.length];
      return {
        id: ev.id || `event-${idx}`,
        title: ev.title || { ru: 'Без названия', en: 'Untitled Event' },
        description: ev.description || { ru: 'Описание отсутствует', en: 'No description' },
        type: ev.type || 'daily',
        icon: ev.icon,
        lat: ev.lat || ev.coordinates?.lat || fallbackSpot.lat,
        lng: ev.lng || ev.coordinates?.lng || fallbackSpot.lng,
        city: ev.city || ev.coordinates?.locationName || fallbackSpot.city,
        country: ev.country || fallbackSpot.country,
        participantsCount: ev.participantsCount || (idx + 1) * 320 + 450,
        ...ev
      };
    });
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    if (activeFilter === 'all') return processedEvents;
    return processedEvents.filter(e => e.type === activeFilter);
  }, [processedEvents, activeFilter]);

  const selectedEvent = React.useMemo(() => {
    return processedEvents.find(e => e.id === selectedEventId) || processedEvents[0] || null;
  }, [processedEvents, selectedEventId]);

  // Map Tile Layers Configuration
  const getTileUrl = (style: 'dark' | 'satellite' | 'streets') => {
    switch (style) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'streets':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'dark':
      default:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
  };

  const getTileAttribution = (style: 'dark' | 'satellite' | 'streets') => {
    switch (style) {
      case 'satellite':
        return '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'streets':
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      case 'dark':
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [25, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer(getTileUrl(mapStyle), {
      attribution: getTileAttribution(mapStyle),
      maxZoom: 18,
    }).addTo(map);

    // Custom dark attribution control in bottom right
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;
    setMapLoaded(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer on Style Change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    L.tileLayer(getTileUrl(mapStyle), {
      attribution: getTileAttribution(mapStyle),
      maxZoom: 18,
    }).addTo(map);
  }, [mapStyle]);

  // Render Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    filteredEvents.forEach((ev) => {
      const isSelected = ev.id === selectedEventId;
      const isDaily = ev.type === 'daily';

      const iconHtml = `
        <div class="relative group cursor-pointer">
          <div class="absolute -inset-2 rounded-full ${isSelected ? 'bg-[#ff4d4d]/60 animate-ping' : isDaily ? 'bg-amber-500/30' : 'bg-[#ff4d4d]/30'} opacity-75 blur-sm transition-all"></div>
          <div class="relative flex items-center justify-center w-9 h-9 rounded-2xl border-2 ${
            isSelected 
              ? 'bg-[#ff4d4d] border-white text-black shadow-[0_0_20px_#ff4d4d]' 
              : isDaily 
                ? 'bg-[#1a1226] border-amber-400 text-amber-400 hover:scale-110' 
                : 'bg-[#15101e] border-[#ff4d4d] text-[#ff4d4d] hover:scale-110'
          } transition-transform shadow-xl">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              ${
                ev.icon === 'swords'
                  ? '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" y1="19" x2="19" y2="13"></line><line x1="16" y1="16" x2="20" y2="20"></line><line x1="19" y1="21" x2="21" y2="19"></line><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"></polyline><line x1="5" y1="14" x2="9" y2="18"></line><line x1="7" y1="17" x2="4" y2="20"></line><line x1="3" y1="19" x2="5" y2="21"></line>'
                  : ev.icon === 'refresh-cw'
                    ? '<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>'
                    : '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>'
              }
            </svg>
          </div>
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 bg-[#0f0a17]/90 border border-[#3d2b4f] rounded-lg text-[10px] font-bold text-white shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            ${ev.title[lang] || ev.title['en']}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'aha-map-marker-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([ev.lat, ev.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedEventId(ev.id);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([ev.lat, ev.lng], 5, {
            duration: 1.2
          });
        }
        if (onSelectEvent) {
          onSelectEvent(ev);
        }
      });

      marker.addTo(markersGroup);
    });
  }, [filteredEvents, selectedEventId, lang, onSelectEvent]);

  // Center on selected event when selected externally or from panel
  const handleFlyToEvent = (ev: EventLocation) => {
    setSelectedEventId(ev.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([ev.lat, ev.lng], 6, {
        duration: 1.5
      });
    }
    if (onSelectEvent) {
      onSelectEvent(ev);
    }
  };

  // Reset view to world map
  const handleResetWorldView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([25, 10], 2, {
        duration: 1.2
      });
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className={`relative bg-[#120d1a] border border-[#3d2b4f]/40 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] ${isFullscreen ? 'fixed inset-0 z-[99999] rounded-none border-none' : 'w-full h-[620px]'} ${className}`}>
      {/* Map Background Layer */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Header Overlay Panel */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Title Badge */}
        <div className="px-4 py-2.5 bg-[#15101e]/85 backdrop-blur-md border border-[#ff4d4d]/30 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-auto">
          <div className="p-2 bg-[#ff4d4d]/20 text-[#ff4d4d] rounded-xl border border-[#ff4d4d]/30">
            <Globe size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {isRu ? 'Интерактивная Карта Ахахи' : 'Aha World Chronicle Map'}
              </span>
              <span className="px-2 py-0.5 bg-[#ff4d4d] text-black text-[9px] font-black rounded-full uppercase">
                {filteredEvents.length} {isRu ? 'точек' : 'nodes'}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 block font-mono">
              {isRu ? 'Геолокация активных хроник и эвентов' : 'Live event coordinates & active nodes'}
            </span>
          </div>
        </div>

        {/* Filter & Controls Toolbar */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Filters */}
          <div className="flex items-center bg-[#15101e]/85 backdrop-blur-md border border-[#3d2b4f] rounded-2xl p-1 gap-1 shadow-2xl">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#ff4d4d] text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isRu ? 'Все' : 'All'}
            </button>
            <button
              onClick={() => setActiveFilter('daily')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'daily'
                  ? 'bg-amber-400 text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isRu ? 'Ежедневные' : 'Daily'}
            </button>
            <button
              onClick={() => setActiveFilter('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'weekly'
                  ? 'bg-[#ff4d4d] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isRu ? 'Еженедельные' : 'Weekly'}
            </button>
          </div>

          {/* Map Style Selector */}
          <div className="flex items-center bg-[#15101e]/85 backdrop-blur-md border border-[#3d2b4f] rounded-2xl p-1 gap-1 shadow-2xl hidden sm:flex">
            <button
              onClick={() => setMapStyle('dark')}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mapStyle === 'dark' ? 'bg-purple-600/40 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-white'
              }`}
              title="Dark Theme"
            >
              <Compass size={15} />
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mapStyle === 'satellite' ? 'bg-emerald-600/40 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-white'
              }`}
              title="Satellite Theme"
            >
              <Layers size={15} />
            </button>
            <button
              onClick={() => setMapStyle('streets')}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mapStyle === 'streets' ? 'bg-blue-600/40 text-blue-300 border border-blue-500/40' : 'text-gray-400 hover:text-white'
              }`}
              title="Streets Theme"
            >
              <Globe size={15} />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 bg-[#15101e]/85 hover:bg-[#ff4d4d]/20 backdrop-blur-md border border-[#3d2b4f] hover:border-[#ff4d4d]/50 text-gray-300 hover:text-white rounded-2xl transition-all cursor-pointer shadow-2xl"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Map Zoom & Navigation Controls (Right Side) */}
      <div className="absolute top-24 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-[#15101e]/85 hover:bg-white/10 backdrop-blur-md border border-[#3d2b4f] text-white rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-xl text-lg"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-[#15101e]/85 hover:bg-white/10 backdrop-blur-md border border-[#3d2b4f] text-white rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-xl text-lg"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleResetWorldView}
          className="w-10 h-10 bg-[#15101e]/85 hover:bg-[#ff4d4d]/20 backdrop-blur-md border border-[#3d2b4f] text-gray-300 hover:text-[#ff4d4d] rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xl"
          title={isRu ? 'Сбросить обзор' : 'Reset View'}
        >
          <Crosshair size={18} />
        </button>
      </div>

      {/* Bottom Horizontal / Side Event Cards Drawer */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col md:flex-row gap-4 items-end pointer-events-none">
        {/* Selected Event Spotlight Drawer */}
        <AnimatePresence mode="wait">
          {selectedEvent && (
            <motion.div
              key={selectedEvent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full md:w-96 bg-[#15101e]/90 backdrop-blur-xl border border-[#ff4d4d]/40 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] pointer-events-auto space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 rounded-2xl flex items-center justify-center text-[#ff4d4d] shrink-0">
                    {selectedEvent.icon === 'swords' ? <Swords size={22} /> :
                     selectedEvent.icon === 'refresh-cw' ? <RefreshCw size={22} /> : <Zap size={22} />}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block flex items-center gap-1">
                      <MapPin size={10} />
                      {selectedEvent.city}, {selectedEvent.country}
                    </span>
                    <h4 className="text-base font-black text-white leading-tight">
                      {selectedEvent.title[lang] || selectedEvent.title['en']}
                    </h4>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${
                  selectedEvent.type === 'daily' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/30'
                }`}>
                  {selectedEvent.type}
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed line-clamp-3 font-medium bg-[#0f0a17]/50 p-3 rounded-2xl border border-white/5">
                {selectedEvent.description[lang] || selectedEvent.description['en']}
              </p>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" />
                  <span>{selectedEvent.participantsCount} {isRu ? 'участников' : 'agents'}</span>
                </div>

                <button
                  onClick={() => handleFlyToEvent(selectedEvent)}
                  className="px-4 py-2 bg-[#ff4d4d] hover:bg-[#ff6666] text-black font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <span>{isRu ? 'Фокус на узле' : 'Focus Node'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Event Selector Chips Bar */}
        <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-2 pointer-events-auto py-1">
          {filteredEvents.map((ev) => {
            const isSelected = ev.id === selectedEventId;
            return (
              <button
                key={ev.id}
                onClick={() => handleFlyToEvent(ev)}
                className={`px-3.5 py-2 rounded-2xl backdrop-blur-md border text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-lg ${
                  isSelected
                    ? 'bg-[#ff4d4d] text-black border-white shadow-[0_0_20px_rgba(255,77,77,0.5)] scale-105'
                    : 'bg-[#15101e]/80 text-gray-300 border-[#3d2b4f] hover:bg-white/10 hover:text-white'
                }`}
              >
                <MapPin size={13} className={isSelected ? 'text-black' : 'text-[#ff4d4d]'} />
                <span>{ev.city || (ev.title[lang] || ev.title['en'])}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
