// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "base64-sol/base64.sol";
import "hardhat/console.sol";

contract BetterChicken is ERC721URIStorage {
    uint256 public tokenCounter;

    event MintedChicken(address sender, uint256 tokenId);

    constructor() ERC721("SVG NFT", "SVG") {
        tokenCounter = 0;
    }

    function buyChickens(address _reciever, uint256 _amount) public {
        string memory tokenURI = formatTokenURI();

        for (uint256 i = 0; i < _amount; i++) {
            tokenCounter = tokenCounter + 1;
            _safeMint(_reciever, tokenCounter);
            _setTokenURI(tokenCounter, tokenURI);
            tokenCounter = tokenCounter + 1;

            emit MintedChicken(_reciever, tokenCounter);
        }
    }

    function formatTokenURI() public pure returns (string memory) {
        string memory baseURL = "data:application/json;base64,";

        return
            string(
                abi.encodePacked(
                    baseURL,
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                "War Chicken",
                                '", "description":"An NFT based on SVG!", "attributes":"", "image":"',
                                "https://ivory-fierce-cat-639.mypinata.cloud/ipfs/Qmek4YeBuANk8ynpfX1Vb8xwnwRtSYfdGc2EFfKZSaT7V5?_gl=1*1ipzxby*_ga*NjMwOTM0NDU1LjE3MDE5NzI1NjU.*_ga_5RMPXG14TE*MTcwMjQwMjc5Mi41LjEuMTcwMjQwMzI0NS4zNi4wLjA.",
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}
