import { expect } from "chai";
import { ethers } from "hardhat";
import { BNPLCore, TrustScoreManager, WalletAnalyzer } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Default Handling", function () {
  let bnplCore: BNPLCore;
  let trustScoreManager: TrustScoreManager;
  let walletAnalyzer: WalletAnalyzer;
  let usdc: any;
  let admin: SignerWithAddress;
  let merchant: SignerWithAddress;
  let borrower: SignerWithAddress;
  let liquidityProvider: SignerWithAddress;

  const USDC_DECIMALS = 6;
  const ONE_USDC = ethers.parseUnits("1", USDC_DECIMALS);
  const TEN_USDC = ethers.parseUnits("10", USDC_DECIMALS);
  const TWENTY_USDC = ethers.parseUnits("20", USDC_DECIMALS);

  beforeEach(async function () {
    [admin, merchant, borrower, liquidityProvider] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("USD Coin", "USDC", USDC_DECIMALS);
    const usdcAddress = await usdc.getAddress();

    // Deploy WalletAnalyzer
    const WalletAnalyzer = await ethers.getContractFactory("WalletAnalyzer");
    walletAnalyzer = await WalletAnalyzer.deploy();
    const walletAnalyzerAddress = await walletAnalyzer.getAddress();

    // Deploy TrustScoreManager
    const TrustScoreManager = await ethers.getContractFactory("TrustScoreManager");
    trustScoreManager = await TrustScoreManager.deploy(admin.address);
    const trustScoreManagerAddress = await trustScoreManager.getAddress();

    // Deploy BNPLCore
    const BNPLCore = await ethers.getContractFactory("BNPLCore");
    bnplCore = await BNPLCore.deploy(usdcAddress, admin.address);
    const bnplCoreAddress = await bnplCore.getAddress();

    // Link contracts
    await trustScoreManager.setBNPLCore(bnplCoreAddress);
    await trustScoreManager.setWalletAnalyzer(walletAnalyzerAddress);
    await bnplCore.setTrustScoreManager(trustScoreManagerAddress);

    // Add merchant
    await bnplCore.addMerchant(merchant.address, "Test Merchant", "E-commerce");

    // Mint USDC to liquidity provider and deposit
    await usdc.mint(admin.address, ethers.parseUnits("1000", USDC_DECIMALS));
    await usdc.connect(admin).approve(bnplCoreAddress, ethers.parseUnits("1000", USDC_DECIMALS));
    await bnplCore.connect(admin).depositLiquidity(ethers.parseUnits("100", USDC_DECIMALS));
  });

  describe("Loan Default Tracking", function () {
    it("Should mark loan as defaulted after grace period expires", async function () {
      // Create a loan
      await bnplCore.connect(borrower).createLoan(TEN_USDC, merchant.address);
      
      const loanId = 1;
      let loan = await bnplCore.getLoan(loanId);
      
      // Verify loan is active
      expect(loan.status).to.equal(0); // LoanStatus.Active
      
      // Fast forward past due date + grace period (7 + 7 = 14 days)
      await time.increase(15 * 24 * 60 * 60); // 15 days
      
      // Mark as defaulted
      await expect(bnplCore.markAsDefaulted(loanId))
        .to.emit(bnplCore, "LoanDefaulted")
        .withArgs(loanId, borrower.address, TEN_USDC);
      
      // Verify loan status changed
      loan = await bnplCore.getLoan(loanId);
      expect(loan.status).to.equal(2); // LoanStatus.Defaulted
      
      // Verify user is blacklisted
      expect(await bnplCore.isBlacklisted(borrower.address)).to.be.true;
      
      // Verify trust score was penalized
      const score = await trustScoreManager.getTrustScore(borrower.address);
      expect(score).to.equal(0); // Started at 0, penalized 20, stays at 0
    });

    it("Should not allow marking as defaulted before grace period", async function () {
      // Create a loan
      await bnplCore.connect(borrower).createLoan(TEN_USDC, merchant.address);
      
      const loanId = 1;
      
      // Try to mark as defaulted immediately (should fail)
      await expect(
        bnplCore.markAsDefaulted(loanId)
      ).to.be.revertedWithCustomError(bnplCore, "GracePeriodNotOver");
      
      // Fast forward only to due date (7 days)
      await time.increase(7 * 24 * 60 * 60);
      
      // Still should fail
      await expect(
        bnplCore.markAsDefaulted(loanId)
      ).to.be.revertedWithCustomError(bnplCore, "GracePeriodNotOver");
    });

    it("Should prevent blacklisted users from creating new loans", async function () {
      // Blacklist the borrower
      await bnplCore.blacklistUser(borrower.address);
      
      // Try to create a loan (should fail)
      await expect(
        bnplCore.connect(borrower).createLoan(TEN_USDC, merchant.address)
      ).to.be.revertedWithCustomError(bnplCore, "BlacklistedUser");
    });
  });

  describe("Late Repayment with Penalty", function () {
    it("Should allow late repayment with 10% penalty", async function () {
      // Create a loan
      await bnplCore.connect(borrower).createLoan(TEN_USDC, merchant.address);
      
      const loanId = 1;
      
      // Fast forward past due date but within grace period (8 days)
      await time.increase(8 * 24 * 60 * 60);
      
      // Mint USDC to borrower for repayment + penalty
      const penalty = (TEN_USDC * 10n) / 100n; // 10% of 10 USDC = 1 USDC
      const totalAmount = TEN_USDC + penalty; // 11 USDC
      
      await usdc.mint(borrower.address, totalAmount);
      await usdc.connect(borrower).approve(await bnplCore.getAddress(), totalAmount);
      
      // Make late repayment
      await expect(bnplCore.connect(borrower).repayWithPenalty(TEN_USDC))
        .to.emit(bnplCore, "LateRepayment")
        .withArgs(loanId, borrower.address, TEN_USDC, penalty);
      
      // Verify loan is fully repaid
      const loan = await bnplCore.getLoan(loanId);
      expect(loan.isRepaid).to.be.true;
      expect(loan.status).to.equal(1); // LoanStatus.Repaid
      
      // Verify reduced score increase (+5 instead of +10)
      const score = await trustScoreManager.getTrustScore(borrower.address);
      expect(score).to.equal(5); // Late repayment gives only 5 points
    });

    it("Should not allow late repayment after grace period", async function () {
      // Create a loan
      await bnplCore.connect(borrower).createLoan(TEN_USDC, merchant.address);
      
      // Fast forward past grace period (15 days)
      await time.increase(15 * 24 * 60 * 60);
      
      // Mint USDC to borrower
      await usdc.mint(borrower.address, TWENTY_USDC);
      await usdc.connect(borrower).approve(await bnplCore.getAddress(), TWENTY_USDC);
      
      // Try to make late repayment (should fail - past grace period)
      await expect(
        bnplCore.connect(borrower).repayWithPenalty(TEN_USDC)
      ).to.be.revertedWithCustomError(bnplCore, "NotInGracePeriod");
    });

    it("Should not allow late repayment before due date", async function () {
      // Create a loan
      await bnplCore.connect(borrower).createLoan(TEN_USDC, merchant.address);
      
      // Mint USDC to borrower
      await usdc.mint(borrower.address, TWENTY_USDC);
      await usdc.connect(borrower).approve(await bnplCore.getAddress(), TWENTY_USDC);
      
      // Try to make late repayment immediately (should fail - not late yet)
      await expect(
        bnplCore.connect(borrower).repayWithPenalty(TEN_USDC)
      ).to.be.revertedWithCustomError(bnplCore, "NotPastDueDate");
    });

    it("Should handle partial late repayment with penalty", async function () {
      // Create a loan
      await bnplCore.connect(borrower).createLoan(TEN_USDC, merchant.address);
      
      // Fast forward past due date but within grace period
      await time.increase(8 * 24 * 60 * 60);
      
      // Pay half with penalty
      const halfAmount = TEN_USDC / 2n; // 5 USDC
      const penalty = (halfAmount * 10n) / 100n; // 0.5 USDC
      const totalAmount = halfAmount + penalty; // 5.5 USDC
      
      await usdc.mint(borrower.address, totalAmount);
      await usdc.connect(borrower).approve(await bnplCore.getAddress(), totalAmount);
      
      // Make partial late repayment
      await bnplCore.connect(borrower).repayWithPenalty(halfAmount);
      
      // Verify partial repayment
      const remainingBalance = await bnplCore.getRemainingBalance(borrower.address);
      expect(remainingBalance).to.equal(halfAmount);
      
      // Loan should not be marked as repaid yet
      const loan = await bnplCore.getLoan(1);
      expect(loan.isRepaid).to.be.false;
    });
  });

  describe("Trust Score Penalties", function () {
    it("Should penalize score by 20 points on default", async function () {
      // Give borrower initial score
      await bnplCore.connect(borrower).createLoan(TEN_USDC, merchant.address);
      
      // Wait 4 days so it's NOT early repayment (early threshold is 3 days)
      await time.increase(4 * 24 * 60 * 60);
      
      // Mint USDC and repay to build score
      await usdc.mint(borrower.address, TEN_USDC);
      await usdc.connect(borrower).approve(await bnplCore.getAddress(), TEN_USDC);
      await bnplCore.connect(borrower).repayLoan();
      
      // Check initial score (should be 10 for on-time payment)
      let score = await trustScoreManager.getTrustScore(borrower.address);
      expect(score).to.equal(10);
      
      // Create another loan and let it default
      await bnplCore.connect(borrower).createLoan(TEN_USDC, merchant.address);
      await time.increase(15 * 24 * 60 * 60); // Past grace period
      await bnplCore.markAsDefaulted(2);
      
      // Score should be reduced by 20 (10 - 20 = 0, capped at 0)
      score = await trustScoreManager.getTrustScore(borrower.address);
      expect(score).to.equal(0);
    });

    it("Should give reduced points for late repayment", async function () {
      // Create and repay late
      await bnplCore.connect(borrower).createLoan(TEN_USDC, merchant.address);
      
      await time.increase(8 * 24 * 60 * 60); // Past due, within grace
      
      const penalty = (TEN_USDC * 10n) / 100n;
      await usdc.mint(borrower.address, TEN_USDC + penalty);
      await usdc.connect(borrower).approve(await bnplCore.getAddress(), TEN_USDC + penalty);
      await bnplCore.connect(borrower).repayWithPenalty(TEN_USDC);
      
      // Should get only 5 points (not 10)
      const score = await trustScoreManager.getTrustScore(borrower.address);
      expect(score).to.equal(5);
    });
  });

  describe("Admin Blacklist Management", function () {
    it("Should allow admin to blacklist users", async function () {
      await expect(bnplCore.blacklistUser(borrower.address))
        .to.emit(bnplCore, "UserBlacklisted")
        .withArgs(borrower.address);
      
      expect(await bnplCore.isBlacklisted(borrower.address)).to.be.true;
    });

    it("Should allow admin to unblacklist users", async function () {
      // Blacklist first
      await bnplCore.blacklistUser(borrower.address);
      expect(await bnplCore.isBlacklisted(borrower.address)).to.be.true;
      
      // Unblacklist
      await expect(bnplCore.unblacklistUser(borrower.address))
        .to.emit(bnplCore, "UserUnblacklisted")
        .withArgs(borrower.address);
      
      expect(await bnplCore.isBlacklisted(borrower.address)).to.be.false;
      
      // User should be able to create loan again
      await bnplCore.connect(borrower).createLoan(TEN_USDC, merchant.address);
    });

    it("Should not allow non-admin to blacklist", async function () {
      await expect(
        bnplCore.connect(borrower).blacklistUser(merchant.address)
      ).to.be.revertedWithCustomError(bnplCore, "OwnableUnauthorizedAccount");
    });
  });
});
