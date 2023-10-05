const { ethers, deployments } = require("hardhat");

const mainnet = {
	unitroller: "0x5E23dC409Fc2F832f83CEc191E245A191a4bCc5C",
	rwaCtokens: [""],
	USYC: "", // USYC address (underlying)
	jumpRateModel: "", // JumpRateModel address
};

async function main() {
	const ComptrollerFactory = await ethers.getContractFactory("Comptroller");
	const cRWA = await ethers.getContractFactory("CRWAToken");
	const cERC20Delegator = await ethers.getContractFactory("cERC20Delegator");

	// deploy comptroller with updated max collateral factor
	const comptroller = await (await ComptrollerFactory.deploy()).deployed();

	// deploy cRWA token and the delegator
	const cRWAToken = await (await cRWA.deploy()).deployed();
	const cUSYC = await (
		await cERC20Delegator.deploy(
			mainnet.USYC, // underlying
			mainnet.unitroller, // comptroller
			mainnet.jumpRateModel, // interest rate model
			1, // initial exchange rate
			"cUSYC", // name
			"cUSYC", // symbol
			6, // decimals
			"ADMIN", // admin
			cRWAToken.address, // implementation
			"BYTES" // become implementation data
		)
	).deployed();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});