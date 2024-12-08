import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "../modules-universal/BeraCub";
import FuzzToken from "../modules-universal/FuzzTokenV2";
import MockHoney from "./MockHoneyTestNet";
import BeraFarmTestNet from "./BeraFarmTestNet";
import ApplySettingsTestNet from "./ApplySettingsTestNet";

export default buildModule("DeployTestNet", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { fuzzToken } = m.useModule(FuzzToken);
  const { mockHoney } = m.useModule(MockHoney);
  const { beraFarm } = m.useModule(BeraFarmTestNet);
  const { applySettingsTestNet } = m.useModule(ApplySettingsTestNet);

  return { beraCub, beraFarm, fuzzToken, mockHoney, applySettingsTestNet };
});
