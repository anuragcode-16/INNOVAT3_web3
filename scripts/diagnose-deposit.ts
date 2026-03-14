import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();

  console.log("=== DEPOSIT LIQUIDITY DIAGNOSTIC ===\n");
  console.log(`Checking wallet: ${signerAddress}\n`);

  // Get contract instances
  const bnplCore = await ethers.getContractAt(
    "BNPLCore",
    "0xef520D6920d41430C2d1057B4D24EF756393A999"
  );

  const usdc = await ethers.getContractAt(
    "IERC20",
    "0x8B0180f2101c8260d49339abfEe87927412494B4"
  );

  // Check 1: Owner
  const owner = await bnplCore.owner();
  console.log(`1. Contract Owner: ${owner}`);
  console.log(`   Your Address: ${signerAddress}`);
  console.log(`   Status: ${owner.toLowerCase() === signerAddress.toLowerCase() ? "✅ You are owner" : "❌ NOT OWNER"}\n`);

  // Check 2: USDC Balance
  const balance = await usdc.balanceOf(signerAddress);
  console.log(`2. Your USDC Balance: ${ethers.formatUnits(balance, 6)} USDC`);
  console.log(`   Status: ${balance > 0n ? "✅ Has balance" : "❌ NO BALANCE"}\n`);

  // Check 3: Allowance
  const allowance = await usdc.allowance(signerAddress, await bnplCore.getAddress());
  console.log(`3. USDC Allowance: ${ethers.formatUnits(allowance, 6)} USDC`);
  console.log(`   Status: ${allowance > 0n ? "✅ Approved" : "❌ NOT APPROVED"}\n`);

  // Check 4: POL Balance (for gas)
  const polBalance = await ethers.provider.getBalance(signerAddress);
  console.log(`4. POL Balance: ${ethers.formatEther(polBalance)} POL`);
  console.log(`   Status: ${polBalance > ethers.parseEther("0.01") ? "✅ Sufficient gas" : "⚠️ Low POL"}\n`);

  // Check 5: Contract Paused?
  const paused = await bnplCore.paused();
  console.log(`5. Contract Paused: ${paused}`);
  console.log(`   Status: ${!paused ? "✅ Active" : "❌ PAUSED"}\n`);

  // Check 6: Contract USDC Balance
  const contractBalance = await usdc.balanceOf(await bnplCore.getAddress());
  console.log(`6. Contract USDC Balance: ${ethers.formatUnits(contractBalance, 6)} USDC\n`);

  // Determine the issue
  console.log("=== DIAGNOSIS ===");
  if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
    console.log("❌ ISSUE: You are not the contract owner!");
    console.log(`   Expected: ${owner}`);
    console.log(`   Got: ${signerAddress}`);
    console.log("\n   SOLUTION: Use the admin wallet in MetaMask");
  } else if (balance === 0n) {
    console.log("❌ ISSUE: No USDC in wallet!");
    console.log("\n   SOLUTION: Get test USDC from https://faucet.circle.com/");
  } else if (allowance === 0n) {
    console.log("❌ ISSUE: USDC not approved!");
    console.log("\n   SOLUTION: Click 'Approve USDC' button first");
  } else if (paused) {
    console.log("❌ ISSUE: Contract is paused!");
    console.log("\n   SOLUTION: Unpause the contract");
  } else if (polBalance < ethers.parseEther("0.01")) {
    console.log("⚠️ WARNING: Low POL balance!");
    console.log("\n   SOLUTION: Get more POL from https://faucet.polygon.technology/");
  } else {
    console.log("✅ All checks passed! Attempting test deposit...\n");
    
    // Try a small deposit
    try {
      const testAmount = ethers.parseUnits("1", 6); // 1 USDC
      
      // First approve if needed
      if (allowance < testAmount) {
        console.log("Approving 100 USDC...");
        const approveTx = await usdc.approve(await bnplCore.getAddress(), ethers.parseUnits("100", 6));
        await approveTx.wait();
        console.log("✅ Approved!");
      }
      
      console.log("Attempting to deposit 1 USDC...");
      const tx = await bnplCore.depositLiquidity(testAmount);
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ DEPOSIT SUCCESSFUL!");
      console.log("   Block:", receipt?.blockNumber);
      console.log("   Gas used:", receipt?.gasUsed.toString());
      
      // Check new balance
      const newContractBalance = await usdc.balanceOf(await bnplCore.getAddress());
      console.log(`   New Contract Balance: ${ethers.formatUnits(newContractBalance, 6)} USDC`);
    } catch (error: any) {
      console.log("❌ DEPOSIT FAILED!");
      console.log("   Error:", error.message);
      if (error.reason) console.log("   Reason:", error.reason);
      if (error.code) console.log("   Code:", error.code);
      
      // Check for specific errors
      if (error.message.includes("OwnableUnauthorizedAccount")) {
        console.log("\n   FIX: You're not the contract owner. Use the deployer wallet.");
      } else if (error.message.includes("insufficient allowance")) {
        console.log("\n   FIX: Need to approve USDC spending first.");
      } else if (error.message.includes("transfer amount exceeds balance")) {
        console.log("\n   FIX: Not enough USDC in your wallet.");
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
