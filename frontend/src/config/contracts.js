
console.log('ENV:', process.env.REACT_APP_CARBON_CREDIT_TOKEN, process.env.REACT_APP_MARKETPLACE, process.env.REACT_APP_VERIFIER_CARBON, process.env.REACT_APP_VERIFIER_TRANSFER, process.env.REACT_APP_RPC_URL, process.env.REACT_APP_BLOCK_EXPLORER);


export const CONTRACT_ADDRESSES = {
  sepolia: {
    carbonCreditToken: process.env.REACT_APP_CARBON_CREDIT_TOKEN,
    marketplace: process.env.REACT_APP_MARKETPLACE,
    carbonCreditVerifier: process.env.REACT_APP_VERIFIER_CARBON,
    transferVerifier: process.env.REACT_APP_VERIFIER_TRANSFER
  }
};

export const NETWORK_CONFIG = {
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: process.env.REACT_APP_RPC_URL,
    blockExplorer: process.env.REACT_APP_BLOCK_EXPLORER
  }
};

export const SUPPORTED_NETWORKS = {
  11155111: {
    name: 'Sepolia Testnet',
    rpcUrl: process.env.REACT_APP_RPC_URL,
    blockExplorer: process.env.REACT_APP_BLOCK_EXPLORER
  }
};

// ---- DEBUG LOG ----
console.log('Loaded CONTRACT_ADDRESSES:', CONTRACT_ADDRESSES);
console.log('Loaded NETWORK_CONFIG:', NETWORK_CONFIG);
console.log('Loaded SUPPORTED_NETWORKS:', SUPPORTED_NETWORKS);
