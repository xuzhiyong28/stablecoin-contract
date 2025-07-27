import {compile, NetworkProvider, } from '@ton/blueprint';
import {Main} from "../wrappers/Main";
import { address, toNano, Address, OpenedContract } from "@ton/core";

const deployedContractAddress = "EQAO2Vtp4YzVjLmO3a0iae_hXu9uyGmswnjMKjQwaP2CDcVU";

export async function run(provider: NetworkProvider) {
  //await deployContract(provider);
  await sendInternalMessage(provider);
}

/***
 * 发送交易
 * @param provider
 */
async function sendInternalMessage(provider: NetworkProvider) {
  const myContract = Main.createFromAddress(Address.parse(deployedContractAddress));
  const openedContract = provider.open(myContract);
  await printData(openedContract);

  await openedContract.sendIncrementMessage(provider.sender(), toNano("0.005"), 1);

  await provider.waitForDeploy(myContract.address)
  console.log("=============================== 发送自增交易 ===============================") // https://tonviewer.com/transaction/53715574fdbbd870e49ff0e77de61efb94185c5b77911c9aa83a8a643574d803
  await printData(openedContract);
}

async function printData(openedContract: OpenedContract<any>){
  let balance_res = await openedContract.getBalance();
  console.log(`balance : ${balance_res.balance}`)
  let data = await openedContract.getDataContract();
  console.log(`data.counter_value: ${data.counter_value}`)
  console.log(`data.recent_sender: ${data.recent_sender}`)
  console.log(`data.owner_address: ${data.owner_address}`)
}

/***
 * 部署合约
 * @param provider
 */
async function deployContract(provider: NetworkProvider) {
  const codeCell = await compile("Main");
  const myContract = Main.createFromConfig(
    {
      number: 1992,
      address: address("UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u"),
      owner_address: address("UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u")
    },
    codeCell
  );
  console.log(`myContract address: ${myContract.address}`); // 部署的合约地址 EQAO2Vtp4YzVjLmO3a0iae_hXu9uyGmswnjMKjQwaP2CDcVU
  const openedContract = provider.open(myContract);
  openedContract.sendDeployMessage(provider.sender(), toNano("0.05"));
  await provider.waitForDeploy(myContract.address)
}
