
//https://medium.com/@ipromise2324/%E6%8E%A2%E7%B4%A2ton%E9%8C%A2%E5%8C%85-%E5%BE%9Ev1%E5%88%B0v4%E7%9A%84%E6%BC%94%E8%AE%8A%E5%8F%8Awallet-v4%E6%B7%B1%E5%BA%A6%E8%A7%A3%E6%9E%90-6d7dc562edf3
import {compile, NetworkProvider} from '@ton/blueprint';
import { address, beginCell, Contract, OpenedContract, toNano } from "@ton/core";
import {Wallet3Code, Wallet3CodeContractConfig} from "../wrappers/Wallet3Code";
import {mnemonicNew, mnemonicToWalletKey} from "@ton/crypto";
import {internal} from "@ton/core/dist/types/_helpers";

export async function run(provider: NetworkProvider) {
  await deployAndTransfer(provider);
  //await deployRandom(provider);
}

async function deployAndTransfer(provider: NetworkProvider){
  console.log('============ 编译WalletV3R2合约 ================')
  const codeCell = await compile("Wallet3Code");
  const codeCellToBoc = codeCell.toBoc();
  console.log(`codeCell : ${codeCellToBoc.toString('hex')}`)
  console.log(`codeCellBase64 : ${codeCellToBoc.toString('base64')}`)

  console.log('============ 助记词生成公私钥 =================')
  // const mnemonicArray = await mnemonicNew(24); // 24 is the number of words in a seed phrase
  const keyPair = await mnemonicToWalletKey([
      'century', 'mercy',   'life',
      'sudden',  'weasel',  'crawl',
      'add',     'sister',  'drift',
      'shoot',   'rug',     'unaware',
      'insect',  'purpose', 'spike',
      'quit',    'mammal',  'miss',
      'actor',   'jaguar',  'toss',
      'cause',   'regular', 'vivid'
    ]
  );
  console.log(`公钥: ${Buffer.from(keyPair.publicKey).toString('hex')}`)
  console.log(`私钥: ${Buffer.from(keyPair.secretKey).toString('hex')}`)
  console.log("============== 合约初始化 ==============");
  // 构建
  let config: Wallet3CodeContractConfig = {
    workchain: 0,
    publicKey: keyPair.publicKey,
    walletId: 698983191
  };
  const walletV3CodeContract = Wallet3Code.createFromConfig(config, codeCell);
  const openedContract = provider.open(walletV3CodeContract);
  console.log(`钱包合约地址: ${walletV3CodeContract.address}`) // 钱包合约地址: EQBY-IIzC-AIWmJLeMTJxWYGzyzVr8MIoVvQAuAdPut1rwlt
  console.log("============== 部署合约并发送转账 ==============");
  let messages = [
    internal({
      to: address("UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u"),
      value: toNano("0.01"),
      init: walletV3CodeContract.init,
      body: null,
      bounce: false
    }),
    internal({
      to: address("UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u"),
      value: toNano("0.01"),
      init: walletV3CodeContract.init,
      body: beginCell().endCell(),
      bounce: false
    })
  ];
  await openedContract.sendTransferExternal(keyPair.secretKey, Number(config.walletId), messages);
  // 交易1: https://tonviewer.com/transaction/8e94a38ab68d7449839930adf33e61c33dfd628912eaae6f8976c1885517bb1a
  // 交易2: https://tonviewer.com/transaction/b80b8951c811d64d761bd9aacaab2f42c9afa1d1cfc2eb8ee3779fcd283f1551
  // 交易3-多message: https://tonviewer.com/transaction/140cc3b26077e875783d7b6f308f643d08a0ad3a2a7c5ef638118a9336f58001
  await provider.waitForDeploy(walletV3CodeContract.address);
}

/***
 * 部署合约
 * @param provider
 */
async function deployRandom(provider: NetworkProvider){
  const codeCell = await compile("Wallet3Code");
  const mnemonicArray = await mnemonicNew(24);
  const keyPair = await mnemonicToWalletKey(mnemonicArray);
  let config: Wallet3CodeContractConfig = {
    workchain: 0,
    publicKey: keyPair.publicKey
  };
  const walletV3CodeContract = Wallet3Code.createFromConfig(config, codeCell);
  console.log(`钱包合约地址: ${walletV3CodeContract.address}`) // EQB6xibcGCSxXaG7igR5IMCLwPSGunZ-aJa55mf9ndfEzHfA
  const openedContract = provider.open(walletV3CodeContract);
  await openedContract.sendDeploy(provider.sender(), toNano('0.1'))
  await provider.waitForDeploy(walletV3CodeContract.address);
}

/***
 * 打印nonce
 * @param openedContract
 */
async function printSeqNo(openedContract: OpenedContract<any>){
  console.log(`seqNo1 : ${await openedContract.getSeqNo()}`)
}




