import {ethers, deployments} from "hardhat";
import {Contract} from "ethers";

let CETH_ADDRESS = "0x830b9849E7D79B92408a86A557e7baAACBeC6030"
let CCANTO_ADDRESS = "0xB65Ec550ff356EcA6150F733bA9B954b2e0Ca488"

async function main() {
  const [dep] = await ethers.getSigners();
  let governorDelegator = await deployments.get("GovernorBravoDelegator")
  let governorDelegate = await deployments.get("GovernorBravoDelegate")
  let timelock = await ethers.getContract("Timelock")
  let treasuryDelegator = await deployments.get("TreasuryDelegator")
  let treasuryDelegate = await deployments.get("TreasuryDelegate")
  let accountantDelegator = await deployments.get("AccountantDelegator")
  let accountantDelegate = await deployments.get("AccountantDelegate")
  
  let comptrollerDelegate = await deployments.get("Comptroller")
  let comptrollerDelegator = await deployments.get("Unitroller")

  let noteRate = await ethers.getContract("NoteRateModel")
  let factory = await ethers.getContract("BaseV1Factory")
  let router = await ethers.getContract("BaseV1Router01")
  
  //cTokens
  let cAtom = await ethers.getContract("CAtomDelegator")
  let cUsdc = await ethers.getContract("CUsdcDelegator")
  let cEth = await ethers.getContractAt("CErc20", CETH_ADDRESS)
  let cNote = await ethers.getContract("CNoteDelegator")
  let cCanto = await ethers.getContractAt("CEther", CCANTO_ADDRESS)
  let cUsdt = await ethers.getContract("CUsdtDelegator")
  
  let tokens : Contract[] = [cAtom, cUsdc, cUsdt, cEth, cNote, cCanto]

  let governor = getDelegator(governorDelegate, governorDelegator, dep)
  let treasury = getDelegator(treasuryDelegate, treasuryDelegator, dep)
  let accountant = getDelegator(accountantDelegate, accountantDelegator, dep)
  let unitroller = getDelegator(comptrollerDelegate, comptrollerDelegator, dep)


  //queue GovShuttle Proposal
  await (await governor.queue(7)).wait()
  await delay(100 * 1000) // await 100 secs, delay in timelock is 60 secs
  await (await governor.execute(7)).wait()


  console.log("Governor Admin: ", await governor.admin())
  console.log("Treasury Admin: ", await treasury.admin())
  console.log("Accountant Admin: ", await accountant.admin())
  console.log("Unitroller Admin: ", await unitroller.admin())
  for (var token of tokens){
    // print updated admins of tokens
    console.log(`admin of ${await token.name()}: ${await token.admin()}`)
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