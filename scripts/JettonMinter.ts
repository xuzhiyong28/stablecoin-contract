import { toNano } from "@ton/core";
import { JettonMinter } from "../wrappers/JettonMinter";
import { compile, NetworkProvider } from "@ton/blueprint";
import { addressToString, assert, base64toCell, jettonWalletCodeFromLibrary } from "../wrappers/ui-utils";
import { Address } from "@ton/core/dist/address/Address";
import { toUnits } from "./units";
import { checkJettonMinter } from "./JettonMinterChecker";

const deployedMinterContractAddress = "EQC9DMjXYRkkljawkvsLASI5-rn4Ce_o1f3OSh2TJcKh3G9i";

const sendToIndex = async (method: string, params: any) => {
  const mainnetRpc = 'https://toncenter.com/api/v3/';
  const headers = {
    'Content-Type': 'application/json'
  };
  const response = await fetch(mainnetRpc + method + '?' + new URLSearchParams(params), {
    method: 'GET',
    headers: headers,
  });
  return response.json();
}

export async function run(provider: NetworkProvider) {
  //await deployJettonMint(provider);
  //await mint(provider);
  await getWalletAddress(provider);
}

/***
 * 部署Jetton Minter合约
 * @param provider
 */
async function deployJettonMint(provider: NetworkProvider) {
  const jettonWalletCodeRaw = await compile("JettonWallet");
  const jettonWalletCode = jettonWalletCodeFromLibrary(jettonWalletCodeRaw);
  const metadataUri = "https://raw.githubusercontent.com/xuzhiyong28/stablecoin-contract/refs/heads/master/metadata/COIN1.json";
  const adminAddress = Address.parse("UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u");
  const minterContract = JettonMinter.createFromConfig({
      admin: adminAddress,
      wallet_code: jettonWalletCode,
      jetton_content: { uri: metadataUri }
    },
    await compile("JettonMinter")
  );
  const openContract = provider.open(minterContract);
  console.log(`myContract address: ${minterContract.address}`);
  // 部署合约并发送1.5TON
  await openContract.sendDeploy(provider.sender(), toNano("1.5"));
  // 部署后合约地址: EQC9DMjXYRkkljawkvsLASI5-rn4Ce_o1f3OSh2TJcKh3G9i
  // 部署合约交易: https://tonviewer.com/transaction/3ebf97603da07948baa8c881541807dddff561f42ddb3882f221e3ef1cf7b94f
  await provider.waitForDeploy(openContract.address);
}

/***
 * mint 交易
 * @param provider
 */
async function mint(provider: NetworkProvider) {
  let jettonMinter = JettonMinter.createFromAddress(Address.parse(deployedMinterContractAddress));
  const openContract = provider.open(jettonMinter);
  // 检查合约是否部署
  const result = await sendToIndex("account", { address: deployedMinterContractAddress })
  console.assert(result.status === "active", "Contract not active");
  console.assert(base64toCell(result.code).equals(await compile("JettonMinter")), "wrong code");
  console.log(`contract balance : ${result.balance}`)
  // mint 10000XZY 到 destinationAddress
  const amount = toUnits("10000", 6);
  const destinationAddress = "UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u";
  await openContract.sendMint(provider.sender(), Address.parse(destinationAddress), amount);
  // mint交易: https://tonviewer.com/transaction/c0f93afef9635f9adc1a15f9ef8c021807195064ef036368f1e4873b9bd1aaf5
  await provider.waitForDeploy(openContract.address);
}

/***
 * 打印合约信息
 * @param provider
 */
async function showJettonMinterInfo(provider: NetworkProvider){
  const ui = provider.ui();
  const jettonMinterCode = await compile('JettonMinter');
  const jettonWalletCodeRaw = await compile('JettonWallet');
  const jettonWalletCode = jettonWalletCodeFromLibrary(jettonWalletCodeRaw);
  try {
    await checkJettonMinter(Address.parseFriendly(deployedMinterContractAddress), jettonMinterCode, jettonWalletCode, provider, ui, false, false);
  } catch (e: any) {
    return;
  }
}

/***
 * 获取owner对应的jetton wallet地址
 * @param provider
 */
async function getWalletAddress(provider: NetworkProvider){
  let jettonMinter = JettonMinter.createFromAddress(Address.parse(deployedMinterContractAddress));
  const openContract = provider.open(jettonMinter);
  const ownerAddress = Address.parse("UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u");
  const jettionWalletAddress = await openContract.getWalletAddress(ownerAddress);
  console.log(jettionWalletAddress);  // XZY代币对应的wallet address: EQASWiqCFd-nWmOsD0PEagcEmK19L6Q541vgJsM-XMr36pTu
}

