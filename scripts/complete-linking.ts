import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // New contract addresses from partial deployment
  const WALLET_ANALYZER_ADDRESS = "0xc7617B5255a23aF3820f187F8Ed2E64fE4CEdc63";
  const ZK_VERIFIER_ADDRESS = "0x57Cd9e808B5F7652Df17E3d4d21bbAcFd4036305";
  const TRUST_SCORE_MANAGER_ADDRESS = "0xcbD37d65F4A4Ede2767e0E04500e99AC017bF088";
  const BNPL_CORE_ADDRESS = "0x51F5a945Bf02E3915Ab66019741dD79b0B96A524";
  const MERCHANT_ADDRESS = "0xF92e0D914c6Bbd5a1B51eB2C023a2c3977b7f4C4";
  
  console.log("\n🔗 Completing contract linking...\n");
  console.log("Deployer:", deployer.address);
  
  // Get contract instances
  const trustScoreManager = await ethers.getContractAt("TrustScoreManager", TRUST_SCORE_MANAGER_ADDRESS);
  const bnplCore = await ethers.getContractAt("BNPLCore", BNPL_CORE_ADDRESS);
  
  // Check what's already linked
  console.log("\n📋 Checking current state...");
  
  try {
    const currentWalletAnalyzer = await trustScoreManager.walletAnalyzer();
    console.log("Current WalletAnalyzer:", currentWalletAnalyzer);
    
    if (currentWalletAnalyzer === "0x0000000000000000000000000000000000000000") {
      console.log("\n1️⃣ Linking WalletAnalyzer...");
      const tx1 = await trustScoreManager.setWalletAnalyzer(WALLET_ANALYZER_ADDRESS, { gasPrice: ethers.parseUnits("100", "gwei") });
      await tx1.wait();
      console.log("✅ WalletAnalyzer linked!");
    } else {
      console.log("✅ WalletAnalyzer already linked");
    }
  } catch (e) {
    console.log("Setting WalletAnalyzer...");
    const tx1 = await trustScoreManager.setWalletAnalyzer(WALLET_ANALYZER_ADDRESS, { gasPrice: ethers.parseUnits("100", "gwei") });
    await tx1.wait();
    console.log("✅ WalletAnalyzer linked!");
  }
  
  try {
    const currentZKVerifier = await trustScoreManager.zkVerifier();
    console.log("Current ZKVerifier:", currentZKVerifier);
    
    if (currentZKVerifier === "0x0000000000000000000000000000000000000000") {
      console.log("\n2️⃣ Linking ZKVerifier...");
      const tx2 = await trustScoreManager.setZKVerifier(ZK_VERIFIER_ADDRESS, { gasPrice: ethers.parseUnits("100", "gwei") });
      await tx2.wait();
      console.log("✅ ZKVerifier linked!");
    } else {
      console.log("✅ ZKVerifier already linked");
    }
  } catch (e) {
    console.log("Setting ZKVerifier...");
    const tx2 = await trustScoreManager.setZKVerifier(ZK_VERIFIER_ADDRESS, { gasPrice: ethers.parseUnits("100", "gwei") });
    await tx2.wait();
    console.log("✅ ZKVerifier linked!");
  }
  
  try {
    const currentTrustScore = await bnplCore.trustScoreManager();
    console.log("Current TrustScoreManager in BNPLCore:", currentTrustScore);
    
    if (currentTrustScore === "0x0000000000000000000000000000000000000000") {
      console.log("\n3️⃣ Linking TrustScoreManager to BNPLCore...");
      const tx3 = await bnplCore.setTrustScoreManager(TRUST_SCORE_MANAGER_ADDRESS, { gasPrice: ethers.parseUnits("100", "gwei") });
      await tx3.wait();
      console.log("✅ TrustScoreManager linked to BNPLCore!");
    } else {
      console.log("✅ TrustScoreManager already linked to BNPLCore");
    }
  } catch (e) {
    console.log("Setting TrustScoreManager...");
    const tx3 = await bnplCore.setTrustScoreManager(TRUST_SCORE_MANAGER_ADDRESS, { gasPrice: ethers.parseUnits("100", "gwei") });
    await tx3.wait();
    console.log("✅ TrustScoreManager linked to BNPLCore!");
  }
  
  // Add merchant
  console.log("\n4️⃣ Adding merchant...");
  try {
    const merchant = await bnplCore.merchants(MERCHANT_ADDRESS);
    if (!merchant.isApproved) {
      const tx4 = await bnplCore.addMerchant(MERCHANT_ADDRESS, "Demo Merchant", "E-commerce", { gasPrice: ethers.parseUnits("100", "gwei") });
      await tx4.wait();
      console.log("✅ Merchant added!");
    } else {
      console.log("✅ Merchant already exists");
    }
  } catch (e) {
    const tx4 = await bnplCore.addMerchant(MERCHANT_ADDRESS, "Demo Merchant", "E-commerce", { gasPrice: ethers.parseUnits("100", "gwei") });
    await tx4.wait();
    console.log("✅ Merchant added!");
  }
  
  // Verify USDC address
  console.log("\n5️⃣ Verifying USDC address...");
  const usdc = await bnplCore.usdc();
  console.log("USDC in BNPLCore:", usdc);
  console.log("Expected USDC:   0x8B0180f2101c8260d49339abfEe87927412494B4");
  console.log("Match:", usdc.toLowerCase() === "0x8B0180f2101c8260d49339abfEe87927412494B4".toLowerCase() ? "✅ YES" : "❌ NO");
  
  console.log("\n" + "=".repeat(60));
  console.log("📋 NEW CONTRACT ADDRESSES - Update frontend/.env.local:");
  console.log("=".repeat(60));
  console.log(`NEXT_PUBLIC_TRUST_SCORE_MANAGER_ADDRESS=${TRUST_SCORE_MANAGER_ADDRESS}`);
  console.log(`NEXT_PUBLIC_BNPL_CORE_ADDRESS=${BNPL_CORE_ADDRESS}`);
  console.log(`NEXT_PUBLIC_WALLET_ANALYZER_ADDRESS=${WALLET_ANALYZER_ADDRESS}`);
  console.log(`NEXT_PUBLIC_ZK_VERIFIER_ADDRESS=${ZK_VERIFIER_ADDRESS}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
