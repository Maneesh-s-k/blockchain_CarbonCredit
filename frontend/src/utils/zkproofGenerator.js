/* global BigInt */
import { groth16 } from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';
import { ethers } from 'ethers';

// Initialize Poseidon hasher once
let poseidon;
(async () => {
  poseidon = await buildPoseidon();
})();

// Explicit named export for poseidonHash
export const poseidonHash = async (inputs) => {
  // Convert string secrets to BigInt first
  const processedInputs = inputs.map(input => {
    if (typeof input === 'string' && !/^(0x)?[0-9a-fA-F]+$/.test(input)) {
      return hashStringToBigInt(input);
    }
    return BigInt(input.toString());
  });

  while (!poseidon) await new Promise(resolve => setTimeout(resolve, 50));
  return poseidon.F.toString(poseidon(processedInputs));
};


const toBigInt = (value) => {
  if (value === undefined || value === null) {
    throw new Error('Cannot convert undefined/null to BigInt');
  }
  if (typeof value === 'bigint') return value;
  if (typeof value === 'string' && value.startsWith('0x')) {
    return BigInt(value);
  }
  return BigInt(value.toString());
};

const hashStringToBigInt = (str) => {
  const hex = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
  return BigInt(hex);
}

export const generateTransferProof = async (
  senderBalance,
  transferAmount,
  senderSecret,
  receiverSecret,
  nonce,
  nullifierHash,
  senderCommitment,
  newSenderCommitment,
  receiverCommitment,
  merkleRoot
) => {
  try {
    // Validate all required inputs exist
    const requiredInputs = {
      senderBalance,
      transferAmount,
      senderSecret,
      receiverSecret,
      nonce,
      nullifierHash,
      senderCommitment,
      newSenderCommitment,
      receiverCommitment,
      merkleRoot
    };

    for (const [key, value] of Object.entries(requiredInputs)) {
      if (value === undefined || value === null) {
        throw new Error(`Missing required input: ${key}`);
      }
    }

    // Convert secrets to cryptographic hashes
    const hashSecret = (secret) => 
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
      const senderSecretBigInt = hashStringToBigInt(senderSecret);
      const receiverSecretBigInt = hashStringToBigInt(receiverSecret);

    // Prepare all inputs as strings
    const inputs = {
      senderBalance: senderBalance.toString(),
      transferAmount: transferAmount.toString(),
      senderSecret: senderSecretBigInt.toString(),
      receiverSecret: receiverSecretBigInt.toString(),
      nonce: nonce.toString(),
      nullifierHash: nullifierHash.toString(),
      senderCommitment: senderCommitment.toString(),
      newSenderCommitment: newSenderCommitment.toString(),
      receiverCommitment: receiverCommitment.toString(),
      merkleRoot: merkleRoot.toString()
    };

    // Wait for Poseidon initialization
    while (!poseidon) await new Promise(resolve => setTimeout(resolve, 100));

    // Poseidon hash function with proper type conversion
    const hash = (elements) => {
      return poseidon.F.toString(
        poseidon(elements.map(e => toBigInt(e)))
      );
    };

    // Generate commitments with validated inputs
    const computedSenderCommitment = hash([
      inputs.senderBalance,
      inputs.senderSecret,
      inputs.nonce
    ]);

    const computedNewSenderCommitment = hash([
      (toBigInt(inputs.senderBalance) - toBigInt(inputs.transferAmount)).toString(),
      inputs.senderSecret,
      (toBigInt(inputs.nonce) + BigInt(1)).toString()
    ]);

    const computedReceiverCommitment = hash([
      inputs.transferAmount,
      inputs.receiverSecret,
      inputs.nonce
    ]);

    // Final proof inputs with hashed values
    const proofInputs = {
      senderBalance: inputs.senderBalance,
      transferAmount: inputs.transferAmount,
      senderSecret: inputs.senderSecret,
      receiverSecret: inputs.receiverSecret,
      nonce: inputs.nonce,
      nullifierHash: inputs.nullifierHash,
      senderCommitment: computedSenderCommitment,
      newSenderCommitment: computedNewSenderCommitment,
      receiverCommitment: computedReceiverCommitment,
      merkleRoot: inputs.merkleRoot
    };

    console.log('Proof Inputs:', proofInputs);

    // Generate ZK proof
    const { proof, publicSignals } = await groth16.fullProve(
      proofInputs,
      '/circuits/transfer.wasm',
      '/circuits/transfer_final.zkey'
    );

    return {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [
        [proof.pi_b[0][1], proof.pi_b[0][0]], 
        [proof.pi_b[1][1], proof.pi_b[1][0]]
      ],
      c: [proof.pi_c[0], proof.pi_c[1]],
      publicSignals
    };

  } catch (error) {
    console.error('Proof Generation Error:', error);
    throw new Error(`Proof generation failed: ${error.message}`);
  }
};
