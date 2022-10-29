import {ethers, deployments} from "hardhat";
import {Contract} from "ethers";

async function main() {
  
    const [dep] = await ethers.getSigners();
    // instantiate governance contracts
    let governorDelegator = await deployments.get("GovernorBravoDelegator")
    let governorDelegate = await deployments.get("GovernorBravoDelegate")
    let timelock = await ethers.getContract("Timelock")

    let unitroller = await ethers.getContract("Unitroller")
    let treasury = await ethers.getContract("TreasuryDelegator")  
    await (await unitroller._setPendingAdmin(timelock.address)).wait()
    await (await treasury._setPendingAdmin(timelock.address)).wait()

    console.log(`unitroller: ${unitroller.address}: pending admin: ${await unitroller.pendingAdmin()}`)
    console.log(`treasury: ${treasury.address}: pending admin: ${await treasury.pendingAdmin()}`)

    //instantiate delegators
    let governor = getDelegator(governorDelegate, governorDelegator, dep)
    //queue GovShuttle Proposal
    // await (await governor.queue(2)).wait()
    console.log("proposal: ", (await governor.getActions(2)))
    await delay(100 * 1000) // await 100 secs, delay in timelock is 60 secs
    await (await governor.execute(2)).wait()

    console.log(`Treasury admin: ${await treasury.admin()}`)
    console.log(`comptroller admin: ${await unitroller.admin()}`)

    return
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