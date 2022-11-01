const { parseUnits } = require("ethers/lib/utils");

async function addLiquidity(
    t1,
    t2,
    oracle,
    user,
    stable,
    amount1,
    amount2
  ) {
    console.log("ADD LIQUIDITY:");
    await (await t1.connect(user).approve(oracle.address, "10000000000000000000000000")).wait();
    await (await t2.connect(user).approve(oracle.address, "10000000000000000000000000")).wait();
  
    let t1BalanceBefore = await t1.balanceOf(user.address);
    let t2BalanceBefore = await t2.balanceOf(user.address);
    await (
      await oracle.connect(user).addLiquidity(
        t1.address,
        t2.address,
        stable,
        amount1,
        amount2,
        0,
        0,
        user.address,
        ethers.BigNumber.from("9999999999999999999999999999999")
      )
    ).wait();
    let t1BalanceAfter = await t1.balanceOf(user.address);
    let t2BalanceAfter = await t2.balanceOf(user.address);
    console.log(t1BalanceBefore.toString() + "----->", t1BalanceAfter.toString());
    console.log(t2BalanceBefore.toString() + "----->", t2BalanceAfter.toString());
    return true
  }

  async function enterCantoLPPool(t1, t2, router, user, stable, amount1Wanted, amount2Wanted) {
    const [amount1, amount2] = ( await router.quoteAddLiquidity(t1.address, t2.address, stable, amount1Wanted, amount2Wanted))
    if ((await t2.balanceOf(user.address)).lt(amount2)) {
        await (await t2.transfer(user.address, amount2)).wait();
    }
    if ((await t1.balanceOf(user.address)).lt(amount1)) {
        await (await t1.connect(user).deposit({value: amount1 })).wait()
    }
    await addLiquidity(t1, t2, router, user, stable, amount1, amount2);
    return true
  }
  async function mintcLPTokens(lpToken, comptroller, user, cLPToken) {
    await (await lpToken.connect(user).approve(cLPToken.address, parseUnits("10000000"))).wait();
    await (await comptroller.connect(user).enterMarkets([cLPToken.address])).wait();
    await (await cLPToken.connect(user).mint(await lpToken.balanceOf(user.address))).wait();
    return true;
  }
  async function swapTokens(t1, t2, router, user, stable, amount) {
    let t1BalanceBefore = await t1.balanceOf(user.address);
    let t2BalanceBefore = await t2.balanceOf(user.address);
    console.log("SWAP: ");
    await (
      await router.connect(user).swapExactTokensForTokensSimple(
        ethers.utils.parseUnits(amount, await t1.decimals()),
        ethers.utils.parseUnits("0", await t2.decimals()),
        t1.address,
        t2.address,
        stable,
        user.address,
        ethers.BigNumber.from("9999999999999999999999999999999")
      )
    ).wait();
    let t1BalanceAfter = await t1.balanceOf(user.address);
    let t2BalanceAfter = await t2.balanceOf(user.address);
    console.log(t1BalanceBefore.toString() + "----->", t1BalanceAfter.toString());
    console.log(t2BalanceBefore.toString() + "----->", t2BalanceAfter.toString());
  }
  async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  module.exports = {addLiquidity, enterCantoLPPool, mintcLPTokens, swapTokens, delay}