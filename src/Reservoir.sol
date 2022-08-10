// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import "src/WETH.sol"; 

/**
 * @title Reservoir Contract
 * @notice Distributes a wcanto to a different contract at a fixed rate.
 * @dev This contract must be poked via the `drip()` function every so often.
 * @author Compound
 */
contract Reservoir {

  /// @notice The block number when the Reservoir started (immutable)
  uint public dripStart;

  /// @notice wcantos per block that to drip to target (immutable)
  uint public dripRate;

  /// @notice Reference to wcanto to drip (immutable)
  WETH public wcanto; //WCanto

  /// @notice Target to receive dripped wcantos (immutable)
  address public target;

  /// @notice Amount that has already been dripped
  uint public dripped;

  /**
    * @notice Constructs a Reservoir
    * @param dripRate_ Numer of wcantos per block to drip
    * @param wcanto_ The wcanto to drip
    * @param target_ The recipient of dripped wcantos
    */
  constructor(uint dripRate_, WETH wcanto_, address target_) public {
    dripStart = block.number;
    dripRate = dripRate_;
    wcanto = wcanto_;
    target = target_;
    dripped = 0;
  }

  /**
    * @notice Drips the maximum amount of wcantos to match the drip rate since inception
    * @dev Note: this will only drip up to the amount of wcantos available.
    * @return The amount of wcantos dripped in this call
    */
  function drip() public returns (uint) {
    // First, read storage into memory
    WETH wcanto_ = wcanto;
    uint reservoirBalance_ = wcanto_.balanceOf(address(this)); // TODO: Verify this is a static call
    uint dripRate_ = dripRate;
    uint dripStart_ = dripStart;
    uint dripped_ = dripped;
    address target_ = target;
    uint blockNumber_ = block.number;

    // Next, calculate intermediate values
    uint dripTotal_ = mul(dripRate_, blockNumber_ - dripStart_, "dripTotal overflow");
    uint deltaDrip_ = sub(dripTotal_, dripped_, "deltaDrip underflow");
    uint toDrip_ = min(reservoirBalance_, deltaDrip_);
    uint drippedNext_ = add(dripped_, toDrip_, "tautological");

    // Finally, write new `dripped` value and transfer wcantos to target
    dripped = drippedNext_;
    wcanto_.transfer(target_, toDrip_);

    return toDrip_;
  }

  receive() external payable {
    WETH wcanto_ = wcanto;
    wcanto_.deposit{value: msg.value}(); // deposit what was sent to this contract and receive the requisite amount of wcanto
  }

  /* Internal helper functions for safe math */

  function add(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
    uint c;
    unchecked { c = a + b; }
    require(c >= a, errorMessage);
    return c;
  }

  function sub(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
    require(b <= a, errorMessage);
    uint c = a - b;
    return c;
  }

  function mul(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
    if (a == 0) {
      return 0;
    }
    uint c;
    unchecked { c = a * b; }
    require(c / a == b, errorMessage);
    return c;
  }

  function min(uint a, uint b) internal pure returns (uint) {
    if (a <= b) {
      return a;
    } else {
      return b;
    }
  }
}

import "./EIP20Interface.sol";
