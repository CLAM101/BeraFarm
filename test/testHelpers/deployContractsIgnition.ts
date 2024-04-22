import { ignition } from "hardhat";
import DeployLocal from "../../ignition/modules/DeployLocal";

export async function deployCounterModuleFixture() {
  return ignition.deploy(DeployLocal);
}
