// import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import "@nomicfoundation/hardhat-chai-matchers";
// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
// import { deployContracts } from "../testHelpers/deploy-contracts";
// import { BeraCub, BeraFarm, FuzzToken, MockHoney } from "../../typechain-types";
// import { oracleABI } from "../testHelpers/ABI/oracle-abi";
// import { ERC20DexABI } from "../testHelpers/ABI/ERC20dex-abi";
// import { ERC20ABI } from "../testHelpers/ABI/ERC20-abi";

// describe("Bera Farm Tests", async function () {
//   let beraCub: BeraCub,
//     beraFarm: BeraFarm,
//     fuzzToken: FuzzToken,
//     mockUSDC: MockHoney,
//     owner: HardhatEthersSigner,
//     mockHoney: MockHoney,
//     otherAccount: HardhatEthersSigner,
//     thirdAccount: HardhatEthersSigner,
//     fourthAccount: HardhatEthersSigner,
//     fifthAccount: HardhatEthersSigner,
//     sixthAccount: HardhatEthersSigner;
//   const oracleAddress = "0x9202Af6Ce925b26AE6B25aDfff0B2705147e195F";
//   const ERC20DexAddress = "0x0D5862FDBDD12490F9B4DE54C236CFF63B038074";
//   const otherDexAddress = "0x9D0FBF9349F646F1435072F2B0212084752EF460";
//   const poolAddress = "0x0000000000000000000000000000000000696969";
//   const honeyTokenAddress = "0x7EeCA4205fF31f947EdBd49195a7A88E6A91161B";

//   before(async function () {
//     const fixture = await loadFixture(deployContracts);
//     owner = fixture.owner;
//     mockHoney = fixture.mockHoney;
//     otherAccount = fixture.otherAccount;
//     thirdAccount = fixture.thirdAccount;
//     fourthAccount = fixture.fourthAccount;
//     fifthAccount = fixture.fifthAccount;
//     sixthAccount = fixture.sixthAccount;
//     beraCub = fixture.beraCub;
//     fuzzToken = fixture.fuzzToken;
//     beraFarm = fixture.beraFarm;
//   });

//   describe("Bera Farm Tests", async function () {
//     it("Gets Currency pairs from Oracle contract on testnet", async function () {
//       const awardBeraCub = await beraFarm
//         .connect(owner)
//         .awardBeraCubs(owner.address, 1);

//       await awardBeraCub.wait(1);

//       const stakingDuration = 24 * 3600;
//       await ethers.provider.send("evm_increaseTime", [stakingDuration]);
//       await ethers.provider.send("evm_mine");
//       const totalClaimable = await beraFarm.getTotalClaimable(owner.address);

//       console.log("Total Claimable: ", ethers.formatEther(totalClaimable));

//       const dailyRewards = await beraFarm.currentDailyRewards();

//       console.log("Daily Rewards: ", ethers.formatEther(dailyRewards));
//     });
//   });
// });
