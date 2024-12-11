import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "../modules-universal/BeraCub";
import FuzzToken from "../modules-universal/FuzzTokenV2";
import BeraFarmTestNet from "../modules-testnet/BeraFarmTestNet";

export default buildModule("ApplySettingsTestNet", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { beraFarm } = m.useModule(BeraFarmTestNet);
  const { fuzzToken } = m.useModule(FuzzToken);

  const owner = m.getAccount(0);

  //Bera Farm settings
  m.call(beraFarm, "setCubNFTContract", [beraCub], {
    from: owner,
  });
  m.call(beraFarm, "setBaseAndQuoteTokens", [], {
    from: owner,
  });

  m.call(beraFarm, "setPlatformState", [true], { from: owner });
  m.call(beraFarm, "openBuyBeraCubsHoney", [], { from: owner });

  //Bera Cub settings
  m.call(beraCub, "openMinting", [], { from: owner });
  m.call(beraCub, "addController", [beraFarm], { from: owner });
  m.call(beraCub, "addBeraFarmContract", [beraFarm], { from: owner });

  //Fuzz Token settings
  m.call(fuzzToken, "addController", [beraFarm], { from: owner });
  m.call(fuzzToken, "enableTrading", [], { from: owner });
  m.call(fuzzToken, "removeHibernation", [], { from: owner });
  m.call(fuzzToken, "openTradingToNonCubsOwner", [], { from: owner });
});
