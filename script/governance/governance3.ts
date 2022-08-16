import {ethers, deployments} from "hardhat";
import {Contract} from "ethers";

async function main() { 
    const [dep] = await ethers.getSigners();
    // instantiate governance contracts
    let governorDelegator = await deployments.get("GovernorBravoDelegator")
    let governorDelegate = await deployments.get("GovernorBravoDelegate")
    let timelock = await ethers.getContract("Timelock")
    let unitroller = await ethers.getContractAt("Comptroller", (await deployments.get("Unitroller")).address)
    // lpTokens
    let cUsdc = await ethers.getContract("CUsdcDelegator")
    let cUsdt = await ethers.getContract("CUsdtDelegator")
    let cNoteUsdc = await ethers.getContract("CNoteUsdcDelegator")
    let cNoteUsdt = await ethers.getContract("CNoteUsdtDelegator")
    let cCantoNote = await ethers.getContract("CCantoNoteDelegator")
    let cCantoAtom = await ethers.getContract("CCantoAtomDelegator")
    let cCantoEth = await ethers.getContract("CCantoEthDelegator")
    let tokens : Contract[] = [cUsdc, cUsdt, cNoteUsdc, cNoteUsdt, cCantoAtom, cCantoEth,cCantoNote]

    //instantiate delegators
    let governor = getDelegator(governorDelegate, governorDelegator, dep)


    //queue GovShuttle Proposal
    await (await governor.queue(13)).wait()
    await delay(100 * 1000) // await 100 secs, delay in timelock is 60 secs
    await (await governor.execute(13)).wait()

    for (var token of tokens){
    // print updated admins of tokens
        console.log(`${await token.name()}: supply speed: ${(await unitroller.compSupplySpeeds(token.address)).toBigInt()} borrow speed: ${(await unitroller.compBorrowSpeeds(token.address))}`)
    }
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