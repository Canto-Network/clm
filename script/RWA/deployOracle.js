const { ethers, deployments } = require("hardhat");

const mainnet = {
	unitroller: "0x5E23dC409Fc2F832f83CEc191E245A191a4bCc5C",
	router: "0xa252eEE9BDe830Ca4793F054B506587027825a8e",
	cCantoDelegator: "0xB65Ec550ff356EcA6150F733bA9B954b2e0Ca488",
	USDT: "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75",
	USDC: "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd",
	wCanto: "0x826551890Dc65655a0Aceca109aB11AbDbD7a07B",
	NOTE: "0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503",
	rwaCtokens: ["0x0355E393cF0cf5486D9CAefB64407b7B1033C2f1"],
};

async function main() {
	[dep] = await ethers.getSigners();

	const CLMPriceOracleFactory = await ethers.getContractFactory(
		"CLMPriceOracle"
	);

	let oracle = await CLMPriceOracleFactory.deploy(
		mainnet.unitroller,
		mainnet.router,
		mainnet.cCantoDelegator,
		mainnet.USDT,
		mainnet.USDC,
		mainnet.wCanto,
		mainnet.NOTE,
		mainnet.rwaCtokens
	);
	await oracle.deployed();
	console.log("CLMPriceOracle deployed to:", oracle.address);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
