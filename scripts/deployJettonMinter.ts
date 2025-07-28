import { toNano } from "@ton/core";
import { JettonMinter } from "../wrappers/JettonMinter";
import { compile, NetworkProvider } from "@ton/blueprint";
import { jettonWalletCodeFromLibrary } from "../wrappers/ui-utils";
import { Address } from "@ton/core/dist/address/Address";

export async function run(provider: NetworkProvider) {
  //const isTestnet = provider.network() !== 'mainnet';
  //const ui = provider.ui();
  //const adminAddress = await promptUserFriendlyAddress("Enter the address of the jetton owner (admin):", ui, isTestnet);
  // e.g "https://bridge.ton.org/token/1/0x111111111117dC0aa78b770fA6A738034120C302.json"
  //const jettonMetadataUri = await promptUrl("Enter jetton metadata uri (https://jettonowner.com/jetton.json)", ui)
  const jettonWalletCodeRaw = await compile("JettonWallet");
  const jettonWalletCode = jettonWalletCodeFromLibrary(jettonWalletCodeRaw);
  const jettonMetadataUri = "https://raw.githubusercontent.com/xuzhiyong28/stablecoin-contract/refs/heads/master/metadata/COIN1.json";
  const adminAddress = Address.parse("UQCSOoc8TPYbwS-zOM6t9R5Msrw7P-dhL_ghgVP2o1A-2j3u");

  const minterContract = JettonMinter.createFromConfig({
      admin: adminAddress,
      wallet_code: jettonWalletCode,
      jetton_content: { uri: jettonMetadataUri }
    },
    await compile("JettonMinter"));
  const openContract = provider.open(minterContract);
  console.log(`myContract address: ${minterContract.address}`);
  // 部署合约并发送1.5TON
  await openContract.sendDeploy(provider.sender(), toNano("1.5"));
  await provider.waitForDeploy(openContract.address);
}
