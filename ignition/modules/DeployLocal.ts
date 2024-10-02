import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "./BeraCub";
import FuzzTokenV2 from "./FuzzTokenV2";
import BeraFarm from "./BeraFarmLocal";
import ApplySettingsLocal from "./ApplySettingsLocal";
import MarketPlace from "./Marketplace";

export default buildModule("DeployLocal", (m: any): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { fuzzToken } = m.useModule(FuzzTokenV2);
  const { beraFarm } = m.useModule(BeraFarm);
  const { nftMarketplace } = m.useModule(MarketPlace);
  // const { applySettingsLocal } = m.useModule(ApplySettingsLocal);

  return {
    beraCub,
    beraFarm,
    fuzzToken,
    nftMarketplace,
    // applySettingsLocal,
  };
});
