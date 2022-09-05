import {ethers, deployments} from "hardhat";
import {Contract} from "ethers";

async function main() { 
	let abiCoder = ethers.utils.defaultAbiCoder

	let CUsdc = await ethers.getContract("CUsdcDelegator")
	let comptroller = await ethers.getContractAt("Comptroller", (await deployments.get("Unitroller")).address)
	let reservoir = await ethers.getContract("Reservoir")

	// lpTokens
	let cUsdc = await ethers.getContract("CUsdcDelegator")
	let cUsdt = await ethers.getContract("CUsdtDelegator")
	let cNoteUsdc = await ethers.getContract("CNoteUsdcDelegator")
	let cNoteUsdt = await ethers.getContract("CNoteUsdtDelegator")
	let cCantoNote = await ethers.getContract("CCantoNoteDelegator")
	let cCantoAtom = await ethers.getContract("CCantoAtomDelegator")
	let cCantoEth = await ethers.getContract("CCantoEthDelegator")
	let tokens = [
		cUsdc.address, //cUsdc delegator
		cUsdt.address, // cUsdt delegator
		cNoteUsdc.address, //cNoteUsdc Delegator 
		cNoteUsdt.address, //cNoteUsdt Delegator
		cCantoAtom.address, //cCantoAtom Delegator 
		cCantoEth.address, //cCantoEth Delegator
		cCantoNote.address //cCantoNote Delegator
	]

	let supplySpeeds = [
		ethers.utils.parseUnits("0.4493041178", "18"),
		ethers.utils.parseUnits("0.4493041178", "18"),
		ethers.utils.parseUnits("17.97216471", "18"),
		ethers.utils.parseUnits("17.97216471", "18"),
		ethers.utils.parseUnits("26.95824707","18"),
		ethers.utils.parseUnits("26.95824707","18"),
		ethers.utils.parseUnits("53.91649413", "18")
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
	
	console.log("tokens: ", tokens)

	console.log(`CUsdc compSupplySpeed: `, (await comptroller.compSupplySpeeds(CUsdc.address)).toBigInt())

	let data = abiCoder.encode(["address[]", "uint[]", "uint[]"], [tokens, supplySpeeds , borrowSpeeds])
	console.log(data)	
	// send funds to reservoir call data
	data = abiCoder.encode(["address","uint256","string"], [reservoir.address, ethers.utils.parseUnits("16304348", "18"), "CANTO"])
	console.log("TreasurySend: ", data)
}

  

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});