// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for WalletAnalyzer
interface IWalletAnalyzer {
    function calculateInitialScore(address wallet) external returns (uint256);
    function getScoreBreakdown(address wallet) external view returns (
        uint256 ageScore,
        uint256 activityScore,
        uint256 balanceScore,
        uint256 totalScore
    );
}

// Interface for ZKCreditVerifier
interface IZKCreditVerifier {
    function getCreditBoost(address user) external view returns (uint256);
    function hasValidProof(address user) external view returns (bool);
}

/**
 * @title TrustScoreManager
 * @author OnStream Team
 * @notice Manages trust scores for the BNPL protocol
 * @dev Trust scores determine credit limits for users
 */
contract TrustScoreManager is Ownable {
    // ============ State Variables ============
    
    /// @notice Mapping of user addresses to their trust scores (from repayment behavior)
    mapping(address => uint256) private trustScores;
    
    /// @notice Address of the BNPL Core contract (authorized to update scores)
    address public bnplCore;
    
    /// @notice Address of the WalletAnalyzer contract
    IWalletAnalyzer public walletAnalyzer;
    
    /// @notice Address of the ZKCreditVerifier contract
    IZKCreditVerifier public zkVerifier;
    
    /// @notice Base credit limit for all users (10 USDC with 6 decimals)
    uint256 public constant BASE_CREDIT_LIMIT = 10 * 1e6;
    
    /// @notice Points awarded for on-time repayment
    uint256 public constant ON_TIME_POINTS = 10;
    
    /// @notice Points awarded for early repayment (bonus)
    uint256 public constant EARLY_POINTS = 15;
    
    /// @notice Credit increment per 10 score points (5 USDC with 6 decimals)
    uint256 public constant CREDIT_INCREMENT = 5 * 1e6;
    
    /// @notice Score threshold for each credit increment
    uint256 public constant SCORE_THRESHOLD = 10;
    
    // ============ Events ============
    
    /// @notice Emitted when a user's trust score is updated
    event ScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore,
        bool wasEarly
    );
    
    /// @notice Emitted when the BNPL Core address is set
    event BNPLCoreUpdated(address indexed oldCore, address indexed newCore);
    
    /// @notice Emitted when the WalletAnalyzer address is set
    event WalletAnalyzerUpdated(address indexed oldAnalyzer, address indexed newAnalyzer);
    
    /// @notice Emitted when the ZKVerifier address is set
    event ZKVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    
    /// @notice Emitted when a user's score is penalized
    event ScorePenalized(address indexed user, uint256 points, string reason);
    
    /// @notice Emitted when a user's score increases
    event ScoreIncreased(address indexed user, uint256 points, string reason);
    
    // ============ Errors ============
    
    error OnlyBNPLCore();
    error ZeroAddress();
    error BNPLCoreNotSet();
    
    // ============ Modifiers ============
    
    /// @notice Restricts function to only the BNPL Core contract
    modifier onlyBNPLCore() {
        if (msg.sender != bnplCore) revert OnlyBNPLCore();
        _;
    }
    
    // ============ Constructor ============
    
    /// @param _admin The admin address that will own this contract
    constructor(address _admin) Ownable(_admin) {}
    
    // ============ External Functions ============
    
    /**
     * @notice Sets the BNPL Core contract address
     * @param _bnplCore The address of the BNPL Core contract
     */
    function setBNPLCore(address _bnplCore) external onlyOwner {
        if (_bnplCore == address(0)) revert ZeroAddress();
        
        address oldCore = bnplCore;
        bnplCore = _bnplCore;
        
        emit BNPLCoreUpdated(oldCore, _bnplCore);
    }
    
    /**
     * @notice Sets the WalletAnalyzer contract address
     * @param _walletAnalyzer The address of the WalletAnalyzer contract
     */
    function setWalletAnalyzer(address _walletAnalyzer) external onlyOwner {
        if (_walletAnalyzer == address(0)) revert ZeroAddress();
        
        address oldAnalyzer = address(walletAnalyzer);
        walletAnalyzer = IWalletAnalyzer(_walletAnalyzer);
        
        emit WalletAnalyzerUpdated(oldAnalyzer, _walletAnalyzer);
    }
    
    /**
     * @notice Sets the ZKCreditVerifier contract address
     * @param _zkVerifier The address of the ZKCreditVerifier contract
     */
    function setZKVerifier(address _zkVerifier) external onlyOwner {
        if (_zkVerifier == address(0)) revert ZeroAddress();
        
        address oldVerifier = address(zkVerifier);
        zkVerifier = IZKCreditVerifier(_zkVerifier);
        
        emit ZKVerifierUpdated(oldVerifier, _zkVerifier);
    }
    
    /**
     * @notice Updates a user's trust score after loan repayment
     * @param _user The user whose score to update
     * @param _wasEarly Whether the repayment was early (bonus points)
     */
    function updateScore(address _user, bool _wasEarly) external onlyBNPLCore {
        if (bnplCore == address(0)) revert BNPLCoreNotSet();
        
        uint256 oldScore = trustScores[_user];
        uint256 pointsToAdd = _wasEarly ? EARLY_POINTS : ON_TIME_POINTS;
        uint256 newScore = oldScore + pointsToAdd;
        
        trustScores[_user] = newScore;
        
        emit ScoreUpdated(_user, oldScore, newScore, _wasEarly);
    }
    
    /**
     * @notice Records a default and penalizes the user's trust score
     * @param _user The user who defaulted
     * @dev Deducts 20 points from trust score (minimum 0)
     */
    function recordDefault(address _user) external onlyBNPLCore {
        uint256 currentScore = trustScores[_user];
        
        // Deduct 20 points for default
        if (currentScore >= 20) {
            trustScores[_user] = currentScore - 20;
        } else {
            trustScores[_user] = 0;
        }
        
        emit ScorePenalized(_user, 20, "Loan default");
    }
    
    /**
     * @notice Records a late repayment (during grace period)
     * @param _user The user who made a late payment
     * @dev Gives only +5 points instead of +10 for on-time
     */
    function recordLateRepayment(address _user) external onlyBNPLCore {
        uint256 oldScore = trustScores[_user];
        trustScores[_user] = oldScore + 5;
        
        emit ScoreIncreased(_user, 5, "Late repayment");
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Gets the trust score for a user
     * @param _user The user address
     * @return The user's trust score (from repayment behavior only)
     */
    function getTrustScore(address _user) external view returns (uint256) {
        return trustScores[_user];
    }
    
    /**
     * @notice Gets the wallet history score bonus from WalletAnalyzer
     * @param _user The user address
     * @return The bonus score from wallet history (0-60 points)
     */
    function getWalletHistoryBonus(address _user) public view returns (uint256) {
        if (address(walletAnalyzer) == address(0)) return 0;
        
        (,,, uint256 totalScore) = walletAnalyzer.getScoreBreakdown(_user);
        return totalScore;
    }
    
    /**
     * @notice Gets the ZK proof credit boost from ZKCreditVerifier
     * @param _user The user address
     * @return The bonus score from ZK proofs (10-30 points)
     */
    function getZKCreditBoost(address _user) public view returns (uint256) {
        if (address(zkVerifier) == address(0)) return 0;
        
        return zkVerifier.getCreditBoost(_user);
    }
    
    /**
     * @notice Gets the combined trust score (repayment + wallet history + ZK boost)
     * @param _user The user address
     * @return The total score including all bonuses
     */
    function getTotalScore(address _user) public view returns (uint256) {
        uint256 baseScore = trustScores[_user];
        uint256 historyBonus = getWalletHistoryBonus(_user);
        uint256 zkBoost = getZKCreditBoost(_user);
        return baseScore + historyBonus + zkBoost;
    }
    
    /**
     * @notice Calculates the credit limit for a user based on their trust score
     * @dev Formula: BASE_CREDIT_LIMIT + (totalScore / SCORE_THRESHOLD) * CREDIT_INCREMENT
     * @dev Now includes wallet history bonus + ZK proof boost in calculation
     * @dev All values in USDC (6 decimals)
     * @param _user The user address
     * @return The user's credit limit in USDC (6 decimals)
     */
    function getCreditLimit(address _user) external view returns (uint256) {
        uint256 totalScore = getTotalScore(_user);
        // Formula: 10 USDC + (totalScore / 10) * 5 USDC
        uint256 bonusCredit = (totalScore / SCORE_THRESHOLD) * CREDIT_INCREMENT;
        return BASE_CREDIT_LIMIT + bonusCredit;
    }
    
    /**
     * @notice Gets both trust score and credit limit for a user
     * @param _user The user address
     * @return score The user's base trust score (repayment only)
     * @return totalScore The combined score (repayment + wallet history + ZK boost)
     * @return walletBonus The wallet history bonus
     * @return zkBoost The ZK proof credit boost
     * @return creditLimit The user's credit limit in USDC (6 decimals)
     */
    function getUserCreditInfo(address _user) external view returns (
        uint256 score,
        uint256 totalScore,
        uint256 walletBonus,
        uint256 zkBoost,
        uint256 creditLimit
    ) {
        score = trustScores[_user];
        walletBonus = getWalletHistoryBonus(_user);
        zkBoost = getZKCreditBoost(_user);
        totalScore = score + walletBonus + zkBoost;
        uint256 bonusCredit = (totalScore / SCORE_THRESHOLD) * CREDIT_INCREMENT;
        creditLimit = BASE_CREDIT_LIMIT + bonusCredit;
    }
}
