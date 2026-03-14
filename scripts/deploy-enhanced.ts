import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log("📦 Deploying Enhanced BNPL System with Wallet Analysis...")
  console.log("Deployer address:", deployer.address)

  // Contract addresses
  const USDC_ADDRESS = "0x8B0180f2101c8260d49339abfEe87927412494B4" // Polygon Amoy USDC
  const OLD_BNPL_CORE = "0x0B8e9E0278Fe46647E9C4876586Ece93e8Ec1F65"
  const MERCHANT_ADDRESS = "0xF92e0D914c6Bbd5a1B51eB2C023a2c3977b7f4C4"

  // 1. Deploy WalletAnalyzer
  console.log("\n1️⃣ Deploying WalletAnalyzer...")
  const WalletAnalyzer = await ethers.getContractFactory("WalletAnalyzer")
  const walletAnalyzer = await WalletAnalyzer.deploy()
  await walletAnalyzer.waitForDeployment()
  const walletAnalyzerAddress = await walletAnalyzer.getAddress()
  console.log("✅ WalletAnalyzer deployed to:", walletAnalyzerAddress)

  // 2. Deploy new TrustScoreManager
  console.log("\n2️⃣ Deploying TrustScoreManager...")
  const TrustScoreManager = await ethers.getContractFactory("TrustScoreManager")
  const trustScoreManager = await TrustScoreManager.deploy(deployer.address)
  await trustScoreManager.waitForDeployment()
  const trustScoreManagerAddress = await trustScoreManager.getAddress()
  console.log("✅ TrustScoreManager deployed to:", trustScoreManagerAddress)

  // 3. Deploy new BNPLCore
  console.log("\n3️⃣ Deploying BNPLCore...")
  const BNPLCore = await ethers.getContractFactory("BNPLCore")
  const bnplCore = await BNPLCore.deploy(
    USDC_ADDRESS,
    deployer.address
  )
  await bnplCore.waitForDeployment()
  const bnplCoreAddress = await bnplCore.getAddress()
  console.log("✅ BNPLCore deployed to:", bnplCoreAddress)

  // 4. Link contracts
  console.log("\n4️⃣ Linking contracts...")
  
  // Link TrustScoreManager to BNPLCore
  const setBNPLTx = await trustScoreManager.setBNPLCore(bnplCoreAddress)
  await setBNPLTx.wait()
  console.log("✅ TrustScoreManager → BNPLCore linked")

  // Link TrustScoreManager to WalletAnalyzer
  const setAnalyzerTx = await trustScoreManager.setWalletAnalyzer(walletAnalyzerAddress)
  await setAnalyzerTx.wait()
  console.log("✅ TrustScoreManager → WalletAnalyzer linked")

  // Link BNPLCore to TrustScoreManager
  const setTrustTx = await bnplCore.setTrustScoreManager(trustScoreManagerAddress)
  await setTrustTx.wait()
  console.log("✅ BNPLCore → TrustScoreManager linked")

  // 5. Add merchant
  console.log("\n5️⃣ Adding merchant...")
  const addMerchantTx = await bnplCore.addMerchant(
    MERCHANT_ADDRESS,
    "Demo Merchant",
    "E-commerce"
  )
  await addMerchantTx.wait()
  console.log("✅ Merchant added:", MERCHANT_ADDRESS)

  // 6. Test wallet analysis
  console.log("\n6️⃣ Testing wallet analysis for deployer...")
  const breakdown = await walletAnalyzer.getScoreBreakdown(deployer.address)
  console.log("\n📊 Wallet Analysis:")
  console.log("  Age Score:", breakdown[0].toString(), "/ 20")
  console.log("  Activity Score:", breakdown[1].toString(), "/ 20")  
  console.log("  Balance Score:", breakdown[2].toString(), "/ 20")
  console.log("  Total History Bonus:", breakdown[3].toString(), "/ 60")

  // 7. Get credit info
  const creditInfo = await trustScoreManager.getUserCreditInfo(deployer.address)
  console.log("\n💳 Credit Information:")
  console.log("  Repayment Score:", creditInfo[0].toString())
  console.log("  Total Score:", creditInfo[1].toString())
  console.log("  Wallet Bonus:", creditInfo[2].toString())
  console.log("  Credit Limit:", ethers.formatUnits(creditInfo[3], 6), "USDC")

  // Save deployment info
  const deploymentInfo = {
    network: "polygon-amoy",
    chainId: 80002,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      walletAnalyzer: walletAnalyzerAddress,
      trustScoreManager: trustScoreManagerAddress,
      bnplCore: bnplCoreAddress,
      usdc: USDC_ADDRESS
    },
    configuration: {
      merchant: MERCHANT_ADDRESS,
      enhancedScoring: true,
      walletHistoryEnabled: true
    },
    oldContracts: {
      bnplCore: OLD_BNPL_CORE,
      trustScoreManager: "0x3ef1456a5AbA04eFd979be0a49232211C88Df014"
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("🎉 ENHANCED DEPLOYMENT COMPLETE!")
  console.log("=".repeat(60))
  console.log("\n📋 Deployment Summary:")
  console.log(JSON.stringify(deploymentInfo, null, 2))
  
  console.log("\n📝 Next Steps:")
  console.log("1. Update frontend/.env.local with new contract addresses")
  console.log("2. Verify contracts on PolygonScan")
  console.log("3. Fund protocol liquidity pool")
  console.log("4. Test enhanced scoring on frontend")
  
  console.log("\n🔗 Verify Commands:")
  console.log(`npx hardhat verify --network amoy ${walletAnalyzerAddress}`)
  console.log(`npx hardhat verify --network amoy ${trustScoreManagerAddress} ${deployer.address}`)
  console.log(`npx hardhat verify --network amoy ${bnplCoreAddress} ${USDC_ADDRESS} ${trustScoreManagerAddress} ${deployer.address}`)
  
  console.log("\n📄 Update .env.local:")
  console.log(`NEXT_PUBLIC_TRUST_SCORE_MANAGER_ADDRESS=${trustScoreManagerAddress}`)
  console.log(`NEXT_PUBLIC_BNPL_CORE_ADDRESS=${bnplCoreAddress}`)
  console.log(`NEXT_PUBLIC_WALLET_ANALYZER_ADDRESS=${walletAnalyzerAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
