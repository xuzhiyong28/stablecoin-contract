import {NetworkProvider} from '@ton/blueprint';
import { Main } from "../wrappers/Main";
import { address, OpenedContract, toNano } from "@ton/core";


export async function run(provider: NetworkProvider) {
  // 合约地址
  const contractAddress = address("EQAcS2uEvsphJVGSt_Z3r7Bgo9jAyxYIHZhi7YDvSCLhX8lQ");
  const mainContract: OpenedContract<Main> = provider.open(Main.createFromAddress(contractAddress));
  const data = await mainContract.getDataContract();
  console.log(`data : ${JSON.stringify(data)}`);
  const balanceData = await mainContract.getBalance();
  console.log(`balance : ${balanceData.balance}`)

  // 自增
  const sendMessageResult = await mainContract.sendIncrementMessage(provider.sender(), toNano("0.0005"), 1);
  console.log(`transaction result : ${sendMessageResult}`)
}
