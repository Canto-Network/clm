import {ethers, deployments} from "hardhat";
import {Contract} from "ethers";

async function main() { 
    const [dep] = await ethers.getSigners();
    // instantiate governance contracts
    let governorDelegator = await deployments.get("GovernorBravoDelegator")
    let governorDelegate = await deployments.get("GovernorBravoDelegate")
    let timelock = await ethers.getContract("Timelock")
    let unitroller = await ethers.getContractAt("Comptroller", (await deployments.get("Unitroller")).address)
    let treasury = await ethers.getContract("TreasuryDelegator")
    let reservoir = await ethers.getContractAt("Reservoir", "0xF55b9a38a7937f6554d67bAF7a1aeA7eAF3509CA")
    let wcanto = await ethers.getContractAt("WETH", "0x826551890Dc65655a0Aceca109aB11AbDbD7a07B")
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
    console.log(`treasury canto balance: ${(await ethers.provider.getBalance(treasury.address))}`)
    console.log(`Reservoir wcanto balance: ${(await wcanto.balanceOf(reservoir.address)).toBigInt()}`)

    //queue GovShuttle Proposal
    // await (await governor.queue(18)).wait()
    // console.log(`proposal actions: ${await governor.getActions(18)}`)
    // await delay(100 * 1000)
    // await (await governor.execute(18)).wait()

    console.log(`treasury canto balance: ${(await ethers.provider.getBalance(treasury.address))}`)
    console.log(`Reservoir wcanto balance: ${(await wcanto.balanceOf(reservoir.address)).toBigInt()}`)

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