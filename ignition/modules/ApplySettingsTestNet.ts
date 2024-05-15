import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BeraCub from "./BeraCub";
import FuzzToken from "./FuzzToken";
import BeraFarmTestNet from "./BeraFarmTestNet";
import FuzzArtifacts from "../../ignition/deployments/chain-80085/artifacts/FuzzToken#FuzzTokenContract.json";
export default buildModule("ApplySettingsTestNet", (m): any => {
  const { beraCub } = m.useModule(BeraCub);
  const fuzzTokenAddress = m.getParameter("fuzzTokenAddress");
  const { beraFarm } = m.useModule(BeraFarmTestNet);

  const fuzzTokenContract = m.contractAt(
    "Honey",
    FuzzArtifacts,
    fuzzTokenAddress
  );

  const owner = m.getAccount(0);

  //Bera Farm settings
  m.call(beraFarm, "setCubNFTContract", [beraCub], {
    from: owner,
  });
  m.call(beraFarm, "setFuzzAddr", [fuzzTokenAddress], { from: owner });
  m.call(beraFarm, "setPlatformState", [true], { from: owner });
  m.call(beraFarm, "openBuyBeraCubsHoney", [], { from: owner });

  //Bera Cub settings
  m.call(beraCub, "openMinting", [], { from: owner });
  m.call(beraCub, "addController", [beraFarm], { from: owner });
  m.call(beraCub, "addBeraFarmContract", [beraFarm], { from: owner });

  //Fuzz Token settings
  m.call(fuzzTokenContract, "addController", [beraFarm], { from: owner });
  m.call(fuzzTokenContract, "enableTrading", [], { from: owner });

  return { beraFarm };
});
