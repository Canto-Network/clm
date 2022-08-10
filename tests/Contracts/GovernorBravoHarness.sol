// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import "../../contracts/Governance/GovernorBravoDelegate.sol";

contract GovernorBravoDelegateHarness is GovernorBravoDelegate {
	// @notice Harness initiate the GovenorBravo contract
	// @dev This function bypasses the need to initiate the GovernorBravo contract from an existing GovernorAlpha for testing.
	// Actual use will only use the _initiate(address) function
    function _initiate() public {
        proposalCount = 1;
        initialProposalId = 1;
    }

    function initialize(address timelock_) override public {
        require(msg.sender == admin, "GovernorBravo::initialize: admin only");
        require(address(timelock) == address(0), "GovernorBravo::initialize: can only initialize once");

        timelock = TimelockInterface(timelock_);
        unigov = IProposal(0x30E20d0A642ADB85Cb6E9da8fB9e3aadB0F593C0);
    }
}
