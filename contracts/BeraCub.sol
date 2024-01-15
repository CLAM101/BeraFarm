// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "base64-sol/base64.sol";
import "hardhat/console.sol";

contract BeraCub is ERC721URIStorage {
    uint256 public tokenCounter;
    uint256 public maxSupply;
    bool public mintingOpen;

    event MintedBeraCub(address sender, uint256 tokenId);
    event MintingOpened(bool mintingOpen);
    event MintingPaused(bool mintingOpen);

    constructor(uint256 _maxSupply) ERC721("Bera Cub", "CUB") {
        tokenCounter = 0;
        maxSupply = _maxSupply;
    }

    function buyBeraCubs(address _reciever, uint256 _amount) public {
        string memory tokenURI = formatTokenURI();
        require(tokenCounter + _amount <= maxSupply, "All Bera Cubs Minted :(");
        for (uint256 i = 0; i < _amount; i++) {
            tokenCounter = tokenCounter + 1;
            _safeMint(_reciever, tokenCounter);
            _setTokenURI(tokenCounter, tokenURI);
            tokenCounter = tokenCounter + 1;

            emit MintedBeraCub(_reciever, tokenCounter);
        }
    }

    function totalSupply() public view returns (uint256) {
        return tokenCounter;
    }

    function openMinting() public {
        mintingOpen = true;
        emit MintingOpened(mintingOpen);
    }

    function pauseMinting() public {
        mintingOpen = false;
        emit MintingPaused(mintingOpen);
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
                                "Bera Cub",
                                '", "description":"A WIld Bera Cub Looking For Honey", "attributes":"", "image":"',
                                "https://ivory-fierce-cat-639.mypinata.cloud/ipfs/Qmek4YeBuANk8ynpfX1Vb8xwnwRtSYfdGc2EFfKZSaT7V5?_gl=1*1ipzxby*_ga*NjMwOTM0NDU1LjE3MDE5NzI1NjU.*_ga_5RMPXG14TE*MTcwMjQwMjc5Mi41LjEuMTcwMjQwMzI0NS4zNi4wLjA.",
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}
