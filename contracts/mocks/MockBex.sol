// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "hardhat/console.sol";

contract MockBex {
    address public honey;
    address public fuzz;

    uint256 public fuzzAmount;
    uint256 public honeyAmount;

    address public pairPool;

    // Assuming struct definitions from the ABI details provided
    struct PoolOptions {
        AssetWeight[] weights;
        uint256 swapFee;
    }

    struct AssetWeight {
        address asset;
        uint256 weight;
    }

    // Enum definition, assuming its details from the context in the ABI
    enum SwapKind {
        SwapIn,
        SwapOut
    }

    // Events (define according to your actual requirements)
    event LiquidityAdded(
        address indexed pool,
        address[] shares,
        uint256[] shareAmounts,
        address[] liquidity,
        uint256[] liquidityAmounts
    );
    event PoolCreated(address indexed pool);
    event LiquidityFetched(
        address indexed pool,
        address[] assets,
        uint256[] amounts
    );

    // constructor
    constructor(
        address _honey,
        address _fuzz,
        uint256 _honeyAmount,
        uint256 _fuzzAmount,
        address _pool
    ) {
        honey = _honey;
        fuzz = _fuzz;
        pairPool = _pool;

        honeyAmount = _honeyAmount;
        fuzzAmount = _fuzzAmount;
    }

    // Function to add liquidity to a pool
    function addLiquidity(
        address pool,
        address receiver,
        address[] calldata assetsIn,
        uint256[] calldata amountsIn
    )
        external
        payable
        returns (
            address[] memory shares,
            uint256[] memory shareAmounts,
            address[] memory liquidity,
            uint256[] memory liquidityAmounts
        )
    {
        // Implementation here...
        emit LiquidityAdded(
            pool,
            shares,
            shareAmounts,
            liquidity,
            liquidityAmounts
        );
    }

    // Function to create a new liquidity pool
    function createPool(
        string calldata name,
        address[] calldata assetsIn,
        uint256[] calldata amountsIn,
        string calldata poolType,
        PoolOptions calldata options
    ) external payable returns (address pool) {
        // Implementation here...
        emit PoolCreated(pool);
    }

    function getLiquidity(
        address pool
    ) external view returns (address[] memory asset, uint256[] memory amounts) {
        asset = new address[](2);
        asset[0] = honey;
        asset[1] = fuzz;

        amounts = new uint256[](2);
        amounts[0] = honeyAmount;
        amounts[1] = fuzzAmount;

        return (asset, amounts);
    }
}
