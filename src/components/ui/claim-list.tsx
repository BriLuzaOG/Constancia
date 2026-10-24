export interface ClaimView {
  name: string;
  label: string;
  value?: string;
  state: 'shown' | 'hidden' | 'on' | 'off'; // shown/hidden read-only; on/off toggleable
}

// Hidden claims never render their value, even when one is passed.
export function ClaimList({
  claims,
  onToggle,
  caption,
}: {
  claims: ClaimView[];
  onToggle?: (name: string, next: boolean) => void;
  caption?: string;
}) {
  return (
    <div>
      {caption ? <p className="mb-4 text-small text-ink-muted">{caption}</p> : null}
      <ul className="border-b-2 border-ink">
        {claims.map((claim) => (
          <li
            key={claim.name}
            data-state={claim.state}
            className="flex items-center justify-between gap-4 border-t-2 border-ink py-3"
          >
            <span className="font-bold">{claim.label}</span>
            {claim.state === 'shown' ? <span>{claim.value}</span> : null}
            {claim.state === 'hidden' ? <span className="text-ink-muted">Hidden</span> : null}
            {claim.state === 'on' || claim.state === 'off' ? (
              <button
                type="button"
                aria-pressed={claim.state === 'on'}
                aria-label={`Share ${claim.label}`}
                onClick={() => {
                  onToggle?.(claim.name, claim.state !== 'on');
                }}
                className="min-h-12 border-2 border-ink px-4 font-bold"
              >
                Share
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
