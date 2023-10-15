const { BigNumber } = require("ethers");
const { ethers, deployments } = require("hardhat");

const mainnet = {
	unitroller: "0x5E23dC409Fc2F832f83CEc191E245A191a4bCc5C",
	rwaCtokens: [""],
	USYC: "0xFb8255f0De21AcEBf490F1DF6F0BDd48CC1df03B", // USYC address (underlying)
	jumpRateModel: "0x9748b6d59fd4C4f087294087bD94b6B9d95B4293", // JumpRateModel address
};

async function main() {
	[dep] = await ethers.getSigners();
	// const ComptrollerFactoryV2 = await ethers.getContractFactory(
	// 	"ComptrollerV2"
	// );
	const cRWA = await ethers.getContractFactory("CRWAToken");
	const cERC20Delegator = await ethers.getContractFactory("CErc20Delegator");

	// // deploy comptroller with updated max collateral factor
	// const comptrollerV2 = await (
	// 	await ComptrollerFactoryV2.deploy()
	// ).deployed();
	// console.log("Comptroller deployed to:", comptrollerV2.address);

	// // deploy cRWA token
	// const cRWAToken = await (await cRWA.deploy()).deployed();
	// console.log("cRWAToken deployed to:", cRWAToken.address);

	// deploy delegator
	const cUSYC = await (
		await cERC20Delegator.deploy(
			mainnet.USYC, // underlying
			mainnet.unitroller, // comptroller
			mainnet.jumpRateModel, // interest rate model
			ethers.utils.parseEther("1"), // initial exchange rate
			"Collateralized US Yield Coin", // name
			"cUSYC", // symbol
			6, // decimals
			"0x03cf8710BBA14C32232Efe0613fD44b8199995EC", // admin
			"0x4eb33355a84c709f85e233035f4f4a5da29921FA", // implementation
			0 // become implementation data
		)
	).deployed();
	console.log("cUSYCDelegator deployed to:", cUSYC.address);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
