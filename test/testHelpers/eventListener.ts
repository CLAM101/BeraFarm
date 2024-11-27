import { BlockTag } from "@ethersproject/abstract-provider";
import { ethers } from "hardhat";
//import { Log } from "hardhat-deploy/types";

export async function getEvents(
  startBlock: BlockTag | undefined,
  endBlock: BlockTag | undefined,
  contract: any,
  ethers: any
) {
  const events = await ethers.provider.getLogs({
    fromBlock: startBlock,
    toBlock: endBlock,
    address: contract,
  });

  const eventInterface = new ethers.Interface([
    "event CreatedRandomSvg(string memory tokenURI, string memory finalSvg)",
    "event BeraCrocLPCreated(address base, address quote, uint256 indexed poolIdx, address token)",
  ]);

  return { eventInterface, events };
}
