// config/contracts.js
export const CONTRACT_ADDRESSES = {
  sepolia: { // Added sepolia parent key
    carbonCreditToken: '0xCa33F82670f4fB196CEDe4741F6045983893f0df',
    marketplace: '0x533FCA53FB28A56695Ae12D0524bE25dC08C3D9E',
    carbonCreditVerifier: '0xC82DE1f1336810c00e43e22150493946272d7D13',
    transferVerifier: '0xf44B74671E536265D69372a80f9ffC1F060bE2F3'
  }
};

export const NETWORK_CONFIG = {
  sepolia: { // Added sepolia parent key
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/e9f45b5ac11648cbab735fc0f755096c',
    blockExplorer: 'https://sepolia.etherscan.io'
  }
};

export const SUPPORTED_NETWORKS = {
  11155111: {
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/e9f45b5ac11648cbab735fc0f755096c',
    blockExplorer: 'https://sepolia.etherscan.io'
  }
};
