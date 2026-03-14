import { ethers } from "hardhat";

async function main() {
  console.log("\n🚀 Deploying Phase 7: Default Handling & Risk Management\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get existing Phase 6 contract addresses
  const EXISTING_WALLET_ANALYZER = "0x33e3B45D64225676730E9365E7914a6D2959AB80";
  const EXISTING_ZK_VERIFIER = "0xE0DfBEcb21CeFF25aF43925Ac6b00BAE314fCD53";
  const USDC_ADDRESS = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"; // Polygon Amoy USDC

  // Deploy TrustScoreManager
  console.log("\n📊 Deploying TrustScoreManager...");
  const TrustScoreManager = await ethers.getContractFactory("TrustScoreManager");
  const trustScoreManager = await TrustScoreManager.deploy(deployer.address);
  await trustScoreManager.waitForDeployment();
  const trustScoreAddress = await trustScoreManager.getAddress();
  console.log("✅ TrustScoreManager deployed to:", trustScoreAddress);

  // Deploy BNPLCore
  console.log("\n💳 Deploying BNPLCore...");
  const BNPLCore = await ethers.getContractFactory("BNPLCore");
  const bnplCore = await BNPLCore.deploy(
    USDC_ADDRESS,
    deployer.address
  );
  await bnplCore.waitForDeployment();
  const bnplCoreAddress = await bnplCore.getAddress();
  console.log("✅ BNPLCore deployed to:", bnplCoreAddress);

  // Link contracts
  console.log("\n🔗 Linking contracts...");

  // Set BNPLCore in TrustScoreManager
  const tx1 = await trustScoreManager.setBNPLCore(bnplCoreAddress);
  await tx1.wait();
  console.log("✅ BNPLCore set in TrustScoreManager");

  // Set TrustScoreManager in BNPLCore
  const tx2 = await bnplCore.setTrustScoreManager(trustScoreAddress);
  await tx2.wait();
  console.log("✅ TrustScoreManager set in BNPLCore");

  // Set WalletAnalyzer in TrustScoreManager
  const tx3 = await trustScoreManager.setWalletAnalyzer(EXISTING_WALLET_ANALYZER);
  await tx3.wait();
  console.log("✅ WalletAnalyzer set in TrustScoreManager");

  // Set ZKVerifier in TrustScoreManager
  const tx4 = await trustScoreManager.setZKVerifier(EXISTING_ZK_VERIFIER);
  await tx4.wait();
  console.log("✅ ZKVerifier set in TrustScoreManager");

  console.log("\n✅ Phase 7 Deployment Complete!");
  console.log("\n📋 Deployed Addresses:");
  console.log("TrustScoreManager:", trustScoreAddress);
  console.log("BNPLCore:", bnplCoreAddress);
  console.log("\n🔗 Linked Addresses (Phase 6):");
  console.log("WalletAnalyzer:", EXISTING_WALLET_ANALYZER);
  console.log("ZKCreditVerifier:", EXISTING_ZK_VERIFIER);
  console.log("USDC:", USDC_ADDRESS);

  // Test default scenario
  console.log("\n🧪 Testing Default Handling on Testnet...");
  console.log("⚠️  Skipping full test on-chain. Use hardhat test for comprehensive tests.");
  console.log("✅ All contract deployments and linkages complete!");

  console.log("\n📝 Next Steps:");
  console.log("1. Verify TrustScoreManager: npx hardhat verify --network amoy", trustScoreAddress, deployer.address);
  console.log("2. Verify BNPLCore: npx hardhat verify --network amoy", bnplCoreAddress, USDC_ADDRESS, deployer.address);
  console.log("3. Update frontend .env.local with new addresses");
  console.log("4. Create admin UI for default management");
  console.log("5. Test late repayment with penalty on testnet UI");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
