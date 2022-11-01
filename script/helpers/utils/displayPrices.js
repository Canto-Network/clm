const { BigNumber } = require("ethers");
const { formatUnits } = require("ethers/lib/utils");
const { ethers, deployments } = require("hardhat");

async function main() {
  const [dep] = await ethers.getSigners();

  let cNote = await ethers.getContract("CNoteDelegator");
  let cCanto = await ethers.getContract("CCanto");
  let cAtom = await ethers.getContract("CAtomDelegator");
  let cEth = await ethers.getContract("CETHDelegator");
  let cUsdc = await ethers.getContract("CUsdcDelegator");
  let cUsdt = await ethers.getContract("CUsdtDelegator");
  const oracle = await ethers.getContract("CLMPriceOracle");
  const CLMOracle = new ethers.Contract(
    (await deployments.get("Unitroller")).address,
    (await deployments.get("Comptroller")).abi,
    dep
  )

console.log(await 
  oracle.router())
  const cTokens = [cNote, cCanto, cAtom, cEth, cUsdc, cUsdt];
  for (var cToken of cTokens) {
    await getPrice(await cToken.name(), cToken.address, CLMOracle, await cToken.decimals());
  }
}
async function getPrice(tokenName, cTokenAddress, oracle, decimals) {
    const price = formatUnits((await oracle.getUnderlyingPrice(cTokenAddress)).div(BigNumber.from(10).pow(18-decimals)))
  console.log(
    "price of " +
      tokenName +
      ": " +
      price
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
