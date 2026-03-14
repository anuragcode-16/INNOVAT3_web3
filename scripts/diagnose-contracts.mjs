import { ethers } from "ethers";

// Setup provider
const RPC_URL = "https://rpc-amoy.polygon.technology";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Contract addresses
const TRUST_SCORE_MANAGER_ADDRESS = "0x3ef1456a5AbA04eFd979be0a49232211C88Df014";
const WALLET_ANALYZER_ADDRESS = "0xc7617B5255a23aF3820f187F8Ed2E64fE4CEdc63";
const ZK_VERIFIER_ADDRESS = "0xeaEf66e56f31AE649a77Ad859f2184f0051C5fc7";
const BNPL_CORE_ADDRESS = "0x0B8e9E0278Fe46647E9C4876586Ece93e8Ec1F65";
const TEST_USER = "0xd5c977fCE3566877C6f6286DDC94BD39599f4555"; // The user from error

// Minimal ABIs
const TSM_ABI = [
  "function walletAnalyzer() view returns (address)",
  "function zkVerifier() view returns (address)",
  "function bnplCore() view returns (address)",
  "function getUserCreditInfo(address) view returns (uint256, uint256, uint256, uint256, uint256)"
];

const BNPL_ABI = [
  "function trustScoreManager() view returns (address)",
  "function hasActiveLoan(address) view returns (bool)",
  "function getActiveLoan(address) view returns (tuple(uint256 amount, uint256 amountRepaid, uint256 dueDate, address merchant, bool isRepaid, bool isDefaulted))"
];

async function main() {
  console.log("\n🔍 OnStream Contract Diagnostics\n");
  console.log("=".repeat(60));

  try {
    // Create contract instances
    const tsm = new ethers.Contract(TRUST_SCORE_MANAGER_ADDRESS, TSM_ABI, provider);
    const bnpl = new ethers.Contract(BNPL_CORE_ADDRESS, BNPL_ABI, provider);

    // Check linkages
    console.log("\n1️⃣  TrustScoreManager Linkages:");
    const linkedWA = await tsm.walletAnalyzer();
    const linkedZK = await tsm.zkVerifier();
    const linkedBNPL = await tsm.bnplCore();

    console.log(`   WalletAnalyzer:`);
    console.log(`     Expected: ${WALLET_ANALYZER_ADDRESS}`);
    console.log(`     Actual:   ${linkedWA}`);
    console.log(`     Status:   ${linkedWA === WALLET_ANALYZER_ADDRESS ? '✅ LINKED' : linkedWA === ethers.ZeroAddress ? '❌ NOT LINKED (0x0)' : '⚠️  MISMATCH'}`);

    console.log(`\n   ZKVerifier:`);
    console.log(`     Expected: ${ZK_VERIFIER_ADDRESS}`);
    console.log(`     Actual:   ${linkedZK}`);
    console.log(`     Status:   ${linkedZK === ZK_VERIFIER_ADDRESS ? '✅ LINKED' : linkedZK === ethers.ZeroAddress ? '❌ NOT LINKED (0x0)' : '⚠️  MISMATCH'}`);

    console.log(`\n   BNPLCore:`);
    console.log(`     Expected: ${BNPL_CORE_ADDRESS}`);
    console.log(`     Actual:   ${linkedBNPL}`);
    console.log(`     Status:   ${linkedBNPL === BNPL_CORE_ADDRESS ? '✅ LINKED' : linkedBNPL === ethers.ZeroAddress ? '❌ NOT LINKED (0x0)' : '⚠️  MISMATCH'}`);

    // Check BNPL linkage
    console.log(`\n\n2️⃣  BNPLCore Linkages:`);
    const linkedTSM = await bnpl.trustScoreManager();
    console.log(`   TrustScoreManager:`);
    console.log(`     Expected: ${TRUST_SCORE_MANAGER_ADDRESS}`);
    console.log(`     Actual:   ${linkedTSM}`);
    console.log(`     Status:   ${linkedTSM === TRUST_SCORE_MANAGER_ADDRESS ? '✅ LINKED' : linkedTSM === ethers.ZeroAddress ? '❌ NOT LINKED (0x0)' : '⚠️  MISMATCH'}`);

    // Test getUserCreditInfo
    console.log(`\n\n3️⃣  Testing getUserCreditInfo for ${TEST_USER}:`);
    try {
      const creditInfo = await tsm.getUserCreditInfo(TEST_USER);
      console.log(`   ✅ SUCCESS!`);
      console.log(`   Score:        ${creditInfo[0].toString()}`);
      console.log(`   Total Score:  ${creditInfo[1].toString()}`);
      console.log(`   Wallet Bonus: ${creditInfo[2].toString()}`);
      console.log(`   ZK Boost:     ${creditInfo[3].toString()}`);
      console.log(`   Credit Limit: ${ethers.formatUnits(creditInfo[4], 6)} USDC`);
    } catch (error) {
      console.log(`   ❌ ERROR:`);
      console.log(`   ${error.message}`);

      if (error.message.includes('out of bounds')) {
        console.log(`\n   📌 This error occurs when contract tries to decode return data`);
        console.log(`      from a contract call that failed or returned invalid data.`);
        console.log(`      Likely cause: WalletAnalyzer or ZKVerifier not deployed`);
        console.log(`      at the addresses they're linked to.`);
      }
    }

    // Test hasActiveLoan
    console.log(`\n\n4️⃣  Testing hasActiveLoan for ${TEST_USER}:`);
    try {
      const hasLoan = await bnpl.hasActiveLoan(TEST_USER);
      console.log(`   ✅ SUCCESS! Has active loan: ${hasLoan}`);
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }

    // Summary
    console.log("\n\n" + "=".repeat(60));
    console.log("📊 DIAGNOSIS SUMMARY");
    console.log("=".repeat(60));

    const allLinked =
      linkedWA === WALLET_ANALYZER_ADDRESS &&
      linkedZK === ZK_VERIFIER_ADDRESS &&
      linkedBNPL === BNPL_CORE_ADDRESS &&
      linkedTSM === TRUST_SCORE_MANAGER_ADDRESS;

    if (!allLinked) {
      console.log("\n⚠️  CONTRACTS NOT PROPERLY LINKED!");
      console.log("\nTo fix:");
      console.log("1. Connect your admin wallet");
      console.log("2. Visit http://localhost:3000/test-contracts");
      console.log("3. Click 'Fix Linkage' buttons");
      console.log("\nOr run: npx hardhat run scripts/link-contracts-latest.ts --network amoy");
    } else {
      console.log("\n✅ All contracts properly linked!");
      console.log("\nIf you're still seeing errors, the issue may be:");
      console.log("- RPC connection problems");
      console.log("- Browser cache (try hard refresh)");
      console.log("- Wallet network mismatch");
    }

  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
