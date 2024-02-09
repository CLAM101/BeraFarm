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
    address public uniswapPair;
    IUniswapV2Router02 private uniswapRouter;

    IBERACUB private beraCubNftContract;

    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    mapping(address => bool) private isController;
    event ControllerRemoved(address controllerRemoved);
    event ControllerAdded(address newController);

    bool public lubricating = true;
    bool public cubsOnly = true;
    address public treasuryAddress;
    uint256 public maxTransactionPercent = 1;
    uint256 private maxTransactionAmount;
    address public liquidityPool;

    constructor(
        uint256 _initialSupply,
        uint256 _maxSupply,
        address _treasuryAddress,
        address _honeyTokenAddress
    ) ERC20("Fuzz Token", "FUZZ") {
        IUniswapV2Router02 _uniswapRouter = IUniswapV2Router02(
            0xB6120De62561D702087142DE405EEB02c18873Bc
        );
        uniswapRouter = _uniswapRouter;

        uniswapPair = IUniswapV2Factory(_uniswapRouter.factory()).createPair(
            address(this),
            _honeyTokenAddress
        );
        initialSupply = _initialSupply;
        maxSupply = _maxSupply;
        treasuryAddress = _treasuryAddress;
        isController[msg.sender] = true;
        _mint(msg.sender, initialSupply);
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
        // If liquidityPool is address(0) we've not yet enabled trading. Liquidity Loading....
        if (liquidityPool == address(0)) {
            require(
                from == owner() || to == owner(),
                "Patience - Trading Not Started Yet!"
            );
            return;
        }
        if (cubsOnly) {
            uint256 traderCubbalance = beraCubNftContract.balanceOf(to);
            require(
                traderCubbalance > 0,
                "Cubs Only - You need to have a Bera Cub to trade FUZZ!"
            );
        }

        // Allow deployer (owner) to send/receive any amount and the liquidityPool to receive any amount.
        // This allows for loading of the LP, and for people to sell tokens into the LP whilst lubrication in progress.
        if (lubricating && from != owner() && to != liquidityPool) {
            // Require that a receiving wallet will not hold more than 1% of supply after a transfer whilst lubrication is in effect
            require(
                balanceOf(to) <= totalSupply() / 100,
                "Just getting warmed up, limit of 1% of Fuzz can be Traded until Lubrication is complete!"
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

    function removeLubrication() external onlyOwner {
        lubricating = false;
    }

    function openTradingToEveryone() external onlyOwner {
        cubsOnly = false;
    }

    // Define the LP address to enable trading!
    function setLiquidityPool(address _liquidityPool) external onlyOwner {
        liquidityPool = _liquidityPool;
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
        return uniswapPair;
    }
}
