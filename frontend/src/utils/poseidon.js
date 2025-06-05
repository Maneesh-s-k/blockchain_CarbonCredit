import { buildPoseidon } from 'circomlibjs';

export const generatePoseidonHash = async (inputs) => {
  const poseidon = await buildPoseidon();
  const hash = poseidon(inputs.map(x => BigInt(x)));
  return poseidon.F.toString(hash);
};
