import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy OnStream BNPL Protocol to Polygon Amoy Testnet
 * 
 * Prerequisites:
 * 1. Set PRIVATE_KEY in .env (admin wallet with MATIC for gas)
 * 2. Set AMOY_RPC_URL in .env (optional, defaults to public RPC)
 * 3. Admin wallet should have testnet USDC for initial liquidity deposit
 * 
 * Testnet USDC Address: 0x8B0180f2101c8260d49339abfEe87927412494B4
 * Admin Address: 0x74E36d4A7b33057e3928CE4bf4C8C53A93361C34
 * Merchant Address: 0xF92e0D914c6Bbd5a1B51eB2C023a2c3977b7f4C4
 */

// Configuration
const USDC_ADDRESS = "0x8B0180f2101c8260d49339abfEe87927412494B4";
const ADMIN_ADDRESS = "0x74E36d4A7b33057e3928CE4bf4C8C53A93361C34";
const MERCHANT_ADDRESS = "0xF92e0D914c6Bbd5a1B51eB2C023a2c3977b7f4C4";
const MERCHANT_NAME = "OnStream Demo Store";
const MERCHANT_CATEGORY = "Digital Products";

interface DeploymentResult {
  network: string;
  timestamp: string;
  contracts: {
    TrustScoreManager: string;
    BNPLCore: string;
    USDC: string;
  };
  admin: string;
  merchant: string;
}

async function main() {
  console.log("\n🚀 OnStream BNPL Protocol - Deployment Script\n");
  console.log("═══════════════════════════════════════════════════════\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC\n");

  // Check if deployer is admin
  if (deployer.address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
    console.log("⚠️  Warning: Deployer is not the designated admin address");
    console.log("   Deployer:", deployer.address);
    console.log("   Expected Admin:", ADMIN_ADDRESS);
    console.log("   Contracts will be owned by the deployer.\n");
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "| Chain ID:", network.chainId.toString());
  console.log("═══════════════════════════════════════════════════════\n");

  // Step 1: Deploy TrustScoreManager
  console.log("📦 Step 1: Deploying TrustScoreManager...");
  const TrustScoreManager = await ethers.getContractFactory("TrustScoreManager");
  const trustScoreManager = await TrustScoreManager.deploy(deployer.address);
  await trustScoreManager.waitForDeployment();
  const trustScoreManagerAddress = await trustScoreManager.getAddress();
  console.log("   ✅ TrustScoreManager deployed to:", trustScoreManagerAddress);

  // Step 2: Deploy BNPLCore
  console.log("\n📦 Step 2: Deploying BNPLCore...");
  const BNPLCore = await ethers.getContractFactory("BNPLCore");
  const bnplCore = await BNPLCore.deploy(USDC_ADDRESS, deployer.address);
  await bnplCore.waitForDeployment();
  const bnplCoreAddress = await bnplCore.getAddress();
  console.log("   ✅ BNPLCore deployed to:", bnplCoreAddress);

  // Step 3: Link contracts
  console.log("\n🔗 Step 3: Linking contracts...");

  console.log("   Setting BNPLCore in TrustScoreManager...");
  const tx1 = await trustScoreManager.setBNPLCore(bnplCoreAddress);
  await tx1.wait();
  console.log("   ✅ TrustScoreManager linked to BNPLCore");

  console.log("   Setting TrustScoreManager in BNPLCore...");
  const tx2 = await bnplCore.setTrustScoreManager(trustScoreManagerAddress);
  await tx2.wait();
  console.log("   ✅ BNPLCore linked to TrustScoreManager");

  // Step 4: Add merchant
  console.log("\n🏪 Step 4: Adding merchant...");
  console.log("   Merchant Address:", MERCHANT_ADDRESS);
  console.log("   Merchant Name:", MERCHANT_NAME);
  console.log("   Merchant Category:", MERCHANT_CATEGORY);

  const tx3 = await bnplCore.addMerchant(MERCHANT_ADDRESS, MERCHANT_NAME, MERCHANT_CATEGORY);
  await tx3.wait();
  console.log("   ✅ Merchant added successfully");

  // Summary
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("🎉 DEPLOYMENT COMPLETE!\n");
  console.log("Contract Addresses:");
  console.log("───────────────────────────────────────────────────────");
  console.log("TrustScoreManager:", trustScoreManagerAddress);
  console.log("BNPLCore:         ", bnplCoreAddress);
  console.log("USDC (Testnet):   ", USDC_ADDRESS);
  console.log("───────────────────────────────────────────────────────");
  console.log("\nAdmin Address:    ", deployer.address);
  console.log("Merchant Address: ", MERCHANT_ADDRESS);
  console.log("═══════════════════════════════════════════════════════\n");

  // Save deployment info
  const deploymentResult: DeploymentResult = {
    network: network.name || "amoy",
    timestamp: new Date().toISOString(),
    contracts: {
      TrustScoreManager: trustScoreManagerAddress,
      BNPLCore: bnplCoreAddress,
      USDC: USDC_ADDRESS,
    },
    admin: deployer.address,
    merchant: MERCHANT_ADDRESS,
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `deployment-${network.chainId}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentResult, null, 2)
  );
  console.log("📄 Deployment info saved to:", `deployments/${filename}`);

  // Also save a latest.json for easy access
  fs.writeFileSync(
    path.join(deploymentsDir, "latest.json"),
    JSON.stringify(deploymentResult, null, 2)
  );
  console.log("📄 Latest deployment saved to: deployments/latest.json");

  // Next steps
  console.log("\n📋 NEXT STEPS:");
  console.log("───────────────────────────────────────────────────────");
  console.log("1. Verify contracts on PolygonScan:");
  console.log(`   npx hardhat verify --network amoy ${trustScoreManagerAddress} "${deployer.address}"`);
  console.log(`   npx hardhat verify --network amoy ${bnplCoreAddress} "${USDC_ADDRESS}" "${deployer.address}"`);
  console.log("");
  console.log("2. Deposit initial liquidity (as admin):");
  console.log("   - Approve USDC spending on BNPLCore contract");
  console.log("   - Call depositLiquidity(amount) on BNPLCore");
  console.log("");
  console.log("3. Update frontend environment variables:");
  console.log(`   NEXT_PUBLIC_TRUST_SCORE_MANAGER_ADDRESS=${trustScoreManagerAddress}`);
  console.log(`   NEXT_PUBLIC_BNPL_CORE_ADDRESS=${bnplCoreAddress}`);
  console.log("═══════════════════════════════════════════════════════\n");

  return deploymentResult;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
