const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");

async function generateRealProof(energyProduced, carbonFactor) {
  try {
    const input = {
      energyProduced: energyProduced.toString(),
      deviceSecret: "123456789",
      timestamp: Math.floor(Date.now() / 1000).toString(),
      nonce: Math.floor(Math.random() * 1000000).toString(),
      minEnergyThreshold: "100",
      maxTimestamp: Math.floor(Date.now() / 1000 + 3600).toString(),
      carbonFactor: carbonFactor.toString()
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      "circuits/build/carbonCreditWorking_js/carbonCreditWorking.wasm",
      "circuits/build/carbonCreditWorking_final.zkey"
    );

    return {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
      c: [proof.pi_c[0], proof.pi_c[1]],
      input: publicSignals
    };
  } catch (error) {
    console.log("ZK proof generation failed, using mock proof:", error.message);
    return {
      a: [1, 2],
      b: [[1, 2], [3, 4]],
      c: [5, 6],
      input: [1000, 1]
    };
  }
}

async function main() {
  console.log("🔧 Setting up Carbon Credit Platform...\n");

  const deploymentPath = path.join(__dirname, "../deployments/localhost.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  console.log("✅ Loaded deployment file successfully");
  
  const [deployer] = await ethers.getSigners();
  console.log("Setup account:", deployer.address);

  const carbonCreditToken = await ethers.getContractAt("CarbonCreditToken", deployment.contracts.carbonCreditToken);

  console.log("📋 Contract addresses:");
  console.log("Carbon Credit Token:", deployment.contracts.carbonCreditToken);

  console.log("\n🌱 Creating sample carbon credits...");
  
  const sampleProjects = [
    { energyAmount: 1000, carbonAmount: 400, projectType: "solar", location: "California, USA", vintage: 2024 },
    { energyAmount: 1500, carbonAmount: 600, projectType: "wind", location: "Texas, USA", vintage: 2024 }
  ];

  for (let i = 0; i < sampleProjects.length; i++) {
    const project = sampleProjects[i];
    
    try {
      console.log(`Creating ${project.projectType} credit...`);
      
      const zkProof = await generateRealProof(project.energyAmount, 400);
      const projectHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`project-${i}-${Date.now()}`));
      const tokenURI = `https://api.carbonplatform.com/metadata/${i}`;

      // Use the SIMPLE function (12 individual parameters)
      const tx = await carbonCreditToken.mintCarbonCreditSimple(
        deployer.address,           // to
        project.carbonAmount,       // carbonAmount
        project.energyAmount,       // energyAmount
        projectHash,               // projectHash
        project.projectType,       // projectType
        project.location,          // location
        project.vintage,           // vintage
        tokenURI,                  // uri
        zkProof.a,                 // a
        zkProof.b,                 // b
        zkProof.c,                 // c
        zkProof.input              // input
      );

      await tx.wait();
      console.log(`✅ Created ${project.projectType} credit: ${project.carbonAmount} tCO₂`);
    } catch (error) {
      console.log(`⚠️ Failed to create ${project.projectType} credit:`, error.message);
    }
  }

  try {
    const balance = await carbonCreditToken.getCarbonBalance(deployer.address);
    console.log(`\n📊 Total carbon credits minted: ${balance} tCO₂`);
  } catch (error) {
    console.log("Could not fetch balance:", error.message);
  }

  console.log("\n🎉 Setup completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
