import {ethers, deployments} from "hardhat";
import {Contract} from "ethers";

async function main() {
  
const [dep] = await ethers.getSigners();
// instantiate governance contracts
let governorDelegator = await deployments.get("GovernorBravoDelegator")
let governorDelegate = await deployments.get("GovernorBravoDelegate")
let timelock = await ethers.getContract("Timelock")

// lpTokens
let cCantoNote = await ethers.getContract("CCantoNoteDelegator")
let cCantoEth = await ethers.getContract("CCantoEthDelegator")
let cCantoAtom = await ethers.getContract("CCantoAtomDelegator")
let cNoteUsdc = await ethers.getContract("CNoteUsdcDelegator")
let cNoteUsdt = await ethers.getContract("CNoteUsdtDelegator")

let tokens : Contract[] = [cCantoNote, cCantoEth, cCantoAtom, cNoteUsdc, cNoteUsdt]

async function setUp() { 
  for (var token of tokens) {
    await (await token._setPendingAdmin(timelock.address)).wait()
    let name = await token.name()
    console.log(`${name} Prior admin: `, await token.admin())
    console.log(`${name} Pending Admin`, await token.pendingAdmin())
  }
  return 
}

//instantiate delegators
let governor = getDelegator(governorDelegate, governorDelegator, dep)
  //queue GovShuttle Proposal
  await (await governor.queue(8)).wait()
  await delay(100 * 1000) // await 100 secs, delay in timelock is 60 secs
  await (await governor.execute(8)).wait()

  for (var token of tokens){
    // print updated admins of tokens
    console.log(`admin of ${await token.name()}: ${await token.admin()}`)
  }

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