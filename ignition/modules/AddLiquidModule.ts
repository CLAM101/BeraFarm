import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import FuzzTokenV2 from "./FuzzTokenV2";
import { ethers } from "hardhat";
import HoneyABI from "../externalArtifacts/honey.json";
import crocSwapDexABI from "../externalArtifacts/crocSwapDexABI.json";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { keccak256 } from "ethers";

export default buildModule("AddLiquidModule", (m): any => {
  const { fuzzToken } = m.useModule(FuzzTokenV2);

  const honeyAddress = m.getParameter("honeyAddress");
  const crocSwapDexAddress = m.getParameter("crocSwapDexAddress");

  const fuzzTokenLiquidAmount = m.getParameter("fuzzTokenLiquidAmount");
  const honeyLiquidAmount = m.getParameter("honeyLiquidAmount");

  const ownerAccount = m.getAccount(0);

  const honeyContract = m.contractAt("Honey", HoneyABI, honeyAddress);
  m.call(fuzzToken, "approve", [crocSwapDexAddress, fuzzTokenLiquidAmount], {
    from: ownerAccount,
  });
  m.call(honeyContract, "approve", [crocSwapDexAddress, honeyLiquidAmount], {
    from: ownerAccount,
  });

  const poolIdx = 36000;
  const price = "1600000000000000000";

  const abiCoder = new ethers.AbiCoder();
  const initPoolCalldata = abiCoder.encode(
    ["address", "address", "uint256", "uint128"],
    [fuzzToken, "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03", poolIdx, price]
  );

  // Define the parameters for minting liquidity
  const mintCode = 31; // Example code for minting liquidity fixed in base tokens
  const bidTick = 0; // Example bid tick
  const askTick = 0; // Example ask tick
  const qty = "46875000000000000000"; // Example quantity
  const limitLower = "1500000000000000000"; // Example lower limit
  const limitHigher = "1700000000000000000"; // Example upper limit
  const settleFlags = 0; // Example settle flags

  const getCrocErc20LpAddress = async (
    base: string,
    quote: string,
    dexAddress: string
  ) => {
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
  };

  // const lpConduit = getCrocErc20LpAddress(
  //   fuzzToken,
  //   honeyAddress,
  //   crocSwapDexAddress
  // );
  // // Encode the calldata for minting liquidity
  // const mintCalldata = abiCoder.encode(
  //   [
  //     "uint8",
  //     "address",
  //     "address",
  //     "uint256",
  //     "int24",
  //     "int24",
  //     "uint128",
  //     "uint128",
  //     "uint128",
  //     "uint8",
  //     "address",
  //   ],
  //   [
  //     mintCode,
  //     fuzzToken,
  //     honeyAddress,
  //     poolIdx,
  //     bidTick,
  //     askTick,
  //     qty,
  //     limitLower,
  //     limitHigher,
  //     settleFlags,
  //     lpConduit,
  //   ]
  // );

  // const multiPathArgs = [2, 3, initPoolCalldata, 128, mintCalldata];

  // const multiCmd = encodeAbiParameters(
  //   parseAbiParameters("uint8, uint8, bytes, uint8, bytes"),
  //   multiPathArgs as any[5]
  // );

  // const crockSwapDex = m.contractAt("Bex", crocSwapDexABI, crocSwapDexAddress);

  // const multicallResult = m.call(crockSwapDex, "userCmd", [6, multiCmd]);

  return { result: "" };
});
