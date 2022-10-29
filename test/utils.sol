pragma solidity ^0.8.10;

import "src/Comptroller.sol";
import "src/Unitroller.sol";
import {BaseV1Factory, BaseV1Pair} from "src/Swap/BaseV1-core.sol";
import {BaseV1Router01} from "src/Swap/BaseV1-periphery.sol"; 
import "forge-std/Test.sol";
import "src/ERC20.sol";
import "src/Note.sol";
import "src/PriceOracle.sol";
import "src/EIP20Interface.sol";
import "./ERC20Malicious.sol";
import "src/CNote.sol";
import "src/ComptrollerInterface.sol";
import {WETH} from "src/WETH.sol";
import {CErc20Delegator} from "src/CErc20Delegator.sol";
import {NoteRateModel} from "src/NoteInterest.sol";
import {CEther} from "src/CEther.sol";

contract ERC20Test is ERC20 {
    constructor(string memory name, string memory symbol, uint256 totalSup, uint8 decimals) ERC20(name, symbol, totalSup, decimals) {}
    
    function mintTo(address to, uint256 amt) external {
        _mint(to, amt);
    }
}

contract WCANTOTest is WETH {
    constructor(string memory name_, string memory symbol_) WETH(name_, symbol_){
        // mint all WETH to deployer on construction
        _balanceOf[msg.sender] = 1e27;
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
    NoteRateModel private noteRate = new NoteRateModel(0);

    // function to instantiate Comptroller, 
    function setUpComptroller() internal {
        comptroller_ = new Comptroller();
        unitroller_ = new Unitroller();
        unitroller_._setPendingImplementation(address(comptroller_));
        comptroller_._become(unitroller_);
    }

    // deploy CErc20
    function deployCErc20(address token) internal returns(CErc20Delegator) {
        // empty bytes
        bytes memory data;
        CErc20Delegate cerc20_ = new CErc20Delegate();
        CErc20Delegator cErc20Delegator = new CErc20Delegator(
            token,
            Comptroller(address(unitroller_)),
            noteRate,
            1,
            "cErc20",
            "cErc20",
            18,
            payable(msg.sender),
            address(cerc20_),
            data
        );
        return cErc20Delegator;
    }

    // Instantiate cNote / CCanto Lending Markets
    function deployCNote() internal returns(CErc20Delegator, NoteTest) { 
        // deploy NoteTest  
        NoteTest note = new NoteTest();
        
        // deploy CNOte
        CNote cnote_ = new CNote();
        // initialize empty implementation data
        bytes memory data; 
        CErc20Delegator cNoteDelegator = new CErc20Delegator(
            address(note),
            Comptroller(address(unitroller_)),
            noteRate,
            1,
            "cNote",
            "cNOte",
            18,
            payable(msg.sender),
            address(cnote_),
            data
        );

        return (cNoteDelegator, note);
    }

    // function for deploying cCanto
    function deployCCanto() internal returns(CEther) {
        // deploy CEther
        CEther ccanto = new CEther(
            comptroller_,
            noteRate,
            1,
            "cCANTO",
            "cCANTO",
            18,
            payable(msg.sender)
        );
        return ccanto;
    }

    // function to instantiate factory as well as router 
    function deployRouter(address wcanto_, address note_) internal returns(BaseV1Router01, BaseV1Factory) {
        // deploy Factory
        BaseV1Factory factory_ = new BaseV1Factory();
        // deploy router
        BaseV1Router01 router = new BaseV1Router01(address(factory_), wcanto_, note_, address(unitroller_));
        return (router, factory_);
    }
}
