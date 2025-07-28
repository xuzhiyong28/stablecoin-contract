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
  const highloadWalletV3 = provider.open(
    HighloadWalletV3.createFromConfig(
      {
        publicKey: keyPair.publicKey,
        subwalletId: SUBWALLET_ID,
        timeout: DEFAULT_TIMEOUT,
      },
      codeCell,
    ),
  );
  console.log(`高性能合约地址: ${highloadWalletV3.address}`) // EQBmrENXqFIRBHvIQEqwiFRAPFvMJQfrH6gmPtP5O3Z-SL9T - UQBmrENXqFIRBHvIQEqwiFRAPFvMJQfrH6gmPtP5O3Z-SOKW
  //await highloadWalletV3.sendDeploy(provider.sender(), toNano('1'));
  //await provider.waitForDeploy(highloadWalletV3.address, 10, 5);

}
