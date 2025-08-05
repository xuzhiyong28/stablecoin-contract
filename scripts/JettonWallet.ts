import { toNano } from "@ton/core";
import { JettonMinter } from "../wrappers/JettonMinter";
import { compile, NetworkProvider } from "@ton/blueprint";
import { addressToString, assert, base64toCell, jettonWalletCodeFromLibrary } from "../wrappers/ui-utils";
import { Address } from "@ton/core/dist/address/Address";
import { toUnits } from "./units";
import { JettonWallet } from "../wrappers/JettonWallet";

const deployedMinterContractAddress = "EQC9DMjXYRkkljawkvsLASI5-rn4Ce_o1f3OSh2TJcKh3G9i";
const fromJettonWalletContractAddress = "EQASWiqCFd-nWmOsD0PEagcEmK19L6Q541vgJsM-XMr36pTu";

export async function run(provider: NetworkProvider) {
  await sendWalletTransfer(provider);
}

/***
 * 发送交易
 * @param provider
 */
async function sendWalletTransfer(provider: NetworkProvider){
  const jettonWalletContract = JettonWallet.createFromAddress(Address.parse(fromJettonWalletContractAddress));
  const openedContract = provider.open(jettonWalletContract);
  const jettonBalance =  await openedContract.getJettonBalance();
  console.log(`代币余额: ${jettonBalance}`)
  const responseAddress = Address.parse("UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u");
  const toOwnerAddress = Address.parse("UQCGe5hXBUGxsr9fatq2IuolGPwNMqdR7BTvNlGSzL_C_Fna");
  await openedContract.sendTransfer(
    provider.sender(),
    toNano('0.5'),
    100n,
    toOwnerAddress,
    responseAddress,
    null,
    toNano('0.05'),
    null);
    // 交易1: https://tonviewer.com/transaction/87033c96a3b42e88cd6a7836f2898d58990026750f9ec2d08cbac029cf7300f2
  await provider.waitForDeploy(openedContract.address);

}
