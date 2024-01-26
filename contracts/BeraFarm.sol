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
    event BoughtBeraCubsFuzz(address sender, uint256 amountOfCubs);
    event BoughtBeraCubsHoney(
        address sender,
        uint256 amountOfCubs,
        uint256 transactionTotal
    );
    event RewardsClaimed(address sender, uint256 rewardAfterTax, uint256 tax);
    event BeraCubsBonded(address sender, uint256 amountOfCubs);
    event BeraCubCompounded(address sender, uint256 amountOfCubs);
    event BeraCubsAwarded(address sender, uint256 amountOfCubs);

    //Addresses
    IBERACUB private beraCubNftContract;
    IFUZZTOKEN private fuzz;
    IERC20 private honey;
    IUniswapV2Pair private fuzzBeraPair;
    IUniswapV2Pair private honeyWberaPair;
    IXDEXFactory private factory;
    address public treasury;

    //Platfrom Settings
    bool public isLive = false;
    bool public bondingOpen = false;
    bool public buyBeraCubsOpen = false;
    bool public emissionsStarted = false;

    //Rates and Pricing
    uint256 private dailyInterest;
    uint256 public claimTaxFuzz = 8;
    uint256 public claimTaxBond = 12;
    uint256 public honeyCostFirstBatch = 5 * 1e18;
    uint256 public honeyCostSecondBatch = 10 * 1e18;
    uint256 public maxBondCostSoFar = 5;
    uint256 public bondDiscount;
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
        uint256 _bondDiscount, //As percentge
        address _factory // Dex factory
    ) {
        fuzz = IFUZZTOKEN(_fuzz);
        fuzzBeraPair = IUniswapV2Pair(_pair);
        honey = IERC20(_honey);
        beraCubNftContract = IBERACUB(_beraCubNftContract);
        factory = IXDEXFactory(_factory);

        // these are testnet token addresses and would need to be replaced in the case of a mainnet deployment
        honeyWberaPair = IUniswapV2Pair(
            factory.getPair(
                0x7EeCA4205fF31f947EdBd49195a7A88E6A91161B,
                0x5806E416dA447b267cEA759358cF22Cc41FAE80F
            )
        );

        treasury = _treasury;
        dailyInterest = _dailyInterest;
        maxBondCostSoFar = _maxBondCostSoFar.mul(1e18);

        //baseline interest rate is 10% APY but can be adjusted based on changes to daily interest
        beraCubBase = SafeMath.mul(10, 1e18);

        bondDiscount = _bondDiscount;
    }

    /**
     * @notice Buy and deposit Bera NFT's for FuzzToken rewards
     * @param _amount amount of Bera NFTs to mint and deposit
     * @dev Purchases and autostakes Bera NFTs for FuzzToken rewards.
     */
    function buyBeraCubsFuzz(uint256 _amount) external nonReentrant {
        require(isLive, "Platform is offline");
        require(buyBeraCubsOpen, "Buy Bera Cubs is closed");
        uint256 totalSupply = getTotalBeraCubs();
        require(totalSupply > 5000, "Not enough Minted To Purchase WIth $Fuzz");
        uint256 beraCubBalance = beraCubNftContract.balanceOf(msg.sender);
        uint256 fuzzOwned = fuzz.balanceOf(msg.sender);

        uint256 transactionTotal = maxBondCostSoFar.mul(_amount);

        uint256 beraCubsOwned = beraCubBalance + _amount;
        require(beraCubsOwned <= 20, "Max Bera Cubs Owned");

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
        updateClaims(msg.sender, _amount);

        emit BoughtBeraCubsFuzz(msg.sender, _amount);
    }

    /**
     * @notice Buy bera Cubs with $Honey stable coin
     * @param _amount amount of Bera NFTs to mint and deposit
     * @dev Purchases Bera Cubs for Honey.
     */
    function buyBeraCubsHoney(uint256 _amount) public {
        require(isLive, "Platform is offline");
        require(buyBeraCubsOpen, "Buy Bera Cubs is closed");
        uint256 totalSupply = getTotalBeraCubs();
        require(totalSupply < 5000, "Not enough Minted To Purchase WIth $Fuzz");

        // IMPORTANT!!!! this is at 6 for testing, up to 5000 before deployment
        require(totalSupply < 5, "Honey Bera Cubs Sold Out");

        uint256 transactionTotal;

        uint256 beraCubBalance = beraCubNftContract.balanceOf(msg.sender);
        uint256 beraCubsOwned = beraCubBalance + _amount;
        require(beraCubsOwned <= 20, "Max Bera Cubs Owned");

        // IMPORTANT!!!! this is at 3 for testing, up to 2500 before deployment
        if (totalSupply <= 3) {
            transactionTotal = _amount.mul(honeyCostFirstBatch);
        }
        // IMPORTANT!!!! this is at 3 for testing, up to 2500 before deployment
        if (totalSupply >= 3) {
            transactionTotal = _amount.mul(honeyCostSecondBatch);
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
        farmers[msg.sender].beraCubsBonded += _amount;

        updateClaims(msg.sender, _amount);

        emit BoughtBeraCubsHoney(msg.sender, _amount, transactionTotal);
    }

    /**
     * @notice Bond Bera Cubs for $Honey stable coin and auto deposit for FuzzToken rewards
     * @param _amount amount of Bera NFTs to mint and deposit
     * @dev Purchases and autostakes Bera NFTs in exchange for $Honey stable coin.
     */
    function bondBeraCubs(uint256 _amount) external payable nonReentrant {
        require(isLive, "Platform is offline");
        require(bondingOpen, "Bonding is closed");
        uint256 beraCubBalance = beraCubNftContract.balanceOf(msg.sender);
        uint256 beraCubsOwned = beraCubBalance + _amount;
        require(beraCubsOwned <= 20, "Max Bera Cubs Owned");

        uint256 honeyAmount = getBondCost();
        uint256 transactionTotal = honeyAmount.mul(_amount);

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
        updateClaims(msg.sender, _amount);
        farmers[msg.sender].beraCubsBonded += _amount;

        emit BeraCubsBonded(msg.sender, _amount);
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
        updateClaims(_address, _amount);

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

        if (beraCubsCompounded == 0) {
            beraCubsCompounded = 1;
        }

        uint256 compoundCost = beraCubsCompounded.mul(5);

        require(
            pendingClaims > compoundCost,
            "Not enough pending $FUZZ to compound"
        );
        uint256 beraCubsOwned = beraCubNftContract.balanceOf(msg.sender);
        uint256 totalFinalBeraCubs = beraCubsOwned.add(1);

        require(totalFinalBeraCubs <= 20, "Max Bera Cubs Owned");
        updateClaims(msg.sender, 0);

        beraCubNftContract.buyBeraCubs(msg.sender, 1);
        farmer.claimsFuzz -= compoundCost;
        _checkAndAdjustFuzzCost(compoundCost);
        updateClaims(msg.sender, 1);
        farmer.beraCubsCompounded += 1;

        emit BeraCubCompounded(msg.sender, 1);
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

        console.log("Pending Fuzz: %s", pendingFuzz);

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

    //Internal functions
    //Bond Setup

    //Price Checking Functions
    function getFuzzPrice() public view returns (uint256) {
        (uint256 beraReserve, uint256 fuzzReserve, ) = fuzzBeraPair
            .getReserves();

        require(beraReserve > 0 && fuzzReserve > 0, "Reserves not available");

        uint256 convertedBeraToHoney = beraPrice.mul(1e18) * beraReserve;
        uint256 price = convertedBeraToHoney / fuzzReserve;

        return price;
    }

    function getBondCost() public view returns (uint256) {
        uint256 tokenPrice = getFuzzPrice();

        uint256 basePrice = maxBondCostSoFar.mul(tokenPrice).div(1e18);
        uint256 discount = SafeMath.sub(100, bondDiscount);
        uint256 bondPrice = basePrice.mul(discount).div(100);

        return bondPrice;
    }

    function setBondDiscount(uint256 newDiscount) public onlyOwner {
        require(newDiscount <= 75, "Discount above limit");
        bondDiscount = newDiscount;
    }

    //Updates
    function updateAllClaims() internal {
        uint256 i;
        for (i = 0; i < farmersAddresses.length; i++) {
            address _address = farmersAddresses[i];
            updateClaims(_address, 0);
        }
    }

    function updateClaims(
        address _address,
        uint256 numberOfNewBeraCubs
    ) internal {
        if (!emissionsStarted) return;
        uint256 beraCubsOwned = beraCubNftContract.balanceOf(_address);
        uint256 beraCubsBalanceToCalcFrom = beraCubsOwned.sub(
            numberOfNewBeraCubs
        );
        uint256 time = block.timestamp;
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

    function setBondTax(uint256 _claimTaxBond) public onlyOwner {
        claimTaxBond = _claimTaxBond;
    }

    function setPlatformState(bool _isLive) public onlyOwner {
        isLive = _isLive;
    }

    // this will need to be replaced on mainnet launch if I can get a price feed from an oracle for Bera.
    function setBeraPrice(uint256 _beraPrice) public onlyOwner {
        beraPrice = _beraPrice;
    }

    function setDailyInterest(uint256 _dailyInterest) public onlyOwner {
        dailyInterest = _dailyInterest;
    }

    function openBonding() external onlyOwner {
        bondingOpen = true;
    }

    function closeBonding() external onlyOwner {
        bondingOpen = false;
    }

    function openBuyBeraCubs() external onlyOwner {
        buyBeraCubsOpen = true;
    }

    function closeBuyBeraCubs() external onlyOwner {
        buyBeraCubsOpen = false;
    }

    function openEmissions() external onlyOwner {
        emissionsStarted = true;
    }

    function closeEmissions() external onlyOwner {
        emissionsStarted = false;
    }
}
