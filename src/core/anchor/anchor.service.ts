import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { EvidenceStore } from '../evidence/evidence.store';
import { merkleRoot } from '../evidence/merkle';

const ABI = parseAbi(['function anchor(bytes32 root, string sessionId)']);

export type AnchorResult = {
  mode: 'onchain' | 'dry-run';
  sessionId: string;
  root: string;
  txHash: string | null;
};

/**
 * Ancla la raíz Merkle de una sesión.
 *
 * Sin RPC_URL, PRIVATE_KEY o CONTRACT_ADDRESS corre en dry-run: calcula la
 * raíz y la registra en el log. El demo nunca depende de un faucet.
 */
@Injectable()
export class AnchorService {
  private readonly logger = new Logger(AnchorService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly store: EvidenceStore,
  ) {}

  async anchorSession(sessionId: string): Promise<AnchorResult> {
    const events = this.store.list(sessionId);
    const root = merkleRoot(events.map((event) => event.hash));

    const config = this.readConfig();

    if (config === null) {
      this.logger.warn(`[anchor] dry-run ${sessionId} ${root}`);
      return { mode: 'dry-run', sessionId, root, txHash: null };
    }

    const account = privateKeyToAccount(config.privateKey);
    const wallet = createWalletClient({
      account,
      chain: sepolia,
      transport: http(config.rpcUrl),
    });

    const txHash = await wallet.writeContract({
      address: config.contract,
      abi: ABI,
      functionName: 'anchor',
      args: [`0x${root.replace('sha256:', '')}`, sessionId],
    });

    this.logger.log(`[anchor] ${sessionId} ${root} tx=${txHash}`);
    return { mode: 'onchain', sessionId, root, txHash };
  }

  /**
   * Un placeholder como `PRIVATE_KEY=0x` no es una llave válida. Si no
   * cumple el formato exacto, el demo corre en dry-run en lugar de romper.
   */
  private readConfig(): {
    rpcUrl: string;
    privateKey: `0x${string}`;
    contract: `0x${string}`;
  } | null {
    const rpcUrl = this.config.get<string>('RPC_URL');
    const privateKey = this.config.get<string>('PRIVATE_KEY');
    const contract = this.config.get<string>('CONTRACT_ADDRESS');

    if (
      typeof rpcUrl !== 'string' ||
      !/^https?:\/\//.test(rpcUrl) ||
      typeof privateKey !== 'string' ||
      !/^0x[0-9a-fA-F]{64}$/.test(privateKey) ||
      typeof contract !== 'string' ||
      !/^0x[0-9a-fA-F]{40}$/.test(contract)
    ) {
      return null;
    }

    return {
      rpcUrl,
      privateKey: privateKey as `0x${string}`,
      contract: contract as `0x${string}`,
    };
  }
}
