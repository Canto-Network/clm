const { deployments } = require("hardhat");
const {canto} = require("../../config/index");


async function main() { 
  [dep] = await ethers.getSigners();

  let govDelegate = await deployments.get("GovernorBravoDelegate")
  let govDelegator = await deployments.get("GovernorBravoDelegator")
  let treasury = await ethers.getContract("TreasuryDelegator")
  let reservoir = await ethers.getContract("Reservoir")
  let weth = await ethers.getContract("WETH")

  let governor = new ethers.Contract(
    govDelegator.address,
    govDelegate.abi,
    dep
  )

  console.log("Treasury ADdress: ", treasury.address)
  console.log(`Treasury admin: ${await treasury.pendingAdmin()}`)
  console.log(`Treasury Balance ${(await ethers.provider.getBalance(treasury.address)).toBigInt()}`)

  //queue GovShuttle Proposal
  await (await governor.queue(3)).wait()
  await new Promise( timeOut => setTimeout(timeOut, 100 * 1000)) // await 100 secs, delay in timelock is 60 secs
  await (await governor.execute(3)).wait()  //queue GovShuttle Proposal

  console.log(`Reservoir weth balance ${(await weth.balanceOf(reservoir.address)).toBigInt()}`)
}     

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});