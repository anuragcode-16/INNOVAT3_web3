import { ethers } from "hardhat";

async function main() {
  console.log("\n🔗 Linking ZKCreditVerifier to TrustScoreManager...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Executing with account:", deployer.address);

  // Contract addresses
  const TRUST_SCORE_MANAGER_ADDRESS = "0xcbD37d65F4A4Ede2767e0E04500e99AC017bF088";
  const ZK_VERIFIER_ADDRESS = "0xeaEf66e56f31AE649a77Ad859f2184f0051C5fc7";

  console.log("TrustScoreManager:", TRUST_SCORE_MANAGER_ADDRESS);
  console.log("ZKCreditVerifier:", ZK_VERIFIER_ADDRESS);
  console.log();

  // Get TrustScoreManager contract
  const trustScoreManager = await ethers.getContractAt("TrustScoreManager", TRUST_SCORE_MANAGER_ADDRESS);

  // Link ZK verifier
  console.log("📝 Setting ZK verifier in TrustScoreManager...");
  const tx = await trustScoreManager.setZKVerifier(ZK_VERIFIER_ADDRESS);
  await tx.wait();
  console.log("✅ ZK verifier linked successfully!");

  // Verify integration
  console.log("\n🧪 Testing integration...\n");

  // Check deployer's credit info
  const creditInfo = await trustScoreManager.getUserCreditInfo(deployer.address);
  console.log("📊 Credit Information for", deployer.address);
  console.log("  Base Score (Repayment):", creditInfo[0].toString(), "points");
  console.log("  Wallet History Bonus:", creditInfo[2].toString(), "points");
  console.log("  ZK Proof Boost:", creditInfo[3].toString(), "points");
  console.log("  Total Score:", creditInfo[1].toString(), "points");
  console.log("  Credit Limit:", ethers.formatUnits(creditInfo[4], 6), "USDC");

  console.log("\n" + "=".repeat(60));
  console.log("📋 INTEGRATION COMPLETE");
  console.log("=".repeat(60));
  console.log("\n✅ Status:");
  console.log("  - ZKCreditVerifier linked to TrustScoreManager");
  console.log("  - Total score now includes: repayment + wallet + ZK boost");
  console.log("  - Credit limits automatically enhanced with ZK proofs");
  console.log("\n🎯 Score Breakdown:");
  console.log("  - Repayment behavior: 0-100+ points (10-15 per payment)");
  console.log("  - Wallet history: 0-60 points (age + activity + balance)");
  console.log("  - ZK proof boost: 10-30 points (balance threshold proof)");
  console.log("  - Maximum possible: 190+ points → 105 USDC credit limit!");
  console.log("\n📝 Example:");
  console.log("  User with 50 repayment + 40 wallet + 20 ZK = 110 total");
  console.log("  Credit Limit: 10 + (110/10) × 5 = 65 USDC");
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
