import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "./BeraCub";
import FuzzToken from "./FuzzTokenV2";

export default buildModule("BeraFarm", (m): any => {
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
