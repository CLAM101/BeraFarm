import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "../modules-universal/BeraCub";

export default buildModule("FuzzTokenV2", (m): any => {
  const owner = m.getAccount(0);

  const { beraCub } = m.useModule(BeraCub);

  let initialFuzzSupply = m.getParameter("initialFuzzSupply");
  let maxFuzzSupply = m.getParameter("maxFuzzSupply");
  let treasureAddress = m.getAccount(1);

  const fuzzToken = m.contract(
    "FuzzTokenV2",
    [initialFuzzSupply, maxFuzzSupply, treasureAddress, beraCub],
    {
      id: "FuzzTokenContract",
    }
  );

  m.call(fuzzToken, "enableTrading", [], { from: owner });

  return { fuzzToken };
});
