// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./TrustScoreManager.sol";

/**
 * @title BNPLCore
 * @author OnStream Team
 * @notice Core BNPL protocol contract for loan creation and repayment
 * @dev Integrates with TrustScoreManager for credit scoring and USDC for payments
 */
contract BNPLCore is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    /// @notice Loan status enumeration
    enum LoanStatus { Active, Repaid, Defaulted }

    // ============ Structs ============

    /// @notice Represents a BNPL loan
    struct Loan {
        uint256 id;
        address borrower;
        address merchant;
        uint256 amount;
        uint256 amountRepaid;   // Track partial repayments
        uint256 createdAt;
        uint256 dueDate;
        uint256 repaidAt;
        bool isRepaid;
        LoanStatus status;
        uint256 gracePeriodEnd;  // Due date + 7 days grace period
    }

    /// @notice Represents a merchant in the protocol
    struct Merchant {
        address merchantAddress;
        string name;
        string category;
        bool isApproved;
        uint256 totalSales;
        uint256 transactionCount;
        uint256 createdAt;
    }

    // ============ State Variables ============

    /// @notice USDC token contract
    IERC20 public immutable usdc;

    /// @notice Trust Score Manager contract
    TrustScoreManager public trustScoreManager;

    /// @notice Repayment period in seconds (7 days)
    uint256 public constant REPAYMENT_PERIOD = 7 days;

    /// @notice Early repayment threshold (3 days before due date = within first 4 days)
    uint256 public constant EARLY_REPAYMENT_THRESHOLD = 3 days;

    /// @notice Minimum installment count (can pay in 1 or 3 installments)
    uint256 public constant MIN_INSTALLMENTS = 1;
    uint256 public constant MAX_INSTALLMENTS = 3;

    /// @notice Total loans counter
    uint256 public totalLoans;

    /// @notice Total USDC volume lent
    uint256 public totalVolume;

    /// @notice Mapping from loan ID to Loan
    mapping(uint256 => Loan) public loans;

    /// @notice Mapping from user address to their active loan ID (0 if none)
    mapping(address => uint256) public activeLoanId;

    /// @notice Mapping from user address to their loan history
    mapping(address => uint256[]) public userLoanHistory;

    /// @notice Mapping from merchant address to Merchant info
    mapping(address => Merchant) public merchants;

    /// @notice Array of all merchant addresses
    address[] public merchantList;

    /// @notice Blacklist mapping for defaulted users
    mapping(address => bool) public blacklisted;

    /// @notice Grace period for late payments (7 days after due date)
    uint256 public constant GRACE_PERIOD = 7 days;

    /// @notice Late payment penalty percentage (10%)
    uint256 public constant LATE_PAYMENT_PENALTY = 10;

    // ============ Events ============

    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed merchant,
        uint256 amount,
        uint256 dueDate
    );

    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        bool wasEarly,
        uint256 repaidAt
    );

    event PartialPayment(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amountPaid,
        uint256 amountRemaining,
        uint256 installmentNumber
    );

    event MerchantAdded(
        address indexed merchant,
        string name,
        string category
    );

    event MerchantRemoved(address indexed merchant);

    event LiquidityDeposited(address indexed admin, uint256 amount);

    event LiquidityWithdrawn(address indexed admin, uint256 amount);

    event TrustScoreManagerUpdated(
        address indexed oldManager,
        address indexed newManager
    );

    event LoanDefaulted(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 remainingAmount
    );

    event LateRepayment(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 penalty
    );

    event UserBlacklisted(address indexed user);

    event UserUnblacklisted(address indexed user);

    // ============ Errors ============

    error ZeroAddress();
    error ZeroAmount();
    error MerchantNotApproved();
    error MerchantAlreadyExists();
    error MerchantDoesNotExist();
    error ActiveLoanExists();
    error NoActiveLoan();
    error LoanAlreadyRepaid();
    error ExceedsCreditLimit();
    error InsufficientLiquidity();
    error InsufficientAllowance();
    error LoanNotFound();
    error BlacklistedUser();
    error NotInGracePeriod();
    error GracePeriodNotOver();
    error LoanNotActive();
    error NotPastDueDate();

    // ============ Constructor ============

    /**
     * @param _usdc The USDC token contract address
     * @param _admin The admin address
     */
    constructor(address _usdc, address _admin) Ownable(_admin) {
        if (_usdc == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
    }

    // ============ Admin Functions ============

    /**
     * @notice Sets the Trust Score Manager contract
     * @param _trustScoreManager The Trust Score Manager contract address
     */
    function setTrustScoreManager(address _trustScoreManager) external onlyOwner {
        if (_trustScoreManager == address(0)) revert ZeroAddress();
        
        address oldManager = address(trustScoreManager);
        trustScoreManager = TrustScoreManager(_trustScoreManager);
        
        emit TrustScoreManagerUpdated(oldManager, _trustScoreManager);
    }

    /**
     * @notice Adds a new merchant to the protocol
     * @param _merchant The merchant's wallet address
     * @param _name The merchant's business name
     * @param _category The merchant's business category
     */
    function addMerchant(
        address _merchant,
        string calldata _name,
        string calldata _category
    ) external onlyOwner {
        if (_merchant == address(0)) revert ZeroAddress();
        if (merchants[_merchant].isApproved) revert MerchantAlreadyExists();

        merchants[_merchant] = Merchant({
            merchantAddress: _merchant,
            name: _name,
            category: _category,
            isApproved: true,
            totalSales: 0,
            transactionCount: 0,
            createdAt: block.timestamp
        });

        merchantList.push(_merchant);

        emit MerchantAdded(_merchant, _name, _category);
    }

    /**
     * @notice Removes a merchant from the protocol
     * @param _merchant The merchant's wallet address
     */
    function removeMerchant(address _merchant) external onlyOwner {
        if (!merchants[_merchant].isApproved) revert MerchantDoesNotExist();

        merchants[_merchant].isApproved = false;

        emit MerchantRemoved(_merchant);
    }

    /**
     * @notice Deposits USDC liquidity into the protocol
     * @param _amount The amount of USDC to deposit (6 decimals)
     */
    function depositLiquidity(uint256 _amount) external onlyOwner nonReentrant {
        if (_amount == 0) revert ZeroAmount();

        usdc.safeTransferFrom(msg.sender, address(this), _amount);

        emit LiquidityDeposited(msg.sender, _amount);
    }

    /**
     * @notice Withdraws USDC liquidity from the protocol (emergency)
     * @param _amount The amount of USDC to withdraw (6 decimals)
     */
    function withdrawLiquidity(uint256 _amount) external onlyOwner nonReentrant {
        if (_amount == 0) revert ZeroAmount();
        if (usdc.balanceOf(address(this)) < _amount) revert InsufficientLiquidity();

        usdc.safeTransfer(msg.sender, _amount);

        emit LiquidityWithdrawn(msg.sender, _amount);
    }

    /**
     * @notice Pauses the protocol (circuit breaker)
     */
    function pauseProtocol() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the protocol
     */
    function unpauseProtocol() external onlyOwner {
        _unpause();
    }

    // ============ User Functions ============

    /**
     * @notice Creates a new BNPL loan
     * @param _amount The loan amount in USDC (6 decimals)
     * @param _merchant The merchant receiving the funds
     */
    function createLoan(
        uint256 _amount,
        address _merchant
    ) external nonReentrant whenNotPaused {
        if (_amount == 0) revert ZeroAmount();
        if (!merchants[_merchant].isApproved) revert MerchantNotApproved();
        if (activeLoanId[msg.sender] != 0) revert ActiveLoanExists();
        if (blacklisted[msg.sender]) revert BlacklistedUser();

        // Check credit limit
        uint256 creditLimit = trustScoreManager.getCreditLimit(msg.sender);
        if (_amount > creditLimit) revert ExceedsCreditLimit();

        // Check protocol liquidity
        if (usdc.balanceOf(address(this)) < _amount) revert InsufficientLiquidity();

        // Create loan
        totalLoans++;
        uint256 loanId = totalLoans;
        uint256 dueDate = block.timestamp + REPAYMENT_PERIOD;

        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            merchant: _merchant,
            amount: _amount,
            amountRepaid: 0,
            createdAt: block.timestamp,
            dueDate: dueDate,
            repaidAt: 0,
            isRepaid: false,
            status: LoanStatus.Active,
            gracePeriodEnd: dueDate + GRACE_PERIOD
        });

        activeLoanId[msg.sender] = loanId;
        userLoanHistory[msg.sender].push(loanId);

        // Update merchant stats
        merchants[_merchant].totalSales += _amount;
        merchants[_merchant].transactionCount++;

        // Update total volume
        totalVolume += _amount;

        // Transfer USDC to merchant
        usdc.safeTransfer(_merchant, _amount);

        emit LoanCreated(loanId, msg.sender, _merchant, _amount, dueDate);
    }

    /**
     * @notice Repays an active loan in full
     * @dev User can pay entire remaining balance at once
     */
    function repayLoan() external nonReentrant whenNotPaused {
        uint256 loanId = activeLoanId[msg.sender];
        if (loanId == 0) revert NoActiveLoan();

        Loan storage loan = loans[loanId];
        if (loan.isRepaid) revert LoanAlreadyRepaid();

        uint256 remainingAmount = loan.amount - loan.amountRepaid;

        // Check user has approved enough USDC
        if (usdc.allowance(msg.sender, address(this)) < remainingAmount) {
            revert InsufficientAllowance();
        }

        // Transfer USDC from user to contract (back to lending pool)
        usdc.safeTransferFrom(msg.sender, address(this), remainingAmount);

        // Mark loan as fully repaid
        loan.amountRepaid = loan.amount;
        loan.isRepaid = true;
        loan.status = LoanStatus.Repaid;
        loan.repaidAt = block.timestamp;

        // Clear active loan
        activeLoanId[msg.sender] = 0;

        // Check if early repayment (within first 4 days of 7-day period)
        bool wasEarly = (block.timestamp + EARLY_REPAYMENT_THRESHOLD) < loan.dueDate;

        // Update trust score
        trustScoreManager.updateScore(msg.sender, wasEarly);

        emit LoanRepaid(loanId, msg.sender, remainingAmount, wasEarly, block.timestamp);
    }

    /**
     * @notice Makes a partial payment (installment) on an active loan
     * @param _amount The amount to pay in this installment (USDC with 6 decimals)
     * @dev Users can pay in up to 3 installments within 7 days
     */
    function makeInstallmentPayment(uint256 _amount) external nonReentrant whenNotPaused {
        if (_amount == 0) revert ZeroAmount();
        
        uint256 loanId = activeLoanId[msg.sender];
        if (loanId == 0) revert NoActiveLoan();

        Loan storage loan = loans[loanId];
        if (loan.isRepaid) revert LoanAlreadyRepaid();

        uint256 remainingAmount = loan.amount - loan.amountRepaid;
        
        // Cannot pay more than remaining
        if (_amount > remainingAmount) {
            _amount = remainingAmount;
        }

        // Check user has approved enough USDC
        if (usdc.allowance(msg.sender, address(this)) < _amount) {
            revert InsufficientAllowance();
        }

        // Transfer USDC from user to contract (back to lending pool)
        usdc.safeTransferFrom(msg.sender, address(this), _amount);

        // Update amount repaid
        loan.amountRepaid += _amount;
        uint256 newRemaining = loan.amount - loan.amountRepaid;

        // Calculate installment number (1, 2, or 3)
        uint256 installmentNumber = 1;
        uint256 oneThird = loan.amount / 3;
        if (loan.amountRepaid > oneThird * 2) {
            installmentNumber = 3;
        } else if (loan.amountRepaid > oneThird) {
            installmentNumber = 2;
        }

        emit PartialPayment(loanId, msg.sender, _amount, newRemaining, installmentNumber);

        // Check if fully repaid
        if (newRemaining == 0) {
            loan.isRepaid = true;
            loan.status = LoanStatus.Repaid;
            loan.repaidAt = block.timestamp;
            activeLoanId[msg.sender] = 0;

            // Check if early repayment
            bool wasEarly = (block.timestamp + EARLY_REPAYMENT_THRESHOLD) < loan.dueDate;

            // Update trust score
            trustScoreManager.updateScore(msg.sender, wasEarly);

            emit LoanRepaid(loanId, msg.sender, loan.amount, wasEarly, block.timestamp);
        }
    }

    /**
     * @notice Gets the remaining balance for a loan
     * @param _user The user's address
     * @return The remaining amount to be paid
     */
    function getRemainingBalance(address _user) external view returns (uint256) {
        uint256 loanId = activeLoanId[_user];
        if (loanId == 0) return 0;
        
        Loan storage loan = loans[loanId];
        if (loan.isRepaid) return 0;
        
        return loan.amount - loan.amountRepaid;
    }

    /**
     * @notice Gets the minimum installment amount (1/3 of loan)
     * @param _user The user's address
     * @return The minimum payment amount per installment
     */
    function getMinInstallmentAmount(address _user) external view returns (uint256) {
        uint256 loanId = activeLoanId[_user];
        if (loanId == 0) return 0;
        
        Loan storage loan = loans[loanId];
        return loan.amount / MAX_INSTALLMENTS;
    }

    // ============ Default Handling Functions ============

    /**
     * @notice Marks a loan as defaulted if grace period has expired
     * @param _loanId The loan ID to mark as defaulted
     * @dev Can be called by anyone after grace period expires
     */
    function markAsDefaulted(uint256 _loanId) external nonReentrant {
        if (_loanId == 0 || _loanId > totalLoans) revert LoanNotFound();
        
        Loan storage loan = loans[_loanId];
        if (loan.status != LoanStatus.Active) revert LoanNotActive();
        if (block.timestamp <= loan.gracePeriodEnd) revert GracePeriodNotOver();
        
        uint256 remainingAmount = loan.amount - loan.amountRepaid;
        
        // Mark loan as defaulted
        loan.status = LoanStatus.Defaulted;
        
        // Clear active loan
        activeLoanId[loan.borrower] = 0;
        
        // Penalize trust score
        trustScoreManager.recordDefault(loan.borrower);
        
        // Blacklist the user
        blacklisted[loan.borrower] = true;
        
        emit LoanDefaulted(_loanId, loan.borrower, remainingAmount);
        emit UserBlacklisted(loan.borrower);
    }

    /**
     * @notice Allows late repayment with penalty during grace period
     * @param _amount The amount to repay (USDC with 6 decimals)
     * @dev 10% penalty applies to late payments
     */
    function repayWithPenalty(uint256 _amount) external nonReentrant whenNotPaused {
        if (_amount == 0) revert ZeroAmount();
        
        uint256 loanId = activeLoanId[msg.sender];
        if (loanId == 0) revert NoActiveLoan();
        
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.Active) revert LoanNotActive();
        if (block.timestamp <= loan.dueDate) revert NotPastDueDate();
        if (block.timestamp > loan.gracePeriodEnd) revert NotInGracePeriod();
        
        uint256 remainingAmount = loan.amount - loan.amountRepaid;
        
        // Cap payment at remaining amount
        if (_amount > remainingAmount) {
            _amount = remainingAmount;
        }
        
        // Calculate 10% late fee
        uint256 penalty = (_amount * LATE_PAYMENT_PENALTY) / 100;
        uint256 totalAmount = _amount + penalty;
        
        // Check user has approved enough USDC (including penalty)
        if (usdc.allowance(msg.sender, address(this)) < totalAmount) {
            revert InsufficientAllowance();
        }
        
        // Transfer USDC from user to contract (amount + penalty)
        usdc.safeTransferFrom(msg.sender, address(this), totalAmount);
        
        // Update loan state
        loan.amountRepaid += _amount;
        uint256 newRemaining = loan.amount - loan.amountRepaid;
        
        emit LateRepayment(loanId, msg.sender, _amount, penalty);
        
        // Check if fully repaid
        if (newRemaining == 0) {
            loan.isRepaid = true;
            loan.repaidAt = block.timestamp;
            loan.status = LoanStatus.Repaid;
            activeLoanId[msg.sender] = 0;
            
            // Reduced score increase for late payment
            trustScoreManager.recordLateRepayment(msg.sender);
            
            emit LoanRepaid(loanId, msg.sender, loan.amount, false, block.timestamp);
        }
    }

    /**
     * @notice Admin function to blacklist a user
     * @param _user The user address to blacklist
     */
    function blacklistUser(address _user) external onlyOwner {
        if (_user == address(0)) revert ZeroAddress();
        blacklisted[_user] = true;
        emit UserBlacklisted(_user);
    }

    /**
     * @notice Admin function to unblacklist a user
     * @param _user The user address to unblacklist
     */
    function unblacklistUser(address _user) external onlyOwner {
        if (_user == address(0)) revert ZeroAddress();
        blacklisted[_user] = false;
        emit UserUnblacklisted(_user);
    }

    /**
     * @notice Checks if a user is blacklisted
     * @param _user The user address to check
     * @return True if blacklisted
     */
    function isBlacklisted(address _user) external view returns (bool) {
        return blacklisted[_user];
    }

    // ============ View Functions ============

    /**
     * @notice Gets the active loan for a user
     * @param _user The user's address
     * @return The active loan details (empty if no active loan)
     */
    function getActiveLoan(address _user) external view returns (Loan memory) {
        uint256 loanId = activeLoanId[_user];
        if (loanId == 0) {
            return Loan(0, address(0), address(0), 0, 0, 0, 0, 0, false, LoanStatus.Active, 0);
        }
        return loans[loanId];
    }

    /**
     * @notice Gets a loan by ID
     * @param _loanId The loan ID
     * @return The loan details
     */
    function getLoan(uint256 _loanId) external view returns (Loan memory) {
        if (_loanId == 0 || _loanId > totalLoans) revert LoanNotFound();
        return loans[_loanId];
    }

    /**
     * @notice Gets all loans for a user
     * @param _user The user's address
     * @return An array of loan IDs
     */
    function getUserLoans(address _user) external view returns (uint256[] memory) {
        return userLoanHistory[_user];
    }

    /**
     * @notice Gets the protocol's USDC balance
     * @return The USDC balance
     */
    function getProtocolLiquidity() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @notice Gets merchant information
     * @param _merchant The merchant's address
     * @return The merchant details
     */
    function getMerchantInfo(address _merchant) external view returns (Merchant memory) {
        return merchants[_merchant];
    }

    /**
     * @notice Gets all merchants
     * @return An array of merchant addresses
     */
    function getAllMerchants() external view returns (address[] memory) {
        return merchantList;
    }

    /**
     * @notice Gets the count of active loans
     * @return The number of active (unpaid) loans
     */
    function getActiveLoansCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= totalLoans; i++) {
            if (!loans[i].isRepaid) {
                count++;
            }
        }
        return count;
    }

    /**
     * @notice Gets all loans (for admin dashboard)
     * @return An array of all loans
     */
    function getAllLoans() external view returns (Loan[] memory) {
        Loan[] memory allLoans = new Loan[](totalLoans);
        for (uint256 i = 1; i <= totalLoans; i++) {
            allLoans[i - 1] = loans[i];
        }
        return allLoans;
    }

    /**
     * @notice Checks if a user has an active loan
     * @param _user The user's address
     * @return True if user has an active loan
     */
    function hasActiveLoan(address _user) external view returns (bool) {
        return activeLoanId[_user] != 0;
    }

    /**
     * @notice Gets the available credit for a user
     * @param _user The user's address
     * @return The available credit amount
     */
    function getAvailableCredit(address _user) external view returns (uint256) {
        uint256 creditLimit = trustScoreManager.getCreditLimit(_user);
        uint256 loanId = activeLoanId[_user];
        
        if (loanId == 0) {
            return creditLimit;
        }
        
        // If there's an active loan, available credit is 0
        // (one loan at a time policy)
        return 0;
    }
}
