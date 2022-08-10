import {ethers, deployments} from "hardhat";
import {Contract} from "ethers";

async function main() { 
  const [dep] = await ethers.getSigners();
  let governorDelegator = await deployments.get("GovernorBravoDelegator")
  let governorDelegate = await deployments.get("GovernorBravoDelegate")
  let timelock = await ethers.getContract("Timelock")
  let treasuryDelegator = await deployments.get("TreasuryDelegator")
  let treasuryDelegate = await deployments.get("TreasuryDelegate")

  
  let noteRate = await ethers.getContract("NoteRateModel")
  let factory = await ethers.getContract("BaseV1Factory")
  let router = await ethers.getContract("BaseV1Router01")

  //instantiate delegators
  let governor = getDelegator(governorDelegate, governorDelegator, dep)
  let treasury = getDelegator(treasuryDelegate, treasuryDelegator, dep)

  //set pending admins of contracts
  await (await governor._setPendingAdmin(timelock.address)).wait()
  console.log("Governor Pending Admin: ", await governor.pendingAdmin());
  console.log("Governor Prior Admin: ", await governor.admin())

  await (await treasury._setPendingAdmin(timelock.address)).wait()
  console.log("Treasury Pending Admin: ", await treasury.pendingAdmin());
  console.log("Treasury Prior Admin: ", await treasury.admin())

  //queue GovShuttle Proposal
  await (await governor.queue(7)).wait()
  await delay(100 * 1000) // await 100 secs, delay in timelock is 60 secs
  await (await governor.execute(7)).wait()


  console.log("Governor Admin: ", await governor.admin())
  console.log("Treasury Admin: ", await treasury.admin())
}   	    

export function delay(ms: number) {
  return new Promise( timeOut => setTimeout(timeOut, ms))
}

export function getDelegator(delegate: any, delegator: any, dep: any): any {
  return new ethers.Contract(
      delegator.address,
      delegate.abi, 
      dep
  )
}


main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});