import {compile, NetworkProvider, } from '@ton/blueprint';
import { address, toNano, Address, OpenedContract } from "@ton/core";
import { mnemonicNew, mnemonicToWalletKey } from "@ton/crypto";
import { HighloadWalletV3, HighloadWalletV3Config } from "../wrappers/HighloadWalletV3";
export const SUBWALLET_ID = 239;
export const DEFAULT_TIMEOUT = 128;

export async function run(provider: NetworkProvider) {
  await deployContract(provider);
}

async function deployContract(provider: NetworkProvider) {
  const codeCell = await compile("HighloadWalletV3");
  const codeCellToBoc = codeCell.toBoc();
  console.log(`codeCell : ${codeCellToBoc.toString('hex')}`)
  console.log(`codeCellBase64 : ${codeCellToBoc.toString('base64')}`)
  console.log("\x1b[31m%s\x1b[0m", '============ 助记词生成公私钥 =================')
  //const mnemonicArray = await mnemonicNew(24); // 24 is the number of words in a seed phrase
  const keyPair = await mnemonicToWalletKey([
    'art',     'forget', 'jazz',
    'slice',   'girl',   'truth',
    'divorce', 'verb',   'egg',
    'clown',   'upper',  'sea',
    'acid',    'palace', 'type',
    'present', 'leg',    'desk',
    'zone',    'skull',  'vessel',
    'yellow',  'frame',  'allow'
  ]);
  console.log(`公钥: ${Buffer.from(keyPair.publicKey).toString('hex')}`)
  console.log(`私钥: ${Buffer.from(keyPair.secretKey).toString('hex')}`)

  const config: HighloadWalletV3Config = {
    publicKey: keyPair.publicKey,
    subwalletId: SUBWALLET_ID,
    timeout: DEFAULT_TIMEOUT
  }
  const highV3CodeContract = HighloadWalletV3.createFromConfig(config, codeCell)
  console.log(`高性能钱包合约地址: ${highV3CodeContract.address}`) // 部署后地址: EQBmrENXqFIRBHvIQEqwiFRAPFvMJQfrH6gmPtP5O3Z-SL9T
  const openedContract = provider.open(highV3CodeContract);
  // 部署
  await openedContract.sendDeploy(provider.sender(), toNano('1'))
  await provider.waitForDeploy(highV3CodeContract.address);
}
