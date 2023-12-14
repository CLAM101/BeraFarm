// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IBETTERCHICKENS is IERC721 {
    // Function to buy chickens
    function buyChickens(address _reciever, uint256 _amount) external;

    // Function to get the formatted token URI
    function formatTokenURI() external view returns (string memory);
}
