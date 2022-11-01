const { formatUnits, parseUnits } = require("ethers/lib/utils");
const { ethers, deployments } = require("hardhat");
const { testAddresses } = require("./utils/testAddresses");

async function main() {
  const [dep] = await ethers.getSigners();
  const deployerAddress = dep.address;

  const Note = await ethers.getContract("Note");
  const USDC = await ethers.getContractAt("ERC20", testAddresses.USDC);
  const USDT = await ethers.getContractAt("ERC20", testAddresses.USDT);
  const ATOM = await ethers.getContractAt("ERC20", testAddresses.ATOM);
  const ETH = await ethers.getContractAt("ERC20", testAddresses.ETH);
  const WETH = await ethers.getContract("WETH");

  const tokens = [USDC, Note, USDT, ATOM, ETH, WETH];
  for (var token of tokens) {
    console.log(`${await token.name()}: ${token.address}`);
  }
  let cNote = await ethers.getContract("CNoteDelegator");
  let cCanto = await ethers.getContract("CCanto");
  let cAtom = await ethers.getContract("CAtomDelegator");
  let cEth = await ethers.getContract("CETHDelegator");
  let cUsdc = await ethers.getContract("CUsdcDelegator");
  let cUsdt = await ethers.getContract("CUsdtDelegator");

  const cTokens = [cNote, cCanto, cAtom, cEth, cUsdc, cUsdt];
  for (var cToken of cTokens) {
    console.log(`${await cToken.name()}: ${cToken.address}`);
  }
  const Unitroller = new ethers.Contract(
    (await deployments.get("Unitroller")).address,
    (await deployments.get("Comptroller")).abi,
    dep
  )
  const Reservoir = await ethers.getContract("Reservoir");  
  const oracle = await ethers.getContract("BaseV1Router01");
  const BaseV1Factory = await ethers.getContract("BaseV1Factory")
  const CLMORACLE = await ethers.getContract("CLMPriceOracle")
//   //All variables set
  await ((await BaseV1Factory.setPeriodSize(0)).wait());

//   //borrow Note
//   await (await Unitroller._supportMarket(cUsdc.address)).wait();
//   (await Unitroller.enterMarkets([cUsdc.address])).wait();
//   await (await Unitroller._supportMarket(cNote.address)).wait();
//   await (await Unitroller._setCollateralFactor(cUsdc.address, parseUnits("0.5"))).wait();
//   await (await USDC.approve(cUsdc.address, "10000000000000000000000000")).wait()
//   await (await cUsdc.mint(parseUnits("5000000", "6"))).wait()
//   console.log("borrowing note");
//   console.log("note balance: ", (await Note.balanceOf(deployerAddress)).toBigInt());
//   await (await cNote.borrow(parseUnits("1000000", "18"))).wait()
//   console.log("borrow complete");
// //Add liquidity
// await (await WETH.deposit({value: ethers.utils.parseUnits("50000", "18") })).wait()
// await addLiquidity(Note, WETH, oracle, deployerAddress, false, "3000", "1000");
// await addLiquidity(ETH, WETH, oracle, deployerAddress,false, "2", "1400");
// await addLiquidity(WETH, ATOM, oracle, deployerAddress, false, "100", "30");
// await addLiquidity(Note, USDC, oracle, deployerAddress, true, "5000", "5000");
// await addLiquidity(Note, USDT, oracle, deployerAddress, true, "5000", "5000");
// await ((await BaseV1Factory.setPeriodSize(0)).wait());
for (let i=0; i < 10; i++) {
    await swapTokens(Note, WETH, oracle, deployerAddress, false, "1000");
    await swapTokens(ETH, WETH, oracle, deployerAddress, false, "1000");
    await swapTokens(ATOM, WETH, oracle, deployerAddress, false, "1000");
    await swapTokens(USDC, Note, oracle, deployerAddress, true, "1000");
    await swapTokens(USDT, Note, oracle, deployerAddress, true, "1000");
}

}
async function addLiquidity(
  t1,
  t2,
  oracle,
  deployer,
  stable,
  amount1,
  amount2
) {
  console.log("ADD LIQUIDITY:");
  await (await t1.approve(oracle.address, "10000000000000000000000000")).wait();
  await (await t2.approve(oracle.address, "10000000000000000000000000")).wait();

  let t1BalanceBefore = await t1.balanceOf(deployer);
  let t2BalanceBefore = await t2.balanceOf(deployer);
  await (
    await oracle.addLiquidity(
      t1.address,
      t2.address,
      stable,
      ethers.utils.parseUnits(amount1, await t1.decimals()),
      ethers.utils.parseUnits(amount2, await t2.decimals()),
      0,
      0,
      deployer,
      ethers.BigNumber.from("9999999999999999999999999999999")
    )
  ).wait();
  let t1BalanceAfter = await t1.balanceOf(deployer);
  let t2BalanceAfter = await t2.balanceOf(deployer);
  console.log(t1BalanceBefore.toString() + "----->", t1BalanceAfter.toString());
  console.log(t2BalanceBefore.toString() + "----->", t2BalanceAfter.toString());
}
async function swapTokens(t1, t2, oracle, deployer, stable, amount) {
  let t1BalanceBefore = await t1.balanceOf(deployer);
  let t2BalanceBefore = await t2.balanceOf(deployer);
  console.log("SWAP: ");
  await (
    await oracle.swapExactTokensForTokensSimple(
      ethers.utils.parseUnits(amount, 1),
      ethers.utils.parseUnits("0", await t2.decimals()),
      t1.address,
      t2.address,
      stable,
      deployer,
      ethers.BigNumber.from("9999999999999999999999999999999")
    )
  ).wait();
  let t1BalanceAfter = await t1.balanceOf(deployer);
  let t2BalanceAfter = await t2.balanceOf(deployer);
  console.log(t1BalanceBefore.toString() + "----->", t1BalanceAfter.toString());
  console.log(t2BalanceBefore.toString() + "----->", t2BalanceAfter.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
