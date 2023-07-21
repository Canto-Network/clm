pragma solidity ^0.8.10;

interface IRWAPriceOracle {
    function getUnderlyingPrice(address rwaCToken) external view returns (uint);
}
