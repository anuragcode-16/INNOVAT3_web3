import { ethers } from "hardhat";

async function main() {
  const BNPL_CORE_ADDRESS = "0xef520D6920d41430C2d1057B4D24EF756393A999";
  const USDC_WE_USE = "0x8B0180f2101c8260d49339abfEe87927412494B4";
  
  const bnpl = await ethers.getContractAt("BNPLCore", BNPL_CORE_ADDRESS);
  const usdcInContract = await bnpl.usdc();
  
  console.log("USDC in BNPLCore contract:", usdcInContract);
  console.log("USDC we are using:        ", USDC_WE_USE);
  console.log("Match:", usdcInContract.toLowerCase() === USDC_WE_USE.toLowerCase() ? "✅ YES" : "❌ NO - MISMATCH!");
  
  if (usdcInContract.toLowerCase() !== USDC_WE_USE.toLowerCase()) {
    console.log("\n⚠️ CRITICAL: BNPLCore is configured with a DIFFERENT USDC address!");
    console.log("   The frontend is approving the wrong USDC token.");
    console.log("   Need to update frontend constants to use:", usdcInContract);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
