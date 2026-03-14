import { ethers } from "hardhat";

/**
 * Test RPC Connection and diagnose user issues
 */

async function main() {
  console.log("\n🔍 OnStream BNPL - RPC Connection Test\n");
  console.log("═══════════════════════════════════════════════════════\n");

  const userAddress = "0xa9A340804873979777752D215dE4C5cea72D1201";
  const merchantAddress = "0xF92e0D914c6Bbd5a1B51eB2C023a2c3977b7f4C4";
  const loanAmount = ethers.parseUnits("0.99", 6);

  try {
    // Get contract instances
    const bnplCore = await ethers.getContractAt(
      "BNPLCore",
      "0x0B8e9E0278Fe46647E9C4876586Ece93e8Ec1F65"
    );

    const trustScore = await ethers.getContractAt(
      "TrustScoreManager",
      "0x3ef1456a5AbA04eFd979be0a49232211C88Df014"
    );

    const usdc = await ethers.getContractAt(
      "IERC20",
      "0x8B0180f2101c8260d49339abfEe87927412494B4"
    );

    console.log("✅ Connected to contracts successfully\n");
    console.log("📊 User Diagnostic Report:");
    console.log("───────────────────────────────────────────────────────");

    // Check 1: User Trust Score
    const score = await trustScore.getTrustScore(userAddress);
    console.log(`\n1. Trust Score: ${score}`);
    console.log(`   ${score >= 0n ? "✅ User exists" : "❌ User not found"}`);

    // Check 2: Credit Limit
    const creditLimit = await trustScore.getCreditLimit(userAddress);
    console.log(`\n2. Credit Limit: ${ethers.formatUnits(creditLimit, 6)} USDC`);
    console.log(`   Required: ${ethers.formatUnits(loanAmount, 6)} USDC`);
    console.log(`   ${creditLimit >= loanAmount ? "✅ Sufficient credit" : "❌ INSUFFICIENT CREDIT"}`);

    // Check 3: Active Loan Status
    const hasActiveLoan = await bnplCore.hasActiveLoan(userAddress);
    console.log(`\n3. Active Loan: ${hasActiveLoan}`);
    console.log(`   ${!hasActiveLoan ? "✅ No active loan (can borrow)" : "❌ ALREADY HAS ACTIVE LOAN"}`);

    // Check 4: Merchant Status
    const merchantInfo = await bnplCore.merchants(merchantAddress);
    console.log(`\n4. Merchant Approved: ${merchantInfo.isApproved}`);
    console.log(`   ${merchantInfo.isApproved ? "✅ Merchant approved" : "❌ MERCHANT NOT APPROVED"}`);

    // Check 5: Protocol Status
    const isPaused = await bnplCore.paused();
    console.log(`\n5. Protocol Status: ${!isPaused ? "Active" : "Paused"}`);
    console.log(`   ${!isPaused ? "✅ Protocol active" : "❌ PROTOCOL PAUSED"}`);

    // Check 6: Protocol Liquidity
    const liquidity = await usdc.balanceOf(await bnplCore.getAddress());
    console.log(`\n6. Protocol Liquidity: ${ethers.formatUnits(liquidity, 6)} USDC`);
    console.log(`   Required: ${ethers.formatUnits(loanAmount, 6)} USDC`);
    console.log(`   ${liquidity >= loanAmount ? "✅ Sufficient liquidity" : "❌ INSUFFICIENT LIQUIDITY"}`);

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("\n🎯 SUMMARY:");
    console.log("───────────────────────────────────────────────────────");

    // Determine if user can create loan
    const canCreateLoan =
      score >= 0n &&
      creditLimit >= loanAmount &&
      !hasActiveLoan &&
      merchantInfo.isApproved &&
      !isPaused &&
      liquidity >= loanAmount;

    if (canCreateLoan) {
      console.log("✅ User can create loan! All checks passed.");
    } else {
      console.log("❌ User CANNOT create loan. Issues found:");
      if (score < 0n) console.log("   - User trust score invalid");
      if (creditLimit < loanAmount) console.log("   - Credit limit too low");
      if (hasActiveLoan) console.log("   - User already has active loan");
      if (!merchantInfo.isApproved) console.log("   - Merchant not approved");
      if (isPaused) console.log("   - Protocol is paused");
      if (liquidity < loanAmount) console.log("   - Insufficient protocol liquidity");
    }

    console.log("\n═══════════════════════════════════════════════════════\n");

  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nFull error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
