const {ethers, deployments} = require("hardhat");
const { address, etherMantissa } = require('../../tests/Utils/Ethereum');

  async function main() {
    const [dep] = await ethers.getSigners();
    const half = etherMantissa(0.5);


    const deployer = dep.address;
    const USDC = await ethers.getContract("USDC");
    const Note = await ethers.getContract("Note");
    const USDT = await ethers.getContract("USDT");
    const ATOM = await ethers.getContract("ATOM");
    const ETH = await ethers.getContract("ETH");
    const WETH = await ethers.getContract("WETH");

    const tokens = [USDC, Note, USDT, ATOM, ETH, WETH] 

    for (var token of tokens) {
      console.log(`${await token.name()}: ${token.address}`)
    }
   
    const cUSDC = await ethers.getContract("CUsdcDelegator");
    const cNote = await ethers.getContract("CNoteDelegator");

    const Unitroller = new ethers.Contract(
      (await deployments.get("Unitroller")).address,
      (await deployments.get("Comptroller")).abi,
      dep
    )
    const Reservoir = await ethers.getContract("Reservoir");  
    const oracle = await ethers.getContract("BaseV1Router01");
    const BaseV1Factory = await ethers.getContract("BaseV1Factory");

    console.log("cUsdc symbol: ", await cUSDC.symbol())

    // await (await Unitroller._supportMarket(cUSDC.address)).wait();
    // (await Unitroller.enterMarkets([cUSDC.address])).wait()
    // await (await Unitroller._supportMarket(cNote.address)).wait();
    // await (await Unitroller._setCollateralFactor(cUSDC.address, half.toString())).wait();
    // await (await USDC.approve(cUSDC.address, "10000000000000000000000000")).wait()
    // await (await cUSDC.mint(ethers.utils.parseUnits("5000000", "6"))).wait()
    console.log("borrowing note")
    console.log("note balance: ", (await Note.balanceOf(deployer)).toBigInt())
    // await (await cNote.borrow(ethers.utils.parseUnits("1000000", "18"))).wait()
    console.log("borrow complete")
    // await (await WETH.deposit({value: ethers.utils.parseUnits("50000", "18") })).wait()

   
    await addLiquidity(Note, WETH, oracle, deployer, false);
    await addLiquidity(ETH, WETH, oracle, deployer, false);
    await addLiquidity(WETH, ATOM, oracle, deployer, false);
    await addLiquidity(Note, USDC, oracle, deployer, true);
    await addLiquidity(Note, USDT, oracle, deployer, true);
    // await addLiquidity(Note, ATOM, oracle, deployer, false);
    // await addLiquidity(Note, ETH, oracle, deployer, false);
    console.log(await BaseV1Factory.allPairs(0));
    console.log(await BaseV1Factory.allPairs(1));
    console.log(await BaseV1Factory.allPairs(2));
    console.log(await BaseV1Factory.allPairs(3));
    console.log(await BaseV1Factory.allPairs(4));

    await ((await BaseV1Factory.setPeriodSize(0)).wait());

    for (let i=0; i < 10; i++) {
      await swapTokens(Note, WETH, oracle, deployer, false);
      await swapTokens(ETH, WETH, oracle, deployer, false);
      await swapTokens(WETH, ATOM, oracle, deployer, false);
      await swapTokens(Note, USDC, oracle, deployer, true);
      await swapTokens(Note, USDT, oracle, deployer, true);
      // await swapTokens(Note, ATOM, oracle, deployer, false);
      // await swapTokens(Note, ETH, oracle, deployer, false);
    }
  }

  async function addLiquidity(t1, t2, oracle, deployer, stable) {
    console.log("ADD LIQUIDITY:")
    await (await t1.approve(oracle.address, "10000000000000000000000000")).wait();
    await (await t2.approve(oracle.address, "10000000000000000000000000")).wait();


    let t1BalanceBefore = await t1.balanceOf(deployer);
    let t2BalanceBefore = await t2.balanceOf(deployer);
    await (await oracle.addLiquidity(
        t1.address, t2.address, stable, 
        ethers.utils.parseUnits("1000", await t1.decimals()),
        ethers.utils.parseUnits("1000", await t2.decimals()),
        0, 0, deployer, ethers.BigNumber.from("9999999999999999999999999999999")
    )).wait();
    let t1BalanceAfter = await t1.balanceOf(deployer);
    let t2BalanceAfter = await t2.balanceOf(deployer);
    console.log(t1BalanceBefore.toString() + "----->", t1BalanceAfter.toString());
    console.log(t2BalanceBefore.toString() + "----->", t2BalanceAfter.toString());
    
  }
  async function swapTokens(t1, t2, oracle, deployer, stable) {
    let t1BalanceBefore = await t1.balanceOf(deployer);
    let t2BalanceBefore = await t2.balanceOf(deployer);
    console.log("SWAP: ")
    await (await oracle.swapExactTokensForTokensSimple(
        ethers.utils.parseUnits("10", await t1.decimals()),
        ethers.utils.parseUnits("0",  await t2.decimals()),
        t1.address, 
        t2.address,
        stable,
        deployer,
        ethers.BigNumber.from("9999999999999999999999999999999")
    )).wait();
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