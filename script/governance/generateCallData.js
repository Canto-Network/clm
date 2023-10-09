const { ethers } = require("hardhat");
const { canto } = require("../../config/index");

async function main() {
	let abiCoder = ethers.utils.defaultAbiCoder;

	// mainnet
	let tokens = [
		"0xdE59F060D7ee2b612E7360E6C1B97c4d8289Ca2e", //cUsdc delegator
		"0x6b46ba92d7e94FfA658698764f5b8dfD537315A9", // cUsdt delegator
		"0xD6a97e43FC885A83E97d599796458A331E580800", //cNoteUsdc Delegator
		"0xf0cd6b5cE8A01D1B81F1d8B76643866c5816b49F", //cNoteUsdt Delegator
		"0xC0D6574b2fe71eED8Cd305df0DA2323237322557", //cCantoAtom Delegator
		"0xb49A395B39A0b410675406bEE7bD06330CB503E3", //cCantoEth Delegator
		"0x3C96dCfd875253A37acB3D2B102b6f328349b16B", //cCantoNote Delegator
	];

	// testnet
	// let tokens = [
	// 	"0x8a66C14854221E078678E13d25e3017d4E3Bc912", //cUsdc delegator
	// 	"0xE66e73865308820616bF5197631d6eE07aa1B45D", // cUsdt delegator
	// 	"0xE1AceA9029d52B54b55Fd0d1f08Ba0748a6677Dc", //cNoteUsdc Delegator
	// 	"0xDDF11fE93D64DE9a4513f409799cF170B96182c2", //cNoteUsdt Delegator
	// 	"0xedD97a6303DCed58C31d37fb208F9d0E3734AC8D", //cCantoAtom Delegator
	// 	"0x4CD4165406caf9da02Ca41153662ec9D401F243C", //cCantoEth Delegator
	// 	"0xc5bC2311674FEd327Bf26AfAF457fC6B2Bff9bed" //cCantoNote Delegator
	// ]

	// epoch 10
	let supplySpeeds = [
		ethers.utils.parseUnits("0.164", "18"),
		ethers.utils.parseUnits("0.164", "18"),
		ethers.utils.parseUnits("0.612", "18"),
		ethers.utils.parseUnits("0.612", "18"),
		ethers.utils.parseUnits("3.429", "18"),
		ethers.utils.parseUnits("3.429", "18"),
		ethers.utils.parseUnits("8.491", "18"),
	];

	// let supplySpeeds = [
	// 	ethers.utils.parseUnits("0.3", "18"),
	// 	ethers.utils.parseUnits("0.3", "18"),
	// 	ethers.utils.parseUnits("4", "18"),
	// 	ethers.utils.parseUnits("4", "18"),
	// 	ethers.utils.parseUnits("16","18"),
	// 	ethers.utils.parseUnits("16","18"),
	// 	ethers.utils.parseUnits("32", "18")
	// ]
	let borrowSpeeds = [0, 0, 0, 0, 0, 0, 0];

	// let priceOracleAddr = "0xCE1541C1dE95ea8d726b3ead31EdB8A8543915F2";

	data = abiCoder.encode(
		["address[]", "uint[]", "uint[]"],
		[tokens, supplySpeeds, borrowSpeeds]
	);
	console.log(data);

	// data2 = abiCoder.encode(["address[]"], [["0x00cEe48F9c6fca37852c5bB9FF36b207892879bC"]]);
	// console.log(data2);
	// send funds to reservoir call data
	// data = abiCoder.encode(["address","uint256","string"], ["0xF55b9a38a7937f6554d67bAF7a1aeA7eAF3509CA", ethers.utils.parseUnits("32500000", "18"), "CANTO"])
	// console.log("TreasurySend: ", data)

	// // update comptroller Price Oracle
	// data = abiCoder.encode(["address"], [priceOracleAddr]);
	// console.log(`Updating price Oracle data: ${data}`)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
