import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "../modules-universal/BeraCub";
import MockHoney from "./MockHoney";
import FuzzTokenV2 from "../modules-universal/FuzzTokenV2";

export default buildModule("BeraFarmTestNet", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { mockHoneyTestNet } = m.useModule(MockHoney);
  const { fuzzToken } = m.useModule(FuzzTokenV2);

  // wallet addresses
  const treasury = m.getAccount(1);
  const owner = m.getAccount(0);

  // contract args
  const dailyInterest = m.getParameter("dailyInterest");
  const claimTaxFuzz = m.getParameter("claimTaxFuzz");
  const bondDiscount = m.getParameter("bondDiscount");
  const maxSupplyForHoney = m.getParameter("maxSupplyForHoney");
  const maxSupplyFirstBatch = m.getParameter("maxSupplyFirstBatch");
  const limitBeforeEmissions = m.getParameter("limitBeforeEmissions");
  const limitBeforeFullTokenTrading = m.getParameter(
    "limitBeforeFullTokenTrading"
  );
  const maxCubsPerWallet = m.getParameter("maxCubsPerWallet");

  const beraFarm = m.contract(
    "BeraFarm",
    [
      treasury,
      dailyInterest,
      claimTaxFuzz,
      bondDiscount,
      maxSupplyForHoney,
      maxSupplyFirstBatch,
      limitBeforeEmissions,
      limitBeforeFullTokenTrading,
      maxCubsPerWallet,
      mockHoneyTestNet,
      fuzzToken,
    ],
    {
      id: "BeraFarmTestNet",
    }
  );

  //baseline settings
  m.call(beraFarm, "setCubNFTContract", [beraCub], {
    from: owner,
  });
  m.call(beraCub, "addController", [beraFarm], { from: owner });

  return { beraFarm };
});
