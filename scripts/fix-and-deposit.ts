import { ethers } from "hardhat";

async function main() {
  const USDC_ADDRESS = "0x8B0180f2101c8260d49339abfEe87927412494B4";
  const BNPL_CORE_ADDRESS = "0xef520D6920d41430C2d1057B4D24EF756393A999";
  
  const [signer] = await ethers.getSigners();
  console.log("Wallet:", await signer.getAddress());
  
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  
  // Check current allowance
  const currentAllowance = await usdc.allowance(await signer.getAddress(), BNPL_CORE_ADDRESS);
  console.log("Current Allowance to BNPLCore:", ethers.formatUnits(currentAllowance, 6), "USDC");
  
  // Approve 1000 USDC
  console.log("\nApproving 1000 USDC to BNPLCore...");
  const tx = await usdc.approve(BNPL_CORE_ADDRESS, ethers.parseUnits("1000", 6));
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("✅ Approved!");
  
  // Verify new allowance
  const newAllowance = await usdc.allowance(await signer.getAddress(), BNPL_CORE_ADDRESS);
  console.log("New Allowance:", ethers.formatUnits(newAllowance, 6), "USDC");
  
  // Now try deposit
  console.log("\n--- Now attempting deposit ---");
  const bnplCore = await ethers.getContractAt("BNPLCore", BNPL_CORE_ADDRESS);
  
  const balance = await usdc.balanceOf(await signer.getAddress());
  console.log("Your USDC balance:", ethers.formatUnits(balance, 6), "USDC");
  
  if (balance > 0n) {
    // Deposit 1 USDC
    const depositAmount = ethers.parseUnits("1", 6);
    console.log("Depositing 1 USDC...");
    const depositTx = await bnplCore.depositLiquidity(depositAmount);
    console.log("Deposit tx:", depositTx.hash);
    await depositTx.wait();
    console.log("✅ DEPOSIT SUCCESSFUL!");
    
    // Check contract balance
    const contractBalance = await usdc.balanceOf(BNPL_CORE_ADDRESS);
    console.log("Contract USDC Balance:", ethers.formatUnits(contractBalance, 6), "USDC");
  } else {
    console.log("No USDC to deposit!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
