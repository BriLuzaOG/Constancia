import { formatEther, getAddress, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ENTRY_POINT, env, publicClient, rpcUrl } from './config.mjs';

const ZERO = /^0x0{40}$/;
const entryPointAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

function deployedAddress(name: string): Address | undefined {
  const value = env(name);
  return value && !ZERO.test(value) ? getAddress(value) : undefined;
}

const client = publicClient();
const row = (label: string, value: string) => console.log(`${label.padEnd(22)} ${value}`);

const [chainId, block] = await Promise.all([client.getChainId(), client.getBlock()]);
const ageSec = Math.floor(Date.now() / 1000) - Number(block.timestamp);
row('rpc', rpcUrl().replace(/\/v2\/.*/, '/v2/…'));
row('chainId', `${chainId}${chainId === 11155111 ? '' : '  (EXPECTED 11155111)'}`);
row('block', `${block.number} (${ageSec}s old)`);

const relayerKey = env('RELAYER_PRIVATE_KEY');
if (relayerKey) {
  const sponsor = privateKeyToAccount(relayerKey as `0x${string}`).address;
  row('sponsor', `${sponsor}  ${formatEther(await client.getBalance({ address: sponsor }))} ETH`);
} else {
  row('sponsor', 'RELAYER_PRIVATE_KEY not set (pnpm chain:sponsor)');
}

const entryPointCode = await client.getCode({ address: ENTRY_POINT });
row('entry point', entryPointCode && entryPointCode !== '0x' ? 'code present' : 'NO CODE');

for (const name of ['LEDGER_CONTRACT_ADDRESS', 'NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS', 'PAYMASTER_ADDRESS']) {
  const address = deployedAddress(name);
  if (!address) continue;
  const code = await client.getCode({ address });
  row(name, `${address}  ${code && code !== '0x' ? 'code present' : 'NO CODE'}`);
}

const paymaster = deployedAddress('PAYMASTER_ADDRESS');
if (paymaster) {
  const deposit = await client.readContract({
    address: ENTRY_POINT,
    abi: entryPointAbi,
    functionName: 'balanceOf',
    args: [paymaster],
  });
  row('paymaster deposit', `${formatEther(deposit)} ETH`);
}
