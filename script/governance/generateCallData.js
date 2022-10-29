const {ethers} = require("hardhat");
const {canto} = require("../../config/index");

async function main() { 
	let abiCoder = ethers.utils.defaultAbiCoder

	let tokens = [
		(await deployments.get("CUsdcDelegator")).address, //cUsdc delegator
		(await deployments.get("CUsdtDelegator")).address, // cUsdt delegator
		(await deployments.get("CNoteUsdcDelegator")).address, //cNoteUsdc Delegator 
		(await deployments.get("CNoteUsdtDelegator")).address, //cNoteUsdt Delegator
		(await deployments.get("CCantoAtomDelegator")).address, //cCantoAtom Delegator 
		(await deployments.get("CCantoEthDelegator")).address, //cCantoEth Delegator
		(await deployments.get("CCantoNoteDelegator")).address //cCantoNote Delegator
	]

	let supplySpeeds = [
		ethers.utils.parseUnits("0.3", "18"),
		ethers.utils.parseUnits("0.3", "18"),
		ethers.utils.parseUnits("4", "18"),
		ethers.utils.parseUnits("4", "18"),
		ethers.utils.parseUnits("16","18"),
		ethers.utils.parseUnits("16","18"),
		ethers.utils.parseUnits("32", "18")
	]
	let borrowSpeeds = [ 
		0,
		0, 
		0,
		0,
		0,
		0,
		0
	]
		
	// reservoir
	let reservoir = await ethers.getContractAt("Reservoir", "0xF55b9a38a7937f6554d67bAF7a1aeA7eAF3509CA")
	console.log(`Reservoir drip rate: ${await reservoir.dripRate()}`)

	let priceOracleAddr = "0xCE1541C1dE95ea8d726b3ead31EdB8A8543915F2";

	// console.log(`CUsdc compSupplySpeed: `, (await comptroller.compSupplySpeeds(CUsdc.address)).toBigInt())

	data = abiCoder.encode(["address[]", "uint[]", "uint[]"], [tokens, supplySpeeds , borrowSpeeds])
	console.log(data)	
	// send funds to reservoir call data
	data = abiCoder.encode(["address","uint256","string"], ["0xF55b9a38a7937f6554d67bAF7a1aeA7eAF3509CA", ethers.utils.parseUnits("32500000", "18"), "CANTO"])
	console.log("TreasurySend: ", data)

	// update comptroller Price Oracle
	data = abiCoder.encode(["address"], [priceOracleAddr]);
	console.log(`Updating price Oracle data: ${data}`)
}

  

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});