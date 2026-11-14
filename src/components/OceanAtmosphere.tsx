import React from 'react';

interface BubbleSpec {
  id: number;
  left: string;
  bottom: string;
  size: number;
  duration: string;
  delay: string;
}

const BUBBLES: BubbleSpec[] = [
  { id: 1, left: '8%', bottom: '8%', size: 10, duration: '15s', delay: '0s' },
  { id: 2, left: '16%', bottom: '18%', size: 6, duration: '12s', delay: '2s' },
  { id: 3, left: '29%', bottom: '5%', size: 12, duration: '18s', delay: '4s' },
  { id: 4, left: '46%', bottom: '14%', size: 8, duration: '14s', delay: '1s' },
  { id: 5, left: '61%', bottom: '6%', size: 14, duration: '16s', delay: '3s' },
  { id: 6, left: '72%', bottom: '20%', size: 9, duration: '13s', delay: '5s' },
  { id: 7, left: '84%', bottom: '10%', size: 16, duration: '19s', delay: '2.5s' },
  { id: 8, left: '91%', bottom: '24%', size: 7, duration: '11s', delay: '6s' },
];

export const OceanAtmosphere: React.FC<{ subtle?: boolean }> = ({ subtle = false }) => {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Balanced deep ocean radial depth gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 92% 72% at 78% 12%, rgba(0, 195, 255, 0.34) 0%, rgba(8, 52, 122, 0.72) 44%, #041536 100%)',
        }}
      />

      {/* Soft bioluminescent cyan & purple ambient light pools */}
      <div
        className="absolute -top-24 -right-24 w-[680px] h-[680px] rounded-full blur-[120px]"
        style={{ background: subtle ? 'rgba(0, 217, 255, 0.14)' : 'rgba(0, 217, 255, 0.22)' }}
      />
      <div
        className="absolute -bottom-32 -left-24 w-[580px] h-[580px] rounded-full blur-[130px]"
        style={{ background: subtle ? 'rgba(139, 61, 255, 0.15)' : 'rgba(139, 61, 255, 0.24)' }}
      />
      <div
        className="hidden sm:block absolute top-1/3 left-1/4 w-[460px] h-[460px] rounded-full blur-[140px]"
        style={{ background: 'rgba(10, 96, 178, 0.16)' }}
      />

      {/* Diagonal ocean sunbeams */}
      {!subtle && (
        <div
          className="absolute top-0 right-0 w-3/4 h-[85vh] opacity-40"
          style={{
            background:
              'conic-gradient(from 205deg at 85% -10%, transparent 0deg, rgba(0, 217, 255, 0.24) 14deg, transparent 28deg, rgba(34, 230, 208, 0.16) 42deg, transparent 58deg)',
          }}
        />
      )}

      {/* Subtle floating underwater bubbles */}
      {BUBBLES.map((b) => (
        <span
          key={b.id}
          className="animate-bubble-rise absolute rounded-full border border-white/35 bg-gradient-to-br from-white/30 to-[#00D9FF]/10"
          style={
            {
              left: b.left,
              bottom: b.bottom,
              width: `${b.size}px`,
              height: `${b.size}px`,
              '--bubble-duration': b.duration,
              animationDelay: b.delay,
              opacity: subtle ? 0.3 : 0.55,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
