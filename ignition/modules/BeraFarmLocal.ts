import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import MockHoney from "./MockHoney";
import MockBex from "./MockBex";
import BeraCub from "./BeraCub";
import FuzzToken from "./FuzzToken";

import { limitBeforeFullTokenTrading } from "../../scripts/deployEthTestNet";

export default buildModule("BeraFarm", (m): any => {
  const { mockHoney } = m.useModule(MockHoney);
  const { mockBex } = m.useModule(MockBex);
  const { beraCub } = m.useModule(BeraCub);
  const { fuzzToken } = m.useModule(FuzzToken);

  const treasury = m.getAccount(5);
  const owner = m.getAccount(0);

  const dailyInterest = m.getParameter("dailyInterest");
  const claimTaxFuzz = m.getParameter("claimTaxFuzz");
  const bondDiscount = m.getParameter("bondDiscount");
  const maxSupplyForHoney = m.getParameter("maxSupplyForHoney");
  const maxSupplyFirstBatch = m.getParameter("maxSupplyFirstBatch");
  const limitBeforeEmissions = m.getParameter("limitBeforeEmissions");
  const limitBeforeFullTokenTrading = m.getParameter(
    "limitBeforeFullTokenTrading"
  );
  const mockPoolAddress = m.getParameter("mockPoolAddress");
  const maxCubsPerWallet = m.getParameter("maxCubsPerWallet");

  const beraFarm = m.contract(
    "BeraFarm",
    [
      mockHoney,
      mockBex,
      mockPoolAddress,
      treasury,
      dailyInterest,
      claimTaxFuzz,
      bondDiscount,
      maxSupplyForHoney,
      maxSupplyFirstBatch,
      limitBeforeEmissions,
      limitBeforeFullTokenTrading,
      maxCubsPerWallet,
    ],
    {
      id: "BeraFarm",
    }
  );

  m.call(beraFarm, "setCubNFTContract", [beraCub], {
    from: owner,
  });

  m.call(beraCub, "addController", [beraFarm], { from: owner });

  m.call(fuzzToken, "addController", [beraFarm], { from: owner });
  return { beraFarm };
});
