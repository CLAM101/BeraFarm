import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "./BeraCub";

import FuzzToken from "./FuzzToken";
import AddLiquidModule from "./AddLiquidModule";
import BeraFarmTestNet from "./BeraFarmTestNet";
import ApplySettingsTestNet from "./ApplySettingsTestNet";

export default buildModule("DeployTestNet", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { beraFarm } = m.useModule(BeraFarmTestNet);
  const { applySettingsTestNet } = m.useModule(ApplySettingsTestNet);

  return { beraCub, beraFarm, applySettingsTestNet };
});
