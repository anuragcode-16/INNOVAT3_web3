import { ethers } from "hardhat";

async function main() {
  const BNPL_CORE_ADDRESS = "0xef520D6920d41430C2d1057B4D24EF756393A999";
  
  console.log("\n🔍 Checking BNPLCore contract owner...\n");
  
  const bnplCore = await ethers.getContractAt("BNPLCore", BNPL_CORE_ADDRESS);
  const owner = await bnplCore.owner();
  
  const [deployer] = await ethers.getSigners();
  
  console.log("📋 Contract Information:");
  console.log("  BNPLCore Address:", BNPL_CORE_ADDRESS);
  console.log("  Contract Owner:", owner);
  console.log("  Your Wallet:", deployer.address);
  console.log("  Is Owner:", owner.toLowerCase() === deployer.address.toLowerCase() ? "✅ YES" : "❌ NO");
  
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("\n⚠️  WARNING: You are NOT the owner of this contract!");
    console.log("   Only the owner can deposit/withdraw liquidity.");
    console.log("   Please connect with:", owner);
  } else {
    console.log("\n✅ You are the owner! You can deposit liquidity.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
