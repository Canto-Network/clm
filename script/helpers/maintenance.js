const {ethers} = require("hardhat");
const {canto} = require("../../config/index");

const CCANTO_ADDRESS = "0xB65Ec550ff356EcA6150F733bA9B954b2e0Ca488"
const CETH_ADDRESS = "0x830b9849e7d79b92408a86a557e7baaacbec6030"

const USDC_ADDRESS = "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd"
const USDT_ADDRESS = "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75"
const WETH_ADDRESS = '0x826551890Dc65655a0Aceca109aB11AbDbD7a07B'

async function main() { 
	const [dep] = await ethers.getSigners();

	//check Comptroller parameters
	let comptroller = new ethers.Contract(
		(await deployments.get("Unitroller")).address,
		(await deployments.get("Comptroller")).abi,
		dep
	)

	let weth = await ethers.getContractAt("WETH", "0x826551890Dc65655a0Aceca109aB11AbDbD7a07B")
	let reservoir = await ethers.getContract("Reservoir")
	let timelock = await ethers.getContract("Timelock")
	console.log(`Comptroller liquidation incentive: ${(await comptroller.liquidationIncentiveMantissa()).toBigInt()}`)
	console.log(`Comptroller close Factor: ${(await comptroller.closeFactorMantissa()).toBigInt()}`)

	console.log(`Unitroller address: ${(await deployments.get("Unitroller")).address}`)
	console.log(`GovernorBravoDelegator: ${(await deployments.get("GovernorBravoDelegator")).address}`)
	console.log(`Accountant Delegator: ${(await deployments.get("AccountantDelegator")).address}`)
	console.log(`Treasury Delegator: ${(await deployments.get("TreasuryDelegator")).address}`)
	console.log(`Timelock: ${(await timelock.delay()).toBigInt()}`)
	console.log(`Comptroller WCANTO balance: ${(await weth.balanceOf(comptroller.address)).toBigInt()}`)
	console.log(`Reservoir Wcanto balance: ${(await weth.balanceOf(reservoir.address)).toBigInt()}`)

	let cCanto = await ethers.getContractAt("CEther", CCANTO_ADDRESS)
	let cEther = await ethers.getContractAt("CErc20", CETH_ADDRESS)
		

	console.log(`cCanto totalsupply: ${(await cCanto.totalSupply()).toBigInt()}`)	
	console.log(`cCanto totalBorrows: ${(await cCanto.totalBorrows()).toBigInt()}`)
	
	console.log(`Note: ${(await deployments.get("Note")).address}`)
	let router = await ethers.getContract("BaseV1Router01")
		
	console.log(`comptroller weth balance: ${(await weth.balanceOf(comptroller.address)).toBigInt()} at ${comptroller.address}`)
	console.log(`Reservoir weth balance: ${(await weth.balanceOf(reservoir.address)).toBigInt()} at ${reservoir.address}`)

	// comptroller markets data
	for (var i = 0; i < 11; i++) {
		let tokenAddr = await comptroller.allMarkets(i)
		let cToken = await ethers.getContractAt("CToken", tokenAddr)
		console.log(`${await cToken.name()} symbol: ${await cToken.symbol()}`)
		console.log(`${await cToken.name()} decimals: ${await cToken.decimals()}`)
		console.log(`${await cToken.name()} market: ${await comptroller.markets(tokenAddr)}`)
		console.log(`${await cToken.name()} supplySpeed: ${(await comptroller.compSupplySpeeds(tokenAddr)).toBigInt()}`)
		console.log(`${await cToken.name()} borrowSpeed: ${(await comptroller.compBorrowSpeeds(tokenAddr)).toBigInt()}`)
		console.log(`${await cToken.name()} borrowRate: ${(await cToken.borrowRatePerBlock()).toBigInt()}`)
		console.log(`${await cToken.name()} supplyRate: ${(await cToken.supplyRatePerBlock()).toBigInt()}`)
		console.log(`${await cToken.name()} interest rate model: ${await cToken.interestRateModel()} `)
		console.log(`${await cToken.name()} totalSupply: ${(await cToken.totalSupply()).toBigInt()}`)
		console.log(`${await cToken.name()} totalBorrows: ${(await cToken.totalBorrows()).toBigInt()}`)
		console.log(`${await cToken.name()} totalReserves: ${(await cToken.totalReserves()).toBigInt()}`)
		console.log(`${await cToken.name()} getCash: ${(await cToken.getCash()).toBigInt()}`)
		console.log(`${await cToken.name()} exchangeRate: ${(await cToken.exchangeRateStored()).toBigInt()}`)
		console.log(`${await cToken.name()} getCash: ${(await cToken.getCash()).toBigInt()}`)
		console.log(`${await cToken.name()} current price; ${(await router.getUnderlyingPrice(tokenAddr)).toBigInt()}`)
		console.log(`${await cToken.name()} contract address: ${tokenAddr}`)
		console.log(`\n\n`)
	}

	// check addresses of pairs
	let factory = await ethers.getContract("BaseV1Factory")
	
	let note = await deployments.get("Note")

	console.log(`router comptroller address: ${await router.Comptroller()} deployment: ${comptroller.address}`)
	console.log(`router note address: ${await router.note()} deployment: ${note.address}`)
	console.log(`router wcanto address: ${await router.wcanto()} deployment: ${WETH_ADDRESS}`)
	console.log(`router usdc stable: ${await router.isStable(USDC_ADDRESS)}`)
	console.log(`router usdt stable: ${await router.isStable(USDT_ADDRESS)}`)
	console.log("router address: ", router.address)
	console.log(`factory: ${await router.factory()}`)

	let allPairsLength = (await factory.allPairsLength()).toBigInt()
	for (var i = 0; i < allPairsLength; i++) {
		let pairAddr = await factory.allPairs(i);

		let pair = await ethers.getContractAt("BaseV1Pair", pairAddr)
		console.log(`${await pair.name()} symbol: ${await pair.symbol()}`)
		console.log(`${await pair.name()} token0: ${await pair.token0()}`)
		console.log(`${await pair.name()} token1: ${await pair.token1()}`)
		console.log(`${await pair.name()} totalSupply: ${(await pair.totalSupply()).toBigInt()}`)
		console.log(`${await pair.name()} reserves0: ${(await pair.reserve0()).toBigInt()}`)
		console.log(`${await pair.name()} reserves1: ${(await pair.reserve1()).toBigInt()}`)
		console.log(`${await pair.name()} stable" ${await pair.stable()}`)
		console.log(`${await pair.name()} periodSize: ${await pair.periodSize()}`)		
		console.log(`${await pair.name()} address: ${pairAddr}`)
		console.log(`${await pair.name()} observationLength: ${await pair.observationLength()}`)
	}
}

  

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});