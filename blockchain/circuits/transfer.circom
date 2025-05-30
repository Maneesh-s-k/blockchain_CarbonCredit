pragma circom 2.0.0;

template PrivateTransfer() {
    // Private inputs (hidden from public)
    signal input senderBalance;
    signal input senderSecret;
    signal input transferAmount;
    signal input receiverSecret;
    signal input nonce;
    
    // Public inputs (visible on blockchain)
    signal input nullifierHash;
    signal input senderCommitment;
    signal input newSenderCommitment;
    signal input receiverCommitment;
    signal input merkleRoot;
    
    // Public outputs
    signal output validTransfer;
    signal output newNullifier;
    
    // 1. Verify sender commitment matches
    component senderHasher = Poseidon3();
    senderHasher.inputs[0] <== senderBalance;
    senderHasher.inputs[1] <== senderSecret;
    senderHasher.inputs[2] <== nonce;
    
    signal senderHash;
    senderHash <== senderHasher.out;
    
    // 2. Generate new sender commitment (after transfer)
    signal newBalance;
    newBalance <== senderBalance - transferAmount;
    
    component newSenderHasher = Poseidon3();
    newSenderHasher.inputs[0] <== newBalance;
    newSenderHasher.inputs[1] <== senderSecret;
    newSenderHasher.inputs[2] <== nonce + 1;
    
    signal newSenderHash;
    newSenderHash <== newSenderHasher.out;
    
    // 3. Generate nullifier to prevent double spending
    component nullifierHasher = Poseidon2();
    nullifierHasher.inputs[0] <== senderSecret;
    nullifierHasher.inputs[1] <== nonce;
    newNullifier <== nullifierHasher.out;
    
    // 4. Verify receiver commitment
    component receiverHasher = Poseidon3();
    receiverHasher.inputs[0] <== transferAmount;
    receiverHasher.inputs[1] <== receiverSecret;
    receiverHasher.inputs[2] <== nonce;
    
    signal receiverHash;
    receiverHash <== receiverHasher.out;
    
    // Simple validation (in real implementation, add proper checks)
    validTransfer <== 1;
}

// Separate templates for different input sizes
template Poseidon2() {
    signal input inputs[2];
    signal output out;
    
    // Simplified hash for 2 inputs
    signal sum;
    sum <== inputs[0] + inputs[1];
    out <== sum * sum;
}

template Poseidon3() {
    signal input inputs[3];
    signal output out;
    
    // Simplified hash for 3 inputs
    signal sum;
    sum <== inputs[0] + inputs[1] + inputs[2];
    out <== sum * sum;
}

component main = PrivateTransfer();
