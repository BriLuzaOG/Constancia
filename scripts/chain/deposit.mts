import { formatEther, parseEther } from 'viem';
import { entryPoint07Abi, entryPoint07Address } from 'viem/account-abstraction';
import { publicClient } from './config.mjs';
import { readAddresses, relayerWallet } from './lib.mjs';

// Moves sponsor ETH into the paymaster's deposit on the EntryPoint: the pool that pays every fee.
// Usage: pnpm chain:deposit [amountEth]   (default 0.1; keeps a float on the relayer)
const FLOAT = parseEther('0.02');
const paymaster = process.env.PAYMASTER_ADDRESS ?? readAddresses().paymaster;
if (!paymaster) throw new Error('No paymaster yet: run pnpm chain:deploy');

const client = publicClient();
const wallet = relayerWallet();
const amount = parseEther(process.argv[2] ?? '0.1');
const balance = await client.getBalance({ address: wallet.account.address });
if (balance < amount + FLOAT) {
  throw new Error(`Sponsor has ${formatEther(balance)} ETH; needs ${formatEther(amount + FLOAT)}. Top up from a faucet.`);
}

const hash = await wallet.writeContract({
  address: entryPoint07Address,
  abi: entryPoint07Abi,
  functionName: 'depositTo',
  args: [paymaster as `0x${string}`],
  value: amount,
});
await client.waitForTransactionReceipt({ hash });
const deposit = await client.readContract({
  address: entryPoint07Address,
  abi: entryPoint07Abi,
  functionName: 'balanceOf',
  args: [paymaster as `0x${string}`],
});
console.log(`paymaster deposit: ${formatEther(deposit)} ETH`);
