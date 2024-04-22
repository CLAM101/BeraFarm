// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Interfaces/IFUZZTOKEN.sol";
import "hardhat/console.sol";
import "./Interfaces/IBERACUB.sol";

contract FuzzToken is IFUZZTOKEN, ERC20, Ownable {
    uint256 private initialSupply;
    uint256 public maxSupply;
    uint256 public totalBurned;

    IBERACUB public beraCubNftContract;

    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    mapping(address => bool) private isController;
    event ControllerRemoved(address controllerRemoved);
    event ControllerAdded(address newController);

    bool public hibernating = true;
    bool public cubsOnly = true;
    bool public tradingEnabled = false;
    address public treasuryAddress;
    address public beraFarmAddress;
    uint256 public maxTransactionPercent = 1;
    uint256 private maxTransactionAmount;
    address public liquidityPool;

    constructor(
        uint256 _initialSupply,
        uint256 _maxSupply,
        address _treasuryAddress,
        address _beraCubNftContract
    ) ERC20("Fuzz Token", "FUZZ") {
        initialSupply = _initialSupply;
        maxSupply = _maxSupply;
        treasuryAddress = _treasuryAddress;
        isController[msg.sender] = true;
        _mint(msg.sender, initialSupply);
        beraCubNftContract = IBERACUB(_beraCubNftContract);
        maxTransactionAmount = initialSupply.mul(maxTransactionPercent).div(
            100
        );
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        if (!tradingEnabled) {
            require(
                from == owner() || to == owner(),
                "Patience - Trading Not Started Yet!"
            );
            return;
        }
        if (cubsOnly && to != address(0) && to != beraFarmAddress) {
            console.log("To address", to);
            uint256 traderCubbalance = beraCubNftContract.balanceOf(to);

            console.log("Trader Cub Balance: %s", traderCubbalance);
            require(
                traderCubbalance > 0,
                "Cubs Only Is active - You need to have a Bera Cub to trade FUZZ!"
            );
        }

        // Allow deployer (owner) to send/receive any amount and the liquidityPool to receive any amount.
        // This allows for loading of the LP, and for people to sell tokens into the LP whilst hibernation in progress.
        if (hibernating && from != owner() && to != liquidityPool) {
            // Require that a receiving wallet will not hold more than 1% of supply after a transfer whilst hibernation is in effect

            uint256 newBalance = balanceOf(to).add(amount);

            require(
                newBalance <= totalSupply() / 100,
                "Just getting warmed up, limit of 1% of $FUZZ can be Traded until Bera Hibernation is complete!"
            );
        }
    }

    function mint(
        address to_,
        uint256 amount_
    ) external override onlyController {
        require(
            totalSupply().add(amount_) <= maxSupply,
            "Maximum supply reached"
        );
        _mint(to_, amount_);
    }

    function burn(
        address from_,
        uint256 amount_
    ) external override onlyController {
        totalBurned = totalBurned.add(amount_);
        _burn(from_, amount_);
    }

    function removeHibernation() external onlyOwner {
        hibernating = false;
    }

    function openTradingToNonCubsOwner() external onlyOwner {
        cubsOnly = false;
    }

    function closeTradingToNonCubsOwner() external onlyOwner {
        cubsOnly = true;
    }

    function openTradingToEveryone() external onlyController {
        cubsOnly = false;
    }

    function enableTrading() external onlyOwner {
        tradingEnabled = true;
    }

    function disableTrading() external onlyOwner {
        tradingEnabled = false;
    }

    function setBeraFarmAddress(address _beraFarmAddress) external onlyOwner {
        beraFarmAddress = _beraFarmAddress;
    }

    function addController(address toAdd_) external onlyOwner {
        isController[toAdd_] = true;
        emit ControllerAdded(toAdd_);
    }

    function isControllerAddress(
        address toCheck_
    ) external view returns (bool) {
        return isController[toCheck_];
    }

    function removeController(address toRemove_) external onlyOwner {
        isController[toRemove_] = false;
        emit ControllerRemoved(toRemove_);
    }

    function setpair(address _pair) external onlyOwner {
        liquidityPool = _pair;
    }

    modifier onlyController() {
        require(isController[_msgSender()], "Caller Not Controller");
        _;
    }

    function getPair() public view returns (address) {
        return liquidityPool;
    }
}
