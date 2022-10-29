const { BigNumber } = require("ethers");
const { formatUnits } = require("ethers/lib/utils");

async function main() {
  let cNote = await ethers.getContract("CNoteDelegator");
  let cCanto = await ethers.getContract("CCanto");
  let cAtom = await ethers.getContract("CAtomDelegator");
  let cEth = await ethers.getContract("CETHDelegator");
  let cUsdc = await ethers.getContract("CUsdcDelegator");
  let cUsdt = await ethers.getContract("CUsdtDelegator");
  const oracle = await ethers.getContract("BaseV1Router01");


  const cTokens = [cNote, cCanto, cAtom, cEth, cUsdc, cUsdt];
  for (var cToken of cTokens) {
    await getPrice(await cToken.name(), cToken.address, oracle, await cToken.decimals());
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
