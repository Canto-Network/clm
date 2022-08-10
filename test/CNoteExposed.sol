pragma solidity ^0.8.10;

import "src/CErc20Delegate.sol";
import "src/Accountant/AccountantInterfaces.sol";
import "src/Treasury/TreasuryInterfaces.sol";
import "src/ErrorReporter.sol";
import "src/NoteInterest.sol";


contract CNoteExposed is CNote {
    function doTransferInExposed(address from, uint amount) external returns(uint) {
        return super.doTransferIn(from, amount);
    }

    function doTransferOutExposed(address payable to, uint amount) external {
        super.doTransferOut(to, amount);
    }
}