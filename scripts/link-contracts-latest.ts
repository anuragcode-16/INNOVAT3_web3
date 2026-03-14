import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // CURRENT contract addresses from latest deployment
  const WALLET_ANALYZER_ADDRESS = "0xc7617B5255a23aF3820f187F8Ed2E64fE4CEdc63";
  const ZK_VERIFIER_ADDRESS = "0xeaEf66e56f31AE649a77Ad859f2184f0051C5fc7"; // Updated!
  const TRUST_SCORE_MANAGER_ADDRESS = "0x3ef1456a5AbA04eFd979be0a49232211C88Df014"; // Updated!
  const BNPL_CORE_ADDRESS = "0x0B8e9E0278Fe46647E9C4876586Ece93e8Ec1F65"; // Updated!
  
  console.log("\n🔗 Verifying and Linking Contracts...\n");
  console.log("Deployer:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  
  // Get contract instances
  const trustScoreManager = await ethers.getContractAt("TrustScoreManager", TRUST_SCORE_MANAGER_ADDRESS);
  const bnplCore = await ethers.getContractAt("BNPLCore", BNPL_CORE_ADDRESS);
  
  console.log("\n📋 Checking current on-chain state...\n");
  
  // Check WalletAnalyzer
  try {
    const currentWalletAnalyzer = await trustScoreManager.walletAnalyzer();
    console.log("1️⃣  WalletAnalyzer:");
    console.log("   Expected:", WALLET_ANALYZER_ADDRESS);
    console.log("   On-chain:", currentWalletAnalyzer);
    
    if (currentWalletAnalyzer.toLowerCase() === WALLET_ANALYZER_ADDRESS.toLowerCase()) {
      console.log("   ✅ Correctly linked!\n");
    } else if (currentWalletAnalyzer === ethers.ZeroAddress) {
      console.log("   ❌ NOT LINKED! Linking now...");
      const tx1 = await trustScoreManager.setWalletAnalyzer(WALLET_ANALYZER_ADDRESS);
      console.log("   Transaction hash:", tx1.hash);
      await tx1.wait();
      console.log("   ✅ WalletAnalyzer linked!\n");
    } else {
      console.log("   ⚠️  MISMATCH! Current:", currentWalletAnalyzer);
      console.log("   Updating to:", WALLET_ANALYZER_ADDRESS);
      const tx1 = await trustScoreManager.setWalletAnalyzer(WALLET_ANALYZER_ADDRESS);
      await tx1.wait();
      console.log("   ✅ Updated!\n");
    }
  } catch (error: any) {
    console.log("   ❌ Error:", error.message, "\n");
  }
  
  // Check ZKVerifier
  try {
    const currentZKVerifier = await trustScoreManager.zkVerifier();
    console.log("2️⃣  ZKVerifier:");
    console.log("   Expected:", ZK_VERIFIER_ADDRESS);
    console.log("   On-chain:", currentZKVerifier);
    
    if (currentZKVerifier.toLowerCase() === ZK_VERIFIER_ADDRESS.toLowerCase()) {
      console.log("   ✅ Correctly linked!\n");
    } else if (currentZKVerifier === ethers.ZeroAddress) {
      console.log("   ❌ NOT LINKED! Linking now...");
      const tx2 = await trustScoreManager.setZKVerifier(ZK_VERIFIER_ADDRESS);
      console.log("   Transaction hash:", tx2.hash);
      await tx2.wait();
      console.log("   ✅ ZKVerifier linked!\n");
    } else {
      console.log("   ⚠️  MISMATCH! Current:", currentZKVerifier);
      console.log("   Updating to:", ZK_VERIFIER_ADDRESS);
      const tx2 = await trustScoreManager.setZKVerifier(ZK_VERIFIER_ADDRESS);
      await tx2.wait();
      console.log("   ✅ Updated!\n");
    }
  } catch (error: any) {
    console.log("   ❌ Error:", error.message, "\n");
  }
  
  // Check TrustScoreManager in BNPLCore
  try {
    const currentTrustScore = await bnplCore.trustScoreManager();
    console.log("3️⃣  TrustScoreManager (in BNPLCore):");
    console.log("   Expected:", TRUST_SCORE_MANAGER_ADDRESS);
    console.log("   On-chain:", currentTrustScore);
    
    if (currentTrustScore.toLowerCase() === TRUST_SCORE_MANAGER_ADDRESS.toLowerCase()) {
      console.log("   ✅ Correctly linked!\n");
    } else if (currentTrustScore === ethers.ZeroAddress) {
      console.log("   ❌ NOT LINKED! Linking now...");
      const tx3 = await bnplCore.setTrustScoreManager(TRUST_SCORE_MANAGER_ADDRESS);
      console.log("   Transaction hash:", tx3.hash);
      await tx3.wait();
      console.log("   ✅ TrustScoreManager linked!\n");
    } else {
      console.log("   ⚠️  MISMATCH! Current:", currentTrustScore);
      console.log("   Updating to:", TRUST_SCORE_MANAGER_ADDRESS);
      const tx3 = await bnplCore.setTrustScoreManager(TRUST_SCORE_MANAGER_ADDRESS);
      await tx3.wait();
      console.log("   ✅ Updated!\n");
    }
  } catch (error: any) {
    console.log("   ❌ Error:", error.message, "\n");
  }
  
  // Check BNPLCore in TrustScoreManager
  try {
    const currentBNPLCore = await trustScoreManager.bnplCore();
    console.log("4️⃣  BNPLCore (in TrustScoreManager):");
    console.log("   Expected:", BNPL_CORE_ADDRESS);
    console.log("   On-chain:", currentBNPLCore);
    
    if (currentBNPLCore.toLowerCase() === BNPL_CORE_ADDRESS.toLowerCase()) {
      console.log("   ✅ Correctly linked!\n");
    } else if (currentBNPLCore === ethers.ZeroAddress) {
      console.log("   ❌ NOT LINKED! Linking now...");
      const tx4 = await trustScoreManager.setBNPLCore(BNPL_CORE_ADDRESS);
      console.log("   Transaction hash:", tx4.hash);
      await tx4.wait();
      console.log("   ✅ BNPLCore linked!\n");
    } else {
      console.log("   ⚠️  MISMATCH! Current:", currentBNPLCore);
      console.log("   Updating to:", BNPL_CORE_ADDRESS);
      const tx4 = await trustScoreManager.setBNPLCore(BNPL_CORE_ADDRESS);
      await tx4.wait();
      console.log("   ✅ Updated!\n");
    }
  } catch (error: any) {
    console.log("   ❌ Error:", error.message, "\n");
  }
  
  console.log("=" .repeat(50));
  console.log("✅ Contract verification and linking complete!");
  console.log("=" .repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  });
