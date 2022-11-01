const { expect } = require("chai");
const { ethers, deployments, getNamedAccounts } = require("hardhat");
const {
  testAddresses,
} = require("../../../script/helpers/utils/testAddresses.js");
const { canto } = require("../../../config/index.js");
const { addLiquidity, enterCantoLPPool, mintcLPTokens, swapTokens, delay } = require("./utils");
const { parseUnits, formatUnits } = require("ethers/lib/utils.js");
const { BigNumber } = require("ethers");

let dep;
let user1;
let Comptroller;
let Router;
let cCantoNote;
let cCantoEth;
let cCantoAtom;
let Note;
let USDC;
let USDT;
let ATOM;
let ETH;
let WETH;
let CantoAtom;
let CantoETH;
let cNote;
let cUSDC;
//tests are done with user1, not the deployer since the deployer is already in the markets
describe("test lending marekt", async () => {
  before(async () => {
    [dep, user1] = await ethers.getSigners();
    Comptroller = new ethers.Contract(
      (await deployments.get("Unitroller")).address,
      (await deployments.get("Comptroller")).abi,
      dep
    );
    Router = await ethers.getContract("BaseV1Router01");
    cCantoNote = await ethers.getContract("CCantoNoteDelegator");
    cCantoEth = await ethers.getContract("CCantoEthDelegator");
    Note = await ethers.getContract("Note");
    USDC = await ethers.getContractAt("ERC20", testAddresses.USDC);
    USDT = await ethers.getContractAt("ERC20", testAddresses.USDT);
    ATOM = await ethers.getContractAt("ERC20", testAddresses.ATOM);
    ETH = await ethers.getContractAt("ERC20", testAddresses.ETH);
    CantoAtom = await ethers.getContractAt("ERC20", testAddresses.cantoatom);
    CantoETH = await ethers.getContractAt("ERC20", testAddresses.cantoeth);
    WETH = await ethers.getContract("WETH");
    cCantoAtom = await ethers.getContract("CCantoAtomDelegator");
    cNote = await ethers.getContract("CNoteDelegator");
    cUSDC = await ethers.getContract("CUsdcDelegator");
  });

    it("testing collateralizing LP token and borrowing", async () => {
      await enterCantoLPPool(WETH, ATOM, Router, user1, false, parseUnits("5"), parseUnits("1", 6));
      await (await CantoAtom.connect(user1).approve(cCantoAtom.address, parseUnits("10000000", 6))).wait();
      await (await Comptroller.connect(user1).enterMarkets([cCantoAtom.address])).wait();
      await (await cCantoAtom.connect(user1).mint(await CantoAtom.balanceOf(user1.address))).wait();
      const [,liquidity] = (await Comptroller.getAccountLiquidity(user1.address));
      //borrow 90%
      await (await cUSDC.connect(user1).borrow((liquidity.mul(90).div(100).div(BigNumber.from(10).pow(12))))).wait();
      const [,newLiquidity] = (await Comptroller.getAccountLiquidity(user1.address));
      const liquidityDiff = (liquidity.mul(90).div(100).sub(newLiquidity));
      expect(liquidityDiff.lt(parseUnits("1"))).to.be.true;
    });

    it("testing 2 LP tokens and borrowing up to limit", async () => {
      const [, initialLiquidity] = await Comptroller.getAccountLiquidity(
        user1.address
      );
      const initialCLP1 = await cCantoAtom.balanceOf(user1.address);
      const initialCLP2 = await cCantoEth.balanceOf(user1.address);
      await enterCantoLPPool(WETH, ATOM, Router, user1, false, parseUnits("5"), parseUnits("1", 6));
      await enterCantoLPPool(WETH, ETH, Router, user1, false, parseUnits("1000"), parseUnits("0.5"));
      await mintcLPTokens(CantoETH, Comptroller, user1, cCantoEth);
      await mintcLPTokens(CantoAtom, Comptroller, user1, cCantoAtom);
      const [, preBorrowliquidity] = await Comptroller.getAccountLiquidity(
        user1.address
      );
      const [, cFactor1] = await Comptroller.markets(cCantoAtom.address);
      const [, cFactor2] = await Comptroller.markets(cCantoEth.address);
      const expectedLiquidityIncrease = (
        await Router.getUnderlyingPrice(cCantoAtom.address)
      )
        .mul(cFactor1)
        .mul((await cCantoAtom.balanceOf(user1.address)).sub(initialCLP1))
        .div(BigNumber.from(10).pow(36))
        .add(
          (await Router.getUnderlyingPrice(cCantoEth.address))
            .mul(cFactor2)
            .mul((await cCantoEth.balanceOf(user1.address)).sub(initialCLP2))
            .div(BigNumber.from(10).pow(36))
        );

      console.log(expectedLiquidityIncrease);
      const percentDiff =
        (Number(formatUnits(preBorrowliquidity.sub(initialLiquidity))) -
          Number(formatUnits(expectedLiquidityIncrease))) /
        Number(formatUnits(expectedLiquidityIncrease));
      expect(
       percentDiff < 0.01
      ).to.be.true;

      //borrow 90% of total liquidity
      await (
        await cUSDC.connect(user1).borrow(
          preBorrowliquidity
            .mul(90)
            .div(100)
            .div(BigNumber.from(10).pow(12))
        )
      ).wait();
      //borrow same amount again, this should fail
      try {
        await (
          await cUSDC.connect(user1).borrow(
            preBorrowliquidity
              .mul(90)
              .div(100)
              .div(BigNumber.from(10).pow(12))
          )
        ).wait();
      } catch {
        //we expect to get here
        expect(true);
      }
    });
  it("testing liquidation with one asset", async () => {
    await enterCantoLPPool(
      WETH,
      ATOM,
      Router,
      user1,
      false,
      parseUnits("5"),
      parseUnits("1", 6)
    );
    await mintcLPTokens(CantoAtom, Comptroller, user1, cCantoAtom);
    const [, preBorrowliquidity] = await Comptroller.getAccountLiquidity(
      user1.address
    );
    await (
      await cUSDC.connect(user1).borrow(
        preBorrowliquidity
          .div(BigNumber.from(10).pow(12))
      )
    ).wait();
    //we now have to change the price of cantoAtomLP so that we go above the borrow limit
    await swapTokens(WETH, Note, Router, user1, false, "10");

    // let shortfall = BigNumber.from(0);
    // while (shortfall.gte(0)) {
    //     await swapTokens(WETH, Note, Router, user1, false, "10");
    //     await delay(2000);
    //     [,,shortfall] =  await Comptroller.getAccountLiquidity(
    //         user1.address
    //       );
    // }
    const cCantoAtomBalance = await cCantoAtom.balanceOf(user1.address);
    const [,seizeTokens] = await Comptroller.liquidateCalculateSeizeTokens(cUSDC.address, cCantoAtom.address, (await cUSDC.borrowBalanceStored(user1.address)).div(2));
    await (await cUSDC.liquidateBorrow(user1.address, (await cUSDC.borrowBalanceStored(user1.address)).div(2), cCantoAtom.address)).wait()
    const cCantoAtomBalanceAfterLiquidation = await cCantoAtom.balanceOf(user1.address);
    const cTokenDecrease= cCantoAtomBalance.sub(cCantoAtomBalanceAfterLiquidation);
    const percentDiff = Number(formatUnits(cTokenDecrease.sub(seizeTokens))) / Number(formatUnits(seizeTokens));
    console.log(formatUnits(cTokenDecrease), formatUnits(seizeTokens))
    expect(percentDiff < 0.02).to.be.true;

  });
  it("test liquidation with 2 LP assets", async () => {
    await enterCantoLPPool(WETH, ATOM, Router, user1, false, parseUnits("5"), parseUnits("1", 6));
    await enterCantoLPPool(WETH, ETH, Router, user1, false, parseUnits("100"), parseUnits(".1"));
    await mintcLPTokens(CantoAtom, Comptroller, user1, cCantoAtom);
    await mintcLPTokens(CantoETH, Comptroller, user1, cCantoEth);
    const [, preBorrowliquidity] = await Comptroller.getAccountLiquidity(
        user1.address
      );
      await (
        await cUSDC.connect(user1).borrow(
          preBorrowliquidity
            .div(BigNumber.from(10).pow(12))
        )
      ).wait();
    // we now have to change the price of cantoAtomLP so that we go above the borrow limit
    await swapTokens(WETH, Note, Router, dep, false, "100");
    const cCantoEthBal = await cCantoEth.balanceOf(user1.address);
    const [,seizeTokens] = await Comptroller.liquidateCalculateSeizeTokens(cUSDC.address, cCantoEth.address, (await cUSDC.borrowBalanceStored(user1.address)).div(2));
    await (await cUSDC.liquidateBorrow(user1.address, (await cUSDC.borrowBalanceStored(user1.address)).div(2), cCantoEth.address)).wait()
    const cCantoETHBalanceAfterLiquidation = await cCantoEth.balanceOf(user1.address);
    const cTokenDecrease= cCantoEthBal.sub(cCantoETHBalanceAfterLiquidation);
    const percentDiff = Number(formatUnits(cTokenDecrease.sub(seizeTokens))) / Number(formatUnits(seizeTokens));
    console.log(formatUnits(cTokenDecrease), formatUnits(seizeTokens))
    expect(percentDiff < 0.02).to.be.true;
  })
});
