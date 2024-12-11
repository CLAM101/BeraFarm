// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Interfaces/IBERAFARM.sol";
import "base64-sol/base64.sol";

contract BeraCub is Ownable, ERC721Enumerable, ERC721URIStorage {
    uint256 public tokenCounter;
    uint256 public maxSupply;
    bool public mintingOpen;
    address public beraFarmContract;
    mapping(address => bool) private isController;
    IBERAFARM private beraFarm;

    event MintedBeraCub(address sender, uint256 tokenId);
    event MintingOpened(bool mintingOpen);
    event MintingPaused(bool mintingOpen);
    event ControllerRemoved(address controllerRemoved);
    event ControllerAdded(address newController);

    constructor(uint256 _maxSupply) ERC721("Bera Cub", "CUB") {
        tokenCounter = 0;
        maxSupply = _maxSupply;
    }

    function buyBeraCubs(
        address _reciever,
        uint256 _amount
    ) public onlyController {
        require(mintingOpen, "MintingNotOpen");
        string memory formattedTokenURI = formatTokenURI();

        uint256 newTotalSupply = tokenCounter + _amount;
        require(newTotalSupply < maxSupply, "All Bera Cubs Minted :(");

        for (uint256 i = 0; i < _amount; i++) {
            _safeMint(_reciever, tokenCounter);

            _setTokenURI(tokenCounter, formattedTokenURI);
            tokenCounter = tokenCounter + 1;

            emit MintedBeraCub(_reciever, tokenCounter);
        }
    }

    function addBeraFarmContract(address _beraFarmContract) public onlyOwner {
        beraFarmContract = _beraFarmContract;
        beraFarm = IBERAFARM(beraFarmContract);
    }

    modifier onlyController() {
        require(isController[_msgSender()], "CallerNotController");
        _;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return tokenCounter;
    }

    function openMinting() public onlyOwner {
        mintingOpen = true;
        emit MintingOpened(mintingOpen);
    }

    function addController(address toAdd_) external onlyOwner {
        isController[toAdd_] = true;
        emit ControllerAdded(toAdd_);
    }

    function removeController(address toRemove_) external onlyOwner {
        isController[toRemove_] = false;
        emit ControllerRemoved(toRemove_);
    }

    function pauseMinting() public onlyOwner {
        mintingOpen = false;
        emit MintingPaused(mintingOpen);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._afterTokenTransfer(from, to, amount);

        beraFarm.updateClaimsOnTokenTransfer(from, to);
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
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
                                "Bear Cub",
                                '", "description":"A Wild Bear Cub Shedding its $FUZZ", "attributes":"", "image":"',
                                "https://ivory-fierce-cat-639.mypinata.cloud/files/bafybeiahpvhbidw6fty56rxgvbxhfwkmyqj4yi62ydgqk6ilh26d5g4xfe?X-Algorithm=PINATA1&X-Date=1733945093&X-Expires=30&X-Method=GET&X-Signature=b1600ab540f331d5804d04eaab99c315f0f5144ecb8b474648d0a1a85b5a7b87",
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}
