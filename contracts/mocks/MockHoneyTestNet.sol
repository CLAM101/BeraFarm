// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockHoneyTestNet is ERC20 {
    constructor(uint256 _initialSupply) ERC20("MOCKHONEY", "MOCKHONEY") {
        _mint(msg.sender, _initialSupply);
    }
}
