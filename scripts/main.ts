import {compile, NetworkProvider} from '@ton/blueprint';
import {Main} from "../wrappers/Main";
import {address, toNano} from "@ton/core";

export async function run(provider: NetworkProvider) {
  const codeCell = await compile("Main");
  const myContract = Main.createFromConfig(
    {
      number: 1992,
      address: address("UQD0EybgqDWSMUBsia8BCVFLloNZX6Ax8dsAcP569fhnA3Mg"),
      owner_address: address("UQD0EybgqDWSMUBsia8BCVFLloNZX6Ax8dsAcP569fhnA3Mg")
    },
    codeCell
  );
  console.log(`myContract address: ${myContract.address}`);
  const openedContract = provider.open(myContract);
  openedContract.sendDeployMessage(provider.sender(), toNano("0.05"));
  await provider.waitForDeploy(myContract.address)
}
