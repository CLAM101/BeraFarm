import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import MockHoney from "./MockHoney";
import MockBex from "./MockBex";
import BeraCub from "./BeraCub";
import FuzzToken from "./FuzzToken";
import BeraFarmLocal from "./BeraFarmLocal";

import { limitBeforeFullTokenTrading } from "../../scripts/deployEthTestNet";

export default buildModule("ApplySettingsLocal", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { fuzzToken } = m.useModule(FuzzToken);
  const { beraFarm } = m.useModule(BeraFarmLocal);

  const owner = m.getAccount(0);

  //Bera Farm settings
  m.call(beraFarm, "setCubNFTContract", [beraCub], {
    from: owner,
  });
  m.call(beraFarm, "setFuzzAddr", [fuzzToken], { from: owner });

  //Bera Cub settings
  m.call(beraCub, "openMinting", [], { from: owner });
  m.call(beraCub, "addController", [beraFarm], { from: owner });
  m.call(beraCub, "addBeraFarmContract", [beraFarm], { from: owner });

  //Fuzz Token settings
  m.call(fuzzToken, "addController", [beraFarm], { from: owner });

  // m.call(fuzzToken, "removeHibernation", [], { from: owner });
  return { beraFarm };
});
