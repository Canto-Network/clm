import {ethers, deployments} from "hardhat";
import {canto} from "../../config/index.js";

const USDC_ADDRESS = "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd"
const ETH_ADDRESS = "0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687"
const ATOM_ADDRESS = "0xecEEEfCEE421D8062EF8d6b4D814efe4dc898265"
const USDT_ADDRESS = "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75"
const WETH_ADDR = "0x826551890Dc65655a0Aceca109aB11AbDbD7a07B"

const noteUsdc = "0x9571997a66D63958e1B3De9647C22bD6b9e7228c" // 0x9571997a66D63958e1B3De9647C22bD6b9e7228c
const noteCanto = "0x1D20635535307208919f0b67c3B2065965A85aA9" //0x1D20635535307208919f0b67c3B2065965A85aA9
const noteUsdt = "0x35DB1f3a6A6F07f82C76fCC415dB6cFB1a7df833" // 0x35DB1f3a6A6F07f82C76fCC415dB6cFB1a7df833
const cantoETH = "0x216400ba362d8FCE640085755e47075109718C8B" // 0x216400ba362d8FCE640085755e47075109718C8B
const cantoAtom = "0x30838619C55B787BafC3A4cD9aEa851C1cfB7b19" // 0x30838619C55B787BafC3A4cD9aEa851C1cfB7b19

async function main() { 
	const [dep] = await ethers.getSigners();

  let comptroller = new ethers.Contract(
    (await deployments.get("Unitroller")).address,
    (await deployments.get("Comptroller")).abi,
    dep
  )
  
  let factory = await ethers.getContract("BaseV1Factory")
  let router = await ethers.getContract("BaseV1Router01")

  if (router.address != "0xa252eEE9BDe830Ca4793F054B506587027825a8e") { 
    return process.exit(1)
  }

  let note = await ethers.getContract("Note")
  if (note.address != "0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503") {
    return process.exit(1)
  }
    
  let weth = await ethers.getContractAt("WETH", WETH_ADDR)
    
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
  console.log(`WCANTO BALANCE: ${(await weth.balanceOf(dep.address)).toBigInt()}`)
  console.log( `Note balance: ${(await note.balanceOf(dep.address)).toBigInt()}`)
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
  console.log(`Note USDC Swap Made`)
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
  console.log(`Note USDT swap made`)

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
  console.log(`Canto ETh swap made`)
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
  console.log(`Canto Note swap made`)
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