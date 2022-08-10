const {ethers} = require("hardhat");
const {canto} = require("../../config/index");

async function main() { 
	let abiCoder = ethers.utils.defaultAbiCoder

	let treasury = await deployments.get("TreasuryDelegator")
	let weth = await ethers.getContract("WETH")
	let reservoir = await deployments.get("Reservoir")
	console.log("Treasury address: ", treasury.address)
	console.log("Reservoir weth balance: ", (await weth.balanceOf(reservoir.address)).toBigInt())

	data = abiCoder.encode(["address", "uint", "string"], [reservoir.address, ethers.utils.parseEther("100000000"), "CANTO"])
	console.log(data)
}

  

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});