import {toNano} from '@ton/core';
import {JettonMinter} from '../wrappers/JettonMinter';
import {compile, NetworkProvider} from '@ton/blueprint';
import {jettonWalletCodeFromLibrary, promptUrl, promptUserFriendlyAddress} from "../wrappers/ui-utils";
import {Address} from "@ton/core/dist/address/Address";
export async function run(provider: NetworkProvider) {
    const isTestnet = provider.network() !== 'mainnet';

    const ui = provider.ui();
    const jettonWalletCodeRaw = await compile('JettonWallet');

    //const adminAddress = await promptUserFriendlyAddress("Enter the address of the jetton owner (admin):", ui, isTestnet);

    // e.g "https://bridge.ton.org/token/1/0x111111111117dC0aa78b770fA6A738034120C302.json"
    //const jettonMetadataUri = await promptUrl("Enter jetton metadata uri (https://jettonowner.com/jetton.json)", ui)

    const jettonWalletCode = jettonWalletCodeFromLibrary(jettonWalletCodeRaw);
    const jettonMetadataUri = "";
    const adminAddress = Address.parse("UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u");


    const minter = provider.open(JettonMinter.createFromConfig({
            admin: adminAddress,
            wallet_code: jettonWalletCode,
            jetton_content: {uri: jettonMetadataUri}
        },
        await compile('JettonMinter')));
    await minter.sendDeploy(provider.sender(), toNano("1.5")); // send 1.5 TON
}
