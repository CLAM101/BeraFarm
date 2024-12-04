import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { deployTokenTests } from "./testHelpers/deployContractsIgnition";
import { Helpers } from "../helpers/Helpers";

const networkHelpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Emissions Tax, Rewards and controls Tests", async function () {
  let beraCub: any,
    beraFarm: any,
    fuzzToken: any,
    honeyContract: any,
    owner: HardhatEthersSigner,
    otherAccount: HardhatEthersSigner,
    thirdAccount: HardhatEthersSigner,
    fourthAccount: HardhatEthersSigner,
    fifthAccount: HardhatEthersSigner,
    sixthAccount: HardhatEthersSigner,
    seventhAccount: HardhatEthersSigner,
    eighthAccount: HardhatEthersSigner;

  before(async function () {
    await networkHelpers.reset("https://bartio.rpc.berachain.com/", 1886012);
    const helpers = await Helpers.createAsync(ethers);
    [
      owner,
      otherAccount,
      thirdAccount,
      fourthAccount,
      fifthAccount,
      sixthAccount,
      seventhAccount,
      eighthAccount,
    ] = await ethers.getSigners();

    const loadedFixture = await loadFixture(deployTokenTests);

    honeyContract = await helpers.contracts.getHoneyContract();

    honeyContract.transfer(thirdAccount.address, ethers.parseEther("2000"));

    beraCub = loadedFixture.beraCub;
    fuzzToken = loadedFixture.fuzzToken;
    beraFarm = loadedFixture.beraFarm;

    await beraFarm.connect(owner).setPlatformState(true);
    await beraFarm.connect(owner).openBuyBeraCubsHoney();
  });

  describe("Rewards & Claims Tests", async function () {
    it("It should block any trading of tokens until trading has been enabled", async function () {
      await expect(fuzzToken.connect(owner).transfer(otherAccount.address, 200))
        .to.not.be.reverted;

      await expect(
        fuzzToken.connect(otherAccount).transfer(thirdAccount.address, 150)
      ).to.be.revertedWith("Patience - Trading Not Started Yet!");
    });
    it("It should block user from trading fuzz unless they own at least one cub", async function () {
      await fuzzToken.connect(owner).enableTrading();

      await expect(
        fuzzToken.connect(otherAccount).transfer(thirdAccount.address, 150)
      ).to.be.revertedWith(
        "Cubs Only Is active - You need to have a Bera Cub to trade FUZZ!"
      );
    });
    it("Should allow the owner to remove the cubs only blocker and allow for a non cub owner to trade", async function () {
      await expect(fuzzToken.connect(owner).openTradingToNonCubsOwner()).to.not
        .be.reverted;

      await expect(
        fuzzToken.connect(otherAccount).transfer(thirdAccount.address, 50)
      ).to.not.be.reverted;
    });
    it("Should allow the owner to add back the cubs only blocker and block a non cub owner from trading", async function () {
      await expect(fuzzToken.connect(owner).closeTradingToNonCubsOwner()).to.not
        .be.reverted;

      await expect(
        fuzzToken.connect(thirdAccount).transfer(fourthAccount.address, 50)
      ).to.be.revertedWith(
        "Cubs Only Is active - You need to have a Bera Cub to trade FUZZ!"
      );
    });
    it("Should allow the Bera Farm contract to remove cubs only trading once the limit has been hit and allow a non cub owner to make a trade", async function () {
      await expect(
        honeyContract
          .connect(thirdAccount)
          .approve(beraFarm.target, ethers.parseEther("100"))
      ).to.not.be.reverted;

      await expect(beraFarm.connect(thirdAccount).buyBeraCubsHoney(2)).to.not.be
        .reverted;

      await expect(
        fuzzToken.connect(otherAccount).transfer(thirdAccount.address, 50)
      ).to.not.be.reverted;
    });
    it("It should block the transfer of more than 1% of the total supply while the hibernation period is still active", async function () {
      const totalSupply = await fuzzToken.totalSupply();

      console.log("Total Supply", ethers.formatEther(totalSupply));

      await expect(
        fuzzToken
          .connect(owner)
          .transfer(thirdAccount.address, ethers.parseEther("1000000"))
      ).to.not.be.reverted;

      await expect(
        fuzzToken
          .connect(thirdAccount)
          .transfer(fourthAccount.address, ethers.parseEther("400000"))
      ).to.be.revertedWith(
        "Just getting warmed up, limit of 1% of $FUZZ can be Traded until Bera Hibernation is complete!"
      );
    });
    it("Should allow the owner to remove the hibernation period and fully open trading", async function () {
      await expect(fuzzToken.connect(owner).removeHibernation()).to.not.be
        .reverted;

      await expect(
        fuzzToken
          .connect(thirdAccount)
          .transfer(fourthAccount.address, ethers.parseEther("400000"))
      ).to.not.be.reverted;
    });
    it("Will prevent minting more tokens than the max supply", async function () {});
    it("Allows the owner to disable trading and prevents trades once trading is disabled", async function () {
      await expect(fuzzToken.connect(owner).disableTrading()).to.not.be
        .reverted;

      await expect(
        fuzzToken
          .connect(thirdAccount)
          .transfer(fourthAccount.address, ethers.parseEther("400000"))
      ).to.be.revertedWith("Patience - Trading Not Started Yet!");
    });
    it("Allows the owner to send and receive any amount of the token regardless fo the hibernation period or the owners cub balance", async function () {
      await expect(
        fuzzToken
          .connect(owner)
          .transfer(thirdAccount.address, ethers.parseEther("500000"))
      ).to.not.be.reverted;
    });

    it("Blocks non controller from calling controller functions", async function () {
      await expect(
        fuzzToken
          .connect(fourthAccount)
          .mint(thirdAccount.address, ethers.parseEther("1000000"))
      ).to.be.revertedWith("Caller Not Controller");

      await expect(
        fuzzToken
          .connect(fourthAccount)
          .burn(thirdAccount.address, ethers.parseEther("1000000"))
      ).to.be.revertedWith("Caller Not Controller");

      await expect(
        fuzzToken.connect(thirdAccount).openTradingToEveryone()
      ).to.be.revertedWith("Caller Not Controller");
    });
  });
});
