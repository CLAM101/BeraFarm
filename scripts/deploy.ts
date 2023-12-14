import { ethers } from "hardhat";
import { ContractFactory } from "ethers";

async function main() {
  const BallsInu: ContractFactory = await ethers.getContractFactory("BallsInu");

  const initialSupply: number = 69420000000000;

  const ballsInu = await BallsInu.deploy(initialSupply);

  console.log(
    "hh verify --network avaxFuji --contract  contracts/BallsInu.sol:BallsInu " +
      ballsInu.target +
      " " +
      initialSupply.toString()
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
