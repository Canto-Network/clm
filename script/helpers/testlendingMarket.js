const { BigNumber } = require("ethers");
const { parseUnits, formatUnits } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { testAddresses } = require("./utils/testAddresses");


async function main() {
  const [dep] = await ethers.getSigners();
  const comptroller = new ethers.Contract(
    (await deployments.get("Unitroller")).address,
    (await deployments.get("Comptroller")).abi,
    dep
  );

  const account6Address = "0x69102D34f0ECDCa2ca2980Ce2a9526D2f313E562";
  const oracle = await ethers.getContract("BaseV1Router01");
  let cNote = await ethers.getContract("CNoteDelegator");
  let cCanto = await ethers.getContract("CCanto");
  let cAtom = await ethers.getContract("CAtomDelegator");
  let cEth = await ethers.getContract("CETHDelegator");
  let cUsdc = await ethers.getContract("CUsdcDelegator");
  let cUsdt = await ethers.getContract("CUsdtDelegator");
  let cCantoAtom = await ethers.getContract("CCantoAtomDelegator");


  const Note = await ethers.getContract("Note");
  const WETH = await ethers.getContract("WETH");
  const USDC = await ethers.getContractAt("ERC20", testAddresses.USDC);
  const USDT = await ethers.getContractAt("ERC20", testAddresses.USDT);
  const ATOM = await ethers.getContractAt("ERC20", testAddresses.ATOM);
  await swapTokens(Note, WETH, oracle, dep.address, false, "1")
  return

const liquidatorcUSDCBalance = Number(formatUnits(await cCantoAtom.balanceOf(dep.address), 18));

//   console.log(await (await comptroller.liquidateBorrowAllowed(cAtom.address, cUsdc.address, dep.address, account6Address, parseUnits("3000", 6))).wait())
//   console.log(await comptroller.getAccountLiquidity(account6Address))
//   console.log(await comptroller.liquidateCalculateSeizeTokens(cAtom.address, cUsdc.address, parseUnits("3000", 6)))
  await (await cNote.liquidateBorrow(account6Address, parseUnits("9", 18), cCantoAtom.address)).wait()

    const liquidatorscUSDCBalanceAfterLiquidation = Number(formatUnits(await cCantoAtom.balanceOf(dep.address), 18))
  console.log("liquidators cToken balance increased by: ", liquidatorscUSDCBalanceAfterLiquidation - liquidatorcUSDCBalance )
  console.log("liquidator repayment in atom: 9 note")
  console.log("price of atom: ", formatUnits((await oracle.getUnderlyingPrice(cAtom.address)).div(BigNumber.from(10).pow(18-6))));
  
}

async function swapTokens(t1, t2, oracle, deployer, stable, amount) {
    let t1BalanceBefore = await t1.balanceOf(deployer);
    let t2BalanceBefore = await t2.balanceOf(deployer);
    console.log("SWAP: ");
    await (
      await oracle.swapExactTokensForTokensSimple(
        ethers.utils.parseUnits(amount, await t1.decimals()),
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
