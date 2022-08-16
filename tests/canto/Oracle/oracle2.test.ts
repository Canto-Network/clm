import{expect} from "chai"
import{ethers, deployments, getNamedAccounts} from "hardhat";
import{diff, sqrt, avg, min} from "./utils"

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

describe("Testing LpToken Price Accuracy after large vol moves in Canto/Eth cantoNotePair", async () => {
    let dep: any;
    let user1: any;
    let user2: any;
    let cantoNotePair: any;
    let cantoEthPair: any

    let accountantCNoteBalance: any;
    before(async() => {
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
        cUsdt = new ethers.Contract(
            (await deployments.get("CUsdtDelegator")).address,
            (await deployments.get("CUsdt")).abi,
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
        await (await comptroller._supportMarket(cUsdc.address)).wait()
        // set collateral factors for cCanto 
        await (await comptroller._setCollateralFactor(cUsdc.address, ethers.utils.parseUnits("0.9", "18"))).wait()
    })
    it("deployer borrows note against Usdc and makes swaps", async () => {
        // borrow note against usdc 
        await (await comptroller.enterMarkets([cUsdc.address, cNote.address])).wait()
        await (await usdc.approve(cUsdc.address, ethers.utils.parseUnits("1000"))).wait()
        // supply usdc
        await (await cUsdc.mint(ethers.utils.parseUnits("100000000", "6"))).wait()
        // borrow note
        await (await cNote.borrow(ethers.utils.parseUnits("9000000", "18"))).wait()
        expect((await note.balanceOf(dep.address)).toBigInt() == ethers.utils.parseUnits("9000000", "18").toBigInt()).to.be.true
    })
    it("Deployer adds 1 canto and 1000 note to pool, deployer does the same for the canto eth pool", async () => {
        // add liquidity to router
        let noteIn = ethers.utils.parseUnits("1000", "18")
        let cantoIn = ethers.utils.parseUnits("1", "18")
        let ethIn = ethers.utils.parseUnits("1000", "18")
        //approve note transfer by router
        await (await note.approve(router.address, noteIn)).wait()
        await (await router.addLiquidityCANTO(
            note.address,
            false,
            noteIn
            ,0,0,
            dep.address,
            9999999999,
            {value: cantoIn}
        )).wait()
        // get cantoNotePair address
        let cantoNotePairAddr = await factory.getPair(note.address, weth.address, false)
        cantoNotePair = await ethers.getContractAt("BaseV1Pair", cantoNotePairAddr)
        
        let x = sqrt(noteIn.toBigInt() * cantoIn.toBigInt()) - BigInt(1000)
        // check that initial liquidity provision is correct
        let lpTokens = (await cantoNotePair.balanceOf(dep.address)).toBigInt()
        expect(lpTokens == x).to.be.true
        // now add liquidity to the canto/eth pair
        await (await eth.approve(router.address, ethIn)).wait()
        await (await router.addLiquidityCANTO(
            eth.address,
            false,
            ethIn
            ,0,0,
            dep.address,
            9999999999,
            {value: cantoIn}
        )).wait() 
        //set period size to zero for instant observations
        await (await factory.setPeriodSize(0)).wait()
        // get cantoEthPairAddr
        let cantoEthPairAddr = await factory.getPair(eth.address, weth.address, false) 
        cantoEthPair = await ethers.getContractAt("BaseV1Pair", cantoEthPairAddr)
        // calculate expected canto/eth lp tokens minted
        x = sqrt(ethIn.toBigInt() * cantoIn.toBigInt() - BigInt(1000))
        lpTokens = (await cantoEthPair.balanceOf(dep.address)).toBigInt()
    })

    // maintain cumulative observations stored
    let totalSupplies : Array<any> = new Array<any>()
    let ethReserves: Array<any> = new Array<any>()
    let cantoReserves : Array<any> = new Array<any>()
    let pricesCanto: Array<any> = new Array<any>()
    let pricesEth: Array<any> = new Array<any>()
    it("Deployer swaps 10 times to cement observations in the cantoNotePair and cantoEthPair", async () => {
        // swap 10 times in pool observe totalSupply/ totalReserves changing periodically and obtain price 
        //approve transfers
        await (await eth.approve(router.address, ethers.utils.parseUnits("10", "18"))).wait()
        await (await note.approve(router.address, ethers.utils.parseUnits("10",  '18'))).wait()
        for(var i = 0; i < 10; i++) {
            //swap note for canto so that a cCanto Price exists
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("1", "18"),
                0,
                note.address,
                weth.address,
                false,
                dep.address,
                9999999999999
            )).wait()
            //swap eth for canto to cement observations in the pair
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("1", "18"),
                0,
                eth.address,
                weth.address,
                false,
                dep.address,
                9999999999999
            )).wait()
            // update array values
            totalSupplies.push((await cantoEthPair.totalSupply()).toBigInt())
            ethReserves.push((await cantoEthPair.reserve1()).toBigInt())
            cantoReserves.push((await cantoEthPair.reserve0()).toBigInt())
            // update price samples (amt of note for )
            let cantoToEth = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), weth.address)).toBigInt()
            pricesCanto.push(cantoToEth)
            let ethToCanto = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), eth.address)).toBigInt()
            pricesEth.push(ethToCanto)
        }
        // actual price
        let actualPrice = (await router.getUnderlyingPrice(cEth.address)).toBigInt()
        // sample does not factor most recent observation into account
        let expected = avg(pricesEth, 1) * (await router.getUnderlyingPrice(cCanto.address)).toBigInt() / BigInt(1e18) // observations lag behind
        // expect less than 0.1% difference in price (actual Price is TWAP) expected calculation does not weight by time
        expect(diff(actualPrice, expected)  == BigInt(0)).to.be.true
    }) 

    let lpTokens: any
    it("Now the deployer adds an outsize amt to the pool (1000x)", async () => {
        // add liquidity to router
        let priorBal = (await cantoEthPair.balanceOf(dep.address)).toBigInt()
        // canto is token 0 in this case 
        let ethIn = ethers.utils.parseUnits("1000000", "18")
        let cantoIn = ethers.utils.parseUnits("1000", "18")
        //approve note transfer by router
        let totalSupply= (await cantoEthPair.totalSupply()).toBigInt()
        let reserve0 = (await cantoEthPair.reserve0()).toBigInt()
        let reserve1 = (await cantoEthPair.reserve1()).toBigInt()
        await (await eth.approve(router.address, ethIn)).wait()
        await (await router.addLiquidityCANTO(
            eth.address,
            false,
            ethIn
            ,0,0,
            dep.address,
            9999999999,
            {value: cantoIn}
        )).wait()
        lpTokens = (await cantoEthPair.balanceOf(dep.address)).toBigInt() - priorBal
        // now calculate the expected tokens out    
        let amt0 = (cantoIn.toBigInt() * totalSupply) / reserve0
        let amt1 = (ethIn.toBigInt() * totalSupply) / reserve1
        let amtMinted = min(amt0, amt1)

        expect(diff(BigInt(amtMinted),BigInt(lpTokens)) <= 1000).to.be.true;
        // update array values
        totalSupplies.push((await cantoEthPair.totalSupply()).toBigInt())
        cantoReserves.push((await cantoEthPair.reserve0()).toBigInt())
        ethReserves.push((await cantoEthPair.reserve1()).toBigInt())
        // update price samples (amt of note for )
        let cantoToEth = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), weth.address)).toBigInt()
        pricesCanto.push(cantoToEth)
        let ethToCanto = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), eth.address)).toBigInt()
        pricesEth.push(ethToCanto)
    })
    let delegator: any
    it("Now Instantiate the lpToken market and retrieve the price of this asset", async  () => {
        let tokenFac = await ethers.getContractFactory("CErc20Delegate", dep)
        let delegate = await tokenFac.deploy()
        let delegatorFac = await ethers.getContractFactory("CErc20Delegator", dep)
        delegator = await delegatorFac.deploy(
            cantoEthPair.address,
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
        let idx = cantoReserves.length - 9
        for (var i = idx; i < cantoReserves.length; i++) { 
            cumulative[i - idx] = (ethReserves[i] * pricesEth[i] + cantoReserves[i] ) / totalSupplies[i]
        }
        let expectedCanto = avg(cumulative, 0) 
        let CantoPrice =  (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        let EthPrice = (await router.getUnderlyingPrice(cEth.address)).toBigInt()
        let expected = expectedCanto * CantoPrice / BigInt(1e18)
        expect(Number(diff(expected, actualPrice)) / Number(actualPrice) <= 0.001).to.be.true
        let pairEthBal = (await cantoEthPair.reserve1()).toBigInt()
        let pairWethBal = (await cantoEthPair.reserve0()).toBigInt()
        let totalSupply = (await cantoEthPair.totalSupply()).toBigInt()
        let actual = BigInt(totalSupply * actualPrice)
        let conversion = avg(pricesEth, ethReserves.length - 9)
        let expectedPrice 
        console.log("actual: ", actual)
        console.log("expected: ", expectedPrice)
        expect(Number(diff(expectedPrice,actual))/ Number(actual) <= 0.01).to.be.true
    })
    it("Deployer swaps 8 times to cement observations in the pair", async () => {
        // swap 10 times in pool observe totalSupply/ totalReserves changing periodically and obtain price 
        //approve transfers
        await (await eth.approve(router.address, ethers.utils.parseUnits("10", "18")))
        for(var i = 0; i < 4; i++) {
            //swap note for canto
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("1", "18"),
                0,
                eth.address,
                weth.address,
                false,
                dep.address,
                9999999999999
            )).wait()
            // update array values
            totalSupplies.push((await cantoEthPair.totalSupply()).toBigInt())
            cantoReserves.push((await cantoEthPair.reserve0()).toBigInt())
            ethReserves.push((await cantoEthPair.reserve1()).toBigInt())
            // update price samples (amt of note for )
            let cantoToEth = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), weth.address)).toBigInt()
            pricesCanto.push(cantoToEth)
            let ethToCanto = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), eth.address)).toBigInt()
            pricesEth.push(ethToCanto)
        }
        // actual price
        let actualPrice = (await router.getUnderlyingPrice(cEth.address)).toBigInt()
        // sample does not factor most recent observation into account
        let expected = avg(pricesEth, cantoReserves.length - 9) * (await router.getUnderlyingPrice(cCanto.address)).toBigInt() / BigInt(1e18) // observations lag behind
        // expect less than 0.1% difference in price (actual Price is TWAP) expected calculation does not weight by time
        expect(diff(actualPrice, expected)  == BigInt(0)).to.be.true
    })
    it("Get Price of lpToken", async () => {
        // actual price 
        let cumulative : Array<any> = new Array<any>()
        let actualPrice = (await router.getUnderlyingPrice(delegator.address)).toBigInt()
        // calculate expected price of lpToken = avg_i ((reserve_1 + reserve_2 * price_{1->2}) / totalSupply_i) 
        let idx = cantoReserves.length - 9
        for (var i = idx; i < cantoReserves.length; i++) { 
            cumulative[i - idx] = (ethReserves[i] * pricesEth[i] + cantoReserves[i] ) / totalSupplies[i]
        }
        let expectedCanto = avg(cumulative, 0) 
        let CantoPrice =  (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        let EthPrice = (await router.getUnderlyingPrice(cEth.address)).toBigInt()
        let expected = expectedCanto * CantoPrice / BigInt(1e18)
        expect(Number(diff(expected, actualPrice)) / Number(actualPrice) <= 0.001).to.be.true
        let pairEthBal = (await cantoEthPair.reserve1()).toBigInt()
        let pairWethBal = (await cantoEthPair.reserve0()).toBigInt()
        let totalSupply = (await cantoEthPair.totalSupply()).toBigInt()
        let actual = BigInt(totalSupply * actualPrice)
        let conversion = avg(pricesEth, ethReserves.length - 9)
        let expectedPrice = BigInt(((pairEthBal * conversion) + pairWethBal) * CantoPrice) / BigInt(1e18)
        expect(Number(diff(expectedPrice,actual))/ Number(actual) <= 0.01).to.be.true
    })
    it("Deployer swaps 8 times to cement observations in the pair", async () => {
        // swap 10 times in pool observe totalSupply/ totalReserves changing periodically and obtain price 
        //approve transfers
        await (await eth.approve(router.address, ethers.utils.parseUnits("10", "18")))
        for(var i = 0; i < 4; i++) {
            //swap note for canto
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("1", "18"),
                0,
                eth.address,
                weth.address,
                false,
                dep.address,
                9999999999999
            )).wait()
            // update array values
            totalSupplies.push((await cantoEthPair.totalSupply()).toBigInt())
            cantoReserves.push((await cantoEthPair.reserve0()).toBigInt())
            ethReserves.push((await cantoEthPair.reserve1()).toBigInt())
            // update price samples (amt of note for )
            let cantoToEth = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), weth.address)).toBigInt()
            pricesCanto.push(cantoToEth)
            let ethToCanto = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), eth.address)).toBigInt()
            pricesEth.push(ethToCanto)
        }
        // actual price
        let actualPrice = (await router.getUnderlyingPrice(cEth.address)).toBigInt()
        // sample does not factor most recent observation into account
        let expected = avg(pricesEth, ethReserves.length - 9) * (await router.getUnderlyingPrice(cCanto.address)).toBigInt() / BigInt(1e18)// observations lag behind
        // expect less than 0.1% difference in price (actual Price is TWAP) expected calculation does not weight by time
        expect(diff(actualPrice, expected)  <= 1e10).to.be.true
    })
    it("Remove liquidity, make swaps", async () => {
        // remove liquidity
        // approve transfer of tokens
        await (await cantoEthPair.approve(router.address, lpTokens)).wait()
        await (await router.removeLiquidityCANTO(
            eth.address,
            false,
            lpTokens,
            0,0,
            dep.address,
            9999999999
        )).wait()
        // write observations
        // update array values
        totalSupplies.push((await cantoEthPair.totalSupply()).toBigInt())
        cantoReserves.push((await cantoEthPair.reserve0()).toBigInt())
        ethReserves.push((await cantoEthPair.reserve1()).toBigInt())
        // update price samples (amt of note for )
        let cantoToEth = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), weth.address)).toBigInt()
        pricesCanto.push(cantoToEth)
        let ethToCanto = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), eth.address)).toBigInt()
        pricesEth.push(ethToCanto)
    })
    it("Get Price of lpToken", async () => {
        // actual price 
        let cumulative : Array<any> = new Array<any>()
        let actualPrice = (await router.getUnderlyingPrice(delegator.address)).toBigInt()
        // calculate expected price of lpToken = avg_i ((reserve_1 + reserve_2 * price_{1->2}) / totalSupply_i) 
        let idx = cantoReserves.length - 9
        for (var i = idx; i < cantoReserves.length; i++) { 
            cumulative[i - idx] = (ethReserves[i] * pricesEth[i] + cantoReserves[i] ) / totalSupplies[i]
        }
        let expectedCanto = avg(cumulative, 0) 
        let CantoPrice =  (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        let EthPrice = (await router.getUnderlyingPrice(cEth.address)).toBigInt()
        let expected = expectedCanto * CantoPrice / BigInt(1e18)
        expect(Number(diff(expected, actualPrice)) / Number(actualPrice) <= 0.001).to.be.true
        let pairEthBal = (await cantoEthPair.reserve1()).toBigInt()
        let pairWethBal = (await cantoEthPair.reserve0()).toBigInt()
        let totalSupply = (await cantoEthPair.totalSupply()).toBigInt()
        let actual = BigInt(totalSupply * actualPrice)
        let conversion = avg(pricesEth, ethReserves.length - 9)
        let expectedPrice = BigInt(((pairEthBal * conversion) + pairWethBal) * CantoPrice) / BigInt(1e18)
        expect(Number(diff(expectedPrice,actual))/ Number(actual) <= 0.01).to.be.true
    })
    it("Now swap some number of times and see how the price begins to change", async () => {
         // swap 10 times in pool observe totalSupply/ totalReserves changing periodically and obtain price 
        //approve transfers
        await (await eth.approve(router.address, ethers.utils.parseUnits("10", "18")))
        for(var i = 0; i < 4; i++) {
            //swap note for canto
            await (await router.swapExactTokensForTokensSimple(
                ethers.utils.parseUnits("1", "18"),
                0,
                eth.address,
                weth.address,
                false,
                dep.address,
                9999999999999
            )).wait()
            // update array values
            totalSupplies.push((await cantoEthPair.totalSupply()).toBigInt())
            cantoReserves.push((await cantoEthPair.reserve0()).toBigInt())
            ethReserves.push((await cantoEthPair.reserve1()).toBigInt())
            // update price samples (amt of note for )
            let cantoToEth = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), weth.address)).toBigInt()
            pricesCanto.push(cantoToEth)
            let ethToCanto = (await cantoEthPair.getAmountOut(ethers.utils.parseUnits("1", "18"), eth.address)).toBigInt()
            pricesEth.push(ethToCanto)
        }
        // actual price
        let actualPrice = (await router.getUnderlyingPrice(cEth.address)).toBigInt()
        // sample does not factor most recent observation into account
        let expected = avg(pricesEth, cantoReserves.length - 9) * (await router.getUnderlyingPrice(cCanto.address)).toBigInt() / BigInt(1e18) // observations lag behind
        // expect less than 0.1% difference in price (actual Price is TWAP) expected calculation does not weight by time
        expect(diff(actualPrice, expected)  == BigInt(0)).to.be.true
    })   
    it("Final LpToken PRice Check", async () => {
        // actual price 
        let cumulative : Array<any> = new Array<any>()
        let actualPrice = (await router.getUnderlyingPrice(delegator.address)).toBigInt()
        // calculate expected price of lpToken = avg_i ((reserve_1 + reserve_2 * price_{1->2}) / totalSupply_i) 
        let idx = cantoReserves.length - 9
        for (var i = idx; i < cantoReserves.length; i++) { 
            cumulative[i - idx] = (ethReserves[i] * pricesEth[i] + cantoReserves[i] ) / totalSupplies[i]
        }
        let expectedCanto = avg(cumulative, 0) 
        let CantoPrice =  (await router.getUnderlyingPrice(cCanto.address)).toBigInt()
        let EthPrice = (await router.getUnderlyingPrice(cEth.address)).toBigInt()
        let expected = expectedCanto * CantoPrice / BigInt(1e18)
        expect(Number(diff(expected, actualPrice)) / Number(actualPrice) <= 0.001).to.be.true
        let pairEthBal = (await cantoEthPair.reserve1()).toBigInt()
        let pairWethBal = (await cantoEthPair.reserve0()).toBigInt()
        let totalSupply = (await cantoEthPair.totalSupply()).toBigInt()
        let actual = BigInt(totalSupply * actualPrice)
        let conversion = avg(pricesEth, ethReserves.length - 9)
        let expectedPrice = BigInt(((pairEthBal * conversion) + pairWethBal) * CantoPrice) / BigInt(1e18)
        expect(Number(diff(expectedPrice,actual))/ Number(actual) <= 0.01).to.be.true
    })
});