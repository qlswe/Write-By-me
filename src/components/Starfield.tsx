import React from 'react';

interface StarfieldProps {
  lowPerfMode?: boolean;
}

export const Starfield: React.FC<StarfieldProps> = ({ lowPerfMode }) => {
  if (lowPerfMode) {
    return (
      <div className="fixed inset-0 -z-10 bg-[#1A1230] overflow-hidden">
        {/* Static background for low performance mode */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#3E3160_0%,transparent_70%)] opacity-40" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 bg-[#1A1230] overflow-hidden">
      {/* Animated radial gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#3E3160_0%,transparent_70%)] opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
      
      {/* Floating glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C3A6E6]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5C4B8B]/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-[#9D7BCE]/15 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '14s', animationDelay: '1s' }} />

      {/* Very subtle static grid but with a moving mask */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #5C4B8B 1px, transparent 1px),
            linear-gradient(to bottom, #5C4B8B 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, #000 40%, transparent 100%)'
        }}
      />
    </div>
  );
};
