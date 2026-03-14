import { ethers } from "hardhat";

// Contract addresses from deployment
const TRUST_SCORE_MANAGER_ADDRESS = "0x3ef1456a5AbA04eFd979be0a49232211C88Df014";
const WALLET_ANALYZER_ADDRESS = "0xc7617B5255a23aF3820f187F8Ed2E64fE4CEdc63";
const ZK_VERIFIER_ADDRESS = "0xeaEf66e56f31AE649a77Ad859f2184f0051C5fc7";
const BNPL_CORE_ADDRESS = "0x0B8e9E0278Fe46647E9C4876586Ece93e8Ec1F65";

async function main() {
  console.log("🔍 Verifying contract linkages on-chain...\n");

  // Get TrustScoreManager contract
  const TrustScoreManager = await ethers.getContractAt(
    "TrustScoreManager",
    TRUST_SCORE_MANAGER_ADDRESS
  );

  // Check WalletAnalyzer
  console.log("📊 Checking WalletAnalyzer...");
  try {
    const walletAnalyzerAddress = await TrustScoreManager.walletAnalyzer();
    console.log(`   Expected: ${WALLET_ANALYZER_ADDRESS}`);
    console.log(`   On-chain: ${walletAnalyzerAddress}`);
    
    if (walletAnalyzerAddress.toLowerCase() === WALLET_ANALYZER_ADDRESS.toLowerCase()) {
      console.log("   ✅ WalletAnalyzer correctly linked!");
    } else if (walletAnalyzerAddress === ethers.ZeroAddress) {
      console.log("   ❌ WalletAnalyzer NOT linked (zero address)!");
    } else {
      console.log("   ⚠️  WalletAnalyzer mismatch!");
    }
  } catch (error: any) {
    console.log(`   ❌ Error reading WalletAnalyzer: ${error.message}`);
  }

  // Check ZKVerifier
  console.log("\n🔐 Checking ZKVerifier...");
  try {
    const zkVerifierAddress = await TrustScoreManager.zkVerifier();
    console.log(`   Expected: ${ZK_VERIFIER_ADDRESS}`);
    console.log(`   On-chain: ${zkVerifierAddress}`);
    
    if (zkVerifierAddress.toLowerCase() === ZK_VERIFIER_ADDRESS.toLowerCase()) {
      console.log("   ✅ ZKVerifier correctly linked!");
    } else if (zkVerifierAddress === ethers.ZeroAddress) {
      console.log("   ❌ ZKVerifier NOT linked (zero address)!");
    } else {
      console.log("   ⚠️  ZKVerifier mismatch!");
    }
  } catch (error: any) {
    console.log(`   ❌ Error reading ZKVerifier: ${error.message}`);
  }

  // Check BNPLCore linkage to TrustScoreManager
  console.log("\n💰 Checking BNPLCore...");
  try {
    const BNPLCore = await ethers.getContractAt(
      "BNPLCore",
      BNPL_CORE_ADDRESS
    );
    
    const trustScoreManagerAddress = await BNPLCore.trustScoreManager();
    console.log(`   Expected: ${TRUST_SCORE_MANAGER_ADDRESS}`);
    console.log(`   On-chain: ${trustScoreManagerAddress}`);
    
    if (trustScoreManagerAddress.toLowerCase() === TRUST_SCORE_MANAGER_ADDRESS.toLowerCase()) {
      console.log("   ✅ TrustScoreManager correctly linked!");
    } else {
      console.log("   ⚠️  TrustScoreManager mismatch!");
    }
  } catch (error: any) {
    console.log(`   ❌ Error reading TrustScoreManager from BNPLCore: ${error.message}`);
  }

  console.log("\n✅ Verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
