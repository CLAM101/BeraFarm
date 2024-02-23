// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IBERAFARM {
    function updateClaimsOnTokenTransfer(address _from, address _to) external;
}
