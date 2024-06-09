import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "./BeraCub";
import MockHoney from "./MockHoney";
import FuzzToken from "./FuzzToken";
import MockBex from "./MockBex";
import BeraFarm from "./BeraFarmLocal";
import ApplySettingsLocal from "./ApplySettingsLocal";
import MarketPlace from "./Marketplace";

export default buildModule("Main", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { mockHoney } = m.useModule(MockHoney);
  const { fuzzToken } = m.useModule(FuzzToken);
  const { mockBex } = m.useModule(MockBex);
  const { beraFarm } = m.useModule(BeraFarm);
  const { nftMarketplace } = m.useModule(MarketPlace);
  const { applySettingsLocal } = m.useModule(ApplySettingsLocal);

  return {
    beraCub,
    beraFarm,
    mockHoney,
    fuzzToken,
    mockBex,
    nftMarketplace,
  };
});
