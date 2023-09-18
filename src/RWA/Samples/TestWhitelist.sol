pragma solidity ^0.8.10;

import "../IWhitelist.sol";


/**
 * @title   TestWhitelist
 * @dev     Test contract for the RWA whitelist
 * @notice  This contract is for testing purposes only
 */

contract TestWhitelist is IWhitelist {
    mapping(address => bool) public whitelist;

    function setWhitelisted(address _address, bool _whitelisted) external {
        whitelist[_address] = _whitelisted;
    }

    function isCustomer(address receiver) external view override returns (bool) {
        return whitelist[receiver];
    }
}