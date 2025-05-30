require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true  // ✅ Add this to fix stack too deep
    }
  },
  networks: {
    localhost: { url: "http://127.0.0.1:8545" }
  }
};
