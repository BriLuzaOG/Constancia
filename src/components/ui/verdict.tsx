export function Verdict({
  kind,
  title,
  reason,
  issuerDomain,
}: {
  kind: 'AUTHENTIC' | 'NOT_AUTHENTIC' | 'UNAVAILABLE';
  title: string;
  reason?: string;
  issuerDomain?: string;
}) {
  return (
    <section role="status" data-kind={kind}>
      <h2>{title}</h2>
      {reason ? <p>{reason}</p> : null}
      {issuerDomain ? <p>Issuer domain: {issuerDomain}</p> : null}
    </section>
  );
}
