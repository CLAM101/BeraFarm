// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Interfaces/IFUZZTOKEN.sol";
import "hardhat/console.sol";
import "./Interfaces/IBERACUB.sol";

interface IUniswapV2Factory {
    function createPair(
        address tokenA,
        address tokenB
    ) external returns (address pair);
}

interface IUniswapV2Router02 {
    function factory() external pure returns (address);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
}

contract FuzzToken is IFUZZTOKEN, ERC20, Ownable {
    uint256 private initialSupply;
    uint256 public maxSupply;

    IUniswapV2Router02 private uniswapRouter;

    IBERACUB private beraCubNftContract;

    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    mapping(address => bool) private isController;
    event ControllerRemoved(address controllerRemoved);
    event ControllerAdded(address newController);

    bool public hibernating = true;
    bool public cubsOnly = true;
    bool public tradingEnabled = false;
    address public treasuryAddress;
    uint256 public maxTransactionPercent = 1;
    uint256 private maxTransactionAmount;
    address public liquidityPool;

    constructor(
        uint256 _initialSupply,
        uint256 _maxSupply,
        address _treasuryAddress,
        address _honeyTokenAddress,
        address _beraCubNftContract
    ) ERC20("Fuzz Token", "FUZZ") {
        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(
            0xB6120De62561D702087142DE405EEB02c18873Bc
        );
        uniswapRouter = _uniswapRouter;

        liquidityPool = IUniswapV2Factory(_uniswapRouter.factory()).createPair(
            address(this),
            _honeyTokenAddress
        );
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
        if (cubsOnly && to != address(0)) {
            uint256 traderCubbalance = beraCubNftContract.balanceOf(to);
            require(
                traderCubbalance > 0,
                "Cubs Only Is active - You need to have a Bera Cub to trade FUZZ!"
            );
        }

        // Allow deployer (owner) to send/receive any amount and the liquidityPool to receive any amount.
        // This allows for loading of the LP, and for people to sell tokens into the LP whilst hibernation in progress.
        if (hibernating && from != owner() && to != liquidityPool) {
            // Require that a receiving wallet will not hold more than 1% of supply after a transfer whilst hibernation is in effect
            require(
                balanceOf(to) <= totalSupply() / 100,
                "Just getting warmed up, limit of 1% of Fuzz can be Traded until Bera Hibernation is complete!"
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
        _burn(from_, amount_);
    }

    function removeHibernation() external onlyOwner {
        hibernating = false;
    }

    function openTradingToEveryoneOwner() external onlyOwner {
        cubsOnly = false;
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

    function addController(address toAdd_) external onlyOwner {
        isController[toAdd_] = true;
        emit ControllerAdded(toAdd_);
    }

    function removeController(address toRemove_) external onlyOwner {
        isController[toRemove_] = false;
        emit ControllerRemoved(toRemove_);
    }

    modifier onlyController() {
        require(isController[_msgSender()], "CallerNotController");
        _;
    }

    function getPair() public view returns (address) {
        return liquidityPool;
    }
}
