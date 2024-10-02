import hre from "hardhat";
import DeployLocal from "../ignition/modules/DeployLocal";
import paramatersLocal from "../ignition/paramatersLocal.json";
import { ethers } from "hardhat";
import { keccak256 } from "ethers";
import { Addressable } from "ethers";

async function getCrocErc20LpAddress(
  base: string | Addressable,
  quote: string,
  dexAddress: string
): any {
  const salt = ethers.keccak256(
    ethers.solidityPacked(["address", "address"], [base, quote])
  );
  const factory = await ethers.getContractFactory("CrocLpErc20");
  const creationCode = factory.bytecode;
  const initCodeHash = keccak256(creationCode);
  const create2Address = ethers.getCreate2Address(
    dexAddress,
    salt,
    initCodeHash
  );
  return create2Address;
}

async function main() {
  const honeyAddress = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
  const bexAddress = "0xAB827b1Cc3535A9e549EE387A6E9C3F02F481B49";

  const {
    beraCub,
    beraFarm,
    fuzzToken,
    nftMarketplace,
    // applySettingsLocal,
  } = await hre.ignition.deploy(DeployLocal, {
    parameters: paramatersLocal,
  });

  const lpConduit = await getCrocErc20LpAddress(
    fuzzToken.target,
    honeyAddress,
    bexAddress
  );

  console.log("lp conduit", lpConduit);
}

main().catch(console.error);
