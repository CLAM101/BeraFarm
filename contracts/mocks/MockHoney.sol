// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockHoney is ERC20 {
    struct MintToRecipient {
        address recipient;
        uint256 amount;
    }

    constructor(
        MintToRecipient[] memory _mintToAddresses
    ) ERC20("Honey", "HONEY") {
        for (uint256 i = 0; i < _mintToAddresses.length; i++) {
            _mint(_mintToAddresses[i].recipient, _mintToAddresses[i].amount);
        }
    }
}
