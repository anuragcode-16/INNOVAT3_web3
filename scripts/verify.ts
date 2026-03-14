import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Verify Contracts on PolygonScan
 * 
 * Prerequisites:
 * 1. Set POLYGONSCAN_API_KEY in .env
 * 2. Deploy contracts first (npm run deploy)
 * 
 * Usage:
 *   npx hardhat run scripts/verify.ts --network amoy
 */

async function main() {
  console.log("\n🔍 OnStream - Contract Verification\n");
  console.log("═══════════════════════════════════════════════════════\n");

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  const latestPath = path.join(deploymentsDir, "latest.json");

  if (!fs.existsSync(latestPath)) {
    throw new Error("No deployment found. Run deploy.ts first.");
  }

  const deployment = JSON.parse(fs.readFileSync(latestPath, "utf-8"));
  console.log("📄 Loaded deployment from:", latestPath);

  // Verify TrustScoreManager
  console.log("\n📦 Verifying TrustScoreManager...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.TrustScoreManager,
      constructorArguments: [deployment.admin],
    });
    console.log("   ✅ TrustScoreManager verified!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("   ℹ️  TrustScoreManager already verified");
    } else {
      console.error("   ❌ TrustScoreManager verification failed:", error.message);
    }
  }

  // Verify BNPLCore
  console.log("\n📦 Verifying BNPLCore...");
  try {
    await run("verify:verify", {
      address: deployment.contracts.BNPLCore,
      constructorArguments: [deployment.contracts.USDC, deployment.admin],
    });
    console.log("   ✅ BNPLCore verified!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("   ℹ️  BNPLCore already verified");
    } else {
      console.error("   ❌ BNPLCore verification failed:", error.message);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("🎉 VERIFICATION COMPLETE!");
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
