// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockHoney is ERC20 {
    constructor(
        uint256 _amountPerAddress,
        address[] memory _mintToAddresses
    ) ERC20("Honey", "HONEY") {
        _mint(msg.sender, _amountPerAddress);

        for (uint256 i = 0; i < _mintToAddresses.length; i++) {
            _mint(_mintToAddresses[i], _amountPerAddress);
        }
    }
}
