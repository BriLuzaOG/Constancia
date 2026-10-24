export function Receipt({
  title,
  rows,
  footnote,
}: {
  title: string;
  rows: { label: string; value: string; mono?: boolean; muted?: boolean }[];
  footnote?: string;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <dl>
        {rows.map((row) => (
          <div key={row.label} data-muted={row.muted ? 'true' : undefined}>
            <dt>{row.label}</dt>
            <dd>{row.mono ? <code>{row.value}</code> : row.value}</dd>
          </div>
        ))}
      </dl>
      {footnote ? <p>{footnote}</p> : null}
    </section>
  );
}
