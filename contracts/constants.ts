/**
 * Contract Configuration Constants
 * OnStream BNPL Protocol
 */

// Fixed addresses on Polygon Amoy Testnet
export const ADMIN_ADDRESS = "0x74E36d4A7b33057e3928CE4bf4C8C53A93361C34";
export const MERCHANT_ADDRESS = "0xF92e0D914c6Bbd5a1B51eB2C023a2c3977b7f4C4";
export const USDC_ADDRESS = "0x8B0180f2101c8260d49339abfEe87927412494B4";

// Trust Score Configuration
export const BASE_CREDIT_LIMIT = 10; // 10 USDC base limit for all users
export const SCORE_MULTIPLIER = 5; // Each 10 points = 5 USDC bonus
export const SCORE_DIVISOR = 10;

// Scoring Points
export const ON_TIME_POINTS = 10; // Points for on-time repayment
export const EARLY_POINTS = 15; // Points for early repayment

// Loan Configuration
export const REPAYMENT_PERIOD_DAYS = 30; // 30 days to repay
export const EARLY_THRESHOLD_PERCENTAGE = 50; // First 50% of period = early

// Product Prices (in USDC, with 6 decimals)
export const PRODUCTS = [
  {
    id: 1,
    name: "Web3 Starter Pack",
    price: 0.99,
    priceWei: 990000, // 0.99 * 10^6 (USDC has 6 decimals)
    description: "Entry-level Web3 tools bundle for beginners",
  },
  {
    id: 2,
    name: "NFT Collection Access",
    price: 1.99,
    priceWei: 1990000,
    description: "Premium NFT marketplace membership with exclusive access",
  },
  {
    id: 3,
    name: "Premium DeFi Tools",
    price: 2.99,
    priceWei: 2990000,
    description: "Advanced DeFi analytics suite with real-time data",
  },
];

// Network Configuration
export const POLYGON_AMOY_CHAIN_ID = 80002;
export const AMOY_RPC_URL = "https://rpc-amoy.polygon.technology/";
export const AMOY_EXPLORER = "https://amoy.polygonscan.com";

// Contract deployed addresses (to be filled after deployment)
export const DEPLOYED_ADDRESSES = {
  TrustScoreManager: "", // Fill after deployment
  BNPLCore: "", // Fill after deployment
};
