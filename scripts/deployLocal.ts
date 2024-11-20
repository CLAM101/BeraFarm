import hre from "hardhat";
import DeployLocal from "../ignition/modules/DeployLocal";
import paramatersLocal from "../ignition/paramatersLocal.json";
import { ethers } from "hardhat";
import { keccak256 } from "ethers";
import { Addressable } from "ethers";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { bexABI } from "../test/testHelpers/ABI/bex-abi";

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

  const [owner] = await hre.ethers.getSigners();

  console.log("lp conduit", lpConduit);

  const dexContract = new hre.ethers.Contract(bexAddress, bexABI, owner);

  const initPoolCallData = encodeAbiParameters(
    parseAbiParameters("uint8, address, address, uint256, uint128"),
    [71, fuzzToken.target, honeyAddress, 36000, 160000000000000] as any[5]
  );

  const mintCalldata = encodeAbiParameters(
    parseAbiParameters(
      "uint8, address, address, uint256, int24, int24, uint128, uint128, uint128, uint8, address"
    ),
    [
      31,
      fuzzToken.target,
      honeyAddress,
      36000,
      0,
      0,
      8223039985483627,
      160000000000000,
      160000000000000,
      0,
      lpConduit,
    ] as any[2]
  );

  const multiPathArgs = [2, 3, initPoolCallData, 128, mintCalldata];

  const multiCmd = encodeAbiParameters(
    parseAbiParameters("uint8, uint8, bytes, uint8, bytes"),
    multiPathArgs as any[5]
  );

  console.log("multiCmd", multiCmd);

  const createPoolAddLiquidTx = await dexContract.userCmd(6, multiCmd);

  const finalizePoolTx = await createPoolAddLiquidTx.wait();

  console.log("createPoolAddLiquidTx", finalizePoolTx);
}

main().catch(console.error);
