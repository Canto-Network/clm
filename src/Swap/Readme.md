# Oracle Audit
## Total LOC: 155

# BaseV1-Periphery

## getUnderlyingPrice (SLOC: 487 - 522): 35 LOC -

Given a cToken, references the underlying asset (or Wcanto in the case of CCanto), and returns the TWAP of the spot prices, determined from the last 8 observations made in the Note/underlyingAsset pool. The result from this calculation is scaled by 1e18, to abide by conventions specified for floating point representations in Compound.

## getPriceLP (SLOC: 549 - 593): 14 LOC -

Given a cLpToken, that is, a cToken whose underlying asset is an lpToken, returns the TWA of the last 8 observations of the TVL / totalLpReserves. This value is also scaled by 1e18. 

## getPriceCanto (SLOC: 525 - 534): 9 LOC -

Returns the price of the asset in Canto. This is called for deriving the price of volatile assets, as all volatile assets will be swapped in pools between the asset and Canto

## getPriceNote (SLOC: 537 - 546): 9 LOC -

Returns the price of the asset in Note. This is called for the deriving the price of stable assets. All stable assets are swapped in pools between the asset and Note. 

# BaseV1-Core

## _update (SLOC: 137 - 153): 16 LOC -

Adds the current values of the reserves and totalSupply times the timeDiff between the last observations to the supply, reserve accumulators.

## reserves (SLOC: 224 - 237) 13 LOC -

Calls sample Reserves.

## sampleReserves (SLOC: 237 - 259): 22 LOC -

Averages reserves of either asset from the last n observations, spaced out in index by window.

## totalSupplyAvg (SLOC: 260 - 269): 9 LOC -

Calls sample supply

## sampleSupply (SLOC: 271 - 289): 18 LOC -

Averages the totalSupply from the last n observations, spaced out in index by window.
