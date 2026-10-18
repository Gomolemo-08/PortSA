import { useEffect, useMemo, useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import MapView from './MapView.jsx';
import Game from './Game.jsx';
import { CATEGORIES, STATUSES, SEVERITIES, PROVINCES, SEED, newRef, reverseGeocode, inBounds, SA_BOUNDS } from './data.js';

const KEY = 'fm-reports-v1';
const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v) && v.length) return v; } catch {} return SEED; };
const fmt = (n) => n.toFixed(5);
const ago = (iso) => { const d = Math.max(0, Math.floor((Date.now() - new Date(iso)) / 864e5)); return d === 0 ? 'Today' : d === 1 ? '1 day ago' : `${d} days ago`; };

export default function App() {
  const [view, setView] = useState('map');
  const [reports, setReports] = useState(load);
  const [draft, setDraft] = useState(null);
  const [selId, setSelId] = useState(null);
  const [fly, setFly] = useState(null);
  const [fCat, setFCat] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [muni, setMuni] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ cat: 'pothole', sev: 'Medium', desc: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(reports)); } catch {} }, [reports]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3800); return () => clearTimeout(t); }, [toast]);

  const shown = useMemo(() => reports.filter((r) => (fCat === 'all' || r.cat === fCat) && (fStatus === 'all' || r.status === fStatus)).sort((a, b) => new Date(b.at) - new Date(a.at)), [reports, fCat, fStatus]);
  const sel = reports.find((r) => r.id === selId);
  const stats = useMemo(() => ({
    total: reports.length,
    open: reports.filter((r) => r.status === 'Open').length,
    prog: reports.filter((r) => r.status === 'In progress').length,
    done: reports.filter((r) => r.status === 'Resolved').length,
  }), [reports]);

  const pick = async (lat, lng) => {
    setSelId(null);
    setBusy(true);
    setDraft({ lat, lng, place: 'Locating…' });
    const g = await reverseGeocode(lat, lng);
    setBusy(false);
    if (g.inside === false || (g.inside === null && !inBounds(lat, lng))) {
      setDraft(null);
      setToast('That pin is outside South Africa. Please drop it inside the border.');
      return;
    }
    setDraft({ lat, lng, place: g.place || `Near ${fmt(lat)}, ${fmt(lng)}` });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!draft || busy) return;
    const r = { id: newRef(), cat: form.cat, sev: form.sev, desc: form.desc.trim() || 'No description provided.', lat: draft.lat, lng: draft.lng, place: draft.place, status: 'Open', at: new Date().toISOString() };
    setReports((x) => [r, ...x]);
    setDraft(null); setForm({ cat: form.cat, sev: 'Medium', desc: '' }); setSelId(r.id);
    setToast(`Report ${r.id} submitted. Municipal teams now have the exact coordinates.`);
  };

  const locate = () => {
    if (!navigator.geolocation) return setToast('Geolocation is not supported on this device.');
    navigator.geolocation.getCurrentPosition(
      (p) => { const { latitude: la, longitude: ln } = p.coords; setFly({ center: [la, ln], zoom: 16, t: Date.now() }); pick(la, ln); },
      () => setToast('Could not get your location. Allow access or tap the map instead.'),
      { enableHighAccuracy: true, timeout: 10000 });
  };

  const setStatus = (id, status) => setReports((x) => x.map((r) => (r.id === id ? { ...r, status } : r)));
  const select = (id) => { setSelId(id); setDraft(null); const r = reports.find((x) => x.id === id); if (r) setFly({ center: [r.lat, r.lng], zoom: 12, t: Date.now() }); };
  const copy = async (r) => { try { await navigator.clipboard.writeText(`${r.lat}, ${r.lng}`); setToast('Coordinates copied.'); } catch { setToast(`${r.lat}, ${r.lng}`); } };
  const exportCsv = () => {
    const rows = [['Ref', 'Category', 'Severity', 'Status', 'Latitude', 'Longitude', 'Location', 'Description', 'Reported']]
      .concat(reports.map((r) => [r.id, CATEGORIES[r.cat].label, r.sev, r.status, r.lat, r.lng, r.place, r.desc, r.at]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'fix-my-ward-reports.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="app">
      <header className="top">
        <div className="brand"><span className="flag" aria-hidden="true" /><div><h1>Fix My Ward</h1><small>Municipal fault reporting · South Africa</small></div></div>
        <nav>
          <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>🗺️ Report</button>
          <button className={view === 'game' ? 'on' : ''} onClick={() => setView('game')}>🏛️ Civic Game</button>
        </nav>
      </header>

      {view === 'game' ? <Game /> : (
        <main className="main">
          <aside className="panel">
            <section className="hero">
              <h2>Drop a pin. Get it fixed.</h2>
              <p>Exact GPS coordinates mean municipal crews find the fault first time, with no more vague “near the shop” descriptions.</p>
            </section>

            <div className="stats">
              <div><b>{stats.total}</b><span>Reports</span></div>
              <div><b className="c-open">{stats.open}</b><span>Open</span></div>
              <div><b className="c-prog">{stats.prog}</b><span>In progress</span></div>
              <div><b className="c-done">{stats.done}</b><span>Fixed</span></div>
            </div>

            <div className="row">
              <button className="primary grow" onClick={locate}>📡 Use my location</button>
              <button onClick={() => setFly({ center: [-28.8, 24.7], zoom: 5, t: Date.now() })}>🇿🇦 Whole SA</button>
            </div>
            <div className="chips scroll" aria-label="Jump to province">
              {PROVINCES.map((p) => <button key={p.name} className="chip" onClick={() => setFly({ center: p.center, zoom: p.zoom, t: Date.now() })}>{p.name}</button>)}
            </div>

            {draft ? (
              <form className="card form" onSubmit={submit}>
                <h3>New report</h3>
                <div className="coords"><span>📍 {fmt(draft.lat)}, {fmt(draft.lng)}</span><small>{draft.place}</small></div>
                <label>Fault type
                  <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select></label>
                <label>Severity
                  <div className="seg">{SEVERITIES.map((s) => <button type="button" key={s} className={form.sev === s ? 'on' : ''} onClick={() => setForm({ ...form, sev: s })}>{s}</button>)}</div></label>
                <label>Details (optional)
                  <textarea rows="3" maxLength={300} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="e.g. Pothole about 1m wide outside the clinic" /></label>
                <div className="row"><button className="primary grow" disabled={busy}>{busy ? 'Checking location…' : 'Submit report'}</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div>
              </form>
            ) : sel ? (
              <div className="card">
                <div className="row between"><h3>{CATEGORIES[sel.cat].icon} {CATEGORIES[sel.cat].label}</h3><button className="x" onClick={() => setSelId(null)} aria-label="Close">✕</button></div>
                <p className="muted">{sel.id} · {sel.sev} · {ago(sel.at)}</p>
                <p>{sel.desc}</p>
                <div className="coords"><span>📍 {fmt(sel.lat)}, {fmt(sel.lng)}</span><small>{sel.place}</small></div>
                <div className="row"><button onClick={() => copy(sel)}>Copy coordinates</button>
                  <a className="btn" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${sel.lat},${sel.lng}`}>Navigate ↗</a></div>
                {muni && <div className="seg">{STATUSES.map((s) => <button key={s} className={sel.status === s ? 'on' : ''} onClick={() => setStatus(sel.id, s)}>{s}</button>)}</div>}
                {!muni && <span className={`badge s-${sel.status.replace(' ', '')}`}>{sel.status}</span>}
              </div>
            ) : (
              <div className="card tip">👆 <b>Tap anywhere on the map</b> inside South Africa to drop a pin and start a report.</div>
            )}

            <div className="row between">
              <h3>Reports ({shown.length})</h3>
              <label className="switch"><input type="checkbox" checked={muni} onChange={(e) => setMuni(e.target.checked)} /> Municipal view</label>
            </div>
            <div className="row">
              <select value={fCat} onChange={(e) => setFCat(e.target.value)} aria-label="Filter by type"><option value="all">All types</option>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filter by status"><option value="all">Any status</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <ul className="list">
              {shown.map((r) => (
                <li key={r.id}><button className={r.id === selId ? 'item on' : 'item'} onClick={() => select(r.id)}>
                  <span className="ico" style={{ background: CATEGORIES[r.cat].color }}>{CATEGORIES[r.cat].icon}</span>
                  <span className="txt"><b>{CATEGORIES[r.cat].label}</b><small>{r.place}</small></span>
                  <span className={`badge s-${r.status.replace(' ', '')}`}>{r.status}</span></button></li>
              ))}
              {!shown.length && <li className="muted pad">No reports match these filters.</li>}
            </ul>
            <div className="row"><button className="grow" onClick={exportCsv}>⬇ Export CSV for municipal teams</button>
              <button onClick={() => { if (confirm('Reset to demo data?')) { setReports(SEED); setSelId(null); } }}>Reset</button></div>
            <p className="foot muted">Demo data is stored in your browser. Map © OpenStreetMap contributors. Coverage: {SA_BOUNDS[0][0]}° to {SA_BOUNDS[1][0]}° lat, {SA_BOUNDS[0][1]}° to {SA_BOUNDS[1][1]}° lng.</p>
          </aside>
          <div className="mapbox">
            <MapView reports={shown} draft={draft} selectedId={selId} onPick={pick} onSelect={select} fly={fly} />
            <div className="legend"><span><i style={{ background: '#22c55e' }} />Resolved</span><span><i style={{ background: '#ffb612' }} />New pin</span></div>
          </div>
        </main>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
      <SpeedInsights />
    </div>
  );
}
