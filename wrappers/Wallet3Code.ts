import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  MessageRelaxed, Sender,
  SendMode
} from "@ton/core";
import { Maybe } from "@ton/ton/dist/utils/maybe";
import * as Buffer from "buffer";
import { createWalletTransferV3 } from "@ton/ton/dist/wallets/signing/createWalletTransfer";

export type Wallet3CodeContractConfig = {
  workchain: number;
  publicKey: Buffer;
  walletId?: Maybe<number>;
}

export function walletV3CodeContractConfigToCell(config: Wallet3CodeContractConfig) {
  let walletId;
  if (config.walletId !== null && config.walletId !== undefined) {
    walletId = config.walletId;
  } else {
    walletId = 698983191 + config.workchain;
  }
  return beginCell()
    .storeUint(0, 32) // seqNo
    .storeUint(walletId, 32) // walletId
    .storeBuffer(config.publicKey)
    .endCell();
}

export class Wallet3Code implements Contract {
  constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) {
  }

  static createFromAddress(address: Address) {
    return new Wallet3Code(address);
  }

  static createFromConfig(config: Wallet3CodeContractConfig, code: Cell) {
    const data = walletV3CodeContractConfigToCell(config);
    const init = {code, data};
    const address = contractAddress(config.workchain, init);
    return new Wallet3Code(address, init);
  }

  /***
   * 获取seqNo
   * @param provider
   */
  async getSeqNo(provider: ContractProvider) {
    let state = await provider.getState();
    if(state.state.type === 'active') {
      let res = await provider.get("seqno", []);
      return res.stack.readNumber()
    } else {
      return 0;
    }
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value: value,
      bounce: false,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell()
    });
  }

  /***
   * 发送外部消息
   * @param provider
   * @param secretKey
   * @param walletId
   * @param messages
   */
  async sendTransferExternal(provider: ContractProvider, secretKey: Buffer, walletId: number, messages: MessageRelaxed[]) {
    let seqNo = await this.getSeqNo(provider);
    let message = createWalletTransferV3({
      seqno: seqNo,
      sendMode: SendMode.PAY_GAS_SEPARATELY,  // 交易手续费（gas）从发送者的钱包中单独支付，不会从消息中转移的TON币中扣除手续费
      walletId: walletId,
      secretKey: secretKey,
      messages: messages
    })
    await provider.external(message);
  }

}
