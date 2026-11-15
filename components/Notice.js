// Result message after an admin or portal form (?ok= / ?warn= / ?err=).
export default function Notice({ sp, o, extra = {} }) {
  if (sp?.ok) return <p className="ok">{extra[sp.ok] || o.saved}</p>;
  if (sp?.warn) return <p className="alert" role="alert">{(extra[sp.wk] || extra.warnPrefix || o.error) + sp.warn}</p>;
  if (sp?.err) return <p className="alert" role="alert">{o.error + sp.err}</p>;
  return null;
}
