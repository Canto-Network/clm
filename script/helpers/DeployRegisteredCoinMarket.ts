import {ethers, deployments} from "hardhat"
// import {delay, getDelegator} from "./governance"
import {canto} from "../../config/index.js"

async function main() { 
	const [dep] = await ethers.getSigners();
	let jumpRate = await ethers.getContract("JumpRateModel")


	let comptroller = new ethers.Contract(
		(await deployments.get("Unitroller")).address,
		(await deployments.get("Comptroller")).abi,
		dep
	)
	console.log("Comptroller: ", comptroller.address)

	let erc20 = await ethers.getContractAt("ERC20", "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd")
	console.log("ERC20 Address: ", await erc20.decimals())

	let cTokenDelegateFac = await ethers.getContractFactory("CErc20Delegate")
	let cTokenDelegate = await cTokenDelegateFac.deploy()
	await cTokenDelegate.deployed()

	const markets = canto.markets

	    //retrieve markets configuration for canto CLM, set admin to deployer for now (should be Timelock)
		const CNoteArgs = [
			erc20.address, //underlying
			comptroller.address, //ComptrollerInterface
			jumpRate.address, //interestRateModel
			markets.CNote.initialExchangeRateMantissa, //initialExchangeRateMantissa
			"cErc20",
			"CErc20",
			markets.CNote.decimals,
			dep.address, //admin
			cTokenDelegate.address, //implementation
			markets.CNote.becomeImplementation, //data for _becomeImplementationdata
		];
	

	let cTokenFac = await ethers.getContractFactory("CErc20Delegator")
	let cToken = await cTokenFac.deploy(
		erc20.address, //underlying
		comptroller.address, //ComptrollerInterface
		jumpRate.address, //interestRateModel
		markets.CNote.initialExchangeRateMantissa, //initialExchangeRateMantissa
		"cErc20",
		"CErc20",
		markets.CNote.decimals,
		dep.address, //admin
		cTokenDelegate.address, //implementation
		markets.CNote.becomeImplementation, //data for _becomeImplementationdata
	)

	await cToken.deployed()

	console.log("cToken address: ", cToken.address)
}

  

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});