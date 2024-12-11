// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IERC20 {
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract Faucet {
    IERC20 public token;
    uint256 public dripAmount;
    mapping(address => uint256) public lastDrip;

    uint256 public cooldown = 1 days;

    constructor(address _token, uint256 _dripAmount) {
        token = IERC20(_token);
        dripAmount = _dripAmount;
    }

    function requestTokens() external {
        require(
            block.timestamp - lastDrip[msg.sender] >= cooldown,
            "Faucet: Cooldown period has not passed"
        );

        require(
            token.transfer(msg.sender, dripAmount),
            "Faucet: Token transfer failed"
        );

        lastDrip[msg.sender] = block.timestamp;
    }

    function setCooldown(uint256 _cooldown) external {
        cooldown = _cooldown;
    }

    function setDripAmount(uint256 _dripAmount) external {
        dripAmount = _dripAmount;
    }
}
