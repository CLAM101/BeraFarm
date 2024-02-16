// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./FuzzToken.sol";
import "./Interfaces/IFUZZTOKEN.sol";
import "./Interfaces/IBERACUB.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";

//Interfaces
interface IUniswapV2Pair {
    function getReserves() external view returns (uint112, uint112, uint32);
}

interface IXDEXFactory {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address pair);
}

contract BeraFarm is Ownable, ReentrancyGuard {
    //SafeMathuse
    using SafeMath for uint256;

    //Events
    event IERC20TransferEvent(IERC20 indexed token, address to, uint256 amount);
    event IERC20TransferFromEvent(
        IERC20 indexed token,
        address from,
        address to,
        uint256 amount
    );
    event BoughtBeraCubsFuzz(
        address sender,
        uint256 amountOfCubs,
        uint256 transactionTotal
    );
    event BoughtBeraCubsHoney(
        address sender,
        uint256 amountOfCubs,
        uint256 transactionTotal
    );
    event BeraCubsBonded(
        address sender,
        uint256 amountOfCubs,
        uint256 transactionTotal
    );
    event BeraCubCompounded(address sender, uint256 compoundCost);
    event BeraCubsAwarded(address sender, uint256 amountOfCubs);
    event RewardsClaimed(address sender, uint256 rewardAfterTax, uint256 tax);

    //Addresses
    IBERACUB private beraCubNftContract;
    IFUZZTOKEN private fuzz;
    IERC20 private honey;
    IUniswapV2Pair private fuzzHoneyPair;
    IUniswapV2Pair private honeyWberaPair;
    IXDEXFactory private factory;
    address public treasury;

    //Platfrom Settings
    bool public isLive = false;
    bool public bondingClosedOwner = false;
    bool public buyBeraCubsHoneyOpen = false;
    bool public buyBeraCubsOpenFuzz = false;
    bool buyBeraCubsOpenFuzzOwner = true;
    bool public emissionsStarted = false;
    bool public emissionsClosedOwner = false;

    //Rates and Pricing
    uint256 public dailyInterest;
    uint256 public claimTaxFuzz;
    uint256 public honeyCostFirstBatch;
    // IMPORTANT!!!! this is at 3 for testing, up to 2500 before deployment
    uint256 public maxSupplyFirstBatch = 3;
    uint256 public honeyCostSecondBatch;
    uint256 public maxBondCostSoFar;
    uint256 public bondDiscount;
    uint256 public baseLineCompoundCost;
    uint256 private immutable beraCubBase;

    //Array
    address[] public farmersAddresses;

    //Farmers Struct
    struct Farmer {
        bool exists;
        uint256 beraCubsBonded;
        uint256 beraCubsCompounded;
        uint256 claimsFuzz;
        uint256 lastUpdate;
    }

    //Mappings
    mapping(address => Farmer) private farmers;

    constructor(
        address _beraCubNftContract, // address of Bera Cub NFT contract
        address _fuzz, //$FUZZ token
        address _honey, //$Honey stablecoin
        address _pair, //Vera Fuzz pool
        address _treasury, //Wallet to hold fees and taxes
        uint256 _dailyInterest, //as a percentage
        uint256 _maxBondCostSoFar, //Cost of a Bera Cub in $FUZZ
        uint256 _claimTaxFuzz, //As percentage
        uint256 _bondDiscount, //As percentge
        address _factory // Dex factory
    ) {
        fuzz = IFUZZTOKEN(_fuzz);
        fuzzHoneyPair = IUniswapV2Pair(_pair);
        honey = IERC20(_honey);
        beraCubNftContract = IBERACUB(_beraCubNftContract);
        factory = IXDEXFactory(_factory);
        baseLineCompoundCost = 5 * 1e18;
        // IMPORTANT!! these are testnet token addresses and would need to be replaced in the case of a mainnet deployment
        honeyWberaPair = IUniswapV2Pair(
            factory.getPair(
                0x7EeCA4205fF31f947EdBd49195a7A88E6A91161B,
                0x5806E416dA447b267cEA759358cF22Cc41FAE80F
            )
        );
        claimTaxFuzz = _claimTaxFuzz;

        treasury = _treasury;
        dailyInterest = _dailyInterest;
        maxBondCostSoFar = _maxBondCostSoFar.mul(1e18);
        maxBondCostSoFar = 5 * 1e18;
        //baseline interest rate is 10 Units of $FUZZ per day and can be adjsuted with the daily interest rate percentage
        beraCubBase = SafeMath.mul(10, 1e18);
        honeyCostFirstBatch = 5 * 1e18;
        honeyCostSecondBatch = 10 * 1e18;
        bondDiscount = _bondDiscount;
    }

    /**
     * @notice Buy and deposit Bera NFT's for FuzzToken rewards
     * @param _amount amount of Bera NFTs to mint and deposit
     * @dev Purchases and autostakes Bera NFTs for FuzzToken rewards.
     */
    function buyBeraCubsFuzz(uint256 _amount) external nonReentrant {
        require(isLive, "Platform is offline");
        require(buyBeraCubsOpenFuzzOwner, "Buy Bera Cubs is closed owner");
        uint256 totalSupply = getTotalBeraCubs();
        // IMPORTANT!!!! this is at 5 for testing, up to 5000 before deployment
        require(totalSupply >= 5, "Not enough Minted To Purchase With $Fuzz");
        require(totalSupply + _amount < 15000, "All Cubs sold out");
        uint256 beraCubBalance = beraCubNftContract.balanceOf(msg.sender);
        uint256 fuzzOwned = fuzz.balanceOf(msg.sender);

        uint256 beraCubsOwned = beraCubBalance + _amount;
        require(beraCubsOwned <= 20, "Max Bera Cubs Owned");

        uint256 transactionTotal = maxBondCostSoFar.mul(_amount);
        require(fuzzOwned >= transactionTotal, "Not enough $FUZZ");

        beraCubNftContract.buyBeraCubs(msg.sender, _amount);

        Farmer memory farmer;
        if (farmers[msg.sender].exists) {
            farmer = farmers[msg.sender];
        } else {
            farmer = Farmer(true, 0, 0, 0, 0);
            farmersAddresses.push(msg.sender);
        }

        fuzz.transferFrom(msg.sender, address(this), transactionTotal);
        fuzz.burn(address(this), transactionTotal);
        farmers[msg.sender] = farmer;
        _updateClaims(msg.sender, _amount);

        emit BoughtBeraCubsFuzz(msg.sender, _amount, transactionTotal);
    }

    /**
     * @notice Buy bera Cubs with $Honey stable coin
     * @param _amount amount of Bera NFTs to mint and deposit
     * @dev Purchases Bera Cubs for Honey.
     */
    function buyBeraCubsHoney(uint256 _amount) public nonReentrant {
        require(isLive, "Platform is offline");
        require(buyBeraCubsHoneyOpen, "Buy Bera Cubs is closed");

        uint256 totalSupplyBeforeAmount = getTotalBeraCubs();
        uint256 totalSupplyPlusAmount = totalSupplyBeforeAmount.add(_amount);

        // IMPORTANT!!!! this is at 6 for testing, up to 5000 before deployment
        require(
            totalSupplyPlusAmount < 6,
            "Honey Bera Cubs Sold Out buy with Fuzz"
        );

        uint256 transactionTotal;

        uint256 beraCubBalance = beraCubNftContract.balanceOf(msg.sender);
        uint256 beraCubsOwned = beraCubBalance + _amount;
        require(beraCubsOwned <= 20, "Max Bera Cubs Owned");

        if (
            totalSupplyBeforeAmount <= maxSupplyFirstBatch &&
            totalSupplyPlusAmount <= maxSupplyFirstBatch
        ) {
            transactionTotal = _amount.mul(honeyCostFirstBatch);
        } else if (totalSupplyBeforeAmount > maxSupplyFirstBatch) {
            transactionTotal = _amount.mul(honeyCostSecondBatch);
        } else if (
            totalSupplyBeforeAmount <= maxSupplyFirstBatch &&
            totalSupplyPlusAmount > maxSupplyFirstBatch
        ) {
            uint256 unitsAtSecondBatchPrice = totalSupplyPlusAmount.sub(
                maxSupplyFirstBatch
            );

            transactionTotal = unitsAtSecondBatchPrice.mul(
                honeyCostSecondBatch
            );

            uint256 remainingCubs = _amount.sub(unitsAtSecondBatchPrice);

            if (remainingCubs > 0) {
                uint256 remainingCost = remainingCubs.mul(honeyCostFirstBatch);
                transactionTotal = transactionTotal.add(remainingCost);
            }
        }

        uint256 honeyBalance = honey.balanceOf(msg.sender);

        require(honeyBalance >= transactionTotal, "Not enough $HONEY");

        Farmer memory farmer;
        if (farmers[msg.sender].exists) {
            farmer = farmers[msg.sender];
        } else {
            farmer = Farmer(true, 0, 0, 0, 0);
            farmersAddresses.push(msg.sender);
        }

        _transferFrom(honey, msg.sender, address(treasury), transactionTotal);

        beraCubNftContract.buyBeraCubs(msg.sender, _amount);
        farmers[msg.sender] = farmer;

        _updateClaims(msg.sender, _amount);

        // IMPORTANT!!!! this is at 2 for testing, up to 1250 before deployment
        if (
            totalSupplyPlusAmount >= 2 &&
            !emissionsStarted &&
            !emissionsClosedOwner
        ) {
            _openEmissions();
        }

        // IMPORTANT!!!! this is at 5 for testing, up to 5000 before deployment
        if (totalSupplyPlusAmount >= 5) {
            fuzz.openTradingToEveryone();
        }

        emit BoughtBeraCubsHoney(msg.sender, _amount, transactionTotal);
    }

    /**
     * @notice Bond Bera Cubs for $Honey stable coin and auto deposit for FuzzToken rewards
     * @param _amount amount of Bera NFTs to mint and deposit
     * @dev Purchases and autostakes Bera NFTs in exchange for $Honey stable coin.
     */
    function bondBeraCubs(uint256 _amount) external nonReentrant {
        require(isLive, "Platform is offline");
        require(!bondingClosedOwner, "Bonding is closed owner");
        uint256 totalSupply = getTotalBeraCubs();
        // IMPORTANT!!!! this is at 5 for testing, up to 5000 before deployment
        require(
            totalSupply >= 5,
            "Bonding still closed please purchase with $Honey"
        );
        uint256 beraCubBalance = beraCubNftContract.balanceOf(msg.sender);
        uint256 beraCubsOwned = beraCubBalance + _amount;
        require(beraCubsOwned <= 20, "Max Bera Cubs Owned");

        uint256 honeyAmount = getBondCost();
        uint256 transactionTotal = honeyAmount.mul(_amount);

        uint256 honeyBalance = honey.balanceOf(msg.sender);

        console.log("Honey Balance in bond", honeyBalance);

        require(honeyBalance >= transactionTotal, "Not enough $HONEY");

        Farmer memory farmer;
        if (farmers[msg.sender].exists) {
            farmer = farmers[msg.sender];
        } else {
            farmer = Farmer(true, 0, 0, 0, 0);
            farmersAddresses.push(msg.sender);
        }
        _transferFrom(honey, msg.sender, address(treasury), transactionTotal);

        beraCubNftContract.buyBeraCubs(msg.sender, _amount);

        farmer.beraCubsBonded += _amount;
        farmers[msg.sender] = farmer;
        _updateClaims(msg.sender, _amount);

        emit BeraCubsBonded(msg.sender, _amount, transactionTotal);
    }

    /**
     * @notice Allows owner to award Bera Cubs to users
     * @param _amount amount of Bera NFTs to mint and deposit
     * @dev Alwards and autostakes Bera NFTs, only accessible by owner.
     */
    function awardBeraCubs(address _address, uint256 _amount) public onlyOwner {
        uint256 beraCubsBalance = beraCubNftContract.balanceOf(_address);

        uint256 beraCubsOwned = beraCubsBalance.add(_amount);

        require(beraCubsOwned <= 20, "Max Bera Cubs Owned");
        Farmer memory farmer;
        if (farmers[_address].exists) {
            farmer = farmers[_address];
        } else {
            farmer = Farmer(true, 0, 0, 0, 0);
            farmersAddresses.push(_address);
        }
        farmers[_address] = farmer;

        beraCubNftContract.buyBeraCubs(_address, _amount);
        _updateClaims(_address, _amount);

        emit BeraCubsAwarded(_address, _amount);
    }

    /**
     * @notice Allows for compounding of Bera Cubs
     * @dev Buys new Bera Cubs based on a chosen amount of Bera cubs to buy based on availble claimable rewards
     */
    function compoundBeraCubs() public nonReentrant {
        uint256 pendingClaims = getTotalClaimable(msg.sender);

        Farmer storage farmer = farmers[msg.sender];
        uint256 beraCubsCompounded = farmer.beraCubsCompounded;

        beraCubsCompounded += 1;

        uint256 compoundCost = beraCubsCompounded.mul(baseLineCompoundCost);

        require(
            pendingClaims > compoundCost,
            "Not enough pending $FUZZ to compound"
        );
        uint256 beraCubsOwned = beraCubNftContract.balanceOf(msg.sender);
        uint256 totalFinalBeraCubs = beraCubsOwned.add(1);

        require(totalFinalBeraCubs <= 20, "Max Bera Cubs Owned");
        _updateClaims(msg.sender, 0);

        beraCubNftContract.buyBeraCubs(msg.sender, 1);
        farmer.claimsFuzz -= compoundCost;

        farmer.beraCubsCompounded = beraCubsCompounded;

        uint256 newCompoundCost = compoundCost + baseLineCompoundCost;
        _checkAndAdjustFuzzCost(newCompoundCost);
        _updateClaims(msg.sender, 1);

        emit BeraCubCompounded(msg.sender, compoundCost);
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

        emit RewardsClaimed(msg.sender, toFarmer, tax);
    }

    //All view functions
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
        _updateClaims(msg.sender, 0);
        uint256 taxFuzz = farmers[msg.sender].claimsFuzz.div(100).mul(
            claimTaxFuzz
        );

        return taxFuzz;
    }

    function currentDailyRewards() external view returns (uint256) {
        uint256 dailyRewards = beraCubBase.mul(dailyInterest).div(100);
        return dailyRewards;
    }

    function getOwnedBeraCubs(address user) external view returns (uint256) {
        uint256 beraCubsOwned = beraCubNftContract.balanceOf(user);
        return beraCubsOwned;
    }

    function getTotalBeraCubs() public view returns (uint256) {
        return beraCubNftContract.totalSupply();
    }

    function getFuzzPrice() public view returns (uint256) {
        (uint256 token0, uint256 token1, ) = fuzzHoneyPair.getReserves();

        require(token0 > 0 && token1 > 0, "Reserves not available");

        uint256 price;

        if (honey > fuzz) {
            uint256 convertedToken0 = token0.div(1e18);
            price = token1.div(convertedToken0);
        } else {
            uint256 convertedToken1 = token1.div(1e18);
            price = token0.div(convertedToken1);
        }

        return price;
    }

    function getBondCost() public view returns (uint256) {
        uint256 tokenPrice = getFuzzPrice();

        uint256 convertedMaxBondCostSoFar = maxBondCostSoFar.div(1e18);

        uint256 basePrice = convertedMaxBondCostSoFar.mul(tokenPrice);
        uint256 discount = SafeMath.sub(100, bondDiscount);

        uint256 bondPrice = basePrice.mul(discount).div(100);

        return bondPrice;
    }

    function getFarmerByAddress(
        address _address
    ) external view returns (Farmer memory) {
        return farmers[_address];
    }

    //Internal functions
    function _updateAllClaims() internal {
        uint256 i;
        for (i = 0; i < farmersAddresses.length; i++) {
            address _address = farmersAddresses[i];
            _updateClaims(_address, 0);
        }
    }

    function _updateClaims(
        address _address,
        uint256 numberOfNewBeraCubs
    ) internal {
        uint256 time = block.timestamp;
        if (!emissionsStarted || emissionsClosedOwner) {
            farmers[_address].lastUpdate = time;
            return;
        }

        uint256 beraCubsOwned = beraCubNftContract.balanceOf(_address);
        uint256 beraCubsBalanceToCalcFrom = beraCubsOwned.sub(
            numberOfNewBeraCubs
        );

        uint256 timerFrom = farmers[_address].lastUpdate;
        if (timerFrom > 0) {
            farmers[_address].claimsFuzz += beraCubsBalanceToCalcFrom
                .mul(beraCubBase)
                .mul(dailyInterest)
                .mul((time.sub(timerFrom)))
                .div(8640000);
        }

        farmers[_address].lastUpdate = time;
    }

    function _transferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 amount
    ) private {
        SafeERC20.safeTransferFrom(token, from, to, amount);

        emit IERC20TransferFromEvent(token, from, to, amount);
    }

    function _checkAndAdjustFuzzCost(uint256 currentCost) internal {
        if (currentCost > maxBondCostSoFar) {
            maxBondCostSoFar = currentCost;
        }
    }

    function _openEmissions() internal {
        emissionsStarted = true;
    }

    //Only owner platform settings
    function setTreasuryAddr(address treasuryAddress) public onlyOwner {
        treasury = treasuryAddress;
    }

    function setFuzzAddr(address fuzzAddress) public onlyOwner {
        fuzz = IFUZZTOKEN(fuzzAddress);
    }

    function setFuzzTax(uint256 _claimTaxFuzz) public onlyOwner {
        claimTaxFuzz = _claimTaxFuzz;
    }

    function setPlatformState(bool _isLive) public onlyOwner {
        isLive = _isLive;
    }

    function setDailyInterest(uint256 _dailyInterest) public onlyOwner {
        dailyInterest = _dailyInterest;
    }

    function setBondDiscount(uint256 newDiscount) public onlyOwner {
        require(newDiscount <= 75, "Discount above limit");
        bondDiscount = newDiscount;
    }

    function openBonding() external onlyOwner {
        bondingClosedOwner = false;
    }

    function closeBonding() external onlyOwner {
        bondingClosedOwner = true;
    }

    function openBuyBeraCubsHoney() external onlyOwner {
        buyBeraCubsHoneyOpen = true;
    }

    function closeBuyBeraCubsHoney() external onlyOwner {
        buyBeraCubsHoneyOpen = false;
    }

    function openFuzzSaleOwner() external onlyOwner {
        buyBeraCubsOpenFuzzOwner = true;
    }

    function closeFuzzSaleOwner() external onlyOwner {
        buyBeraCubsOpenFuzzOwner = false;
    }

    function openEmissionsOwner() external onlyOwner {
        emissionsClosedOwner = false;
    }

    function closeEmissionsOwner() external onlyOwner {
        emissionsClosedOwner = true;
    }
}
