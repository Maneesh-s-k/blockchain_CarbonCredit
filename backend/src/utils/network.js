// utils/network.js
export const checkSepoliaNetwork = async () => {
  if (window.ethereum?.networkVersion !== '11155111') {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }]
    });
  }
};


exports.getClientIP = (req) => {
  return req.ip || 
    req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress;
};