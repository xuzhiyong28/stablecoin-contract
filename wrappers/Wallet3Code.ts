import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  MessageRelaxed,
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

  async getSeqNo(provider: ContractProvider) {
    let state = await provider.getState();
    if(state.state.type === 'active') {
      let res = await provider.get("seqno", []);
      return res.stack.readNumber()
    } else {
      return 0;
    }
  }

  /***
   * 发送外部消息
   * @param provider
   * @param secretKey
   * @param walletId
   * @param messages
   */
  async sendTransfer(provider: ContractProvider, secretKey: Buffer, walletId: number, messages: MessageRelaxed[]) {
    let seqNo = await this.getSeqNo(provider);
    let message = createWalletTransferV3({
      seqno: seqNo,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      walletId: walletId,
      secretKey: secretKey,
      messages: messages
    })
    await provider.external(message);
  }

}
