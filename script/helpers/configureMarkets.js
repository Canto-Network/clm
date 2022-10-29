const canto = require("../../config/index.js");
async function main() {
    const [dep] = await ethers.getSigners();

    const comptroller = new ethers.Contract(
        (await deployments.get("Unitroller")).address,
        (await deployments.get("Comptroller")).abi,
        dep
      )
    const Cantomarkets = require("../../config/markets.js");
    const markets = Cantomarkets.canto;

    // retrieve market parameters
    let cNote = await ethers.getContract("CNoteDelegator")
    let cCanto = await ethers.getContract("CCanto")
    let cAtom = await ethers.getContract("CAtomDelegator")
    let cEth = await ethers.getContract("CETHDelegator")
    let cUsdc = await ethers.getContract("CUsdcDelegator")
    let cUsdt = await ethers.getContract("CUsdtDelegator")
    let cCantoNote = await ethers.getContract("CCantoNoteDelegator")
    let cCantoEth = await ethers.getContract("CCantoEthDelegator")
    let cCantoAtom = await ethers.getContract("CCantoAtomDelegator")
    let cNoteUsdt = await ethers.getContract("CNoteUsdtDelegator")
    let cNoteUsdc = await ethers.getContract("CNoteUsdcDelegator")

    //configure the cNote market
    await (await comptroller._supportMarket(cNote.address)).wait()
    await (await comptroller._setCollateralFactor(cNote.address, markets.CNote.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cNote.address], [markets.CNote.compSupplySpeed], [markets.CNote.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cNote.address], [markets.CNote.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CNote configured")
    
    // configure cCanto market
    await (await comptroller._supportMarket(cCanto.address)).wait()
    await (await comptroller._setCollateralFactor(cCanto.address, markets.CCanto.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cCanto.address], [markets.CCanto.compSupplySpeed], [markets.CCanto.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cCanto.address], [markets.CCanto.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CCanto configured")

    // configure cAtom market
    await (await comptroller._supportMarket(cAtom.address)).wait()
    await (await comptroller._setCollateralFactor(cAtom.address, markets.CAtom.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cAtom.address], [markets.CAtom.compSupplySpeed], [markets.CAtom.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cAtom.address], [markets.CAtom.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CAtom configured")

    // configure cEth market
    await (await comptroller._supportMarket(cEth.address)).wait()
    await (await comptroller._setCollateralFactor(cEth.address, markets.CEth.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cEth.address], [markets.CEth.compSupplySpeed], [markets.CEth.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cEth.address], [markets.CEth.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CEth configured")

    // configure cUsdc market
    await (await comptroller._supportMarket(cUsdc.address)).wait()
    await (await comptroller._setCollateralFactor(cUsdc.address, markets.CUsdc.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cUsdc.address], [markets.CUsdc.compSupplySpeed], [markets.CUsdc.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cUsdc.address], [markets.CUsdc.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CUsdc configured")

    // configure cUsdt market
    await (await comptroller._supportMarket(cUsdt.address)).wait()
    await (await comptroller._setCollateralFactor(cUsdt.address, markets.CUsdt.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cUsdt.address], [markets.CUsdt.compSupplySpeed], [markets.CUsdt.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cUsdt.address], [markets.CUsdt.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CUsdt configured")    
    
    // configure cCantoNote market
    await (await comptroller._supportMarket(cCantoNote.address)).wait()
    await (await comptroller._setCollateralFactor(cCantoNote.address, markets.CCantoNote.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cCantoNote.address], [markets.CCantoNote.compSupplySpeed], [markets.CCantoNote.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cCantoNote.address], [markets.CCantoNote.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CCantoNote configured")   
    
    // configure cCantoEth market
    await (await comptroller._supportMarket(cCantoEth.address)).wait()
    await (await comptroller._setCollateralFactor(cCantoEth.address, markets.CCantoEth.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cCantoEth.address], [markets.CCantoEth.compSupplySpeed], [markets.CCantoEth.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cCantoEth.address], [markets.CCantoEth.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CCantoEth configured")   
    
    // configure cCantoAtom market
    await (await comptroller._supportMarket(cCantoAtom.address)).wait()
    await (await comptroller._setCollateralFactor(cCantoAtom.address, markets.CCantoAtom.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cCantoAtom.address], [markets.CCantoAtom.compSupplySpeed], [markets.CCantoAtom.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cCantoAtom.address], [markets.CCantoAtom.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CCantoAtom configured")   
        
    // configure cNoteUsdc market
    await (await comptroller._supportMarket(cNoteUsdc.address)).wait()
    await (await comptroller._setCollateralFactor(cNoteUsdc.address, markets.CNoteUsdc.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cNoteUsdc.address], [markets.CNoteUsdc.compSupplySpeed], [markets.CNoteUsdc.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cNoteUsdc.address], [markets.CNoteUsdc.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CNoteUsdc configured")   
        
    // configure cNoteUsdt market
    await (await comptroller._supportMarket(cNoteUsdt.address)).wait()
    await (await comptroller._setCollateralFactor(cNoteUsdt.address, markets.CNoteUsdt.CollateralFactor)).wait() // set the collateral factor for cNote
    await (await comptroller._setCompSpeeds ([cNoteUsdt.address], [markets.CNoteUsdt.compSupplySpeed], [markets.CNoteUsdt.compBorrowSpeed])).wait()
    await (await comptroller._setMarketBorrowCaps([cNoteUsdt.address], [markets.CNoteUsdt.borrowCap])).wait() //set the BorrowCap For this market
    console.log("CNoteUsdt configured")   
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});