const {ethers} = require("hardhat");
const {canto} = require("../../config/index");

async function main() { 
	let abiCoder = ethers.utils.defaultAbiCoder

	let CUsdc = await ethers.getContract("CUsdcDelegator")
	let comptroller = await ethers.getContractAt("Comptroller", (await deployments.get("Unitroller")).address)
	// lpTokens
	let cUsdc = await ethers.getContract("CUsdcDelegator")
	let cUsdt = await ethers.getContract("CUsdtDelegator")
	let cNoteUsdc = await ethers.getContract("CNoteUsdcDelegator")
	let cNoteUsdt = await ethers.getContract("CNoteUsdtDelegator")
	let cCantoNote = await ethers.getContract("CCantoNoteDelegator")
	let cCantoAtom = await ethers.getContract("CCantoAtomDelegator")
	let cCantoEth = await ethers.getContract("CCantoEthDelegator")
	let tokens = [
		cUsdc.address,
		cUsdt.address,
		cNoteUsdc.address, 
		cNoteUsdt.address , 
		cCantoAtom.address , 
		cCantoEth.address,
		cCantoNote.address
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

	data = abiCoder.encode(["address[]", "uint[]", "uint[]"], [tokens, supplySpeeds , borrowSpeeds])
	console.log(data)
}

  

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});