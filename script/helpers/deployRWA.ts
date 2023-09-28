const {ethers, deployments} = require("hardhat");

async function main() {
    const cRWAFactory = await ethers.getContractFactory("CRWAToken");
    const cRWA = await (await cRWAFactory.deploy()).deployed();
    
    console.log("CRWA deployed to:", cRWA.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
