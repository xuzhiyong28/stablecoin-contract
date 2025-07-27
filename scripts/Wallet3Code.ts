import {compile, NetworkProvider} from '@ton/blueprint';
import {Main} from "../wrappers/Main";
import {address, toNano} from "@ton/core";
import {Wallet3Code, Wallet3CodeContractConfig} from "../wrappers/Wallet3Code";
import {mnemonicNew, mnemonicToWalletKey} from "@ton/crypto";
import {createWalletTransferV3} from "@ton/ton/dist/wallets/signing/createWalletTransfer"
import {internal} from "@ton/core/dist/types/_helpers";

export async function run(provider: NetworkProvider) {
  console.log("\x1b[31m%s\x1b[0m", '============ 编译WalletV3R2合约 ================')
  const codeCell = await compile("Wallet3Code");
  const codeCellToBoc = codeCell.toBoc();
  console.log(`codeCell : ${codeCellToBoc.toString('hex')}`)
  console.log(`codeCellBase64 : ${codeCellToBoc.toString('base64')}`)


  console.log("\x1b[31m%s\x1b[0m", '============ 助记词生成公私钥 =================')
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


  console.log("\x1b[31m%s\x1b[0m", "============== 合约初始化 =================");
  // 构建
  let config: Wallet3CodeContractConfig = {
    workchain: 0,
    publicKey: keyPair.publicKey
  };
  const walletV3CodeContract = Wallet3Code.createFromConfig(config, codeCell);
  console.log(`钱包合约地址: ${walletV3CodeContract.address}`)

  console.log("\x1b[31m%s\x1b[0m", "============== 部署合约并发送转账 =================");
  let messages = [
    internal({
      to: address("UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u"),
      value: toNano("0.005"),
      init: walletV3CodeContract.init,
      body: null,
      bounce: false
    })
  ];
  let walletId = 698983191 + config.workchain;
  const openedContract = provider.open(walletV3CodeContract);

  let seqNo = await openedContract.getSeqNo();
  console.log(`seqNo : ${seqNo}`)
  await openedContract.sendTransfer(keyPair.secretKey, walletId, messages);
  // 发送的交易: https://tonviewer.com/transaction/8e94a38ab68d7449839930adf33e61c33dfd628912eaae6f8976c1885517bb1a
  await provider.waitForDeploy(walletV3CodeContract.address);
}
