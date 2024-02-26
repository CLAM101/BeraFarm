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
    IERC20 private immutable honey;
    IUniswapV2Pair private fuzzHoneyPair;
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

    //State Variables
    uint256 public dailyInterest;
    uint256 public claimTaxFuzz;
    uint256 public maxCompoundCostSoFar = 5 * 1e18;
    uint256 public bondDiscount;

    //Constants
    //Rates and Pricing
    uint256 public constant honeyCostFirstBatch = 5 * 1e18;
    uint256 public constant honeyCostSecondBatch = 10 * 1e18;
    uint256 public constant maxAllowedCompoundCost = 25 * 1e18;
    uint256 public constant baseLineCompoundCost = 5 * 1e18;
    //baseline interest rate is 10 Units of $FUZZ per day and can be adjsuted with the daily interest rate percentage
    uint256 private constant beraCubBase = 10 * 1e18;

    //Immutables
    //Supply limits
    uint256 public immutable maxSupplyFirstBatch;
    uint256 public immutable limitBeforeEmissions;
    uint256 public immutable limitBeforeFullTokenTrading;
    uint256 public immutable maxSupplyForHoney;

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
        address _pair, //Honey Fuzz pool
        address _treasury, //Wallet to hold fees and taxes
        uint256 _dailyInterest, //as a percentage
        uint256 _claimTaxFuzz, //As percentage
        uint256 _bondDiscount, //As percentge
        uint256 _maxSupplyForHoney, //Max supply of Bera Cubs for sale with $Honey
        uint256 _maxSupplyFirstBatch, //Max supply of Bera Cubs for sale with $Honey
        uint256 _limitBeforeEmissions, //Limit of Cubs to be sold befor emissions are turned on
        uint256 _limitBeforeFullTokenTrading,
        address _factory // Dex factory
    ) {
        beraCubNftContract = IBERACUB(_beraCubNftContract);
        fuzz = IFUZZTOKEN(_fuzz);
        honey = IERC20(_honey);
        fuzzHoneyPair = IUniswapV2Pair(_pair);
        treasury = _treasury;
        dailyInterest = _dailyInterest;
        claimTaxFuzz = _claimTaxFuzz;
        bondDiscount = _bondDiscount;
        maxSupplyForHoney = _maxSupplyForHoney;
        maxSupplyFirstBatch = _maxSupplyFirstBatch;
        limitBeforeEmissions = _limitBeforeEmissions;
        limitBeforeFullTokenTrading = _limitBeforeFullTokenTrading;
        factory = IXDEXFactory(_factory);
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

        require(
            totalSupply >= maxSupplyForHoney,
            "Not enough Minted To Purchase With $Fuzz"
        );

        uint256 beraCubBalance = beraCubNftContract.balanceOf(msg.sender);
        uint256 fuzzOwned = fuzz.balanceOf(msg.sender);

        uint256 beraCubsOwned = beraCubBalance + _amount;
        require(beraCubsOwned <= 20, "Max Bera Cubs Owned");

        uint256 transactionTotal = maxCompoundCostSoFar.mul(_amount);
        require(fuzzOwned >= transactionTotal, "Not enough $FUZZ");

        beraCubNftContract.buyBeraCubs(msg.sender, _amount);
        Farmer memory farmer;

        fuzz.transferFrom(msg.sender, address(this), transactionTotal);
        fuzz.burn(address(this), transactionTotal);
        farmers[msg.sender] = farmer;
        _updateClaims(msg.sender);

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

        console.log(
            "Total Supply in buy function",
            totalSupplyPlusAmount,
            "Max Supply",
            maxSupplyForHoney
        );

        require(
            totalSupplyPlusAmount <= maxSupplyForHoney,
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

        _transferFrom(honey, msg.sender, address(treasury), transactionTotal);

        beraCubNftContract.buyBeraCubs(msg.sender, _amount);

        _setOrUpdateFarmer(msg.sender);

        _updateClaims(msg.sender);

        if (
            totalSupplyPlusAmount >= limitBeforeEmissions &&
            !emissionsStarted &&
            !emissionsClosedOwner
        ) {
            _openEmissions();
        }

        if (totalSupplyPlusAmount >= limitBeforeFullTokenTrading) {
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

        console.log(
            "Total Supply in bond function",
            totalSupply,
            "Max Supply",
            maxSupplyForHoney
        );

        require(
            totalSupply >= maxSupplyForHoney,
            "Bonding still closed please purchase with $Honey"
        );
        uint256 beraCubBalance = beraCubNftContract.balanceOf(msg.sender);
        uint256 beraCubsOwned = beraCubBalance + _amount;
        require(beraCubsOwned <= 20, "Max Bera Cubs Owned");

        uint256 honeyAmount = getBondCost();
        uint256 transactionTotal = honeyAmount.mul(_amount);

        uint256 honeyBalance = honey.balanceOf(msg.sender);

        require(honeyBalance >= transactionTotal, "Not enough $HONEY");

        Farmer memory farmer;

        _transferFrom(honey, msg.sender, address(treasury), transactionTotal);

        beraCubNftContract.buyBeraCubs(msg.sender, _amount);

        farmer.beraCubsBonded += _amount;
        farmers[msg.sender] = farmer;
        _updateClaims(msg.sender);

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

        beraCubNftContract.buyBeraCubs(_address, _amount);
        _updateClaims(_address);

        emit BeraCubsAwarded(_address, _amount);
    }

    /**
     * @notice Allows for compounding of Bera Cubs
     * @dev Compounds 1 Cup per call, we dont use setOrUpdate farmer here as changes are quite specific to a compound
     */
    function compoundBeraCubs() public nonReentrant {
        require(
            emissionsStarted,
            "Compound not possible emissions not started"
        );
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
        _updateClaims(msg.sender);

        beraCubNftContract.buyBeraCubs(msg.sender, 1);

        console.log(
            "Claims Fuzz",
            farmer.claimsFuzz,
            "Compound cost",
            compoundCost
        );
        farmer.claimsFuzz -= compoundCost;

        farmer.beraCubsCompounded = beraCubsCompounded;

        uint256 newCompoundCost = compoundCost + baseLineCompoundCost;
        if (maxAllowedCompoundCost >= newCompoundCost) {
            _checkAndAdjustFuzzCost(newCompoundCost);
        }

        _updateClaims(msg.sender);

        emit BeraCubCompounded(msg.sender, compoundCost);
    }

    function claim() external {
        require(
            farmers[msg.sender].exists,
            "Sender must be registered Bera Cub farmer to claim"
        );

        uint256 tax = calculateTax();
        uint256 reward = farmers[msg.sender].claimsFuzz;
        uint256 toBurn = tax;
        uint256 toFarmer = reward.sub(tax);

        require(reward > 0, "No rewards available for claim");

        if (reward > 0) {
            farmers[msg.sender].claimsFuzz = 0;
            fuzz.mint(msg.sender, toFarmer);
            fuzz.burn(msg.sender, toBurn);
        }

        emit RewardsClaimed(msg.sender, toFarmer, tax);
    }

    function updateClaimsOnTokenTransfer(address _from, address _to) external {
        require(
            msg.sender == address(beraCubNftContract),
            "Only Bera Cub contract can call this function"
        );

        _setOrUpdateFarmer(_to);

        if (_from == address(0)) {
            _updateClaims(_to);
            return;
        }

        _updateClaims(_from);
        _updateClaims(_to);
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
        _updateClaims(msg.sender);
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

        uint256 convertedmaxCompoundCostSoFar = maxCompoundCostSoFar.div(1e18);

        uint256 basePrice = convertedmaxCompoundCostSoFar.mul(tokenPrice);
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
    function _setOrUpdateFarmer(address _farmerAddress) internal {
        Farmer memory farmer;
        if (farmers[_farmerAddress].exists) {
            farmer = farmers[_farmerAddress];
        } else {
            farmer = Farmer(true, 0, 0, 0, 0);
            farmersAddresses.push(_farmerAddress);
        }

        farmers[_farmerAddress] = farmer;
    }

    function _updateClaims(address _address) internal {
        uint256 time = block.timestamp;
        if (!emissionsStarted || emissionsClosedOwner) {
            farmers[_address].lastUpdate = time;
            return;
        }

        uint256 beraCubsOwned = beraCubNftContract.balanceOf(_address);

        uint256 timerFrom = farmers[_address].lastUpdate;
        if (timerFrom > 0) {
            farmers[_address].claimsFuzz += beraCubsOwned
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
        if (currentCost > maxCompoundCostSoFar) {
            maxCompoundCostSoFar = currentCost;
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
