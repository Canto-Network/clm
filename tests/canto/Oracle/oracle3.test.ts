import{expect} from "chai"
import{ethers, deployments, getNamedAccounts} from "hardhat";
import {min, sqrt, avg, diff, percentDiff} from "./utils"

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR);

let comptroller: any;
let weth: any;
let note: any;
let usdc: any;
let cCanto: any;
let usdt: any;
let cNote: any;
let cUsdt: any;
let noteRate: any; 
let treasury: any;
let accountant: any;
let blocksPerYear: bigint = BigInt(5256666)
let cEth : any
let factory: any
let router: any
let cUsdc : any
let eth: any

describe("Testing LpToken Price Accuracy after large vol moves in Canto/Note pair", async () => {
    let dep: any;
    let user1: any;
    let user2: any;
    let pair: any;

    let accountantCNoteBalance: any;
    before(async() => {
        // retrieve contracts from the deployment
        dep  = await getNamedAccounts();
        [dep, user1, user2] = await ethers.getSigners();
        await deployments.fixture(["Protocol"]);
        comptroller = new ethers.Contract(
            (await deployments.get("Unitroller")).address,
            (await deployments.get("Comptroller")).abi,
            dep 
        );
        usdc = await ethers.getContract("USDC");
        note = await ethers.getContract("Note");
        eth = await ethers.getContract("ETH")
        cNote = new ethers.Contract(
            (await deployments.get("CNoteDelegator")).address,
            (await deployments.get("CNote")).abi,
            dep
        );
        cCanto = await ethers.getContract("CCanto")
        cEth = new ethers.Contract(
            (await deployments.get("CETHDelegator")).address,
            (await deployments.get("CETH")).abi,
            dep
        )
        cUsdc = new ethers.Contract(
            (await deployments.get("CUsdcDelegator")).address,
            (await deployments.get("CUsdc")).abi,
            dep
        )

        accountant = await ethers.getContract("AccountantDelegator")
        treasury = await ethers.getContract("TreasuryDelegator")
        noteRate = await ethers.getContract("NoteRateModel")
        factory = await ethers.getContract("BaseV1Factory")
        router = await ethers.getContract("BaseV1Router01")
        weth = await ethers.getContract("WETH")
    });
    it("deployer sends 10000 canto to user1 and user2", async () => {
        // support and collateralize markets in comptroller
        console.log("deployer canto balance: ", (await ethers.provider.getBalance(dep.address)).toBigInt())
        console.log("deployer canto balance: ", (await ethers.provider.getBalance(user2.address)).toBigInt())
        console.log("deployer canto balance: ", (await ethers.provider.getBalance(user1.address)).toBigInt())
        await (await comptroller._supportMarket(cUsdc.address)).wait()
        // set collateral factors for cCanto 
        await (await comptroller._setCollateralFactor(cUsdc.address, ethers.utils.parseUnits("0.9", "18"))).wait()
    })
    it("deployer borrows note against Usdc and makes swaps", async () => {
        // borrow note against usdc 
        await (await comptroller.enterMarkets([cUsdc.address, cNote.address])).wait()
        await (await usdc.approve(cUsdc.address, ethers.utils.parseUnits("1000"))).wait()
        // supply usdc
        await (await cUsdc.mint(ethers.utils.parseUnits("100000000000000", "6"))).wait()
        // borrow note
        await (await cNote.borrow(ethers.utils.parseUnits("9000000000000", "18"))).wait()
        expect((await note.balanceOf(dep.address)).toBigInt() == ethers.utils.parseUnits("9000000000000", "18").toBigInt()).to.be.true
    })

    it("Deployer adds 1 canto and 1000 note to pool", async () => {
        // add liquidity to router
        let noteIn = ethers.utils.parseUnits("1000", "18")
        let cantoIn = ethers.utils.parseUnits("1", "18")
        //approve note transfer by router
        await (await weth.deposit({value: ethers.utils.parseUnits("9", "18")}))
        await (await note.approve(router.address, noteIn)).wait()
        await (await weth.approve(router.address, cantoIn)).wait()
        await (await router.addLiquidity(
            note.address,
            weth.address,
            false,
            noteIn,
            cantoIn,
            0,0, 
            dep.address,
            9999999999,
            )).wait()
        // get pair address
        let pairAddr = await factory.getPair(note.address, weth.address, false)
        pair = await ethers.getContractAt("BaseV1Pair", pairAddr)

        let x = sqrt(noteIn.toBigInt() * cantoIn.toBigInt()) - BigInt(1000)
        // check that initial liquidity provision is correct
        let lpTokens = (await pair.balanceOf(dep.address)).toBigInt()
        expect(lpTokens == x).to.be.true
        //set period size to zero for instant observations
        await (await factory.setPeriodSize(0)).wait()
    })

    // maintain cumulative observations stored
    let totalSupplies : Array<any> = new Array<any>()
    let reserves0: Array<any> = new Array<any>()
    let reserves1 : Array<any> = new Array<any>()
    let pricesCanto: Array<any> = new Array<any>()
    let pricesNote: Array<any> = new Array<any>()
    it("Deployer swaps 10 times to cement observations in the pair", async () => {
        // swap 10 times in pool observe totalSupply/ totalReserves changing periodically and obtain price 
        //approve transfers
        await (await note.approve(router.address, ethers.utils.parseUnits("13", "18")))
        for(var i = 0; i < 13; i++) {
            //swap note for canto
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("1", "18"),
                0,
                note.address,
                weth.address,
                false,
                dep.address,
                9999999999
            )).wait()
            // update array values
            totalSupplies.push((await pair.totalSupply()).toBigInt())
            reserves0.push((await pair.reserve0()).toBigInt())
            reserves1.push((await pair.reserve1()).toBigInt())

            // update price samples (amt of note for 1e18 canto)
            let cantoPrice = (await pair.getAmountOut(ethers.utils.parseUnits("1", "18"), weth.address)).toBigInt()
            pricesCanto.push(cantoPrice)
            let notePrice = (await pair.getAmountOut(ethers.utils.parseUnits("1", "18"), note.address)).toBigInt()
            pricesNote.push(notePrice)

        }
        console.log("pair token0: ", await pair.token0())
        console.log("pair token1: ", await pair.token1())

        console.log("weth address: ", weth.address)
        console.log("note address: ", note.address)

        // actual price
        let actualPrice = (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        // sample does not factor most recent observation into account
        let expected = BigInt(avg(pricesCanto, 1)) // observations lag behind
        console.log("actualPrice: ", actualPrice) 
        console.log("expected price: ", expected)
        // expect less than 0.1% difference in price (actual Price is TWAP) expected calculation does not weight by time
        expect(percentDiff(actualPrice, expected) <= 0.01).to.be.true
    })

    let delegator: any
    it("Now Instantiate the lpToken market and retrieve the price of this asset", async  () => {
        let tokenFac = await ethers.getContractFactory("CErc20Delegate", dep)
        let delegate = await tokenFac.deploy()
        let delegatorFac = await ethers.getContractFactory("CErc20Delegator", dep)
        delegator = await delegatorFac.deploy(
            pair.address,
            comptroller.address,
            (await deployments.get("JumpRateModel")).address,
            ethers.utils.parseUnits("1", "18"),
            "x",
            "x",
            18,
            dep.address,
            delegate.address,
            []
        )
        await delegator.deployed() 
    })
    it("Get Price of lpToken", async () => {
        // actual price 
        let cumulative : Array<any> = new Array<any>()
        let actualPrice = (await router.getUnderlyingPrice(delegator.address)).toBigInt()
        // calculate expected price of lpToken = avg_i ((reserve_1 + reserve_2 * price_{1->2}) / totalSupply_i) 
        let idx = reserves0.length - 9
        for (var i = idx; i < reserves0.length; i++) { 
            let reserve1Canto = BigInt(reserves1[i] * pricesNote[i]) / BigInt(1e18)
            cumulative[i - idx] = BigInt((reserve1Canto + reserves0[i]) * BigInt(1e18) ) / BigInt(totalSupplies[i])
        }
        let expectedCanto = avg(cumulative, 0) 
        let CantoPrice =  (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        let expected = BigInt(expectedCanto) * CantoPrice / BigInt(1e18)
        console.log("expected: ", expected)
        console.log("actual Price: ", actualPrice)
        console.log("percentDiff in price: ", percentDiff(expected, actualPrice))
        // expect(Number(diff(expected, actualPrice)) / Number(actualPrice) <= 0.001).to.be.true
        // amount of note in pair, unscaled
        let pairNoteBal = (await note.balanceOf(pair.address)).toBigInt()
        // amount of weth in the pair, unscaled
        let pairWethBal = (await weth.balanceOf(pair.address)).toBigInt()
        // total Supply of lpTokens, unscaled
        let totalSupply = (await pair.totalSupply()).toBigInt()
        // price of lpToken is scaled by 1e18
        let actual = BigInt(totalSupply * actualPrice) / BigInt(1e18)
        // price of Canto \-> Note is scaled by 1e18
        expected = pairNoteBal + BigInt(pairWethBal * CantoPrice) / BigInt(1e18)
        
        console.log("actual TVL: ", actual)
        console.log("expected TVL: ", expected)

        console.log("percentDiff in TVL", percentDiff(actual, expected))

        // expect(Number(diff(expected, actual)) / Number(actual) <= 0.01).to.be.true
    })

    let lpTokens: any
    it("Now the deployer adds an outsize amt to the pool (5x)", async () => {
        // add liquidity to router
        let priorBal = (await pair.balanceOf(dep.address)).toBigInt()
        // canto is token 0 in this case 
        let scale = 1
        let noteIn = ethers.utils.parseUnits("5000", "18").toBigInt()  * BigInt(scale)
        let cantoIn = ethers.utils.parseUnits("5", "18").toBigInt() * BigInt(scale)
        //approve note transfer by router
        let totalSupply= (await pair.totalSupply()).toBigInt()
        let reserve0 = (await pair.reserve0()).toBigInt()
        let reserve1 = (await pair.reserve1()).toBigInt()
        console.log(`reserve0: ${reserve0}, reserve1: ${reserve1}`)
        await (await note.approve(router.address, noteIn)).wait()
        await (await weth.approve(router.address, cantoIn)).wait()
        await (await router.addLiquidity(
            note.address,
            weth.address,
            false,
            noteIn,
            cantoIn
            ,0,0,
            dep.address,
            9999999999,
            )).wait()
        lpTokens = (await pair.balanceOf(dep.address)).toBigInt() - priorBal
        reserve0 = (await pair.reserve0()).toBigInt()
        reserve1 = (await pair.reserve1()).toBigInt()
        console.log(`reserve0: ${reserve0}, reserve1: ${reserve1}`)
        // now calculate the expected tokens out    
        let amt0 = (BigInt(cantoIn) * totalSupply) / reserve0
        let amt1 = (BigInt(noteIn) * totalSupply) / reserve1
        let amtMinted = min(amt0, amt1)

        // expect(percentDiff(amtMinted,lpTokens) <= 0.01).to.be.true;
        // update array values
        totalSupplies.push((await pair.totalSupply()).toBigInt())
        reserves0.push((await pair.reserve0()).toBigInt())
        reserves1.push((await pair.reserve1()).toBigInt())
        // update price samples (amt of note for )
        let cantoPrice = (await pair.getAmountOut(ethers.utils.parseUnits("1", "18"), weth.address)).toBigInt()
        pricesCanto.push(cantoPrice)
        let notePrice = (await pair.getAmountOut(ethers.utils.parseUnits("1", "18"), note.address)).toBigInt()
        pricesNote.push(notePrice)
    })
    it("How much has the Canto/Note Price changed by", async () => { 
        // actual price
        let actualPrice = (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        // sample does not factor most recent observation into account
        let expected = BigInt(avg(pricesCanto, 2)) // observations lag behind
        console.log("actualPrice: ", actualPrice) 
        console.log("expected price: ", expected)
        // expect less than 0.1% difference in price (actual Price is TWAP) expected calculation does not weight by time
        expect(percentDiff(actualPrice, expected) <= 0.01).to.be.true
    })

    it("Get Price of lpToken", async () => {
        // actual price 
        let cumulative : Array<any> = new Array<any>()
        let actualPrice = (await router.getUnderlyingPrice(delegator.address)).toBigInt()
        // calculate expected price of lpToken = avg_i ((reserve_1 + reserve_2 * price_{1->2}) / totalSupply_i) 
        let idx = reserves0.length - 9
        for (var i = idx; i < reserves0.length; i++) { 
            // token0TVL in terms of Canto
            let reserve1Canto = BigInt(reserves1[i] * pricesNote[i]) / BigInt(1e18)
            cumulative[i - idx] = BigInt((reserve1Canto + reserves0[i]) * BigInt(1e18) ) / BigInt(totalSupplies[i])
        }
        let expectedCanto = avg(cumulative, 0) 
        let CantoPrice =  (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        let expected = BigInt(expectedCanto) * CantoPrice / BigInt(1e18)
        console.log("expected: ", expected)
        console.log("actual Price: ", actualPrice)
        console.log("percentDiff in price: ", percentDiff(expected, actualPrice))
        
        // amount of note in pair, unscaled
        let pairNoteBal = (await note.balanceOf(pair.address)).toBigInt()
        // amount of weth in the pair, unscaled
        let pairWethBal = (await weth.balanceOf(pair.address)).toBigInt()
        // total Supply of lpTokens, unscaled
        let totalSupply = (await pair.totalSupply()).toBigInt()
        // price of lpToken is scaled by 1e18
        let actual = BigInt(totalSupply * actualPrice) / BigInt(1e18)
        // price of Canto \-> Note is scaled by 1e18
        expected = pairNoteBal + BigInt(pairWethBal * CantoPrice) / BigInt(1e18)
        
        console.log("actual TVL: ", actual)
        console.log("expected TVL: ", expected)

        console.log("percentDiff in TVL", percentDiff(actual, expected))

        // expect(Number(diff(expected, actual)) / Number(actual) <= 0.01).to.be.true
    })
    it("Deployer swaps 8 times to cement observations in the pair", async () => {
        // swap 10 times in pool observe totalSupply/ totalReserves changing periodically and obtain price 
        //approve transfers
        await (await note.approve(router.address, ethers.utils.parseUnits("10", "18")))
        for(var i = 0; i < 4; i++) {
            //swap note for canto
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("1", "18"),
                0,
                note.address,
                weth.address,
                false,
                dep.address,
                9999999999999
            )).wait()
            // update array values
            totalSupplies.push((await pair.totalSupply()).toBigInt())
            reserves0.push((await pair.reserve0()).toBigInt())
            reserves1.push((await pair.reserve1()).toBigInt())
            // update price samples (amt of note for )
            let cantoPrice = (await pair.getAmountOut(ethers.utils.parseUnits("1", "18"), weth.address)).toBigInt()
            pricesCanto.push(cantoPrice)
            let notePrice = (await pair.getAmountOut(ethers.utils.parseUnits("1", "18"), note.address)).toBigInt()
            pricesNote.push(notePrice)
        }
        // actual price
        let actualPrice = (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        // sample does not factor most recent observation into account
        let expected = avg(pricesCanto, reserves0.length - 9) // observations lag behind
        // expect less than 0.1% difference in price (actual Price is TWAP) expected calculation does not weight by time
        console.log(`actual price: ${actualPrice}`)
        console.log(`expected price: ${expected}`)
        expect(diff(actualPrice, expected)  <= 0.01).to.be.true
    })
    it("Remove liquidity, make swaps", async () => {
        // remove liquidity
        // approve transfer of tokens
        let scale = 1
        let reserve0 = (await pair.reserve0()).toBigInt()
        let reserve1 = (await pair.reserve1()).toBigInt()
        console.log(`reserve0: ${reserve0}, reserve1: ${reserve1}`)
        await (await pair.approve(router.address, lpTokens)).wait()
        await (await router.removeLiquidity(
            note.address,
            weth.address,
            false,
            BigInt(lpTokens)/BigInt(scale),
            0,0,
            dep.address,
            9999999999
        )).wait()
        // write observations
        // update array values
        reserve0 = (await pair.reserve0()).toBigInt()
        reserve1 = (await pair.reserve1()).toBigInt()
        console.log(`reserve0: ${reserve0}, reserve1: ${reserve1}`)
        totalSupplies.push((await pair.totalSupply()).toBigInt())
        reserves0.push((await pair.reserve0()).toBigInt())
        reserves1.push((await pair.reserve1()).toBigInt())
        // update price samples (amt of note for )
        let cantoPrice = (await pair.getAmountOut(ethers.utils.parseUnits("1", "18"), weth.address)).toBigInt()
        pricesCanto.push(cantoPrice)
        let notePrice = (await pair.getAmountOut(ethers.utils.parseUnits("1", "18"), note.address)).toBigInt()
        pricesNote.push(notePrice)
        let lpTokenPrice = (await router.getUnderlyingPrice(delegator.address)).toBigInt()
        console.log("lpToken Price: ", lpTokenPrice)
    })
    it("Get Price of lpToken", async () => {
        // actual price 
        let cumulative : Array<any> = new Array<any>()
        let actualPrice = (await router.getUnderlyingPrice(delegator.address)).toBigInt()
        // calculate expected price of lpToken = avg_i ((reserve_1 + reserve_2 * price_{1->2}) / totalSupply_i) 
        // ignore the last observation in the cumulative array
        let idx = reserves0.length - 9
        for (var i = idx; i < reserves0.length; i++) { 
            let reserve1Canto = BigInt(reserves1[i] * pricesNote[i]) / BigInt(1e18)
            cumulative[i - idx] = (reserve1Canto + reserves0[i]) * BigInt(1e18) / BigInt(totalSupplies[i])
        } 
        let expectedCanto = avg(cumulative, 0)
        let CantoPrice =  (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        let expected = expectedCanto * CantoPrice / BigInt(1e18)
        console.log("percentDiff in price: ", percentDiff(actualPrice, expected))
        console.log("actual price: ", actualPrice)
        console.log("expected price: ",expected )
        
        // amount of note in pair, unscaled
        let pairNoteBal = (await note.balanceOf(pair.address)).toBigInt()
        // amount of weth in the pair, unscaled
        let pairWethBal = (await weth.balanceOf(pair.address)).toBigInt()
        // total Supply of lpTokens, unscaled
        let totalSupply = (await pair.totalSupply()).toBigInt()
        // price of lpToken is scaled by 1e18
        let actual = BigInt(totalSupply * actualPrice) / BigInt(1e18)
        // price of Canto \-> Note is scaled by 1e18
        expected = pairNoteBal + BigInt(pairWethBal * CantoPrice) / BigInt(1e18)
        
        console.log("actual TVL: ", actual)
        console.log("expected TVL: ", expected)

        console.log("percentDiff in TVL", percentDiff(actual, expected))
    })
    it("Now swap some number of times and see how the price begins to change", async () => {
        // swap 10 times in pool observe totalSupply/ totalReserves changing periodically and obtain price 
        //approve transfers
        await (await note.approve(router.address, ethers.utils.parseUnits("10", "18")))
        for(var i = 0; i < 4; i++) {
            //swap note for canto
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("1", "18"),
                0,
                note.address,
                weth.address,
                false,
                dep.address,
                9999999999999
            )).wait()
            // update array values
            totalSupplies.push((await pair.totalSupply()).toBigInt())
            reserves0.push((await pair.reserve0()).toBigInt())
            reserves1.push((await pair.reserve1()).toBigInt())
            // update price samples (amt of note for )
            let cantoPrice = (await pair.getAmountOut(ethers.utils.parseUnits("1", "18"), weth.address)).toBigInt()
            pricesCanto.push(cantoPrice)
            let notePrice = (await pair.getAmountOut(ethers.utils.parseUnits("1", "18"), note.address)).toBigInt()
            pricesNote.push(notePrice)
        }
        // actual price
        let actualPrice = (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        // sample does not factor most recent observation into account
        let expected = avg(pricesCanto, reserves0.length - 9) // observations lag behind
        // expect less than 0.1% difference in price (actual Price is TWAP) expected calculation does not weight by time
        expect(diff(actualPrice, expected)  <= 0.01).to.be.true
    })   
    it("do lpToken Price Checks", async () => {
        // actual price 
        let cumulative : Array<any> = new Array<any>()
        let actualPrice = (await router.getUnderlyingPrice(delegator.address)).toBigInt()
        // calculate expected price of lpToken = avg_i ((reserve_1 + reserve_2 * price_{1->2}) / totalSupply_i) 
        // ignore the last observation in the cumulative array
        let idx = reserves0.length - 9
        for (var i = idx; i < reserves0.length; i++) {
            let reserves1Canto = BigInt(reserves1[i] * pricesNote[i]) / BigInt(1e18)
            cumulative[i - idx] = (reserves1Canto + reserves0[i] ) * BigInt(1e18) / totalSupplies[i]
        } 
        let expectedCanto = avg(cumulative, 0) 
        let CantoPrice =  (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        let expected = expectedCanto * CantoPrice / BigInt(1e18)
        // amount of note in pair, unscaled
        let pairNoteBal = (await note.balanceOf(pair.address)).toBigInt()
        // amount of weth in the pair, unscaled
        let pairWethBal = (await weth.balanceOf(pair.address)).toBigInt()
        // total Supply of lpTokens, unscaled
        let totalSupply = (await pair.totalSupply()).toBigInt()
        // price of lpToken is scaled by 1e18
        let actual = BigInt(totalSupply * actualPrice) / BigInt(1e18)
        // price of Canto \-> Note is scaled by 1e18
        expected = pairNoteBal + BigInt(pairWethBal * CantoPrice) / BigInt(1e18)
        
        console.log("actual TVL: ", actual)
        console.log("expected TVL: ", expected)

        console.log("percentDiff in TVL", percentDiff(actual, expected))
    })   
});