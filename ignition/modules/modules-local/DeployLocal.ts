import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "../modules-universal/BeraCub";
import FuzzTokenV2 from "../modules-universal/FuzzTokenV2";
import BeraFarm from "./BeraFarmLocal";
import ApplySettingsLocal from "./ApplySettingsLocal";
import MarketPlace from "../modules-universal/Marketplace";

export default buildModule("DeployLocal", (m: any): any => {
  const { beraCub } = m.useModule(BeraCub);
  const { fuzzToken } = m.useModule(FuzzTokenV2);
  const { beraFarm } = m.useModule(BeraFarm);
  const { nftMarketplace } = m.useModule(MarketPlace);
  m.useModule(ApplySettingsLocal);

  return {
    beraCub,
    beraFarm,
    fuzzToken,
    nftMarketplace,
  };
});
