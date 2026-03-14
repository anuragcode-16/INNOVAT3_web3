/**
 * Frontend Configuration Constants
 * OnStream BNPL Protocol
 */

// Contract Addresses on Polygon Amoy
export const ADMIN_ADDRESS = "0x74E36d4A7b33057e3928CE4bf4C8C53A93361C34";
export const MERCHANT_ADDRESS = "0xF92e0D914c6Bbd5a1B51eB2C023a2c3977b7f4C4";
// IMPORTANT: This MUST match the USDC address configured in BNPLCore contract!
export const USDC_ADDRESS = "0x8B0180f2101c8260d49339abfEe87927412494B4";

// Deployed Contract Addresses (Enhanced with Wallet Analyzer - Jan 16, 2026)
// Use environment variables first, then fall back to hardcoded addresses
export const TRUST_SCORE_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_TRUST_SCORE_MANAGER_ADDRESS || "0x3ef1456a5AbA04eFd979be0a49232211C88Df014") as `0x${string}`;
export const BNPL_CORE_ADDRESS = (process.env.NEXT_PUBLIC_BNPL_CORE_ADDRESS || "0x0B8e9E0278Fe46647E9C4876586Ece93e8Ec1F65") as `0x${string}`;
export const WALLET_ANALYZER_ADDRESS = (process.env.NEXT_PUBLIC_WALLET_ANALYZER_ADDRESS || "0xc7617B5255a23aF3820f187F8Ed2E64fE4CEdc63") as `0x${string}`;
export const ZK_VERIFIER_ADDRESS = (process.env.NEXT_PUBLIC_ZK_VERIFIER_ADDRESS || "0xeaEf66e56f31AE649a77Ad859f2184f0051C5fc7") as `0x${string}`;

// Network Configuration
export const POLYGON_AMOY_CHAIN_ID = 80002;

// Product Configuration
export const PRODUCTS = [
  {
    id: 1,
    name: "Web3 Starter Pack",
    price: "0.99",
    priceUSDC: 990000, // 0.99 USDC with 6 decimals
    description: "Entry-level Web3 tools bundle for beginners",
    image: "/products/starter-pack.svg",
  },
  {
    id: 2,
    name: "NFT Collection Access",
    price: "1.99",
    priceUSDC: 1990000,
    description: "Premium NFT marketplace membership with exclusive access",
    image: "/products/nft-access.svg",
  },
  {
    id: 3,
    name: "Premium DeFi Tools",
    price: "2.99",
    priceUSDC: 2990000,
    description: "Advanced DeFi analytics suite with real-time data",
    image: "/products/defi-tools.svg",
  },
];

// Credit Score Configuration
export const BASE_CREDIT_LIMIT = 10; // 10 USDC
export const ON_TIME_POINTS = 10;
export const EARLY_POINTS = 15;
export const REPAYMENT_PERIOD_DAYS = 7;
export const EARLY_REPAYMENT_THRESHOLD_DAYS = 3; // Early = within first 4 days

// UI Configuration
export const APP_NAME = "OnStream";
export const APP_DESCRIPTION = "Build Credit, Unlock Freedom - Web3's First Trust-Based Payment Layer";
