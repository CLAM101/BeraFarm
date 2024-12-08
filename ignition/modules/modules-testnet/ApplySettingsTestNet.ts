import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "../modules-universal/BeraCub";
import FuzzToken from "../modules-universal/FuzzTokenV2";
import BeraFarmTestNet from "../modules-testnet/BeraFarmTestNet";

export default buildModule("ApplySettingsTestNet", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { FuzzTokenV2 } = m.useModule(FuzzToken);
  const { beraFarm } = m.useModule(BeraFarmTestNet);

  const owner = m.getAccount(0);

  //Bera Farm settings
  m.call(beraFarm, "setCubNFTContract", [beraCub], {
    from: owner,
  });
  m.call(beraFarm, "setFuzzAddr", [FuzzTokenV2], { from: owner });
  m.call(beraFarm, "setPlatformState", [true], { from: owner });
  m.call(beraFarm, "openBuyBeraCubsHoney", [], { from: owner });

  //Bera Cub settings
  m.call(beraCub, "openMinting", [], { from: owner });
  m.call(beraCub, "addController", [beraFarm], { from: owner });
  m.call(beraCub, "addBeraFarmContract", [beraFarm], { from: owner });

  //Fuzz Token settings
  m.call(FuzzTokenV2, "addController", [beraFarm], { from: owner });
  m.call(FuzzTokenV2, "enableTrading", [], { from: owner });

  return { beraFarm };
});
