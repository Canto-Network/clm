const {ethers} = require("hardhat");
const {canto} = require("../../config/index");

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
		"0xdE59F060D7ee2b612E7360E6C1B97c4d8289Ca2e", //cUsdc delegator
		"0x6b46ba92d7e94FfA658698764f5b8dfD537315A9", // cUsdt delegator
		"0xD6a97e43FC885A83E97d599796458A331E580800", //cNoteUsdc Delegator 
		"0xf0cd6b5cE8A01D1B81F1d8B76643866c5816b49F", //cNoteUsdt Delegator
		"0xC0D6574b2fe71eED8Cd305df0DA2323237322557", //cCantoAtom Delegator 
		"0xb49A395B39A0b410675406bEE7bD06330CB503E3", //cCantoEth Delegator
		"0x3C96dCfd875253A37acB3D2B102b6f328349b16B" //cCantoNote Delegator
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
	// send funds to reservoir call data
	data = abiCoder.encode(["address","uint256","string"], ["0xCD9A55aa5C890b132700Ef9aA8218Db2F55327d8", ethers.utils.parseUnits("62500000", "18"), "CANTO"])
	console.log("TreasurySend: ", data)
}

  

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});