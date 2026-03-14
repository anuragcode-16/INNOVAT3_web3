"use client";

import { Marquee } from "./magicui/marquee";
import { cn } from "@/lib/utils";

const logos = [
  { 
    svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_1_1)">
      <circle cx="16" cy="16" r="16" fill="#627EEA"/>
      <path d="M16 2C8.27 2 2 8.27 2 16s6.27 14 14 14 14-6.27 14-14S23.73 2 16 2zm0 2c6.63 0 12 5.37 12 12s-5.37 12-12 12S4 22.63 4 16 9.37 4 16 4z" fill="white"/>
      <path d="M16 5L10 13h4v8h4v-8h4l-6-8z" fill="white"/>
      </g>
      <defs>
      <clipPath id="clip0_1_1">
      <rect width="32" height="32" fill="white"/>
      </clipPath>
      </defs>
    </svg>`,
    name: "Ethereum",
    symbol: "ETH"
  },
  { 
    svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F7931A"/>
      <path d="M24 12c0-4.4-3.6-8-8-8s-8 3.6-8 8v8c0 4.4 3.6 8 8 8s8-3.6 8-8v-8z" fill="white"/>
      <circle cx="16" cy="16" r="4" fill="#F7931A"/>
    </svg>`,
    name: "Bitcoin",
    symbol: "BTC"
  },
  { 
    svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#8247E5"/>
      <path d="M16 6l8 4v8l-8 4-8-4v-8l8-4z" fill="white"/>
      <path d="M8 14l8 4 8-4" stroke="white" stroke-width="1" fill="none"/>
      <path d="M16 18v6" stroke="white" stroke-width="1"/>
    </svg>`,
    name: "Polygon",
    symbol: "MATIC"
  },
  { 
    svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#E84142"/>
      <path d="M16 8C11.6 8 8 11.6 8 16c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4.4-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" fill="white"/>
      <path d="M16 12v8M12 16h8" stroke="white" stroke-width="1.5"/>
    </svg>`,
    name: "Avalanche",
    symbol: "AVAX"
  },
  { 
    svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
      <path d="M10 18h4v-4h4v4h4v-4h-4v-4h-4v4h-4v4z" fill="white"/>
      <rect x="10" y="10" width="12" height="12" stroke="white" stroke-width="1" fill="none"/>
    </svg>`,
    name: "BNB",
    symbol: "BNB"
  },
  { 
    svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#00D4FF"/>
      <path d="M16 8C11.6 8 8 11.6 8 16s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 2c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6z" fill="white"/>
      <circle cx="16" cy="16" r="3" fill="#00D4FF"/>
    </svg>`,
    name: "Cello",
    symbol: "CELO"
  },
  { 
    svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#7B3FF2"/>
      <path d="M16 6L8 10v8c0 6 8 10 8 10s8-4 8-10v-8l-8-4z" fill="white"/>
      <path d="M16 14L12 17v3h8v-3l-4-3z" fill="#7B3FF2"/>
    </svg>`,
    name: "Weilliptic",
    symbol: "WEI"
  },
];

const CryptoLogoMarquee = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg py-16">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white text-center">Supported Networks</h3>
        <p className="text-gray-400 text-center mt-2">Built for the multi-chain future</p>
      </div>
      
      <Marquee pauseOnHover className="[--duration:40s]">
        {logos.map((logo, idx) => (
          <div
            key={idx}
            className={cn(
              "flex flex-col items-center justify-center w-48 h-32 mx-8 cursor-pointer",
              "transition-transform duration-300 ease-in-out hover:scale-110"
            )}
            title={logo.name}
          >
            <div 
              className="w-16 h-16 mb-2"
              dangerouslySetInnerHTML={{ __html: logo.svg }}
            />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-200">{logo.symbol}</p>
              <p className="text-xs text-gray-400">{logo.name}</p>
            </div>
          </div>
        ))}
      </Marquee>
    </div>
  );
};

export default CryptoLogoMarquee;
