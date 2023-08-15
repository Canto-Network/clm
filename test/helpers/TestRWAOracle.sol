pragma solidity ^0.8.10;

import "src/RWA/IRWAPriceOracle.sol";

contract TestRWAOracle is IRWAPriceOracle {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, 1e18, 0, 0, 0);
    }
}
