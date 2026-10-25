import type { NetworkState } from '@/lib/ledger/types';
import { blockInk } from '../_lib/format';

// Last 16 Sepolia blocks as vertical lines. The ink is decorative (it rotates with the block number).
export function BlockStrip({ state }: { state: NetworkState }) {
  return (
    <figure>
      <ol
        aria-label="Last blocks"
        className="flex h-40 items-stretch gap-1 border-y-4 border-ink bg-white px-2"
      >
        {state.blocks.map((block) => {
          const ink = blockInk(block.number);
          return (
            <li
              key={block.number}
              title={`Block ${block.number}`}
              className={`flex-1 border-x-2 border-ink ${ink.bg}`}
            >
              <span className="sr-only">
                Block {block.number}, {block.txCount} transactions
              </span>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-3 text-small text-ink-muted">
        A new block about every {state.blockTimeSec} seconds.
      </figcaption>
    </figure>
  );
}
