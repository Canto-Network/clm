import {ethers, deployments} from "hardhat";
import {canto} from "../../config/index.js";

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
  
  let factory = await ethers.getContract("BaseV1Factory")
  let router = await ethers.getContract("BaseV1Router01")
  let note = await ethers.getContract("Note")
  let weth = await ethers.getContract("WETH")
    
  let cNote = await ethers.getContract("CNoteDelegator")
  let cUsdt = await ethers.getContract("CUsdtDelegator")

  console.log(`note address: ${note.address}`)
  // instantiate tokens
  let usdc = await ethers.getContractAt("ERC20", USDC_ADDRESS)
  let usdt = await ethers.getContractAt("ERC20", USDT_ADDRESS)
  let eth = await ethers.getContractAt("ERC20", ETH_ADDRESS)
  let atom = await ethers.getContractAt("ERC20", ATOM_ADDRESS)

  //retrieve balances of convert-coin tokens
  console.log(`USDC balance: ${(await usdc.balanceOf(dep.address)).toBigInt()}`)
  console.log(`USDT balance: ${(await usdt.balanceOf(dep.address)).toBigInt()}`)
  console.log(`ETH balance: ${(await eth.balanceOf(dep.address)).toBigInt()}`)
  
  // swap note <--> usdc 
  // approve transfer before swap
  await (await note.approve(router.address, ethers.utils.parseUnits("1", "18"))).wait()
  await (await usdc.approve(router.address, ethers.utils.parseUnits("1", "18"))).wait()

  await (await router.swapExactTokensForTokensSimple(
    ethers.utils.parseUnits("1", "13"), 
    0, 
    note.address, //token from
    usdc.address, //token to
    true, 
    dep.address,
    9999999999999
  )).wait();

  //swap note <--> usdt 
  //approve transfer before swap
  await (await note.approve(router.address, ethers.utils.parseUnits("1", "18"))).wait()
  await (await usdt.approve(router.address, ethers.utils.parseUnits("1", "18"))).wait()

  await (await router.swapExactTokensForTokensSimple(
    ethers.utils.parseUnits("1", "13"), 
    0, 
    note.address, //token from
    usdt.address, //token to
    true, 
    dep.address,
    9999999999999
  )).wait();


  //swap canto <--> eth
  //approve transfer before swap
  await (await weth.approve(router.address, ethers.utils.parseUnits("1", "18"))).wait()
  await (await eth.approve(router.address, ethers.utils.parseUnits("1", "18"))).wait()

  await (await router.swapExactTokensForTokensSimple(
    ethers.utils.parseUnits("1", "13"), 
    0, 
    weth.address, //token from
    eth.address, //token to
    false, 
    dep.address,
    9999999999999
  )).wait();

  //swap canto <--> note
  //approve transfer before swap
  await (await weth.approve(router.address, ethers.utils.parseUnits("1", "18"))).wait()
  await (await note.approve(router.address, ethers.utils.parseUnits("1", "18"))).wait()

  await (await router.swapExactTokensForTokensSimple(
    ethers.utils.parseUnits("1", "13"), 
    0, 
    weth.address, //token from
    note.address, //token to
    false, 
    dep.address,
    9999999999999
  )).wait();

  //swap canto <---> atom
  //approve transfer before swap
  await (await weth.approve(router.address, ethers.utils.parseUnits("1", "18"))).wait()
  await (await note.approve(router.address, ethers.utils.parseUnits("1", "18"))).wait()

  await (await router.swapExactTokensForTokensSimple(
    ethers.utils.parseUnits("1", "16"), 
    0, 
    weth.address, //token from
    atom.address, //token to
    false, 
    dep.address,
    9999999999999
  )).wait();

  console.log(`swaps finished`)

  let noteUsdcAddr = await factory.getPair(note.address, usdc.address, true)
  let noteUsdtAddr = await factory.getPair(note.address, usdt.address, true)
  let cantoEthAddr = await factory.getPair(weth.address, eth.address, false)
  let cantoNoteAddr = await factory.getPair(weth.address, note.address, false)
  let cantoAtomAddr = await factory.getPair(weth.address, atom.address, false)

  let tokens = [noteUsdcAddr, noteUsdtAddr, cantoEthAddr, cantoNoteAddr, cantoAtomAddr]

  for (var token of tokens) {
    let pair = await ethers.getContractAt("BaseV1Pair", token)
    let obs = await pair.observationLength()
    console.log(`observation length of pair ${await pair.name()}: ${obs}`)
    console.log(`pair: ${await pair.name()} reserve0: ${(await pair.reserve0()).toBigInt()} reserve1: ${(await pair.reserve1()).toBigInt()}`)
  }
}       	

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});