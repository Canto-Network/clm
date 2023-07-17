const { time } = require("@nomicfoundation/hardhat-network-helpers");
const {ethers} = require("hardhat");
const {canto} = require("../../config/index");

const CCANTO_ADDRESS = "0xB65Ec550ff356EcA6150F733bA9B954b2e0Ca488"
const CETH_ADDRESS = "0x830b9849e7d79b92408a86a557e7baaacbec6030"

const USDC_ADDRESS = "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd"
const USDT_ADDRESS = "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75"
const WETH_ADDRESS = '0x826551890Dc65655a0Aceca109aB11AbDbD7a07B'

async function main() { 
	const [dep] = await ethers.getSigners();

	let comptroller = await ethers.getContractAt("Comptroller", "0x5E23dC409Fc2F832f83CEc191E245A191a4bCc5C");
	// let treasury = await ethers.getContractAt("TreasuryDelegate", "0x2906fE356D8D0DC566cE35c714af366431C061d9");
	// let governor = await ethers.getContractAt("GovernorBravoDelegate", "0x00cEe48F9c6fca37852c5bB9FF36b207892879bC")
	// let timelock = await ethers.getContractAt("Timelock", "0x0D87F08B70202312E8C67F6149cF86987b36fAF0")

	// let pendingAdmin = await comptroller.admin();
	// console.log(pendingAdmin);

	// let x = await governor.initialProposalId();
	// console.log(x);

	// let treasuryAdmin = await treasury.admin();
	// console.log(treasuryAdmin);

	// let timelockAdmin = await timelock.admin();
	// console.log(timelockAdmin);

    // let x = await comptroller.compSupplyState("0xdE59F060D7ee2b612E7360E6C1B97c4d8289Ca2e");

    // console.log(x);
	
	// comptroller markets data
	let tokenList = await comptroller.getAllMarkets();
	for (var i = 0; i < tokenList.length; i++) {
		let tokenAddr = tokenList[i];
		let cToken = await ethers.getContractAt("CToken", tokenAddr)
		console.log(`${await cToken.name()} symbol: ${await cToken.symbol()}`)
		// console.log(`${await cToken.name()} decimals: ${await cToken.decimals()}`)
		// console.log(`${await cToken.name()} market: ${await comptroller.markets(tokenAddr)}`)
		console.log(`${await cToken.name()} supplySpeed: ${(await comptroller.compSupplySpeeds(tokenAddr)).toBigInt()}`)
		// console.log(`${await cToken.name()} borrowSpeed: ${(await comptroller.compBorrowSpeeds(tokenAddr)).toBigInt()}`)
		// console.log(`${await cToken.name()} borrowRate: ${(await cToken.borrowRatePerBlock()).toBigInt()}`)
		// console.log(`${await cToken.name()} supplyRate: ${(await cToken.supplyRatePerBlock()).toBigInt()}`)
		// console.log(`${await cToken.name()} interest rate model: ${await cToken.interestRateModel()} `)
		// console.log(`${await cToken.name()} totalSupply: ${(await cToken.totalSupply()).toBigInt()}`)
		// console.log(`${await cToken.name()} totalBorrows: ${(await cToken.totalBorrows()).toBigInt()}`)
		// console.log(`${await cToken.name()} totalReserves: ${(await cToken.totalReserves()).toBigInt()}`)
		// console.log(`${await cToken.name()} getCash: ${(await cToken.getCash()).toBigInt()}`)
		// console.log(`${await cToken.name()} exchangeRate: ${(await cToken.exchangeRateStored()).toBigInt()}`)
		// console.log(`${await cToken.name()} getCash: ${(await cToken.getCash()).toBigInt()}`)
		// console.log(`${await cToken.name()} current price; ${(await router.getUnderlyingPrice(tokenAddr)).toBigInt()}`)
		console.log(`${await cToken.name()} contract address: ${tokenAddr}`)
		console.log(`\n\n`)
	}


}

  

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});