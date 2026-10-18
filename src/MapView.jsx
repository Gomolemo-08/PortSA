import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SA_BOUNDS, CATEGORIES } from './data.js';

const pinIcon = (color, icon, active) =>
  L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin${active ? ' active' : ''}" style="--c:${color}"><span>${icon}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 39],
  });

export default function MapView({ reports, draft, selectedId, onPick, onSelect, fly }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const draftMarker = useRef(null);
  const pick = useRef(onPick);
  const select = useRef(onSelect);
  pick.current = onPick;
  select.current = onSelect;

  useEffect(() => {
    const bounds = L.latLngBounds(SA_BOUNDS);
    const m = L.map(el.current, {
      minZoom: 5, maxZoom: 18, maxBounds: bounds.pad(0.25), maxBoundsViscosity: 0.85,
    }).fitBounds(bounds);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    L.rectangle(bounds, { color: '#ffb612', weight: 1, dashArray: '6 6', fill: false, interactive: false }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    m.on('click', (e) => pick.current(e.latlng.lat, e.latlng.lng));
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    map.current = m;
    return () => { ro.disconnect(); m.remove(); map.current = null; draftMarker.current = null; };
  }, []);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    reports.forEach((r) => {
      const c = CATEGORIES[r.cat];
      L.marker([r.lat, r.lng], { icon: pinIcon(r.status === 'Resolved' ? '#22c55e' : c.color, c.icon, r.id === selectedId), keyboard: true, title: c.label })
        .on('click', (e) => { L.DomEvent.stopPropagation(e); select.current(r.id); })
        .addTo(g);
    });
  }, [reports, selectedId]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (draftMarker.current) { draftMarker.current.remove(); draftMarker.current = null; }
    if (draft) {
      draftMarker.current = L.marker([draft.lat, draft.lng], { icon: pinIcon('#ffb612', '📍', true), zIndexOffset: 1000 }).addTo(m);
    }
  }, [draft]);

  useEffect(() => {
    if (fly && map.current) map.current.flyTo(fly.center, fly.zoom, { duration: 1.2 });
  }, [fly]);

  return <div ref={el} className="map" role="application" aria-label="Map of South Africa. Click to drop a pin." />;
}
