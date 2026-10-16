import React from 'react';

export const FluidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#f4f8fd]" aria-hidden="true">
      {/* Harmonic Wave Layer 1: Radiant Royal Blue */}
      <div
        className="absolute rounded-full filter blur-[120px] opacity-35 will-change-transform"
        style={{
          width: '65vw',
          height: '65vw',
          background: 'radial-gradient(circle, #2563eb 0%, #3b82f6 50%, transparent 75%)',
          top: '-15%',
          left: '-12%',
          animation: 'driftHarmonic1 26s infinite alternate cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Harmonic Wave Layer 2: Ethereal Light Cyan / Ice Blue */}
      <div
        className="absolute rounded-full filter blur-[100px] opacity-40 will-change-transform"
        style={{
          width: '55vw',
          height: '55vw',
          background: 'radial-gradient(circle, #38bdf8 0%, #93c5fd 60%, transparent 80%)',
          bottom: '-12%',
          right: '-10%',
          animation: 'driftHarmonic2 22s infinite alternate-reverse cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Harmonic Wave Layer 3: Deep Navy Indigo Depth */}
      <div
        className="absolute rounded-full filter blur-[140px] opacity-25 will-change-transform"
        style={{
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle, #1e3a8a 0%, #172554 60%, transparent 80%)',
          top: '35%',
          right: '15%',
          animation: 'driftHarmonic3 32s infinite alternate cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Harmonic Wave Layer 4: Soft Specular Light Beam */}
      <div
        className="absolute rounded-full filter blur-[90px] opacity-30 will-change-transform"
        style={{
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle, #bfdbfe 0%, #dbeafe 50%, transparent 70%)',
          bottom: '20%',
          left: '20%',
          animation: 'driftHarmonic1 20s infinite alternate-reverse cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Ambient noise & glass sheen */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
    </div>
  );
};
