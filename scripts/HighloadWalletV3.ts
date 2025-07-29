
// https://medium.com/@ipromise2324/%E6%B7%B1%E5%85%A5%E6%8E%A2%E8%A8%8E-%E5%A6%82%E4%BD%95%E5%9C%A8ton%E4%B8%8A%E4%B8%80%E6%AC%A1%E5%82%B3%E9%80%81254-messages-highload-wallet-v3%E7%9A%84%E7%A8%8B%E5%BC%8F%E8%A7%A3%E6%9E%90-caf154345203
import {compile, NetworkProvider, } from '@ton/blueprint';
import { address, toNano, Address, OpenedContract, OutActionSendMsg, beginCell, SendMode, internal as internal_relaxed } from "@ton/core";
import { mnemonicNew, mnemonicToWalletKey } from "@ton/crypto";
import { HighloadWalletV3, HighloadWalletV3Config } from "../wrappers/HighloadWalletV3";
import { HighloadQueryId } from "../wrappers/highload/HighloadQueryId";
export const SUBWALLET_ID = 239;
export const DEFAULT_TIMEOUT = 128;
export enum OP {
  InternalTransfer = 0xae42e5a4
}
export abstract class Errors {
  static invalid_signature = 33;
  static invalid_subwallet = 34;
  static invalid_creation_time = 35;
  static already_executed = 36;
}
export const maxKeyCount   = (1 << 13); //That is max key count not max key value
export const maxShift      = maxKeyCount - 1;
export const maxQueryCount = maxKeyCount * 1023; // Therefore value count
export const maxQueryId    = (maxShift << 10) + 1022;

const getRandom = (min:number, max:number) => {
  return Math.random() * (max - min) + min;
}

const getRandomInt = (min: number, max: number) => {
  return Math.round(getRandom(min, max));
}

export async function run(provider: NetworkProvider) {
  //await deployContract(provider);
  await sendTransfer(provider);
}

/***
 * 发送批量交易
 * @param provider
 */
async function sendTransfer(provider: NetworkProvider){
  const highloadWalletContract = Address.parse("EQBmrENXqFIRBHvIQEqwiFRAPFvMJQfrH6gmPtP5O3Z-SL9T");
  const highloadWalletV3 = provider.open(HighloadWalletV3.createFromAddress(highloadWalletContract));
  const keyPair = await initKeyPair();
  const rndShift = getRandomInt(0, maxShift);
  const rndBitNum = getRandomInt(0, 1022);
  const queryId = HighloadQueryId.fromShiftAndBitNumber(BigInt(rndShift), BigInt(rndBitNum));
  const msgCount = 10;
  let outMsgs: OutActionSendMsg[] = new Array(msgCount);
  const testBody = beginCell().storeUint(0, 32).storeStringTail('Test').endCell();
  for (let i = 0; i < msgCount; i++) {
    outMsgs[i] = {
      type: 'sendMsg',
      mode: SendMode.NONE,
      outMsg: internal_relaxed({
        to: Address.parse('UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u'),
        value: toNano('0.05'),
        body: testBody,
      })
    }
  }
  await highloadWalletV3.sendBatch(keyPair.secretKey, outMsgs, SUBWALLET_ID, queryId, DEFAULT_TIMEOUT, Math.floor(Date.now() / 1000) - 10)
  // 交易1: https://tonviewer.com/transaction/93799d76ac638ff5b8a0a5f8d7be63de6b1b6629e05408edd239b71b920e415c
  // 交易2: https://tonviewer.com/transaction/ce39a2ff6ac36197605084ebaf03e92c490da1d3ac298095014404549aa200aa
}

/***
 * 部署合约
 * @param provider
 */
async function deployContract(provider: NetworkProvider) {
  const codeCell = await compile("HighloadWalletV3");
  const codeCellToBoc = codeCell.toBoc();
  console.log(`codeCell : ${codeCellToBoc.toString('hex')}`)
  console.log(`codeCellBase64 : ${codeCellToBoc.toString('base64')}`)
  console.log("\x1b[31m%s\x1b[0m", '============ 助记词生成公私钥 =================')
  //const mnemonicArray = await mnemonicNew(24); // 24 is the number of words in a seed phrase
  const keyPair = await initKeyPair();
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
  await highloadWalletV3.sendDeploy(provider.sender(), toNano('1'));
  await provider.waitForDeploy(highloadWalletV3.address, 10, 5);
}

async function initKeyPair(){
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
  return keyPair;
}


