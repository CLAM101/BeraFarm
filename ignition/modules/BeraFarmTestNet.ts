import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "./BeraCub";

export default buildModule("BeraFarmTestNet", (m): any => {
  const { beraCub } = m.useModule(BeraCub);

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
  const pool = m.getParameter("poolAddress");

  // contract addresses
  const honeyAddress = m.getParameter("honeyAddress");
  const bexAddress = m.getParameter("bexAddress");

  const beraFarm = m.contract(
    "BeraFarm",
    [
      honeyAddress,
      bexAddress,
      pool,
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
