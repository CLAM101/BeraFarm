import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "../modules-universal/BeraCub";
import FuzzTokenV2 from "../modules-universal/FuzzTokenV2";
import BeraFarmLocal from "./BeraFarmLocal";

export default buildModule("ApplySettingsLocal", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { fuzzToken } = m.useModule(FuzzTokenV2);
  const { beraFarm } = m.useModule(BeraFarmLocal);

  const owner = m.getAccount(0);

  //Bera Farm settings
  m.call(beraFarm, "setCubNFTContract", [beraCub], {
    from: owner,
  });
  m.call(beraFarm, "setBaseAndQuoteTokens", [], {
    from: owner,
  });

  //Bera Cub settings
  m.call(beraCub, "openMinting", [], { from: owner });
  m.call(beraCub, "addController", [beraFarm], { from: owner });
  m.call(beraCub, "addBeraFarmContract", [beraFarm], { from: owner });

  //Fuzz Token settings
  m.call(fuzzToken, "addController", [beraFarm], { from: owner });

  return { beraFarm };
});
