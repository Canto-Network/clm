export function setMarketParams(
    comptroller, 
    tokenAddress, 
    colatFactor,
    compSupplySpeed,
    compBorrowSpeed,
    borrowCap
    ) {
    console.log("supporting market for " + tokenAddress);
    await (await comptroller._supportMarket(tokenAddress)).wait();
    console.log("setting collateral factor")
    await (await comptroller._setCollateralFactor(tokenAddress, colatFactor)).wait();
    console.log("setting comp speed")
    await (await comptroller._setCompSpeeds([tokenAddress], [compSupplySpeed], [compBorrowSpeed])).wait();
    console.log("setting borrow cap") 
    await (await comptroller._setMarketBorrowCaps([tokenAddress], [borrowCap])).wait() //set the BorrowCap For this market

}

export function createCTokenMarket(
    cERC20Delegator, 
    underlyingAddress, 
    comptrollerAddress,
    modelAddress,
    initialExchangeRateMantissa,
    name, 
    symbol,
    decimals,
    deployerAddress,
    cTokenFactoryAddress,
    becomeImplementation
    ) {
    console.log("creating cToken Market for: " + name);
    const cToken = cERC20Delegator.deploy(
        underlyingAddress,
        comptrollerAddress,
        modelAddress,
        initialExchangeRateMantissa,
        name,
        symbol,
        decimals,
        deployerAddress,
        cTokenFactoryAddress,
        becomeImplementation
    );
    await cToken.deployed();
    resolvedAddress =await cToken.resolvedAddress;
    console.log(name + ": " + resolvedAddress);
    return resolvedAddress;
}