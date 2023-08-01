const { deployments } = require("hardhat");
const { canto } = require("../../config/index");

async function main() {
	[dep] = await ethers.getSigners();

	//   let govDelegate = await deployments.get("GovernorBravoDelegate")
	//   let govDelegator = await deployments.get("GovernorBravoDelegator")
	//   let treasury = await ethers.getContract("TreasuryDelegator")
	//   let reservoir = await ethers.getContract("Reservoir")
	//   let weth = await ethers.getContract("WETH")

	//   let governor = new ethers.Contract(
	//     govDelegator.address,
	//     govDelegate.abi,
	//     dep
	//   )

	let govBravo = await ethers.getContractAt(
		"GovernorBravoDelegate",
		"0xBC3139f9dA6b16A8FF8Ac6e0dEc4C0278d532dba"
	);
	let prop = await ethers.getContractAt(
		"IProposal",
		"0x648a5Aa0C4FbF2C1CF5a3B432c2766EeaF8E402d"
	);

	let x = await prop.QueryProp(87);
	console.log(x);
	//queue GovShuttle Proposal
	// await govBravo.queue(87);
	// await govBravo.execute(87);
	//   await new Promise( timeOut => setTimeout(timeOut, 100 * 1000)) // await 100 secs, delay in timelock is 60 secs
	//   await (await governor.execute(39)).wait()  //queue GovShuttle Proposal

	//   console.log(`Reservoir weth balance ${(await weth.balanceOf(reservoir.address)).toBigInt()}`)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
