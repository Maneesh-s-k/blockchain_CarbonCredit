async function main() {
  console.log("🚀 Starting Carbon Credit Platform Deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  // Deploy BOTH ZK Verifiers
  console.log("📋 Deploying ZK Verifier Contracts...");
  
  // Deploy Carbon Credit Verifier
  const CarbonCreditVerifier = await ethers.getContractFactory("Verifier");
  const carbonVerifier = await CarbonCreditVerifier.deploy();
  await carbonVerifier.deployed();
  console.log("✅ Carbon Credit Verifier deployed to:", carbonVerifier.address);

  // Deploy Transfer Verifier (deploy same verifier twice for now)
  const TransferVerifier = await ethers.getContractFactory("Verifier");
  const transferVerifier = await TransferVerifier.deploy();
  await transferVerifier.deployed();
  console.log("✅ Transfer Verifier deployed to:", transferVerifier.address);

  // Deploy Carbon Credit Token with BOTH verifiers
  console.log("\n🌱 Deploying Carbon Credit Token Contract...");
  const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
  const carbonCreditToken = await CarbonCreditToken.deploy(
    carbonVerifier.address,    // First argument: carbonCreditVerifier
    transferVerifier.address   // Second argument: transferVerifier
  );
  await carbonCreditToken.deployed();
  console.log("✅ Carbon Credit Token deployed to:", carbonCreditToken.address);

  // Deploy Marketplace
  console.log("\n🏪 Deploying Carbon Credit Marketplace...");
  const CarbonCreditMarketplace = await ethers.getContractFactory("CarbonCreditMarketplace");
  const marketplace = await CarbonCreditMarketplace.deploy(carbonCreditToken.address);
  await marketplace.deployed();
  console.log("✅ Marketplace deployed to:", marketplace.address);

  // Setup permissions
  console.log("\n🔐 Setting up permissions...");
  await carbonCreditToken.setAuthorizedMinter(deployer.address, true);
  await carbonCreditToken.setAuthorizedMinter(marketplace.address, true);
  console.log("✅ Permissions configured");

  console.log("\n🎉 Deployment Summary:");
  console.log("==========================================");
  console.log("Network: localhost");
  console.log("Carbon Credit Verifier:", carbonVerifier.address);
  console.log("Transfer Verifier:", transferVerifier.address);
  console.log("Carbon Credit Token:", carbonCreditToken.address);
  console.log("Marketplace:", marketplace.address);
  console.log("==========================================");

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: "localhost",
    deployer: deployer.address,
    contracts: {
      carbonCreditVerifier: carbonVerifier.address,
      transferVerifier: transferVerifier.address,
      carbonCreditToken: carbonCreditToken.address,
      marketplace: marketplace.address
    },
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  fs.writeFileSync("deployments/localhost.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📁 Deployment info saved to deployments/localhost.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
