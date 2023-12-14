// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor(uint256 _initialSupply) ERC20("USDC", "USDC") {
        _mint(msg.sender, _initialSupply = 10 ** 18);
    }
}
