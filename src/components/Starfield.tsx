import React from 'react';

export const Starfield: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-[#1A1230] overflow-hidden">
      {/* Subtle radial gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#3E3160_0%,transparent_70%)] opacity-60" />
      
      {/* Very subtle static grid */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #5C4B8B 1px, transparent 1px),
            linear-gradient(to bottom, #5C4B8B 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #000 40%, transparent 100%)'
        }}
      />
    </div>
  );
};
