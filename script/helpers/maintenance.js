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

	console.log(`Comptroller liquidation incentive: ${(await comptroller.liquidationIncentiveMantissa()).toBigInt()}`)
	console.log(`Comptroller close Factor: ${(await comptroller.closeFactorMantissa()).toBigInt()}`)

	let cCanto = await ethers.getContractAt("CEther", CCANTO_ADDRESS)
	let cEther = await ethers.getContractAt("CErc20", CETH_ADDRESS)
	
	console.log(`cCanto totalsupply: ${(await cCanto.totalSupply()).toBigInt()}`)	
	console.log(`cCanto totalBorrows: ${(await cCanto.totalBorrows()).toBigInt()}`)
	
	// comptroller markets data
	for (var i = 0; i < 11; i++) {
		let tokenAddr = await comptroller.allMarkets(i)
		let cToken = await ethers.getContractAt("CToken", tokenAddr)
		console.log(`${await cToken.name()} symbol: ${await cToken.symbol()}`)
		console.log(`${await cToken.name()} decimals: ${await cToken.decimals()}`)
		console.log(`${await cToken.name()} market: ${await comptroller.markets(tokenAddr)}`)
		console.log(`${await cToken.name()} supplySpeed: ${(await comptroller.compSupplySpeeds(tokenAddr)).toBigInt()}`)
		console.log(`${await cToken.name()} borrowSpeed: ${(await comptroller.compBorrowSpeeds(tokenAddr)).toBigInt()}`)
		console.log(`${await cToken.name()} interest rate model: ${await cToken.interestRateModel()} `)
		console.log(`${await cToken.name()} totalSupply: ${(await cToken.totalSupply()).toBigInt()}`)
		console.log(`${await cToken.name()} totalBorrows: ${(await cToken.totalBorrows()).toBigInt()}`)
		console.log(`${await cToken.name()} exchangeRate: ${(await cToken.exchangeRateStored()).toBigInt()}`)
		console.log(`\n\n`)
	}

	// check addresses of pairs
	let factory = await ethers.getContract("BaseV1Factory")
	let router = await ethers.getContract("BaseV1Router01")
	
	let note = await deployments.get("Note")

	console.log(`router comptroller address: ${await router.Comptroller()} deployment: ${comptroller.address}`)
	console.log(`router note address: ${await router.note()} deployment: ${note.address}`)
	console.log(`router wcanto address: ${await router.wcanto()} deployment: ${WETH_ADDRESS}`)
	console.log(`router usdc stable: ${await router.isStable(USDC_ADDRESS)}`)
	console.log(`router usdt stable: ${await router.isStable(USDT_ADDRESS)}`)


	let allPairsLength = (await factory.allPairsLength()).toBigInt()
	for (var i = 0; i < allPairsLength; i++) {
		let pairAddr = await factory.allPairs(i);
		let pair = await ethers.getContractAt("BaseV1Pair", pairAddr)
		console.log(`${await pair.name()} symbol: ${await pair.symbol()}`)
		console.log(`${await pair.name()} token0: ${await pair.token0()}`)
		console.log(`${await pair.name()} token1: ${await pair.token1()}`)
		console.log(`${await pair.name()} stable" ${await pair.stable()}`)
		console.log(`${await pair.name()} periodSize: ${await pair.periodSize()}`)		
	}
}

  

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});