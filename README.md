# onstream - Web3 BNPL Protocol

**Build Credit, Unlock Freedom** - Web3's First Trust-Based Payment Layer

## 🎯 Project Overview

onstream is a decentralized Buy Now, Pay Later (BNPL) protocol that enables users to build credit scores in Web3 through responsible repayment behavior. Users start with 10 USDC credit at Trust Score 0 and grow their purchasing power by repaying on time.

### Key Features

- ✅ **Truly Under-Collateralized**: No collateral required, pure reputation-based lending
- ✅ **Instant Credit**: Start with 10 USDC credit limit immediately
- ✅ **Dynamic Trust Score System**: Multi-component scoring (repayment + wallet history + ZK proofs)
- ✅ **On-Chain Wallet Analysis**: Automatic bonus points from wallet age, activity, and balance
- ✅ **ZK Proof Privacy**: Prove balance thresholds without revealing exact amounts
- ✅ **Real USDC Payments**: Actual USDC transactions on Polygon Amoy testnet
- ✅ **Installment Payments**: Flexible repayment with partial payments support
- ✅ **Admin Controls**: Protocol liquidity management and merchant approval
- ✅ **Real-Time Updates**: Auto-refreshing on-chain data every 30 seconds
- ✅ **Transparent**: All rules on-chain, fully auditable

### Credit Scoring Formula

**Total Score = Repayment Score + Wallet Bonus + ZK Boost**

- **Repayment Score**: 0-100+ points (earned through loan repayments)
  - On-time payment: +10 points
  - Early payment (7+ days before due): +15 points
  
- **Wallet History Bonus**: 0-60 points (auto-calculated on-chain)
  - Wallet age: up to 20 points
  - Transaction activity: up to 20 points
  - Current balance: up to 20 points
  
- **ZK Proof Boost**: 0-30 points (privacy-preserving balance verification)
  - ≥1 USDC: +10 points
  - ≥11 USDC: +20 points
  - ≥101 USDC: +30 points

**Credit Limit Formula**: `$10 + ($5 × Total Score ÷ 10)`
- Minimum: $10 USDC (at 0 points)
- Maximum: $105 USDC (at 190 points)

### Technology Stack

**Smart Contracts:**
- Solidity 0.8.20
- Hardhat Development Environment
- OpenZeppelin (Security & Standards)
- Polygon Amoy Testnet

**Frontend:**
- Next.js 16 (App Router + Turbopack)
- TypeScript
- TailwindCSS
- wagmi v2 + viem
- RainbowKit
- React Hot Toast

**Key Integrations:**
- Circle USDC on Polygon
- WalletConnect v2
- On-chain wallet analysis
- Zero-Knowledge proof system (Groth16)

## 📦 Project Structure

```
onstream/
├── contracts/              # Solidity smart contracts
│   ├── BNPLCore.sol       # Main BNPL logic
│   ├── TrustScoreManager.sol  # Credit scoring system
│   ├── WalletAnalyzer.sol     # On-chain wallet analysis
│   └── ZKCreditVerifier.sol   # ZK proof verification
├── scripts/                # Deployment & setup scripts
├── test/                   # Contract test suites
├── frontend/               # Next.js frontend application
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utilities & constants
├── docs/                   # Comprehensive documentation
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── USER_WORKFLOW.md
│   ├── PRIVACY_ARCHITECTURE.md
│   └── DEMO_SCRIPT.md
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask or other Web3 wallet
- Polygon Amoy testnet MATIC (for gas)
- Polygon Amoy testnet USDC

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/anuragcode-16/INNOVAT3_web3.git
cd INNOVAT3_web3
```

2. **Install smart contract dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
```

4. **Configure environment variables**

Root directory `.env`:
```bash
cp .env.example .env
# Edit .env with your private key and RPC URL
```

Frontend `.env.local`:
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with WalletConnect Project ID
```

### Development

**Compile smart contracts:**
```bash
npm run compile
```

**Run tests:**
```bash
npm run test
```

**Deploy to Amoy testnet:**
```bash
npm run deploy
```

**Start frontend development server:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Contract Addresses

**Polygon Amoy Explorer**: https://amoy.polygonscan.com/

**Test USDC Faucet**: Contact admin for test USDC

## 🎮 Demo Products

| Product | Price | Description |
|---------|-------|-------------|
| Web3 Starter Pack | 0.99 USDC | Entry-level Web3 tools bundle |
| NFT Collection Access | 1.99 USDC | Premium NFT marketplace membership |
| Premium DeFi Tools | 2.99 USDC | Advanced DeFi analytics suite |
| Crypto Learning Course | 4.99 USDC | Complete Web3 education package |
| DAO Governance Token | 9.99 USDC | Voting rights in DeFi governance |

## 🎯 User Journey

1. **Connect Wallet** → Get instant 10 USDC credit limit
2. **Browse Shop** → Select products up to your credit limit
3. **Buy Now** → Purchase with BNPL (30-day terms)
4. **Repay Loan** → Full payment or installments
5. **Build Credit** → Earn points and unlock higher limits
6. **Submit ZK Proof** → Boost score with privacy-preserving balance verification

## 🔑 Key Features Explained

### 1. Multi-Component Credit Scoring
Unlike traditional systems that only track repayment, onstream uses three data sources:
- **Repayment History**: Direct behavior tracking
- **Wallet Analysis**: Automated on-chain reputation assessment
- **ZK Proofs**: Privacy-preserving financial verification

### 2. Wallet Analyzer
Automatically evaluates wallets based on:
- **Age Score**: Older wallets = more trustworthy (up to 20 pts)
- **Activity Score**: Transaction history depth (up to 20 pts)
- **Balance Score**: Current holdings (up to 20 pts)

### 3. Zero-Knowledge Proofs
Users can prove they hold sufficient USDC without revealing exact amounts:
- Completely privacy-preserving
- Instant verification on-chain
- Valid for 30 days
- Three threshold levels for different boost amounts

### 4. Flexible Repayment
- **Full Repayment**: Pay entire loan at once
- **Installment Payments**: Make partial payments (min 1/3 of remaining)
- **Early Payment Bonus**: Repay 7+ days early for +15 points instead of +10

## 📚 Documentation

- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - Complete technical documentation (500+ lines)
- **[IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md)** - Step-by-step build guide
- **[USER_WORKFLOW.md](./docs/USER_WORKFLOW.md)** - Detailed user and admin workflows
- **[PRIVACY_ARCHITECTURE.md](./docs/PRIVACY_ARCHITECTURE.md)** - ZK proof system explained
- **[DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md)** - Hackathon demo walkthrough
- **[CREDIT_SYSTEM_VISUAL_GUIDE.md](./CREDIT_SYSTEM_VISUAL_GUIDE.md)** - Visual credit scoring guide

## 🔐 Security

- ✅ Smart contracts use OpenZeppelin battle-tested libraries
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Access control with `onlyAdmin` modifiers
- ✅ Pausable emergency stop mechanism
- ✅ USDC integration with proper approval checks
- ✅ One active loan per user restriction
- ✅ Credit limit enforcement on-chain
- ✅ Installment payment validation (min 1/3 remaining balance)
- ✅ ZK proof expiration (30 days)
- ✅ Comprehensive test coverage

## 🧪 Testing

Run the full test suite:
```bash
npm test
```

Test specific modules:
```bash
npx hardhat test test/BNPL.test.ts
npx hardhat test test/TrustScore.test.ts
npx hardhat test test/WalletAnalyzer.test.ts
```

Check test coverage:
```bash
npm run coverage
```

## 🚀 Deployment

Deploy all contracts to Polygon Amoy:
```bash
npx hardhat run scripts/deploy-phase6-complete.ts --network amoy
```

Link contracts:
```bash
npx hardhat run scripts/complete-linking.ts --network amoy
```

Setup initial liquidity (admin only):
```bash
npx hardhat run scripts/setup-liquidity.ts --network amoy
```

## 🗺️ Roadmap

### ✅ Phase 1 - MVP (Completed - Hackathon Ready)
- ✅ Core BNPL functionality with Trust Score
- ✅ Multi-component credit scoring system
- ✅ On-chain wallet analysis
- ✅ ZK proof integration
- ✅ Installment payment support
- ✅ Real-time dashboard updates
- ✅ Admin liquidity management
- ✅ Polygon Amoy deployment

### 🔄 Phase 2 - Enhanced Features (Next 3 Months)
- [ ] Gitcoin Passport integration
- [ ] Credit Score NFT with dynamic metadata
- [ ] Multi-chain deployment (Arbitrum, Optimism)
- [ ] Merchant self-service onboarding
- [ ] Advanced analytics dashboard
- [ ] Email/SMS notifications

### 🔮 Phase 3 - Advanced Systems (6 Months)
- [ ] Production ZK circuit implementation (replace mock proofs)
- [ ] Machine learning risk models
- [ ] Credit delegation/sub-accounts
- [ ] Secondary debt market
- [ ] Insurance fund mechanism
- [ ] DAO governance structure

### 🚀 Phase 4 - Mainnet & Scale (12 Months)
- [ ] Mainnet launch on Polygon
- [ ] Fiat on/off-ramps (MoonPay/Wyre)
- [ ] B2B merchant partnerships
- [ ] Cross-protocol integrations
- [ ] Mobile app (iOS/Android)
- [ ] Credit score portability across chains

## � Innovation Highlights

### What Makes onstream Unique?

1. **True Under-Collateralization**: Unlike Aave/Compound, no collateral required
2. **Multi-Source Credit Scoring**: First to combine repayment + wallet analysis + ZK proofs
3. **Privacy-First**: ZK proofs allow balance verification without revealing amounts
4. **Real-Time On-Chain**: All data fetched live from blockchain every 30 seconds
5. **Web3-Native UX**: Seamless wallet integration, auto-refresh, toast notifications
6. **Hackathon-Ready**: Fully functional, deployed, and demo-able

### Technical Achievements

- ✅ 4 interconnected smart contracts deployed and verified
- ✅ 500+ lines of comprehensive documentation
- ✅ Real USDC transactions on Polygon testnet
- ✅ Dynamic credit scoring with 3 independent data sources
- ✅ Privacy-preserving ZK proof system
- ✅ Full-stack TypeScript implementation
- ✅ Real-time blockchain data synchronization
- ✅ Responsive mobile-first UI

## 👥 Team

**Hackathon Team**
- Smart Contract Development (Solidity)
- Frontend Development (Next.js/React)
- Web3 Integration (wagmi/viem)
- System Architecture & Design

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **Polygon** for Amoy testnet infrastructure and development grants
- **Circle** for USDC stablecoin integration
- **OpenZeppelin** for secure contract libraries and standards
- **RainbowKit** for beautiful wallet connection UI
- **Hardhat** for excellent development tooling
- **Vercel** for Next.js and hosting platform

## 📞 Support & Links

- **GitHub**: [github.com/anuragcode-16/INNOVAT3_web3](https://github.com/anuragcode-16/INNOVAT3_web3)
- **Live Demo**: [onstream.vercel.app](https://onsteam.vercel.app/)
- **Polygon Amoy Explorer**: [amoy.polygonscan.com](https://amoy.polygonscan.com)

---

**Built with ❤️ for Web3 Hackathon 2026**

*onstream - Building the FICO Score of Web3*

*"Start with trust, grow with reputation"*
