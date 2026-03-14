import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { TrustScoreManager, BNPLCore } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("OnStream BNPL Protocol", function () {
  // Constants matching the contracts
  const BASE_CREDIT_LIMIT = 10n * 10n ** 6n; // 10 USDC
  const ON_TIME_POINTS = 10n;
  const EARLY_POINTS = 15n;
  const CREDIT_INCREMENT = 5n * 10n ** 6n; // 5 USDC
  const SCORE_THRESHOLD = 10n;
  const REPAYMENT_PERIOD = 7n * 24n * 60n * 60n; // 7 days in seconds
  const EARLY_REPAYMENT_THRESHOLD = 3n * 24n * 60n * 60n; // 3 days in seconds

  // Test fixtures
  async function deployProtocolFixture() {
    const [admin, merchant, user1, user2, user3] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Deploy TrustScoreManager
    const TrustScoreManager = await ethers.getContractFactory("TrustScoreManager");
    const trustScoreManager = await TrustScoreManager.deploy(admin.address);
    await trustScoreManager.waitForDeployment();

    // Deploy BNPLCore
    const BNPLCore = await ethers.getContractFactory("BNPLCore");
    const bnplCore = await BNPLCore.deploy(await usdc.getAddress(), admin.address);
    await bnplCore.waitForDeployment();

    // Link contracts
    await trustScoreManager.setBNPLCore(await bnplCore.getAddress());
    await bnplCore.setTrustScoreManager(await trustScoreManager.getAddress());

    // Add merchant
    await bnplCore.addMerchant(merchant.address, "Demo Merchant", "E-commerce");

    // Mint USDC to admin and deposit liquidity
    const initialLiquidity = 1000n * 10n ** 6n; // 1000 USDC
    await usdc.mint(admin.address, initialLiquidity);
    await usdc.connect(admin).approve(await bnplCore.getAddress(), initialLiquidity);
    await bnplCore.depositLiquidity(initialLiquidity);

    // Mint USDC to users for repayments
    const userBalance = 100n * 10n ** 6n; // 100 USDC each
    await usdc.mint(user1.address, userBalance);
    await usdc.mint(user2.address, userBalance);
    await usdc.mint(user3.address, userBalance);

    return { usdc, trustScoreManager, bnplCore, admin, merchant, user1, user2, user3 };
  }

  // ============ TrustScoreManager Tests ============

  describe("TrustScoreManager", function () {
    describe("Initialization", function () {
      it("Should set the correct owner", async function () {
        const { trustScoreManager, admin } = await loadFixture(deployProtocolFixture);
        expect(await trustScoreManager.owner()).to.equal(admin.address);
      });

      it("Should have correct constants", async function () {
        const { trustScoreManager } = await loadFixture(deployProtocolFixture);
        expect(await trustScoreManager.BASE_CREDIT_LIMIT()).to.equal(BASE_CREDIT_LIMIT);
        expect(await trustScoreManager.ON_TIME_POINTS()).to.equal(ON_TIME_POINTS);
        expect(await trustScoreManager.EARLY_POINTS()).to.equal(EARLY_POINTS);
      });
    });

    describe("Trust Score", function () {
      it("Should return 0 for new users", async function () {
        const { trustScoreManager, user1 } = await loadFixture(deployProtocolFixture);
        expect(await trustScoreManager.getTrustScore(user1.address)).to.equal(0);
      });

      it("Should return base credit limit (10 USDC) for new users", async function () {
        const { trustScoreManager, user1 } = await loadFixture(deployProtocolFixture);
        expect(await trustScoreManager.getCreditLimit(user1.address)).to.equal(BASE_CREDIT_LIMIT);
      });
    });

    describe("Access Control", function () {
      it("Should only allow owner to set BNPL Core", async function () {
        const { trustScoreManager, user1 } = await loadFixture(deployProtocolFixture);
        await expect(
          trustScoreManager.connect(user1).setBNPLCore(user1.address)
        ).to.be.revertedWithCustomError(trustScoreManager, "OwnableUnauthorizedAccount");
      });

      it("Should revert when setting zero address as BNPL Core", async function () {
        const { trustScoreManager } = await loadFixture(deployProtocolFixture);
        await expect(
          trustScoreManager.setBNPLCore(ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(trustScoreManager, "ZeroAddress");
      });

      it("Should only allow BNPL Core to update scores", async function () {
        const { trustScoreManager, user1 } = await loadFixture(deployProtocolFixture);
        await expect(
          trustScoreManager.connect(user1).updateScore(user1.address, false)
        ).to.be.revertedWithCustomError(trustScoreManager, "OnlyBNPLCore");
      });
    });

    describe("Credit Limit Calculation", function () {
      it("Should calculate correct credit limit for various scores", async function () {
        const { trustScoreManager, bnplCore, usdc, merchant, user1 } = await loadFixture(deployProtocolFixture);

        // Initial: score 0, limit 10 USDC
        expect(await trustScoreManager.getCreditLimit(user1.address)).to.equal(BASE_CREDIT_LIMIT);

        // Create and repay loan to increase score
        const loanAmount = 5n * 10n ** 6n; // 5 USDC
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);
        await usdc.connect(user1).approve(await bnplCore.getAddress(), loanAmount);

        // Fast forward to just before due date for on-time repayment
        await time.increase(Number(REPAYMENT_PERIOD) - 1000);
        await bnplCore.connect(user1).repayLoan();

        // After on-time repayment: score 10, limit should be 15 USDC
        expect(await trustScoreManager.getTrustScore(user1.address)).to.equal(ON_TIME_POINTS);
        expect(await trustScoreManager.getCreditLimit(user1.address)).to.equal(
          BASE_CREDIT_LIMIT + CREDIT_INCREMENT // 10 + 5 = 15 USDC
        );
      });

      it("Should give bonus points for early repayment", async function () {
        const { trustScoreManager, bnplCore, usdc, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 5n * 10n ** 6n;
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);
        await usdc.connect(user1).approve(await bnplCore.getAddress(), loanAmount);

        // Repay immediately (early)
        await bnplCore.connect(user1).repayLoan();

        // Should get early points (15)
        expect(await trustScoreManager.getTrustScore(user1.address)).to.equal(EARLY_POINTS);
      });
    });
  });

  // ============ BNPLCore Tests ============

  describe("BNPLCore", function () {
    describe("Initialization", function () {
      it("Should set correct owner", async function () {
        const { bnplCore, admin } = await loadFixture(deployProtocolFixture);
        expect(await bnplCore.owner()).to.equal(admin.address);
      });

      it("Should set correct USDC address", async function () {
        const { bnplCore, usdc } = await loadFixture(deployProtocolFixture);
        expect(await bnplCore.usdc()).to.equal(await usdc.getAddress());
      });

      it("Should have initial liquidity deposited", async function () {
        const { bnplCore } = await loadFixture(deployProtocolFixture);
        expect(await bnplCore.getProtocolLiquidity()).to.equal(1000n * 10n ** 6n);
      });
    });

    describe("Merchant Management", function () {
      it("Should add merchant correctly", async function () {
        const { bnplCore, merchant } = await loadFixture(deployProtocolFixture);
        const info = await bnplCore.getMerchantInfo(merchant.address);
        expect(info.isApproved).to.be.true;
        expect(info.name).to.equal("Demo Merchant");
      });

      it("Should not allow non-admin to add merchant", async function () {
        const { bnplCore, user1, user2 } = await loadFixture(deployProtocolFixture);
        await expect(
          bnplCore.connect(user1).addMerchant(user2.address, "Test", "Test")
        ).to.be.revertedWithCustomError(bnplCore, "OwnableUnauthorizedAccount");
      });

      it("Should not allow duplicate merchants", async function () {
        const { bnplCore, merchant } = await loadFixture(deployProtocolFixture);
        await expect(
          bnplCore.addMerchant(merchant.address, "Test", "Test")
        ).to.be.revertedWithCustomError(bnplCore, "MerchantAlreadyExists");
      });

      it("Should remove merchant correctly", async function () {
        const { bnplCore, merchant } = await loadFixture(deployProtocolFixture);
        await bnplCore.removeMerchant(merchant.address);
        const info = await bnplCore.getMerchantInfo(merchant.address);
        expect(info.isApproved).to.be.false;
      });
    });

    describe("Loan Creation", function () {
      it("Should create loan within credit limit", async function () {
        const { bnplCore, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 5n * 10n ** 6n; // 5 USDC (within 10 USDC limit)
        await expect(
          bnplCore.connect(user1).createLoan(loanAmount, merchant.address)
        ).to.emit(bnplCore, "LoanCreated");

        const loan = await bnplCore.getActiveLoan(user1.address);
        expect(loan.amount).to.equal(loanAmount);
        expect(loan.borrower).to.equal(user1.address);
        expect(loan.merchant).to.equal(merchant.address);
        expect(loan.isRepaid).to.be.false;
      });

      it("Should fail when exceeding credit limit", async function () {
        const { bnplCore, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 15n * 10n ** 6n; // 15 USDC (exceeds 10 USDC limit)
        await expect(
          bnplCore.connect(user1).createLoan(loanAmount, merchant.address)
        ).to.be.revertedWithCustomError(bnplCore, "ExceedsCreditLimit");
      });

      it("Should fail with unapproved merchant", async function () {
        const { bnplCore, user1, user2 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 5n * 10n ** 6n;
        await expect(
          bnplCore.connect(user1).createLoan(loanAmount, user2.address)
        ).to.be.revertedWithCustomError(bnplCore, "MerchantNotApproved");
      });

      it("Should fail when user already has active loan", async function () {
        const { bnplCore, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 5n * 10n ** 6n;
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);

        await expect(
          bnplCore.connect(user1).createLoan(loanAmount, merchant.address)
        ).to.be.revertedWithCustomError(bnplCore, "ActiveLoanExists");
      });

      it("Should fail with zero amount", async function () {
        const { bnplCore, merchant, user1 } = await loadFixture(deployProtocolFixture);

        await expect(
          bnplCore.connect(user1).createLoan(0, merchant.address)
        ).to.be.revertedWithCustomError(bnplCore, "ZeroAmount");
      });

      it("Should transfer USDC to merchant on loan creation", async function () {
        const { bnplCore, usdc, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const merchantBalanceBefore = await usdc.balanceOf(merchant.address);
        const loanAmount = 5n * 10n ** 6n;

        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);

        const merchantBalanceAfter = await usdc.balanceOf(merchant.address);
        expect(merchantBalanceAfter - merchantBalanceBefore).to.equal(loanAmount);
      });
    });

    describe("Loan Repayment", function () {
      it("Should repay loan successfully", async function () {
        const { bnplCore, usdc, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 5n * 10n ** 6n;
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);

        await usdc.connect(user1).approve(await bnplCore.getAddress(), loanAmount);

        await expect(
          bnplCore.connect(user1).repayLoan()
        ).to.emit(bnplCore, "LoanRepaid");

        const loan = await bnplCore.getActiveLoan(user1.address);
        expect(loan.amount).to.equal(0); // No active loan
      });

      it("Should fail without active loan", async function () {
        const { bnplCore, user1 } = await loadFixture(deployProtocolFixture);

        await expect(
          bnplCore.connect(user1).repayLoan()
        ).to.be.revertedWithCustomError(bnplCore, "NoActiveLoan");
      });

      it("Should fail without USDC approval", async function () {
        const { bnplCore, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 5n * 10n ** 6n;
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);

        await expect(
          bnplCore.connect(user1).repayLoan()
        ).to.be.revertedWithCustomError(bnplCore, "InsufficientAllowance");
      });

      it("Should update trust score on repayment", async function () {
        const { bnplCore, usdc, trustScoreManager, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 5n * 10n ** 6n;
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);
        await usdc.connect(user1).approve(await bnplCore.getAddress(), loanAmount);
        await bnplCore.connect(user1).repayLoan();

        const score = await trustScoreManager.getTrustScore(user1.address);
        expect(score).to.be.greaterThan(0);
      });

      it("Should allow new loan after repayment", async function () {
        const { bnplCore, usdc, merchant, user1 } = await loadFixture(deployProtocolFixture);

        // First loan
        const loanAmount = 5n * 10n ** 6n;
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);
        await usdc.connect(user1).approve(await bnplCore.getAddress(), loanAmount);
        await bnplCore.connect(user1).repayLoan();

        // Second loan should work
        await expect(
          bnplCore.connect(user1).createLoan(loanAmount, merchant.address)
        ).to.emit(bnplCore, "LoanCreated");
      });
    });

    describe("Liquidity Management", function () {
      it("Should deposit liquidity", async function () {
        const { bnplCore, usdc, admin } = await loadFixture(deployProtocolFixture);

        const depositAmount = 500n * 10n ** 6n;
        await usdc.mint(admin.address, depositAmount);
        await usdc.connect(admin).approve(await bnplCore.getAddress(), depositAmount);

        const balanceBefore = await bnplCore.getProtocolLiquidity();
        await bnplCore.depositLiquidity(depositAmount);
        const balanceAfter = await bnplCore.getProtocolLiquidity();

        expect(balanceAfter - balanceBefore).to.equal(depositAmount);
      });

      it("Should withdraw liquidity", async function () {
        const { bnplCore, usdc, admin } = await loadFixture(deployProtocolFixture);

        const withdrawAmount = 100n * 10n ** 6n;
        const adminBalanceBefore = await usdc.balanceOf(admin.address);

        await bnplCore.withdrawLiquidity(withdrawAmount);

        const adminBalanceAfter = await usdc.balanceOf(admin.address);
        expect(adminBalanceAfter - adminBalanceBefore).to.equal(withdrawAmount);
      });

      it("Should fail withdraw with insufficient liquidity", async function () {
        const { bnplCore } = await loadFixture(deployProtocolFixture);

        const withdrawAmount = 2000n * 10n ** 6n; // More than available
        await expect(
          bnplCore.withdrawLiquidity(withdrawAmount)
        ).to.be.revertedWithCustomError(bnplCore, "InsufficientLiquidity");
      });
    });

    describe("Pause Functionality", function () {
      it("Should pause and unpause protocol", async function () {
        const { bnplCore, merchant, user1 } = await loadFixture(deployProtocolFixture);

        await bnplCore.pauseProtocol();

        const loanAmount = 5n * 10n ** 6n;
        await expect(
          bnplCore.connect(user1).createLoan(loanAmount, merchant.address)
        ).to.be.revertedWithCustomError(bnplCore, "EnforcedPause");

        await bnplCore.unpauseProtocol();

        await expect(
          bnplCore.connect(user1).createLoan(loanAmount, merchant.address)
        ).to.emit(bnplCore, "LoanCreated");
      });
    });

    describe("View Functions", function () {
      it("Should return correct loan history", async function () {
        const { bnplCore, usdc, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 5n * 10n ** 6n;

        // Create and repay first loan
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);
        await usdc.connect(user1).approve(await bnplCore.getAddress(), loanAmount);
        await bnplCore.connect(user1).repayLoan();

        // Create second loan
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);

        const history = await bnplCore.getUserLoans(user1.address);
        expect(history.length).to.equal(2);
      });

      it("Should return correct available credit", async function () {
        const { bnplCore, merchant, user1 } = await loadFixture(deployProtocolFixture);

        // Initially should be full credit limit
        expect(await bnplCore.getAvailableCredit(user1.address)).to.equal(BASE_CREDIT_LIMIT);

        // After loan, should be 0 (one loan at a time)
        await bnplCore.connect(user1).createLoan(5n * 10n ** 6n, merchant.address);
        expect(await bnplCore.getAvailableCredit(user1.address)).to.equal(0);
      });

      it("Should return all loans correctly", async function () {
        const { bnplCore, merchant, user1, user2 } = await loadFixture(deployProtocolFixture);

        await bnplCore.connect(user1).createLoan(5n * 10n ** 6n, merchant.address);
        await bnplCore.connect(user2).createLoan(3n * 10n ** 6n, merchant.address);

        const allLoans = await bnplCore.getAllLoans();
        expect(allLoans.length).to.equal(2);
      });
    });

    describe("Installment Payments", function () {
      it("Should allow partial payment (installment)", async function () {
        const { bnplCore, usdc, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 9n * 10n ** 6n; // 9 USDC (divisible by 3)
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);

        // Pay 1/3 of the loan
        const installment = 3n * 10n ** 6n; // 3 USDC
        await usdc.connect(user1).approve(await bnplCore.getAddress(), installment);

        await expect(
          bnplCore.connect(user1).makeInstallmentPayment(installment)
        ).to.emit(bnplCore, "PartialPayment");

        // Check remaining balance
        expect(await bnplCore.getRemainingBalance(user1.address)).to.equal(6n * 10n ** 6n);

        // Loan should still be active
        expect(await bnplCore.hasActiveLoan(user1.address)).to.be.true;
      });

      it("Should complete loan after 3 installments", async function () {
        const { bnplCore, usdc, merchant, user1, trustScoreManager } = await loadFixture(deployProtocolFixture);

        const loanAmount = 9n * 10n ** 6n; // 9 USDC
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);

        const installment = 3n * 10n ** 6n; // 3 USDC each

        // First installment
        await usdc.connect(user1).approve(await bnplCore.getAddress(), installment);
        await bnplCore.connect(user1).makeInstallmentPayment(installment);
        expect(await bnplCore.hasActiveLoan(user1.address)).to.be.true;

        // Second installment
        await usdc.connect(user1).approve(await bnplCore.getAddress(), installment);
        await bnplCore.connect(user1).makeInstallmentPayment(installment);
        expect(await bnplCore.hasActiveLoan(user1.address)).to.be.true;

        // Third installment (final)
        await usdc.connect(user1).approve(await bnplCore.getAddress(), installment);
        await expect(
          bnplCore.connect(user1).makeInstallmentPayment(installment)
        ).to.emit(bnplCore, "LoanRepaid");

        // Loan should now be repaid
        expect(await bnplCore.hasActiveLoan(user1.address)).to.be.false;

        // Trust score should be updated
        expect(await trustScoreManager.getTrustScore(user1.address)).to.be.greaterThan(0);
      });

      it("Should cap payment at remaining balance", async function () {
        const { bnplCore, usdc, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 5n * 10n ** 6n;
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);

        // Try to pay more than the loan amount
        const overpayment = 10n * 10n ** 6n;
        await usdc.connect(user1).approve(await bnplCore.getAddress(), overpayment);

        // This should complete the loan, only taking the actual amount
        await bnplCore.connect(user1).makeInstallmentPayment(overpayment);

        expect(await bnplCore.hasActiveLoan(user1.address)).to.be.false;
      });

      it("Should return correct minimum installment amount", async function () {
        const { bnplCore, merchant, user1 } = await loadFixture(deployProtocolFixture);

        const loanAmount = 9n * 10n ** 6n; // 9 USDC
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);

        const minInstallment = await bnplCore.getMinInstallmentAmount(user1.address);
        expect(minInstallment).to.equal(3n * 10n ** 6n); // 3 USDC (9/3)
      });

      it("Should give early bonus when all installments paid within 4 days", async function () {
        const { bnplCore, usdc, merchant, user1, trustScoreManager } = await loadFixture(deployProtocolFixture);

        const loanAmount = 6n * 10n ** 6n;
        await bnplCore.connect(user1).createLoan(loanAmount, merchant.address);

        // Pay in 2 installments within early period (first 4 days)
        const installment = 3n * 10n ** 6n;

        await usdc.connect(user1).approve(await bnplCore.getAddress(), loanAmount);
        await bnplCore.connect(user1).makeInstallmentPayment(installment);
        await bnplCore.connect(user1).makeInstallmentPayment(installment);

        // Should get early payment bonus (15 points instead of 10)
        expect(await trustScoreManager.getTrustScore(user1.address)).to.equal(15n);
      });
    });
  });
});
