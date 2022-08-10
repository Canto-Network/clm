// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import "../../contracts/Governance/GovernorBravoDelegate.sol";

contract GovernorBravoImmutable is GovernorBravoDelegate {

    constructor(
            address timelock_,
            address admin_) {
        admin = msg.sender;
        initialize(timelock_);

        admin = admin_;
    }


    function initialize(address timelock_) override public {
        require(msg.sender == admin, "GovernorBravo::initialize: admin only");
        require(address(timelock) == address(0), "GovernorBravo::initialize: can only initialize once");

        timelock = TimelockInterface(timelock_);
        unigov = IProposal(0x30E20d0A642ADB85Cb6E9da8fB9e3aadB0F593C0);
    }

    function _initiate() public {
        proposalCount = 1;
        initialProposalId = 1;
    }
}
