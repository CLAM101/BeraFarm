// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./BetterEgg.sol";
import "./Interfaces/IBETTEREGG.sol";
import "./Interfaces/IBETTERCHICKENS.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";

interface IUniswapV2Pair {
    function getReserves() external view returns (uint112, uint112, uint32);
}

interface IJoeFactory {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address pair);
}

contract ChickenFarmButBetter is Ownable {
    //Emit payment events

    event IERC20TransferEvent(IERC20 indexed token, address to, uint256 amount);
    event IERC20TransferFromEvent(
        IERC20 indexed token,
        address from,
        address to,
        uint256 amount
    );
    event BoughtChickens(address sender, uint256 amount);
    event RewardsClaimed(address sender, uint256 amount);
    event ChickensBonded(address sender, uint256 amount);

    //SafeMathuse

    using SafeMath for uint256;

    //Variables
    IBETTERCHICKENS private chickenContract;
    IBETTEREGG private eggs;
    IERC20 private usdc;
    IUniswapV2Pair private eggWavaxPair;
    IUniswapV2Pair private usdcWavaxPair;
    IJoeFactory private factory;

    address public treasury;
    address private burn;

    uint256 ethPrice = 36;
    uint256 private dailyInterest;
    uint256 private nodeCost;
    uint256 private nodeBase;
    uint256 public bondDiscount;

    uint256 public claimTaxEggs = 8;
    uint256 public claimTaxBond = 12;
    uint256 public bondNodeStartTime;

    bool public isLive = false;
    uint256 totalNodes = 0;

    //Array

    address[] public farmersAddresses;

    //Farmers Struct

    struct Farmer {
        bool exists;
        uint256 nftBalance;
        uint256 bondNodes;
        uint256 claimsEggs;
        uint256 claimsBond;
        uint256 lastUpdate;
    }

    //Mappings

    mapping(address => Farmer) private farmers;

    //Constructor

    constructor(
        address _chickenContract,
        address _eggs, //Address of the $EGGS token to use in the platform
        address _usdc, //Address of USDC stablecoin
        address _pair, //Address of the liquidity pool
        address _treasury, //Address of a treasury wallet to hold fees and taxes
        uint256 _dailyInterest, //DailyInterest
        uint256 _nodeCost, //Cost of a node in $EGGS
        uint256 _bondDiscount, //% of discount of the bonding
        address _factory // Joe factory contract address
    ) {
        eggs = IBETTEREGG(_eggs);

        console.log("Pair in constructor", _pair);
        eggWavaxPair = IUniswapV2Pair(_pair);
        usdc = IERC20(_usdc);
        chickenContract = IBETTERCHICKENS(_chickenContract);
        factory = IJoeFactory(_factory);
        usdcWavaxPair = IUniswapV2Pair(
            factory.getPair(
                0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7,
                0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E
            )
        );
        treasury = _treasury;
        dailyInterest = _dailyInterest;
        nodeCost = _nodeCost.mul(1e18);
        nodeBase = SafeMath.mul(10, 1e18);
        bondDiscount = _bondDiscount;
    }

    //Price Checking Functions

    function getPrice() public view returns (uint256) {
        (uint256 reserveUsdc0, uint256 reserveUsdc1, ) = usdcWavaxPair
            .getReserves();

        uint256 avaxPrice = reserveUsdc0.div(reserveUsdc1);

        console.log("calculated avax price", avaxPrice);

        (uint256 reserve0, uint256 reserve1, ) = eggWavaxPair.getReserves();

        console.log("Reserve0", reserve0, "Reserve1", reserve1);

        require(reserve0 > 0 && reserve1 > 0, "Reserves not available");

        uint256 price = (uint256(reserve1) * avaxPrice) / uint256(reserve0);

        return price;
    }

    //Bond Setup

    function getBondCost() public view returns (uint256) {
        uint256 tokenPrice = getPrice();

        console.log("Token price from get price function", tokenPrice);
        uint256 basePrice = nodeCost.mul(tokenPrice).div(1e18);
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

    function setEggsAddr(address eggsaddress) public onlyOwner {
        eggs = IBETTEREGG(eggsaddress);
    }

    function setEggsTax(uint256 _claimTaxEggs) public onlyOwner {
        claimTaxEggs = _claimTaxEggs;
    }

    function setBondTax(uint256 _claimTaxBond) public onlyOwner {
        claimTaxBond = _claimTaxBond;
    }

    //Platform Settings

    function setPlatformState(bool _isLive) public onlyOwner {
        isLive = _isLive;
    }

    function setEthPrice(uint256 _ethPrice) public onlyOwner {
        ethPrice = _ethPrice;
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

    function setBondNodeStartTime(uint256 _newStartTime) external onlyOwner {
        bondNodeStartTime = _newStartTime;
    }

    //Node management - Buy - Claim - Bond - User front end

    /**
     * @notice Buy and deposit chickens for BetterEgg rewards
     * @param _amount amount of chicken NFTs to mint and deposit
     * @dev Purchases and autostakes chicken NFTs for BetterEgg rewards.\
     */
    function buyChickens(uint256 _amount) external {
        require(isLive, "Platform is offline");
        uint256 nodesOwned = chickenContract.balanceOf(msg.sender);
        uint256 betterEggOwned = eggs.balanceOf(msg.sender);

        uint256 transactionTotal = nodeCost.mul(_amount);
        require(nodesOwned < 100, "Max Chickens Owned");

        require(betterEggOwned >= transactionTotal, "Not enough $EGGS");
        chickenContract.buyChickens(msg.sender, _amount);

        Farmer memory farmer;
        if (farmers[msg.sender].exists) {
            farmer = farmers[msg.sender];
        } else {
            farmer = Farmer(true, 0, 0, 0, 0, 0);
            farmersAddresses.push(msg.sender);
        }

        eggs.transferFrom(msg.sender, address(this), transactionTotal);
        eggs.burn(address(this), transactionTotal);
        farmers[msg.sender] = farmer;
        updateClaims(msg.sender, _amount);

        totalNodes += _amount;

        emit BoughtChickens(msg.sender, _amount);
    }

    function bondChickens(uint256 _amount) external payable {
        require(isLive, "Platform is offline");
        require(
            block.timestamp >= bondNodeStartTime,
            "BondNode not available yet"
        );

        uint256 chickenBalance = chickenContract.balanceOf(msg.sender);
        uint256 nodesOwned = chickenBalance +
            farmers[msg.sender].bondNodes +
            _amount;
        require(nodesOwned < 101, "Max Chickens Owned");
        Farmer memory farmer;
        if (farmers[msg.sender].exists) {
            farmer = farmers[msg.sender];
        } else {
            farmer = Farmer(true, 0, 0, 0, 0, 0);
            farmersAddresses.push(msg.sender);
        }
        uint256 usdcAmount = getBondCost();
        uint256 transactionTotal = usdcAmount.mul(_amount);
        uint256 usdcBalance = usdc.balanceOf(msg.sender);
        require(usdcBalance >= transactionTotal, "Not enough $USDC");
        _transferFrom(usdc, msg.sender, address(treasury), transactionTotal);

        chickenContract.buyChickens(msg.sender, _amount);
        farmers[msg.sender] = farmer;
        updateClaims(msg.sender, _amount);
        farmers[msg.sender].bondNodes += _amount;
        totalNodes += _amount;

        emit ChickensBonded(msg.sender, _amount);
    }

    // function awardNode(address _address, uint256 _amount) public onlyOwner {
    //     uint256 nodesOwned = farmers[_address].eggsNodes +
    //         farmers[_address].bondNodes +
    //         _amount;
    //     require(nodesOwned < 101, "Max Chickens Owned");
    //     Farmer memory farmer;
    //     if (farmers[_address].exists) {
    //         farmer = farmers[_address];
    //     } else {
    //         farmer = Farmer(true, 0, 0, 0, 0, 0);
    //         farmersAddresses.push(_address);
    //     }
    //     farmers[_address] = farmer;
    //     updateClaims(_address);
    //     farmers[_address].eggsNodes += _amount;
    //     totalNodes += _amount;
    //     farmers[_address].lastUpdate = block.timestamp;
    // }

    // function compoundNode() public {
    //     uint256 pendingClaims = getTotalClaimable(msg.sender);
    //     uint256 nodesOwned = farmers[msg.sender].eggsNodes +
    //         farmers[msg.sender].bondNodes;
    //     require(
    //         pendingClaims > nodeCost,
    //         "Not enough pending eggsEggs to compound"
    //     );
    //     require(nodesOwned < 100, "Max Chickens Owned");
    //     updateClaims(msg.sender);
    //     if (farmers[msg.sender].claimsEggs > nodeCost) {
    //         farmers[msg.sender].claimsEggs -= nodeCost;
    //         farmers[msg.sender].eggsNodes++;
    //     } else {
    //         uint256 difference = nodeCost - farmers[msg.sender].claimsEggs;
    //         farmers[msg.sender].claimsEggs = 0;
    //         farmers[msg.sender].claimsBond -= difference;
    //         farmers[msg.sender].bondNodes++;
    //     }
    //     totalNodes++;
    // }

    function updateClaims(
        address _address,
        uint256 numberOfNewChickens
    ) internal {
        uint256 chickensOwned = chickenContract.balanceOf(msg.sender);
        uint256 chickenBalanceToCalcFrom = chickensOwned.sub(
            numberOfNewChickens
        );
        uint256 time = block.timestamp;
        uint256 timerFrom = farmers[_address].lastUpdate;
        if (timerFrom > 0)
            farmers[_address].claimsEggs += chickenBalanceToCalcFrom
                .mul(nodeBase)
                .mul(dailyInterest)
                .mul((time.sub(timerFrom)))
                .div(8640000);

        if (farmers[_address].claimsBond > 0) {
            farmers[_address].claimsBond += farmers[_address]
                .bondNodes
                .mul(nodeBase)
                .mul(dailyInterest)
                .mul((time.sub(timerFrom)))
                .div(8640000);
        }

        farmers[_address].lastUpdate = time;
    }

    function getTotalClaimable(address _user) public view returns (uint256) {
        uint256 time = block.timestamp;
        uint256 pendingEggs = farmers[_user]
            .nftBalance
            .mul(nodeBase)
            .mul(dailyInterest)
            .mul((time.sub(farmers[_user].lastUpdate)))
            .div(8640000);
        uint256 pendingBond = farmers[_user]
            .bondNodes
            .mul(
                nodeBase.mul(
                    dailyInterest.mul((time.sub(farmers[_user].lastUpdate)))
                )
            )
            .div(8640000);
        uint256 pending = pendingEggs.add(pendingBond);
        return
            farmers[_user].claimsEggs.add(farmers[_user].claimsBond).add(
                pending
            );
    }

    function getTaxEstimate() external view returns (uint256) {
        uint256 time = block.timestamp;
        uint256 pendingEggs = farmers[msg.sender]
            .nftBalance
            .mul(nodeBase)
            .mul(dailyInterest)
            .mul((time.sub(farmers[msg.sender].lastUpdate)))
            .div(8640000);
        uint256 pendingBond = farmers[msg.sender]
            .bondNodes
            .mul(nodeBase)
            .mul(dailyInterest)
            .mul((time.sub(farmers[msg.sender].lastUpdate)))
            .div(8640000);
        uint256 claimableEggs = pendingEggs.add(farmers[msg.sender].claimsEggs);
        uint256 claimableBond = pendingBond.add(farmers[msg.sender].claimsBond);
        uint256 taxEggs = claimableEggs.div(100).mul(claimTaxEggs);
        uint256 taxBond = claimableBond.div(100).mul(claimTaxBond);
        return taxEggs.add(taxBond);
    }

    function calculateTax() public returns (uint256) {
        updateClaims(msg.sender, 0);
        uint256 taxEggs = farmers[msg.sender].claimsEggs.div(100).mul(
            claimTaxEggs
        );
        uint256 taxBond = farmers[msg.sender].claimsBond.div(100).mul(
            claimTaxBond
        );
        uint256 tax = taxEggs.add(taxBond);

        console.log("Calculated Tax", tax);
        return tax;
    }

    function claim() external {
        require(
            farmers[msg.sender].exists,
            "sender must be registered farmer to claim yields"
        );

        uint256 nodesOwned = chickenContract.balanceOf(msg.sender);
        require(
            nodesOwned > 0,
            "sender must own at least one chicken to claim yields"
        );

        uint256 tax = calculateTax();
        uint256 reward = farmers[msg.sender].claimsEggs.add(
            farmers[msg.sender].claimsBond
        );
        uint256 toBurn = tax;
        uint256 toFarmer = reward.sub(tax);

        if (reward > 0) {
            farmers[msg.sender].claimsEggs = 0;
            farmers[msg.sender].claimsBond = 0;
            eggs.mint(msg.sender, toFarmer);
            eggs.burn(msg.sender, toBurn);
        }

        emit RewardsClaimed(msg.sender, reward);
    }

    //Platform Info

    function currentDailyRewards() external view returns (uint256) {
        uint256 dailyRewards = nodeBase.mul(dailyInterest).div(100);
        return dailyRewards;
    }

    function getOwnedNodes(address user) external view returns (uint256) {
        uint256 ownedNodes = farmers[user].nftBalance.add(
            farmers[user].bondNodes
        );
        return ownedNodes;
    }

    function getTotalNodes() external view returns (uint256) {
        return totalNodes;
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
