const { ethers, deployments } = require("hardhat");
const {canto} = require("../../config/index");

const USDC_ADDRESS = "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd"
const ETH_ADDRESS = "0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687"
const ATOM_ADDRESS = "0xecEEEfCEE421D8062EF8d6b4D814efe4dc898265"
const USDT_ADDRESS = "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75"


const noteUsdc = "0x753eF0D3506D70D8266335C16A5ed7cC71Aa376a"
const noteCanto = "0xF326fFc2Faee43F6f42B120204267F66fc24146C"
const noteUsdt = "0x406376a1ea40cf149A31f6e23638f99900988f46"
const cantoETH = "0x03cD777F7DA9EE2884fc2FD111808467C4Df0203"
const cantoAtom = "0x4C7504dFEe142849d59a96D4A1954eE9c7ea7437"

async function main() { 
	const [dep] = await ethers.getSigners();

  let comptroller = new ethers.Contract(
    (await deployments.get("Unitroller")).address,
    (await deployments.get("Comptroller")).abi,
    dep
  )
    let treasury = await deployments.get("TreasuryDelegator")
    let factory = await ethers.getContract("BaseV1Factory")
    let router = await ethers.getContract("BaseV1Router01")
    let note = await ethers.getContract("Note")
    let weth = await ethers.getContract("WETH")

    let cNote = await ethers.getContract("CNoteDelegator")
    let cUsdc = await ethers.getContract("CUsdcDelegator")
    let cCanto = await ethers.getContract("CCanto")
    let cCantoNote = await ethers.getContract("CCantoNoteDelegator")
    let cNoteUsdc = await ethers.getContract("CNoteUsdcDelegator")
    let cNoteUsdt = await ethers.getContract("CNoteUsdtDelegator")
    let cCantoEth = await ethers.getContract("CCantoEthDelegator")

    let cantonote = await factory.getPair(weth.address, note.address, false)
    let cantoNote = await ethers.getContractAt("BaseV1Pair", cantonote)


    // console.log("canto price: ", (await router.getUnderlyingPrice(cCanto.address)).toBigInt())
    console.log("canto/note price: ", (await router.getUnderlyingPrice(cCantoNote.address)).toBigInt())
    console.log("totalSupply: ", (await cantoNote.totalSupply()).toBigInt())
    console.log("reserve0: ", (await cantoNote.reserve0()).toBigInt())
    console.log("reserve1: ", (await cantoNote.reserve1()).toBigInt())
    console.log("token0: ", (await cantoNote.token0()))
    console.log("token1: ", (await cantoNote.token1()))
    console.log("last observation: ", await cantoNote.lastObservation())
    console.log("reserves samples; ", await cantoNote.sampleReserves(8,1))
    console.log("sample supply: ", )
    // console.log("note/usdc price: ", (await router.getUnderlyingPrice(cNoteUsdc.address)).toBigInt())
    // console.log("NoteUsdt price: ", (await router.getUnderlyingPrice(cNoteUsdt.address)).toBigInt())
    // console.log("canto / eth price: ", (await router.getUnderlyingPrice(cCantoEth.address)).toBigInt())
}   
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});