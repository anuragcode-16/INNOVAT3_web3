import { ethers } from "hardhat";

/**
 * Test USDC Balance and Repayment Flow
 * Run before repaying to check if everything is set up correctly
 */

async function main() {
  const userAddress = process.env.TEST_USER_ADDRESS || "0xa9A340804873979777752D215dE4C5cea72D1201";
  
  console.log("\n💰 USDC Repayment Flow Test\n");
  console.log("═══════════════════════════════════════════════════════\n");

  // Get contracts
  const bnplCore = await ethers.getContractAt(
    "BNPLCore",
    "0x0B8e9E0278Fe46647E9C4876586Ece93e8Ec1F65"
  );
  
  const usdc = await ethers.getContractAt(
    "IERC20",
    "0x8B0180f2101c8260d49339abfEe87927412494B4"
  );

  console.log(`📍 Testing User: ${userAddress}\n`);

  // Step 1: Check if user has active loan
  const hasActiveLoan = await bnplCore.hasActiveLoan(userAddress);
  console.log("1️⃣  Active Loan Status:", hasActiveLoan);

  if (!hasActiveLoan) {
    console.log("   ❌ User has no active loan. Nothing to repay.\n");
    return;
  }

  // Step 2: Get loan details
  const activeLoan = await bnplCore.getActiveLoan(userAddress);
  const loanAmount = ethers.formatUnits(activeLoan.amount, 6);
  const amountRepaid = ethers.formatUnits(activeLoan.amountRepaid, 6);
  const remaining = ethers.formatUnits(activeLoan.amount - activeLoan.amountRepaid, 6);

  console.log("\n2️⃣  Loan Details:");
  console.log(`   Total Amount: ${loanAmount} USDC`);
  console.log(`   Already Paid: ${amountRepaid} USDC`);
  console.log(`   Remaining: ${remaining} USDC`);

  // Step 3: Check user's USDC balance
  const userBalance = await usdc.balanceOf(userAddress);
  const balanceFormatted = ethers.formatUnits(userBalance, 6);
  console.log(`\n3️⃣  User USDC Balance: ${balanceFormatted} USDC`);

  const hasEnough = userBalance >= (activeLoan.amount - activeLoan.amountRepaid);
  console.log(`   ${hasEnough ? "✅ Sufficient balance" : "❌ INSUFFICIENT BALANCE!"}`);

  if (!hasEnough) {
    console.log(`\n   ⚠️  User needs ${remaining} USDC but only has ${balanceFormatted} USDC`);
    console.log("   Get USDC from: https://faucet.circle.com/");
  }

  // Step 4: Check USDC allowance
  const allowance = await usdc.allowance(userAddress, await bnplCore.getAddress());
  const allowanceFormatted = ethers.formatUnits(allowance, 6);
  console.log(`\n4️⃣  USDC Allowance: ${allowanceFormatted} USDC`);

  const isApproved = allowance >= (activeLoan.amount - activeLoan.amountRepaid);
  console.log(`   ${isApproved ? "✅ Approved for repayment" : "❌ NOT APPROVED - Need approval first!"}`);

  // Step 5: Check contract balance (lending pool)
  const contractBalance = await usdc.balanceOf(await bnplCore.getAddress());
  const contractBalanceFormatted = ethers.formatUnits(contractBalance, 6);
  console.log(`\n5️⃣  Protocol Pool Balance: ${contractBalanceFormatted} USDC`);

  // Summary
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("📋 REPAYMENT CHECKLIST:\n");

  const checks = [
    { name: "Has active loan", status: hasActiveLoan },
    { name: "Has enough USDC", status: hasEnough },
    { name: "USDC approved", status: isApproved },
  ];

  checks.forEach(check => {
    console.log(`   ${check.status ? "✅" : "❌"} ${check.name}`);
  });

  const allGood = checks.every(c => c.status);

  if (allGood) {
    console.log("\n✅ All checks passed! User can repay the loan.");
    console.log("\n📝 Steps to repay on frontend:");
    console.log("   1. Go to http://localhost:3000/repay");
    console.log("   2. If not approved, click 'Approve USDC'");
    console.log("   3. Click 'Pay Full Amount' or pay in installments");
    console.log(`   4. Confirm MetaMask transaction for ${remaining} USDC`);
    console.log("\n🔍 Verify on blockchain:");
    console.log(`   User balance before: ${balanceFormatted} USDC`);
    console.log(`   User balance after should be: ${(parseFloat(balanceFormatted) - parseFloat(remaining)).toFixed(6)} USDC`);
    console.log(`   Protocol pool before: ${contractBalanceFormatted} USDC`);
    console.log(`   Protocol pool after should be: ${(parseFloat(contractBalanceFormatted) + parseFloat(remaining)).toFixed(6)} USDC`);
  } else {
    console.log("\n❌ Cannot repay yet. Fix the issues above first.");
    
    if (!hasEnough) {
      console.log("\n💡 Get test USDC:");
      console.log("   1. Go to https://faucet.circle.com/");
      console.log("   2. Select 'Polygon Amoy' network");
      console.log("   3. Enter your wallet address");
      console.log(`   4. Request at least ${remaining} USDC`);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
