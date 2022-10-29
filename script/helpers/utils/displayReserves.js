const { BigNumber } = require("ethers");
const { formatUnits } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { testAddresses } = require("./testAddresses");

async function main() {
  const Note = await ethers.getContract("Note");
  const USDC = await ethers.getContractAt("ERC20", testAddresses.USDC);
  const USDT = await ethers.getContractAt("ERC20", testAddresses.USDT);
  const ATOM = await ethers.getContractAt("ERC20", testAddresses.ATOM);
  const ETH = await ethers.getContractAt("ERC20", testAddresses.ETH);
  const WETH = await ethers.getContract("WETH");
  const oracle = await ethers.getContract("BaseV1Router01");
  let cCantoNote = await ethers.getContract("CCantoNoteDelegator");
  let cCantoEth = await ethers.getContract("CCantoEthDelegator");
  let cCantoAtom = await ethers.getContract("CCantoAtomDelegator");
  let cNoteUsdt = await ethers.getContract("CNoteUsdtDelegator");
  let cNoteUsdc = await ethers.getContract("CNoteUsdcDelegator");

    //displaying reserves
    console.log("cantoETH: ", await oracle.getReserves(WETH.address, ETH.address, false))
    console.log("cantoATOM: ", await oracle.getReserves(WETH.address, ATOM.address, false))
    console.log("cantoNote: ", await oracle.getReserves(WETH.address, Note.address, false))
    console.log("noteUSDC: ", await oracle.getReserves(Note.address, USDC.address, true))
    console.log("noteUSDT: ", await oracle.getReserves(Note.address, USDT.address, true))

  const cTokens = [cCantoNote, cCantoEth, cCantoAtom, cNoteUsdc, cNoteUsdt];
  for (var cToken of cTokens) {
    await getPrice(
      await cToken.name(),
      cToken.address,
      oracle,
      await cToken.decimals()
    );
  }
}
async function getPrice(tokenName, cTokenAddress, oracle, decimals) {
  const price = formatUnits(
    (await oracle.getUnderlyingPrice(cTokenAddress)).div(
      BigNumber.from(10).pow(18 - decimals)
    )
  );
  console.log("price of " + tokenName + ": " + price);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
