// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockHoney is ERC20 {
    struct MintToRecipient {
        address recipient;
        uint256 amount;
    }

    uint256 public dripAmount;

    mapping(address => uint256) public lastDrip;

    uint256 public cooldown = 1 days;

    constructor(
        MintToRecipient[] memory _mintToAddresses,
        uint256 _dripAmount
    ) ERC20("Honey", "HONEY") {
        for (uint256 i = 0; i < _mintToAddresses.length; i++) {
            _mint(_mintToAddresses[i].recipient, _mintToAddresses[i].amount);
        }

        dripAmount = _dripAmount;
    }

    function requestTokens() external {
        require(
            block.timestamp - lastDrip[msg.sender] >= cooldown,
            "Faucet: Cooldown period has not passed"
        );

        _mint(msg.sender, dripAmount);

        lastDrip[msg.sender] = block.timestamp;
    }

    function setCooldown(uint256 _cooldown) external {
        cooldown = _cooldown;
    }

    function setDripAmount(uint256 _dripAmount) external {
        dripAmount = _dripAmount;
    }
}
