const {ethers} = require("hardhat");
const {canto} = require("../../config/index");


async function main() { 
	const [dep] = await ethers.getSigners();

	let abiCoder = ethers.utils.defaultAbiCoder

	
	let treasury = await ethers.getContract("TreasuryDelegator")
	let reservoir = await ethers.getContract("Reservoir")
	let weth = await ethers.getContract("WETH")
	
	console.log("Treasury Address: ", treasury.address)
	console.log("Reservoir Balance: ", await weth.balanceOf(reservoir.address))
	console.log("Treasury Balance: ", (await ethers.provider.getBalance(treasury.address)).toBigInt())

	data = abiCoder.encode(["address", "uint", "string"], [reservoir.address, ethers.utils.parseEther("100"), "CANTO"])
	console.log(data)
}

  

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});