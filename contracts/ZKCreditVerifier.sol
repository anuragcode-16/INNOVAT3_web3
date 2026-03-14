// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ZKCreditVerifier
 * @notice Verifies zero-knowledge proofs of balance thresholds and grants credit boosts
 * @dev For MVP: uses simplified verification. In production: replace with actual snarkjs verifier
 */
contract ZKCreditVerifier {
    struct BalanceProof {
        uint256 threshold;      // Minimum balance threshold proved
        uint256 timestamp;      // When proof was submitted
        bool verified;          // Proof verification status
    }
    
    // User address => their latest balance proof
    mapping(address => BalanceProof) public proofs;
    
    // User address => credit boost points (10-30 based on threshold)
    mapping(address => uint256) public creditBoost;
    
    // Events
    event ProofSubmitted(address indexed user, uint256 threshold, uint256 boost);
    event ProofExpired(address indexed user, uint256 threshold);
    
    /**
     * @notice Submit a zero-knowledge proof of balance
     * @param threshold The minimum balance threshold being proved (in USDC with 6 decimals)
     * @param a ZK proof parameter a
     * @param b ZK proof parameter b
     * @param c ZK proof parameter c
     * @param input Public inputs to the proof
     */
    function submitBalanceProof(
        uint256 threshold,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[1] calldata input
    ) external {
        // Verify the ZK proof
        bool isValid = verifyProofInternal(a, b, c, input);
        require(isValid, "Invalid ZK proof");
        
        // Record the proof
        proofs[msg.sender] = BalanceProof({
            threshold: threshold,
            timestamp: block.timestamp,
            verified: true
        });
        
        // Calculate credit boost based on threshold
        uint256 boost = calculateCreditBoost(threshold);
        creditBoost[msg.sender] = boost;
        
        emit ProofSubmitted(msg.sender, threshold, boost);
    }
    
    /**
     * @notice Calculate credit boost based on proved threshold
     * @param threshold The minimum balance threshold proved
     * @return Credit boost points (10-30)
     */
    function calculateCreditBoost(uint256 threshold) internal pure returns (uint256) {
        // Thresholds in USDC (6 decimals) - Lower values for hackathon testing
        if (threshold >= 101 * 10**6) {
            return 30; // Proved 101+ USDC = +30 pts
        } else if (threshold >= 11 * 10**6) {
            return 20; // Proved 11-100 USDC = +20 pts
        } else if (threshold >= 1 * 10**6) {
            return 10; // Proved 1-10 USDC = +10 pts
        }
        return 0; // Below minimum threshold
    }
    
    /**
     * @notice Verify ZK proof (simplified for MVP)
     * @dev In production: Replace with actual snarkjs verifier contract
     * @param a ZK proof parameter a
     * @param b ZK proof parameter b
     * @param c ZK proof parameter c
     * @param input Public inputs to the proof
     * @return True if proof is valid
     */
    function verifyProofInternal(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[1] calldata input
    ) internal pure returns (bool) {
        // Placeholder verification for MVP demonstration
        // Real implementation would use snarkjs-generated verifier contract
        // For now, accept proof if all inputs are non-zero
        return (a[0] > 0 && b[0][0] > 0 && c[0] > 0 && input[0] > 0);
    }
    
    /**
     * @notice Get credit boost for a user (0 if expired)
     * @param user The user address
     * @return Credit boost points
     */
    function getCreditBoost(address user) external view returns (uint256) {
        // Proofs expire after 30 days
        if (block.timestamp - proofs[user].timestamp > 30 days) {
            return 0;
        }
        return creditBoost[user];
    }
    
    /**
     * @notice Check if user has a valid (non-expired) proof
     * @param user The user address
     * @return True if proof is valid and not expired
     */
    function hasValidProof(address user) external view returns (bool) {
        BalanceProof memory proof = proofs[user];
        return proof.verified && (block.timestamp - proof.timestamp <= 30 days);
    }
    
    /**
     * @notice Get detailed proof information for a user
     * @param user The user address
     * @return threshold The proved threshold amount
     * @return timestamp When the proof was submitted
     * @return verified If the proof is verified
     * @return boost Current credit boost points
     * @return isExpired If the proof has expired
     */
    function getProofDetails(address user) external view returns (
        uint256 threshold,
        uint256 timestamp,
        bool verified,
        uint256 boost,
        bool isExpired
    ) {
        BalanceProof memory proof = proofs[user];
        threshold = proof.threshold;
        timestamp = proof.timestamp;
        verified = proof.verified;
        boost = creditBoost[user];
        isExpired = (block.timestamp - proof.timestamp > 30 days);
    }
}
