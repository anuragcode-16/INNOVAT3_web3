pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

// Prove balance >= threshold without revealing exact balance
template BalanceProof() {
    signal input balance;        // Private: actual balance
    signal input threshold;      // Public: minimum required
    signal input salt;           // Private: randomness
    signal output isValid;       // Public: 1 if balance >= threshold
    
    component gte = GreaterEqThan(64);
    gte.in[0] <== balance;
    gte.in[1] <== threshold;
    
    isValid <== gte.out;
}

component main = BalanceProof();
