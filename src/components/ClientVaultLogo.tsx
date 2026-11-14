import React from 'react';

interface ClientVaultLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const ClientVaultLogo: React.FC<ClientVaultLogoProps> = ({
  size = 'md',
  showWordmark = true,
}) => {
  const iconDim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0">
      <span
        className={`${iconDim} relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#00D9FF]/25 via-[#0879B9]/35 to-[#8B3DFF]/35 border border-[#00D9FF]/45 shadow-[0_0_20px_rgba(0,217,255,0.28)]`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="cv-vault-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22E6D0" />
              <stop offset="55%" stopColor="#00D9FF" />
              <stop offset="100%" stopColor="#8B3DFF" />
            </linearGradient>
          </defs>
          {/* Secure folder + ocean crest silhouette */}
          <path
            d="M4.5 9.5C4.5 7.843 5.843 6.5 7.5 6.5H12.4C13.28 6.5 14.11 6.89 14.68 7.56L16.1 9.25H24.5C26.157 9.25 27.5 10.593 27.5 12.25V22.5C27.5 24.157 26.157 25.5 24.5 25.5H7.5C5.843 25.5 4.5 24.157 4.5 22.5V9.5Z"
            stroke="url(#cv-vault-grad)"
            strokeWidth="2"
            fill="rgba(0, 217, 255, 0.14)"
          />
          {/* Ocean wave & vault lock core */}
          <path
            d="M8.5 19.2C10.5 17.5 12.5 17.5 14.5 19.1C16.5 20.7 18.5 20.7 20.5 19.1C21.6 18.2 22.6 18 23.5 18.2"
            stroke="#22E6D0"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="16" cy="14.5" r="2.1" fill="#FFFFFF" />
          <path
            d="M16 14.5V16.8"
            stroke="#00D9FF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className={`${textSize} font-display font-bold tracking-tight text-white`}>
          Client<span className="bg-gradient-to-r from-[#00D9FF] to-[#22E6D0] bg-clip-text text-transparent">Vault</span>
        </span>
      )}
    </span>
  );
};
