'use client';

export function Mono({
  value,
  shorten = false,
  copy = false,
}: {
  value: string;
  shorten?: boolean;
  copy?: boolean;
}) {
  // shortcut: fixed 10/8 middle-ellipsis, no grapheme awareness, fine for hex and base58 IDs; upgrade if free-text values appear
  const text = shorten && value.length > 24 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
  const code = <code title={value}>{text}</code>;
  if (!copy) return code;
  return (
    <span>
      {code}
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(value);
        }}
      >
        Copy
      </button>
    </span>
  );
}
