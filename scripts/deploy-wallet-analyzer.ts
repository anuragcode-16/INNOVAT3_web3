import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log("📦 Deploying WalletAnalyzer and updating TrustScoreManager...")
  console.log("Deployer address:", deployer.address)

  // Deployed contract addresses (from previous deployment)
  const TRUST_SCORE_MANAGER = "0x3ef1456a5AbA04eFd979be0a49232211C88Df014"
  const BNPL_CORE = "0x0B8e9E0278Fe46647E9C4876586Ece93e8Ec1F65"

  // Deploy WalletAnalyzer
  console.log("\n1️⃣ Deploying WalletAnalyzer...")
  const WalletAnalyzer = await ethers.getContractFactory("WalletAnalyzer")
  const walletAnalyzer = await WalletAnalyzer.deploy()
  await walletAnalyzer.waitForDeployment()
  const walletAnalyzerAddress = await walletAnalyzer.getAddress()
  
  console.log("✅ WalletAnalyzer deployed to:", walletAnalyzerAddress)

  // Wait for a few blocks
  console.log("\n⏳ Waiting for block confirmations...")
  await new Promise(resolve => setTimeout(resolve, 10000)) // 10 seconds

  // Update TrustScoreManager to use WalletAnalyzer
  console.log("\n2️⃣ Linking WalletAnalyzer to TrustScoreManager...")
  const trustScoreManager = await ethers.getContractAt("TrustScoreManager", TRUST_SCORE_MANAGER)
  
  const setAnalyzerTx = await trustScoreManager.setWalletAnalyzer(walletAnalyzerAddress)
  await setAnalyzerTx.wait()
  
  console.log("✅ WalletAnalyzer linked to TrustScoreManager")

  // Test wallet analysis
  console.log("\n3️⃣ Testing wallet analysis...")
  const testAddress = deployer.address
  
  // Get score breakdown
  const breakdown = await walletAnalyzer.getScoreBreakdown(testAddress)
  console.log("\n📊 Wallet Analysis for", testAddress)
  console.log("  Age Score:", breakdown[0].toString(), "/ 20")
  console.log("  Activity Score:", breakdown[1].toString(), "/ 20")
  console.log("  Balance Score:", breakdown[2].toString(), "/ 20")
  console.log("  Total History Bonus:", breakdown[3].toString(), "/ 60")

  // Get updated credit info
  const creditInfo = await trustScoreManager.getUserCreditInfo(testAddress)
  console.log("\n💳 Updated Credit Information:")
  console.log("  Repayment Score:", ethers.formatUnits(creditInfo[0], 0))
  console.log("  Total Score:", ethers.formatUnits(creditInfo[1], 0))
  console.log("  Wallet Bonus:", ethers.formatUnits(creditInfo[2], 0))
  console.log("  Credit Limit:", ethers.formatUnits(creditInfo[3], 6), "USDC")

  // Save deployment info
  const deploymentInfo = {
    network: "polygon-amoy",
    chainId: 80002,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      walletAnalyzer: walletAnalyzerAddress,
      trustScoreManager: TRUST_SCORE_MANAGER,
      bnplCore: BNPL_CORE
    },
    upgrades: {
      walletAnalyzerLinked: true,
      enhancedScoringEnabled: true
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("🎉 DEPLOYMENT COMPLETE!")
  console.log("=".repeat(60))
  console.log("\n📋 Summary:")
  console.log(JSON.stringify(deploymentInfo, null, 2))
  
  console.log("\n📝 Next Steps:")
  console.log("1. Verify WalletAnalyzer on PolygonScan")
  console.log("2. Update frontend with new scoring display")
  console.log("3. Test enhanced credit scoring on testnet")
  
  console.log("\n🔗 Verify Command:")
  console.log(`npx hardhat verify --network amoy ${walletAnalyzerAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
