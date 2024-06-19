// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error ItemNotForSale(address nftAddress, uint256 tokenId);
error NotListed(address nftAddress, uint256 tokenId);
error AlreadyListed(address nftAddress, uint256 tokenId);
error NoProceeds();
error NotOwner();
error NotApprovedForMarketplace();
error PriceMustBeAboveZero();

contract NftMarketplace is ReentrancyGuard {
    struct Listing {
        uint256 id;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    event ItemListed(
        uint256 indexed id,
        address indexed seller,
        address indexed nftAddress,
        uint256 tokenId,
        uint256 price
    );

    event ListingUpdated(
        uint256 indexed id,
        address indexed seller,
        address indexed nftAddress,
        uint256 tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 listingId
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    // State Variables
    Listing[] public activeListings;
    uint256[] private deletedIndexes;
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_proceeds;

    // Function modifiers
    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NotListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NotOwner();
        }
        _;
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId,
        uint256 listingId
    ) external payable isListed(nftAddress, tokenId) nonReentrant {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert PriceNotMet(nftAddress, tokenId, listedItem.price);
        }
        _removeFromActiveListings(listingId);
        delete (s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(
            listedItem.seller,
            msg.sender,
            tokenId
        );

        s_proceeds[listedItem.seller] += msg.value;
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert PriceMustBeAboveZero();
        }
        IERC721 nft = IERC721(nftAddress);
        if (
            nft.getApproved(tokenId) != address(this) &&
            nft.isApprovedForAll(msg.sender, address(this)) == false
        ) {
            revert NotApprovedForMarketplace();
        }
        uint256 listingId;
        if (deletedIndexes.length > 0) {
            listingId = deletedIndexes[deletedIndexes.length - 1];
            deletedIndexes.pop();
        } else {
            listingId = activeListings.length;
            activeListings.push();
        }
        Listing memory newListing = Listing({
            id: listingId,
            seller: msg.sender,
            nftContract: nftAddress,
            tokenId: tokenId,
            price: price,
            active: true
        });
        s_listings[nftAddress][tokenId] = newListing;
        activeListings[listingId] = newListing;

        emit ItemListed(newListing.id, msg.sender, nftAddress, tokenId, price);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice,
        uint256 listingId
    )
        external
        isListed(nftAddress, tokenId)
        nonReentrant
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (newPrice == 0) {
            revert PriceMustBeAboveZero();
        }

        s_listings[nftAddress][tokenId].price = newPrice;

        activeListings[listingId].price = newPrice;
        emit ListingUpdated(
            s_listings[nftAddress][tokenId].id,
            msg.sender,
            nftAddress,
            tokenId,
            newPrice
        );
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId,
        uint256 listingId
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        _removeFromActiveListings(listingId);
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId, listingId);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NoProceeds();
        }
        s_proceeds[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        require(success, "Transfer failed");
    }

    // internals

    function _removeFromActiveListings(uint256 listingId) internal {
        if (
            listingId < activeListings.length &&
            activeListings[listingId].active
        ) {
            activeListings[listingId] = Listing({
                id: 0,
                seller: address(0),
                nftContract: address(0),
                tokenId: 0,
                price: 0,
                active: false
            });
            deletedIndexes.push(listingId);
        }
    }

    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getActiveListings() external view returns (Listing[] memory) {
        return activeListings;
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
