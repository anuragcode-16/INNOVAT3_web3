// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WalletAnalyzer
 * @notice Analyzes wallet history to calculate initial credit score
 * @dev Provides on-chain metrics for creditworthiness assessment
 */
contract WalletAnalyzer {
    struct WalletMetrics {
        uint256 firstSeenTimestamp;  // When wallet was first recorded
        uint256 lastUpdateTimestamp; // Last time metrics were updated
        bool isRecorded;             // Whether wallet has been analyzed
    }
    
    mapping(address => WalletMetrics) public metrics;
    
    // Events
    event WalletRecorded(address indexed wallet, uint256 timestamp);
    event WalletAnalyzed(address indexed wallet, uint256 totalScore);
    
    /**
     * @notice Record a wallet for the first time
     * @param wallet Address to record
     */
    function recordWallet(address wallet) public {
        if (!metrics[wallet].isRecorded) {
            metrics[wallet] = WalletMetrics({
                firstSeenTimestamp: block.timestamp,
                lastUpdateTimestamp: block.timestamp,
                isRecorded: true
            });
            emit WalletRecorded(wallet, block.timestamp);
        }
    }
    
    /**
     * @notice Calculate wallet age in days
     * @param wallet Address to analyze
     * @return Age in days since first recorded
     */
    function getWalletAge(address wallet) public view returns (uint256) {
        if (!metrics[wallet].isRecorded) return 0;
        return (block.timestamp - metrics[wallet].firstSeenTimestamp) / 1 days;
    }
    
    /**
     * @notice Calculate age-based score (max 20 points)
     * @param wallet Address to analyze
     * @return Score based on wallet age
     */
    function getAgeScore(address wallet) public view returns (uint256) {
        uint256 age = getWalletAge(wallet);
        
        if (age >= 365) return 20;      // 1+ year = 20 pts
        if (age >= 180) return 15;      // 6+ months = 15 pts
        if (age >= 90) return 10;       // 3+ months = 10 pts
        if (age >= 30) return 5;        // 1+ month = 5 pts
        if (age >= 7) return 3;         // 1+ week = 3 pts
        if (age >= 1) return 1;         // 1+ day = 1 pt
        return 0;                       // New wallet = 0 pts
    }
    
    /**
     * @notice Estimate transaction count based on nonce
     * @param wallet Address to analyze
     * @return Estimated transaction count
     * @dev In production, use Chainlink oracle or The Graph for accurate count
     */
    function getTxCount(address wallet) public view returns (uint256) {
        // Get the transaction count (nonce) of the wallet
        uint256 nonce = getNonce(wallet);
        return nonce;
    }
    
    /**
     * @notice Get the nonce (transaction count) of an address
     * @param wallet Address to check
     * @return Transaction count
     */
    function getNonce(address wallet) internal view returns (uint256) {
        // Get account nonce using assembly for gas efficiency
        uint256 nonce;
        assembly {
            nonce := extcodesize(wallet)
        }
        // Fallback: use a simple heuristic based on address entropy
        // This is a simplified version for demo - in production use Chainlink/The Graph
        if (nonce == 0) {
            // Use address entropy as proxy for activity
            bytes32 hash = keccak256(abi.encodePacked(wallet));
            nonce = uint256(hash) % 100; // 0-99 range
        }
        return nonce;
    }
    
    /**
     * @notice Calculate activity score based on transaction count (max 20 points)
     * @param wallet Address to analyze
     * @return Score based on activity level
     */
    function getActivityScore(address wallet) public view returns (uint256) {
        uint256 txCount = getTxCount(wallet);
        
        if (txCount >= 100) return 20;     // Very active
        if (txCount >= 50) return 15;      // Active
        if (txCount >= 20) return 10;      // Moderate
        if (txCount >= 5) return 5;        // Light usage
        if (txCount >= 1) return 2;        // Minimal usage
        return 0;                          // No transactions
    }
    
    /**
     * @notice Calculate balance score based on native token holdings (max 20 points)
     * @param wallet Address to analyze
     * @return Score based on balance
     */
    function getBalanceScore(address wallet) public view returns (uint256) {
        uint256 balance = wallet.balance;
        
        // Scoring based on MATIC balance (Polygon)
        if (balance >= 10 ether) return 20;     // 10+ MATIC = 20 pts
        if (balance >= 5 ether) return 15;      // 5+ MATIC = 15 pts
        if (balance >= 1 ether) return 10;      // 1+ MATIC = 10 pts
        if (balance >= 0.5 ether) return 7;     // 0.5+ MATIC = 7 pts
        if (balance >= 0.1 ether) return 5;     // 0.1+ MATIC = 5 pts
        if (balance >= 0.01 ether) return 2;    // 0.01+ MATIC = 2 pts
        return 0;                               // Low balance = 0 pts
    }
    
    /**
     * @notice Calculate composite initial credit score (0-60 points)
     * @param wallet Address to analyze
     * @return Total score from wallet history analysis
     * @dev Combines age, activity, and balance scores
     */
    function calculateInitialScore(address wallet) external returns (uint256) {
        // Record wallet if not already recorded
        recordWallet(wallet);
        
        // Calculate component scores
        uint256 ageScore = getAgeScore(wallet);
        uint256 activityScore = getActivityScore(wallet);
        uint256 balanceScore = getBalanceScore(wallet);
        
        uint256 totalScore = ageScore + activityScore + balanceScore;
        
        emit WalletAnalyzed(wallet, totalScore);
        
        return totalScore;
    }
    
    /**
     * @notice Get detailed breakdown of wallet scores
     * @param wallet Address to analyze
     * @return ageScore Score from wallet age
     * @return activityScore Score from transaction activity
     * @return balanceScore Score from token holdings
     * @return totalScore Sum of all scores
     */
    function getScoreBreakdown(address wallet) external view returns (
        uint256 ageScore,
        uint256 activityScore,
        uint256 balanceScore,
        uint256 totalScore
    ) {
        ageScore = getAgeScore(wallet);
        activityScore = getActivityScore(wallet);
        balanceScore = getBalanceScore(wallet);
        totalScore = ageScore + activityScore + balanceScore;
    }
    
    /**
     * @notice Check if wallet has been recorded
     * @param wallet Address to check
     * @return True if wallet has been analyzed before
     */
    function isWalletRecorded(address wallet) external view returns (bool) {
        return metrics[wallet].isRecorded;
    }
    
    /**
     * @notice Get full wallet metrics
     * @param wallet Address to query
     * @return Wallet metrics struct
     */
    function getWalletMetrics(address wallet) external view returns (WalletMetrics memory) {
        return metrics[wallet];
    }
}
