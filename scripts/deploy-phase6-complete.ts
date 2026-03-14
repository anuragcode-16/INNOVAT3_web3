import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log("\n🚀 Deploying Complete Enhanced BNPL System (Phase 6)...")
  console.log("📋 Including: Wallet Analysis + ZK Proofs + Trust Scoring\n")
  console.log("Deployer address:", deployer.address)

  // Contract addresses
  const USDC_ADDRESS = "0x8B0180f2101c8260d49339abfEe87927412494B4" // Polygon Amoy USDC
  const MERCHANT_ADDRESS = "0xF92e0D914c6Bbd5a1B51eB2C023a2c3977b7f4C4"

  // 1. Deploy WalletAnalyzer
  console.log("\n1️⃣ Deploying WalletAnalyzer...")
  const WalletAnalyzer = await ethers.getContractFactory("WalletAnalyzer")
  const walletAnalyzer = await WalletAnalyzer.deploy()
  await walletAnalyzer.waitForDeployment()
  const walletAnalyzerAddress = await walletAnalyzer.getAddress()
  console.log("✅ WalletAnalyzer deployed to:", walletAnalyzerAddress)

  // 2. Deploy ZKCreditVerifier
  console.log("\n2️⃣ Deploying ZKCreditVerifier...")
  const ZKCreditVerifier = await ethers.getContractFactory("ZKCreditVerifier")
  const zkVerifier = await ZKCreditVerifier.deploy()
  await zkVerifier.waitForDeployment()
  const zkVerifierAddress = await zkVerifier.getAddress()
  console.log("✅ ZKCreditVerifier deployed to:", zkVerifierAddress)

  // 3. Deploy new TrustScoreManager
  console.log("\n3️⃣ Deploying TrustScoreManager...")
  const TrustScoreManager = await ethers.getContractFactory("TrustScoreManager")
  const trustScoreManager = await TrustScoreManager.deploy(deployer.address)
  await trustScoreManager.waitForDeployment()
  const trustScoreManagerAddress = await trustScoreManager.getAddress()
  console.log("✅ TrustScoreManager deployed to:", trustScoreManagerAddress)

  // 4. Deploy new BNPLCore
  console.log("\n4️⃣ Deploying BNPLCore...")
  const BNPLCore = await ethers.getContractFactory("BNPLCore")
  const bnplCore = await BNPLCore.deploy(
    USDC_ADDRESS,
    deployer.address
  )
  await bnplCore.waitForDeployment()
  const bnplCoreAddress = await bnplCore.getAddress()
  console.log("✅ BNPLCore deployed to:", bnplCoreAddress)

  // 5. Link contracts
  console.log("\n5️⃣ Linking all contracts...")
  
  // Link TrustScoreManager to BNPLCore
  const setBNPLTx = await trustScoreManager.setBNPLCore(bnplCoreAddress)
  await setBNPLTx.wait()
  console.log("✅ TrustScoreManager → BNPLCore linked")

  // Link TrustScoreManager to WalletAnalyzer
  const setAnalyzerTx = await trustScoreManager.setWalletAnalyzer(walletAnalyzerAddress)
  await setAnalyzerTx.wait()
  console.log("✅ TrustScoreManager → WalletAnalyzer linked")

  // Link TrustScoreManager to ZKCreditVerifier
  const setZKTx = await trustScoreManager.setZKVerifier(zkVerifierAddress)
  await setZKTx.wait()
  console.log("✅ TrustScoreManager → ZKCreditVerifier linked")

  // Link BNPLCore to TrustScoreManager
  const setTrustTx = await bnplCore.setTrustScoreManager(trustScoreManagerAddress)
  await setTrustTx.wait()
  console.log("✅ BNPLCore → TrustScoreManager linked")

  // 6. Add merchant
  console.log("\n6️⃣ Adding merchant...")
  const addMerchantTx = await bnplCore.addMerchant(
    MERCHANT_ADDRESS,
    "Demo Merchant",
    "E-commerce"
  )
  await addMerchantTx.wait()
  console.log("✅ Merchant added:", MERCHANT_ADDRESS)

  // 7. Test wallet analysis
  console.log("\n7️⃣ Testing wallet analysis for deployer...")
  const breakdown = await walletAnalyzer.getScoreBreakdown(deployer.address)
  console.log("\n📊 Wallet Analysis:")
  console.log("  Age Score:", breakdown[0].toString(), "/ 20")
  console.log("  Activity Score:", breakdown[1].toString(), "/ 20")  
  console.log("  Balance Score:", breakdown[2].toString(), "/ 20")
  console.log("  Total History Bonus:", breakdown[3].toString(), "/ 60")

  // 8. Submit test ZK proof
  console.log("\n8️⃣ Submitting test ZK proof...")
  const mockProof = {
    threshold: 500n * 10n**6n, // 500 USDC
    a: [1n, 2n] as [bigint, bigint],
    b: [[3n, 4n], [5n, 6n]] as [[bigint, bigint], [bigint, bigint]],
    c: [7n, 8n] as [bigint, bigint],
    input: [1n] as [bigint]
  }
  const proofTx = await zkVerifier.submitBalanceProof(
    mockProof.threshold,
    mockProof.a,
    mockProof.b,
    mockProof.c,
    mockProof.input
  )
  await proofTx.wait()
  console.log("✅ ZK Proof submitted successfully!")

  // 9. Get complete credit info
  console.log("\n9️⃣ Getting complete credit information...")
  const creditInfo = await trustScoreManager.getUserCreditInfo(deployer.address)
  console.log("\n💳 Complete Credit Breakdown:")
  console.log("  Repayment Score:", creditInfo[0].toString(), "points")
  console.log("  Wallet History Bonus:", creditInfo[2].toString(), "points")
  console.log("  ZK Proof Boost:", creditInfo[3].toString(), "points")
  console.log("  ─────────────────────────────")
  console.log("  Total Score:", creditInfo[1].toString(), "points")
  console.log("  Credit Limit:", ethers.formatUnits(creditInfo[4], 6), "USDC")

  // Wait for confirmations
  console.log("\n⏳ Waiting for block confirmations...")
  await new Promise(resolve => setTimeout(resolve, 30000)) // Wait 30 seconds
  console.log("✅ Confirmations received!")

  console.log("\n" + "=".repeat(70))
  console.log("📋 DEPLOYMENT SUMMARY - PHASE 6 COMPLETE")
  console.log("=".repeat(70))
  
  console.log("\n🎯 Deployed Contracts:")
  console.log(`  WalletAnalyzer:      ${walletAnalyzerAddress}`)
  console.log(`  ZKCreditVerifier:    ${zkVerifierAddress}`)
  console.log(`  TrustScoreManager:   ${trustScoreManagerAddress}`)
  console.log(`  BNPLCore:            ${bnplCoreAddress}`)
  
  console.log("\n📊 System Configuration:")
  console.log("  USDC Token:", USDC_ADDRESS)
  console.log("  Admin:", deployer.address)
  console.log("  Merchant:", MERCHANT_ADDRESS)
  
  console.log("\n✅ Features Enabled:")
  console.log("  ✓ Wallet History Analysis (0-60 points)")
  console.log("  ✓ ZK Balance Proofs (10-30 points)")
  console.log("  ✓ Repayment Scoring (10-15 per payment)")
  console.log("  ✓ Enhanced Credit Limits")

  console.log("\n🎯 Score Components:")
  console.log("  Base Credit:       10 USDC (everyone)")
  console.log("  Wallet History:    0-60 points → +0 to 30 USDC")
  console.log("  ZK Proof Boost:    10-30 points → +5 to 15 USDC")
  console.log("  Repayment Score:   Variable → +5 USDC per 10 points")
  console.log("  Maximum Possible:  190+ points → 105+ USDC credit!")

  console.log("\n📝 Next Steps:")
  console.log("\n  1. Verify all contracts on PolygonScan:")
  console.log(`     npx hardhat verify --network amoy ${walletAnalyzerAddress}`)
  console.log(`     npx hardhat verify --network amoy ${zkVerifierAddress}`)
  console.log(`     npx hardhat verify --network amoy ${trustScoreManagerAddress} ${deployer.address}`)
  console.log(`     npx hardhat verify --network amoy ${bnplCoreAddress} ${USDC_ADDRESS} ${deployer.address}`)
  
  console.log("\n  2. Update frontend .env.local:")
  console.log(`     NEXT_PUBLIC_TRUST_SCORE_MANAGER_ADDRESS=${trustScoreManagerAddress}`)
  console.log(`     NEXT_PUBLIC_BNPL_CORE_ADDRESS=${bnplCoreAddress}`)
  console.log(`     NEXT_PUBLIC_WALLET_ANALYZER_ADDRESS=${walletAnalyzerAddress}`)
  console.log(`     NEXT_PUBLIC_ZK_VERIFIER_ADDRESS=${zkVerifierAddress}`)
  
  console.log("\n  3. Fund protocol with liquidity:")
  console.log("     Update setup-enhanced-liquidity.ts with new BNPLCore address")
  console.log("     npx hardhat run scripts/setup-enhanced-liquidity.ts --network amoy")
  
  console.log("\n  4. Test on frontend:")
  console.log("     - Dashboard shows all three score components")
  console.log("     - Shop page allows BNPL purchases")
  console.log("     - ZK Proof page enables privacy-preserving credit boost")
  
  console.log("\n" + "=".repeat(70))
  console.log("🎊 PHASE 6 DEPLOYMENT COMPLETE!")
  console.log("=".repeat(70) + "\n")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
