pragma solidity ^0.8.10;

interface IWhitelist {
    function isWhitelistedReceiver(
        address receiver
    ) external view returns (bool);
}
