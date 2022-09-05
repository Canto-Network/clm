# Oracle Audit

# BaseV1-Periphery

## getUnderlyingPrice (SLOC: 487 - 522) -

Given a cToken, references the underlying asset (or Wcanto in the case of CCanto), and returns the TWAP of the spot prices, determined from the last 8 observations made in the Note/underlyingAsset pool. The result from this calculation is scaled by 1e18, to abide by conventions specified for floating point representations in Compound.

## getPriceLP (SLOC: 549 - 593) -

Given a cLpToken, that is, a cToken whose underlying asset is an lpToken, returns the TWA of the last 8 observations of the TVL / totalLpReserves. This value is also scaled by 1e18. 

## getPriceCanto (SLOC: 525 - 534) -

Returns the price of the asset in Canto. This is called for deriving the price of volatile assets, as all volatile assets will be swapped in pools between the asset and Canto

## getPriceNote (SLOC: 537 - 546) -

Returns the price of the asset in Note. This is called for the deriving the price of stable assets. All stable assets are swapped in pools between the asset and Note. 

# BaseV1-Core

## _update (SLOC: 137 - 153) -

Adds the current values of the reserves and totalSupply times the timeDiff between the last observations to the supply, reserve accumulators.

## reserves (SLOC: 224 - 237) -

Calls sample Reserves.

## sampleReserves (SLOC: 237 - 259) -

Averages reserves of either asset from the last n observations, spaced out in index by window.

## totalSupplyAvg (SLOC: 260 - 269) -

Calls sample supply

## sampleSupply (SLOC: 271 - 289) -

Averages the totalSupply from the last n observations, spaced out in index by window.
