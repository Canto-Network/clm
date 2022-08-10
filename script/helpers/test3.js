const { ethers } = require("hardhat");


const USDC_ADDRESS = "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd"
const ATOM_ADDRESS = "0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687"

async function main() { 
[dep] = await ethers.getSigners();

// These contracts are the erc20 representations of native cosmos-sdk coins
let USDC = await ethers.getContractAt("ERC20", USDC_ADDRESS)
let ATOM = await ethers.getContractAt("ERC20", ATOM_ADDRESS)


comptroller = new ethers.Contract(
    (await deployments.get("Unitroller")).address,
    (await deployments.get("Comptroller")).abi,
    dep 
);
const cUsdc = await ethers.getContract("CUsdcDelegator");
const cAtom = await ethers.getContract("CAtomDelegator")


let mintBal = ethers.utils.parseUnits("1000000", "6")
let ethMintBal = ethers.utils.parseUnits("1000", "18")

await (await USDC.approve(cUsdc.address, mintBal)).wait()
await (await ATOM.approve(cAtom.address, mintBal)).wait()

// redeem usdc
console.log(`usdc balance before redeem: ${(await USDC.balanceOf(dep.address)).toBigInt()}`)
await (await cUsdc.redeemUnderlying(mintBal)).wait()
console.log(`usdc balance after redeem: ${(await USDC.balanceOf(dep.address)).toBigInt()}`)


// redeem atom
console.log(`deployer cToken balance: ${(await ATOM.balanceOf(dep.address)).toBigInt()}`)
await (await cAtom.redeemUnderlying(mintBal)).wait()
console.log(`deployer cToken balance: ${(await ATOM.balanceOf(dep.address)).toBigInt()}`)
}
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});