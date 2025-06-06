/* global BigInt */
import { groth16 } from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';
import { ethers } from 'ethers';

// Initialize Poseidon hasher once
let poseidon;
(async () => {
  poseidon = await buildPoseidon();
})();
export const poseidonHash = async (inputs) => {
  while (!poseidon) await new Promise(resolve => setTimeout(resolve, 50));
  return poseidon.F.toString(poseidon(inputs.map(x => BigInt(x))));
};
const toBigInt = (value) => {
  if (value === undefined || value === null) {
    throw new Error('Cannot convert undefined/null to BigInt');
  }
  return BigInt(value.toString());
};

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
    // Input validation
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
    // Convert string secrets to BigInt
    const senderSecretBigInt = BigInt(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(senderSecret))
    );
    
    const receiverSecretBigInt = BigInt(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(receiverSecret))
    );

    // Convert all values to strings and validate
    const inputs = {
      senderBalance: senderBalance.toString(),
      transferAmount: transferAmounBigInt.toString(),
      senderSecret: senderSecretBigInt.toString(),
      receiverSecret: receiverSecret.toString(),
      nonce: nonce.toString(),
      nullifierHash: nullifierHash.toString(),
      senderCommitment: senderCommitment.toString(),
      newSenderCommitment: newSenderCommitment.toString(),
      receiverCommitment: receiverCommitment.toString(),
      merkleRoot: merkleRoot.toString()
    };

    // Generate Poseidon hashes (wait for initialization)
    while (!poseidon) await new Promise(resolve => setTimeout(resolve, 100));
    
    const hash = (elements) => {
      return poseidon.F.toString(poseidon(elements.map(toBigInt)));
    };

    // Generate updated commitments
    const computedSenderCommitment = hash([
      inputs.senderBalance,
      inputs.senderSecret,
      inputs.nonce
    ]);

    const computedNewSenderCommitment = hash([
      (BigInt(inputs.senderBalance) - BigInt(inputs.transferAmount)).toString(),
      inputs.senderSecret,
      (BigInt(inputs.nonce) + BigInt(1)).toString()
    ]);

    const computedReceiverCommitment = hash([
      inputs.transferAmount,
      inputs.receiverSecret,
      inputs.nonce
    ]);

    // Final proof inputs
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

    console.log('Proof Generation Inputs:', proofInputs);

    // Generate proof
    const { proof, publicSignals } = await groth16.fullProve(
      proofInputs,
      '/circuits/transfer.wasm',
      '/circuits/transfer_final.zkey'
    );

    return {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
      c: [proof.pi_c[0], proof.pi_c[1]],
      publicSignals
    };

  } catch (error) {
    console.error('ZK Proof Generation Error:', error);
    throw new Error(`Proof generation failed: ${error.message}`);
  }
};
