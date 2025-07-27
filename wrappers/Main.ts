
import {Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode} from "@ton/core";


export type MainContractConfig = {
    number: number;
    address: Address,
    owner_address: Address
};

export function mainContractConfigToCell(config: MainContractConfig): Cell {
    return beginCell()
        .storeUint(config.number, 32)
        .storeAddress(config.address)
        .storeAddress(config.owner_address)
        .endCell();
}

export class Main implements Contract {
    constructor(readonly address: Address, readonly init?: {code: Cell, data: Cell}) {
    }

    static createFromAddress(address: Address) {
        return new Main(address);
    }

    static createFromConfig(config: MainContractConfig, code: Cell, workchain = 0) {
        const data = mainContractConfigToCell(config);
        const init = {code, data};
        const address = contractAddress(workchain, init);
        return new Main(address, init);
    }


    async sendDeployMessage(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(2, 32).endCell()
        })
    }


    /**
     * 发送一个内部消息
     */
    async sendInternalMessage(provider: ContractProvider, sender: Sender, value: bigint) {
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell()
        })
    }

    async sendIncrementMessage(provider: ContractProvider, sender: Sender, value: bigint, incremnet_by: number) {
        const msg_body = beginCell()
            .storeUint(1, 32)   // op
            .storeUint(incremnet_by, 32) // 递增数量
            .endCell();
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body
        })
    }

    async sendDepositMessage(provider: ContractProvider, sender: Sender, value: bigint) {
        const msg_body = beginCell()
            .storeUint(2, 32) // op
            .endCell();
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body
        });
    }

    async sendNoOpDepositMessage(provider: ContractProvider, sender: Sender, value: bigint) {
        const msg_body = beginCell()
            //.storeUint(2, 32) // op
            .endCell();
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body
        });
    }


    /***
     * 发送提款消息
     */
    async sendWithdrawalMessage(provider: ContractProvider, sender: Sender, value: bigint, amount: bigint){
        const msg_body = beginCell()
            .storeUint(3, 32) // op
            .storeCoins(amount)
            .endCell();
        await provider.internal(sender, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body
        })
    }


    async getData(provider: ContractProvider) {
        const {stack} = await provider.get("get_the_latest_sender", []);
        return {
            recent_sender: stack.readAddress()
        }
    }

    async getDataContract(provider: ContractProvider) {
        const {stack} = await provider.get("get_contract_storage_data", []);
        return {
            counter_value: stack.readNumber(),
            recent_sender: stack.readAddress(),
            owner_address: stack.readAddress()
        }
    }

    async getBalance(provider: ContractProvider) {
        const {stack} = await provider.get("balance", []);
        return {
            balance: stack.readNumber()
        };
    }

}
