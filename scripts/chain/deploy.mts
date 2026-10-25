import { readAddresses, relayer, deployArtifact, saveAddresses } from './lib.mjs';

// Idempotent: whatever is already recorded in demo-pack/addresses.json is never redeployed.
const addresses = readAddresses();

if (!addresses.factory) {
  addresses.factory = (await deployArtifact('AccountFactory')).address;
  saveAddresses(addresses);
}
if (!addresses.paymaster) {
  addresses.paymaster = (await deployArtifact('VerifyingPaymaster', [relayer().address])).address;
  saveAddresses(addresses);
}

console.log(`NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS=${addresses.factory}`);
console.log(`PAYMASTER_ADDRESS=${addresses.paymaster}`);
