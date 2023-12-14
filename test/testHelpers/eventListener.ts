import { ethers } from "hardhat";

import { BlockTag } from "@ethersproject/abstract-provider";
//import { Log } from "hardhat-deploy/types";

export async function getEvents(
  startBlock: BlockTag | undefined,
  endBlock: BlockTag | undefined,
  contract: any
) {
  const events = await ethers.provider.getLogs({
    fromBlock: startBlock,
    toBlock: endBlock,
    address: contract.target,
  });

  const eventInterface = new ethers.Interface([
    "event CreatedRandomSvg(string memory tokenURI, string memory finalSvg)",
  ]);

  return { eventInterface, events };
}
