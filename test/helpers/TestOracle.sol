pragma solidity ^0.8.10;

import "src/PriceOracle.sol";

contract TestOracle is PriceOracle {
    function getUnderlyingPrice(CToken cToken) external override pure returns (uint256) {
        return 1e18;
    }
}
