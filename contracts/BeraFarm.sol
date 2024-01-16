// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./FuzzToken.sol";
import "./Interfaces/IFUZZTOKEN.sol";
import "./Interfaces/IBERACUB.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";

interface IUniswapV2Pair {
    function getReserves() external view returns (uint112, uint112, uint32);
}

interface IXDEXFactory {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address pair);
}

contract BeraFarm is Ownable {
    //Emit payment events

    event IERC20TransferEvent(IERC20 indexed token, address to, uint256 amount);
    event IERC20TransferFromEvent(
        IERC20 indexed token,
        address from,
        address to,
        uint256 amount
    );
    event BoughtBeraCubs(address sender, uint256 amount);
    event RewardsClaimed(address sender, uint256 amount);
    event BeraCubsBonded(address sender, uint256 amount);

    //SafeMathuse
    using SafeMath for uint256;

    //Variables
    IBERACUB private beraCubNftContract;
    IFUZZTOKEN private fuzz;
    IERC20 private honey;

    // check how the bex works and if it is a fork of uniswap
    IUniswapV2Pair private fuzzBeraPair;
    IUniswapV2Pair private honeyWberaPair;
    IXDEXFactory private factory;
    address public treasury;
    address private burn;

    uint256 beraPrice = 1000;
    uint256 private dailyInterest;
    uint256 private beraCubCost;
    uint256 private beraCubBase;
    uint256 public bondDiscount;

    uint256 public claimTaxFuzz = 8;
    uint256 public claimTaxBond = 12;
    uint256 public bondBeraCubsStartTime;

    bool public isLive = false;

    //Array
    address[] public farmersAddresses;

    //Farmers Struct
    struct Farmer {
        bool exists;
        uint256 beraCubsBonded;
        uint256 claimsFuzz;
        uint256 lastUpdate;
    }

    //Mappings
    mapping(address => Farmer) private farmers;

    //Constructor
    constructor(
        address _beraContract, // address of Bera Cub NFT contract
        address _fuzz, //Address of the $FUZZ token to use in the platform
        address _honey, //Address of $Honey stablecoin
        address _pair, //Address of the liquidity pool
        address _treasury, //Address of a treasury wallet to hold fees and taxes
        uint256 _dailyInterest, //DailyInterest
        uint256 _nodeCost, //Cost of a node in $FUZZ
        uint256 _bondDiscount, //% of discount of the bonding
        address _factory // Joe factory contract address
    ) {
        fuzz = IFUZZTOKEN(_fuzz);

        fuzzBeraPair = IUniswapV2Pair(_pair);
        honey = IERC20(_honey);
        beraCubNftContract = IBERACUB(_beraContract);
        factory = IXDEXFactory(_factory);

        // these are testnet toke addresses adn would need to be replaced in the case of a mainnet deployment
        honeyWberaPair = IUniswapV2Pair(
            factory.getPair(
                0x7EeCA4205fF31f947EdBd49195a7A88E6A91161B,
                0x5806E416dA447b267cEA759358cF22Cc41FAE80F
            )
        );

        treasury = _treasury;
        dailyInterest = _dailyInterest;
        beraCubCost = _nodeCost.mul(1e18);
        beraCubBase = SafeMath.mul(10, 1e18);
        bondDiscount = _bondDiscount;
    }

    //Price Checking Functions
    function getFuzzPrice() public view returns (uint256) {
        (uint256 reserve0, uint256 reserve1, ) = fuzzBeraPair.getReserves();

        require(reserve0 > 0 && reserve1 > 0, "Reserves not available");

        uint256 convertedBeraToHoney = beraPrice.mul(1e18) * reserve1;
        uint256 price = convertedBeraToHoney / reserve0;

        return price;
    }

    //Bond Setup
    function getBondCost() public view returns (uint256) {
        uint256 tokenPrice = getFuzzPrice();

        uint256 basePrice = beraCubCost.mul(tokenPrice).div(1e18);
        uint256 discount = SafeMath.sub(100, bondDiscount);
        uint256 bondPrice = basePrice.mul(discount).div(100);

        return bondPrice;
    }

    function setBondDiscount(uint256 newDiscount) public onlyOwner {
        require(newDiscount <= 75, "Discount above limit");
        bondDiscount = newDiscount;
    }

    //Set Addresses

    function setTreasuryAddr(address treasuryAddress) public onlyOwner {
        treasury = treasuryAddress;
    }

    function setFuzzAddr(address fuzzAddress) public onlyOwner {
        fuzz = IFUZZTOKEN(fuzzAddress);
    }

    function setFuzzTax(uint256 _claimTaxFuzz) public onlyOwner {
        claimTaxFuzz = _claimTaxFuzz;
    }

    function setBondTax(uint256 _claimTaxBond) public onlyOwner {
        claimTaxBond = _claimTaxBond;
    }

    //Platform Settings

    function setPlatformState(bool _isLive) public onlyOwner {
        isLive = _isLive;
    }

    // will likely reeplace this if I can get an accurate price or a feed from an oracle when mainnet launches
    function setBeraPrice(uint256 _beraPrice) public onlyOwner {
        beraPrice = _beraPrice;
    }

    function setDailyInterest(uint256 _dailyInterest) public onlyOwner {
        dailyInterest = _dailyInterest;
    }

    function updateAllClaims() internal {
        uint256 i;
        for (i = 0; i < farmersAddresses.length; i++) {
            address _address = farmersAddresses[i];
            updateClaims(_address, 0);
        }
    }

    function setBondBeraCubsStartTime(
        uint256 _newStartTime
    ) external onlyOwner {
        bondBeraCubsStartTime = _newStartTime;
    }

    //Node management - Buy - Claim - Bond - User front end

    /**
     * @notice Buy and deposit Bera NFT's for FuzzToken rewards
     * @param _amount amount of Bera NFTs to mint and deposit
     * @dev Purchases and autostakes Bera NFTs for FuzzToken rewards.\
     */
    function buyBeraCubs(uint256 _amount) external {
        require(isLive, "Platform is offline");
        uint256 beraCubBalance = beraCubNftContract.balanceOf(msg.sender);
        uint256 fuzzOwned = fuzz.balanceOf(msg.sender);

        uint256 transactionTotal = beraCubCost.mul(_amount);
        require(beraCubBalance < 20, "Max Bera Cubs Owned");

        require(fuzzOwned >= transactionTotal, "Not enough $FUZZ");
        beraCubNftContract.buyBeraCubs(msg.sender, _amount);

        Farmer memory farmer;
        if (farmers[msg.sender].exists) {
            farmer = farmers[msg.sender];
        } else {
            farmer = Farmer(true, 0, 0, 0);
            farmersAddresses.push(msg.sender);
        }

        fuzz.transferFrom(msg.sender, address(this), transactionTotal);
        fuzz.burn(address(this), transactionTotal);
        farmers[msg.sender] = farmer;
        updateClaims(msg.sender, _amount);

        emit BoughtBeraCubs(msg.sender, _amount);
    }

    function bondBeras(uint256 _amount) external payable {
        require(isLive, "Platform is offline");
        require(
            block.timestamp >= bondBeraCubsStartTime,
            "Bond Bera Cub not available yet"
        );

        uint256 beraCubBalance = beraCubNftContract.balanceOf(msg.sender);
        uint256 beraCubsOwned = beraCubBalance + _amount;
        require(beraCubsOwned < 20, "Max Bera Cubs  Owned");
        Farmer memory farmer;
        if (farmers[msg.sender].exists) {
            farmer = farmers[msg.sender];
        } else {
            farmer = Farmer(true, 0, 0, 0);
            farmersAddresses.push(msg.sender);
        }
        uint256 honeyAmount = getBondCost();
        uint256 transactionTotal = honeyAmount.mul(_amount);

        uint256 honeyBalance = honey.balanceOf(msg.sender);

        require(honeyBalance >= transactionTotal, "Not enough $HONEY");
        _transferFrom(honey, msg.sender, address(treasury), transactionTotal);

        beraCubNftContract.buyBeraCubs(msg.sender, _amount);
        farmers[msg.sender] = farmer;
        updateClaims(msg.sender, _amount);
        farmers[msg.sender].beraCubsBonded += _amount;

        emit BeraCubsBonded(msg.sender, _amount);
    }

    function awardNode(address _address, uint256 _amount) public onlyOwner {
        uint256 beraCubsBalance = beraCubNftContract.balanceOf(_address);
        uint256 beraCubsOwned = beraCubsBalance + _amount;

        require(beraCubsOwned < 20, "Max Bera Cubs Owned");
        Farmer memory farmer;
        if (farmers[_address].exists) {
            farmer = farmers[_address];
        } else {
            farmer = Farmer(true, 0, 0, 0);
            farmersAddresses.push(_address);
        }
        farmers[_address] = farmer;
        updateClaims(_address, _amount);
    }

    function compoundNode() public {
        uint256 pendingClaims = getTotalClaimable(msg.sender);
        uint256 beraCubsOwned = beraCubNftContract.balanceOf(msg.sender);
        require(
            pendingClaims > beraCubCost,
            "Not enough pending $FUZZ to compound"
        );
        require(beraCubsOwned < 20, "Max Chickens Owned");

        require(
            farmers[msg.sender].claimsFuzz > beraCubCost,
            "Not enough $FUZZ to compound"
        );
        farmers[msg.sender].claimsFuzz -= beraCubCost;
        beraCubNftContract.buyBeraCubs(msg.sender, 1);

        updateClaims(msg.sender, 1);
    }

    function updateClaims(
        address _address,
        uint256 numberOfNewBeraCubs
    ) internal {
        uint256 beraCubsOwned = beraCubNftContract.balanceOf(msg.sender);
        uint256 beraCubsBalanceToCalcFrom = beraCubsOwned.sub(
            numberOfNewBeraCubs
        );
        uint256 time = block.timestamp;
        uint256 timerFrom = farmers[_address].lastUpdate;
        if (timerFrom > 0)
            farmers[_address].claimsFuzz += beraCubsBalanceToCalcFrom
                .mul(beraCubBase)
                .mul(dailyInterest)
                .mul((time.sub(timerFrom)))
                .div(8640000);

        farmers[_address].lastUpdate = time;
    }

    function getTotalClaimable(address _user) public view returns (uint256) {
        uint256 time = block.timestamp;
        uint256 beraCubBalance = beraCubNftContract.balanceOf(_user);
        uint256 pendingFuzz = beraCubBalance
            .mul(beraCubBase)
            .mul(dailyInterest)
            .mul((time.sub(farmers[_user].lastUpdate)))
            .div(8640000);

        return farmers[_user].claimsFuzz.add(pendingFuzz);
    }

    function getTaxEstimate() external view returns (uint256) {
        uint256 time = block.timestamp;
        uint256 beraCubBalance = beraCubNftContract.balanceOf(msg.sender);
        uint256 pendingFuzz = beraCubBalance
            .mul(beraCubBase)
            .mul(dailyInterest)
            .mul((time.sub(farmers[msg.sender].lastUpdate)))
            .div(8640000);

        uint256 claimableFuzz = pendingFuzz.add(farmers[msg.sender].claimsFuzz);

        uint256 taxFuzz = claimableFuzz.div(100).mul(claimTaxFuzz);

        return taxFuzz;
    }

    function calculateTax() public returns (uint256) {
        updateClaims(msg.sender, 0);
        uint256 taxFuzz = farmers[msg.sender].claimsFuzz.div(100).mul(
            claimTaxFuzz
        );

        return taxFuzz;
    }

    function claim() external {
        require(
            farmers[msg.sender].exists,
            "sender must be registered Bera Cub farmer to claim yields"
        );

        uint256 beraCubsOwned = beraCubNftContract.balanceOf(msg.sender);
        require(
            beraCubsOwned > 0,
            "sender must own at least one Bera Cub to claim yields"
        );

        uint256 tax = calculateTax();
        uint256 reward = farmers[msg.sender].claimsFuzz;
        uint256 toBurn = tax;
        uint256 toFarmer = reward.sub(tax);

        if (reward > 0) {
            farmers[msg.sender].claimsFuzz = 0;
            fuzz.mint(msg.sender, toFarmer);
            fuzz.burn(msg.sender, toBurn);
        }

        emit RewardsClaimed(msg.sender, reward);
    }

    //Platform Info
    function currentDailyRewards() external view returns (uint256) {
        uint256 dailyRewards = beraCubBase.mul(dailyInterest).div(100);
        return dailyRewards;
    }

    function getOwnedBeraCubs(address user) external view returns (uint256) {
        uint256 beraCubsOwned = beraCubNftContract.balanceOf(user);
        return beraCubsOwned;
    }

    function getTotalNodes() external view returns (uint256) {
        return beraCubNftContract.totalSupply();
    }

    //SafeERC20 transferFrom
    function _transferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 amount
    ) private {
        SafeERC20.safeTransferFrom(token, from, to, amount);

        //Log transferFrom to blockchain
        emit IERC20TransferFromEvent(token, from, to, amount);
    }
}
