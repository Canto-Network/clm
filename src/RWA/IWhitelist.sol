pragma solidity ^0.8.10;

interface IWhitelist {
    function isCustomer(
        address receiver
    ) external view returns (bool);
}
