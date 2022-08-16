import {ethers, deployments} from "hardhat";
import {Contract} from "ethers";

let CETH_ADDRESS = "0x4069803F7065e81F16FEb502d1624E866D3ee73b"
let CCANTO_ADDRESS = "0xC5cfB37851E78C65a89de90e6488289F2d8A4380"

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
  let cEth = await ethers.getContractAt("CErc20", CETH_ADDRESS)
  let cNote = await ethers.getContract("CNoteDelegator")
  let cCanto = await ethers.getContractAt("CEther", CCANTO_ADDRESS)
  let cUsdt = await ethers.getContract("CUsdtDelegator")

  let tokens : Contract[] = [cAtom, cUsdc, cUsdt, cEth, cNote, cCanto]


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
  console.log(`auxiliary admin set`)

  //queue GovShuttle Proposal
  await (await governor.queue(2)).wait()
  await delay(100 * 1000) // await 100 secs, delay in timelock is 60 secs
  await (await governor.execute(2)).wait()


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