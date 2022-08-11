pragma solidity ^0.8.10;

import "src/Comptroller.sol";
import "src/Unitroller.sol";
import "src/Swap/BaseV1-core.sol";
import "forge-std/Test.sol";
import "src/ERC20.sol";
import "src/Note.sol";
import "src/PriceOracle.sol";
import "src/EIP20Interface.sol";
import "./ERC20Malicious.sol";
import "src/CNote.sol";
import "src/ComptrollerInterface.sol";

contract ERC20Test is ERC20 {
    constructor(string memory name, string memory symbol, uint256 totalSup, uint8 decimals) ERC20(name, symbol, totalSup, decimals) {}
    
    function mintTo(address to, uint256 amt) external {
        _mint(to, amt);
    }
}

contract NoteTest is Note {
    function mintTo(address target, uint amount) public {
        _mint(target, amount);
    }
}

contract MaliciousNote is ERC20Malicious { 
    CNote cnote;
    constructor(string memory name, string memory symbol, uint256 totalSup, uint8 decimals) ERC20Malicious(name, symbol, totalSup, decimals) {}

    function setCNote(address cnote_) external {
        cnote = CNote(cnote_); // instantiate CNote object
    }

    function transferFrom(
        address from, 
        address to, 
        uint256 amount
    ) public override returns(bool) { 
        super.transferFrom(from, to, amount);
        // now re-enter the cNote Contract
        cnote.mint(0); // this should fail in mintInternal due to Re-entrancy
    }
}

contract TestPriceOracle is PriceOracle {
    function getUnderlyingPrice(CToken ctoken) override external view returns(uint) {
        return 1e18;
    }
}


abstract contract Helpers is Test {
    Comptroller public comptroller_;
    Unitroller public unitroller_ ;
    // BaseV1Factory public factory_ = new BaseV1Factory();

    function setUpComptroller() internal {
        comptroller_ = new Comptroller();
        unitroller_ = new Unitroller();
        unitroller_._setPendingImplementation(address(comptroller_));
        comptroller_._become(unitroller_);
    }
}
