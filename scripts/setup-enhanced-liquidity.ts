import { ethers } from "hardhat"

async function main() {
  const [admin] = await ethers.getSigners()
  
  console.log("💰 Setting up liquidity for enhanced BNPL protocol...")
  console.log("Admin address:", admin.address)

  // Contract addresses (Phase 6)
  const BNPL_CORE = "0x61Dc398E81F002aC230f6FAF5af60c6d5a5Cb1E3"
  const USDC = "0x8B0180f2101c8260d49339abfEe87927412494B4"
  
  // Get contracts
  const bnplCore = await ethers.getContractAt("BNPLCore", BNPL_CORE)
  const usdc = await ethers.getContractAt("IERC20", USDC)
  
  // Check admin balance
  const adminBalance = await usdc.balanceOf(admin.address)
  console.log("\n📊 Admin USDC Balance:", ethers.formatUnits(adminBalance, 6), "USDC")
  
  // Deposit amount (1 USDC - all we have)
  const depositAmount = ethers.parseUnits("1", 6)
  
  console.log("\n1️⃣ Approving USDC...")
  const approveTx = await usdc.approve(BNPL_CORE, depositAmount)
  await approveTx.wait()
  console.log("✅ USDC approved")
  
  console.log("\n2️⃣ Depositing liquidity...")
  const depositTx = await bnplCore.depositLiquidity(depositAmount)
  await depositTx.wait()
  console.log("✅ Liquidity deposited:", ethers.formatUnits(depositAmount, 6), "USDC")
  
  // Check protocol liquidity
  const protocolLiquidity = await bnplCore.getProtocolLiquidity()
  console.log("\n💵 Protocol Liquidity:", ethers.formatUnits(protocolLiquidity, 6), "USDC")
  
  console.log("\n✅ Setup complete! Protocol ready for testing.")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
