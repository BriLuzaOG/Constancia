import type { NetworkState } from '@/lib/ledger/types';
import { inkOf } from '../_lib/format';

// Last 16 blocks as vertical lines in their proposer's ink. A validator that stops proposing
// simply disappears from the field.
export function BlockStrip({ state }: { state: NetworkState }) {
  return (
    <figure>
      <ol
        aria-label="Last blocks"
        className="flex h-40 items-stretch gap-1 border-y-4 border-ink bg-white px-2"
      >
        {state.blocks.map((block) => {
          const ink = inkOf(state, block.proposer);
          return (
            <li
              key={block.number}
              title={`Block ${block.number}`}
              className={`flex-1 border-x-2 border-ink ${ink?.bg ?? 'bg-rule'}`}
            >
              <span className="sr-only">
                Block {block.number}, proposer {ink?.letter ?? 'unknown'}
              </span>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-3 text-small text-ink-muted">
        No single company runs this ledger.
      </figcaption>
    </figure>
  );
}
