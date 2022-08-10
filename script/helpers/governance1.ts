import {ethers, deployments} from "hardhat";
import {Contract} from "ethers";

async function main() { 
  const [dep] = await ethers.getSigners();
  let governorDelegator = await deployments.get("GovernorBravoDelegator")
  let governorDelegate = await deployments.get("GovernorBravoDelegate")
  let timelock = await ethers.getContract("Timelock")
  let treasuryDelegator = await deployments.get("TreasuryDelegator")
  let treasuryDelegate = await deployments.get("TreasuryDelegate")
  let accountantDelegator = await deployments.get("AccountantDelegator")
  let accountantDelegate = await deployments.get("AccountantDelegate")
  
  let noteRate = await ethers.getContract("NoteRateModel")
  let factory = await ethers.getContract("BaseV1Factory")
  let router = await ethers.getContract("BaseV1Router01")

  //cTokens
  let cAtom = await ethers.getContract("CAtomDelegator")
  let cUsdc = await ethers.getContract("CUsdcDelegator")
  let cEth = await ethers.getContract("CETHDelegator")
  let cNote = await ethers.getContract("CNoteDelegator")
  let cCanto = await ethers.getContract("CCanto")
  let cCantoNote = await ethers.getContract("CCantoNoteDelegator")
  let cCantoEth = await ethers.getContract("CCantoEthDelegator")
  let cCantoAtom = await ethers.getContract("CCantoAtomDelegator")
  let cNoteUsdc = await ethers.getContract("CNoteUsdcDelegator")
  let cNoteUsdt = await ethers.getContract("CNoteUsdtDelegator")

  let tokens : Contract[] = [cAtom, cUsdc, cEth, cNote, cCanto]


  //instantiate delegators
  let governor = getDelegator(governorDelegate, governorDelegator, dep)
  let treasury = getDelegator(treasuryDelegate, treasuryDelegator, dep)
  let accountant = getDelegator(accountantDelegate, accountantDelegator, dep)
  let unitroller = await ethers.getContract("Unitroller")

  //set pending admins of contracts
  await (await governor._setPendingAdmin(timelock.address)).wait()
  console.log("Governor Pending Admin: ", await governor.pendingAdmin());
  console.log("Governor Prior Admin: ", await governor.admin())

  await (await treasury._setPendingAdmin(timelock.address)).wait()
  console.log("Treasury Pending Admin: ", await treasury.pendingAdmin());
  console.log("Treasury Prior Admin: ", await treasury.admin())
  
  await (await accountant._setPendingAdmin(timelock.address)).wait()
  console.log("Accountant Pending Admin: ", await governor.pendingAdmin());
  console.log("Accountant Prior Admin: ", await accountant.admin())

  await (await unitroller._setPendingAdmin(timelock.address)).wait()
  console.log("Unitroller Pending Admin: ", await unitroller.pendingAdmin());
  console.log("Unitroller Prior Admin: ", await unitroller.admin())

  for (var token of tokens) {
    await (await token._setPendingAdmin(timelock.address)).wait()
    let name = await token.name()
    console.log(`${name} Prior admin: `, await token.admin())
    console.log(`${name} Pending Admin`, await token.pendingAdmin())
  }


  //migrate governance in NoteInterestRateModel
  await (await noteRate.setAdmin(timelock.address)).wait()
  await (await factory.setAdmin(timelock.address)).wait()
  await (await router.setAdmin(timelock.address)).wait()

  //queue GovShuttle Proposal
  await (await governor.queue(1)).wait()
  await delay(100 * 1000) // await 100 secs, delay in timelock is 60 secs
  await (await governor.execute(1)).wait()


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