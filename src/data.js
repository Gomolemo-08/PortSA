// Rough bounding box of South Africa incl. Prince Edward Islands excluded: [south, west], [north, east]
export const SA_BOUNDS = [[-34.9, 16.4], [-22.1, 32.95]];

export const CATEGORIES = {
  pothole:   { label: 'Pothole / Road damage', icon: '🕳️', color: '#f59e0b' },
  water:     { label: 'Water leak / No water', icon: '💧', color: '#38bdf8' },
  electric:  { label: 'Power outage / Cable',  icon: '⚡', color: '#facc15' },
  light:     { label: 'Streetlight out',       icon: '💡', color: '#a78bfa' },
  sewage:    { label: 'Sewage overflow',       icon: '🚽', color: '#84cc16' },
  refuse:    { label: 'Refuse / Illegal dump', icon: '🗑️', color: '#fb7185' },
  traffic:   { label: 'Traffic signal fault',  icon: '🚦', color: '#f97316' },
};

export const STATUSES = ['Open', 'In progress', 'Resolved'];
export const SEVERITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const PROVINCES = [
  { name: 'Gauteng',       center: [-26.15, 28.1],  zoom: 9 },
  { name: 'Western Cape',  center: [-33.2, 20.6],   zoom: 7 },
  { name: 'KwaZulu-Natal', center: [-28.9, 30.9],   zoom: 8 },
  { name: 'Eastern Cape',  center: [-32.3, 26.6],   zoom: 7 },
  { name: 'Free State',    center: [-28.5, 26.3],   zoom: 7 },
  { name: 'Limpopo',       center: [-23.6, 29.5],   zoom: 7 },
  { name: 'Mpumalanga',    center: [-25.6, 30.4],   zoom: 8 },
  { name: 'North West',    center: [-26.4, 25.5],   zoom: 7 },
  { name: 'Northern Cape', center: [-29.6, 21.9],   zoom: 6 },
];

const d = (n) => new Date(Date.now() - n * 864e5).toISOString();
// Demo reports placed at real city-centre coordinates
export const SEED = [
  { id: 'FM-DEMO01', cat: 'pothole', lat: -26.2041, lng: 28.0473, place: 'Johannesburg CBD, Gauteng', sev: 'High', desc: 'Deep pothole in the left lane damaging tyres.', status: 'Open', at: d(2) },
  { id: 'FM-DEMO02', cat: 'water', lat: -33.9249, lng: 18.4241, place: 'Cape Town CBD, Western Cape', sev: 'Urgent', desc: 'Burst main spilling onto the street.', status: 'In progress', at: d(1) },
  { id: 'FM-DEMO03', cat: 'light', lat: -29.8587, lng: 31.0218, place: 'Durban, KwaZulu-Natal', sev: 'Medium', desc: 'Three streetlights out along the beachfront road.', status: 'Open', at: d(4) },
  { id: 'FM-DEMO04', cat: 'electric', lat: -25.7479, lng: 28.2293, place: 'Pretoria, Gauteng', sev: 'High', desc: 'Exposed cable at the pedestrian crossing.', status: 'In progress', at: d(3) },
  { id: 'FM-DEMO05', cat: 'refuse', lat: -33.9608, lng: 25.6022, place: 'Gqeberha, Eastern Cape', sev: 'Medium', desc: 'Illegal dumping next to the school fence.', status: 'Open', at: d(6) },
  { id: 'FM-DEMO06', cat: 'sewage', lat: -29.0852, lng: 26.1596, place: 'Bloemfontein, Free State', sev: 'Urgent', desc: 'Sewage overflowing from manhole.', status: 'Open', at: d(1) },
  { id: 'FM-DEMO07', cat: 'traffic', lat: -23.9045, lng: 29.4689, place: 'Polokwane, Limpopo', sev: 'High', desc: 'Robot stuck on red at a busy intersection.', status: 'Resolved', at: d(9) },
  { id: 'FM-DEMO08', cat: 'pothole', lat: -25.4753, lng: 30.9694, place: 'Mbombela, Mpumalanga', sev: 'Low', desc: 'Surface cracking near the taxi rank.', status: 'Open', at: d(5) },
  { id: 'FM-DEMO09', cat: 'water', lat: -28.7282, lng: 24.7499, place: 'Kimberley, Northern Cape', sev: 'Medium', desc: 'No water supply since Monday morning.', status: 'In progress', at: d(2) },
  { id: 'FM-DEMO10', cat: 'light', lat: -25.856, lng: 25.6403, place: 'Mahikeng, North West', sev: 'Medium', desc: 'High-mast light has been dark for a week.', status: 'Open', at: d(7) },
  { id: 'FM-DEMO11', cat: 'refuse', lat: -33.0153, lng: 27.9116, place: 'East London, Eastern Cape', sev: 'Low', desc: 'Uncollected refuse for two cycles.', status: 'Resolved', at: d(10) },
  { id: 'FM-DEMO12', cat: 'electric', lat: -29.6006, lng: 30.3794, place: 'Pietermaritzburg, KwaZulu-Natal', sev: 'High', desc: 'Transformer humming and sparking.', status: 'Open', at: d(1) },
];

export const newRef = () => 'FM-' + Date.now().toString(36).toUpperCase().slice(-6);

export async function reverseGeocode(lat, lng) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=${lat}&lon=${lng}`, { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } });
    clearTimeout(t);
    const j = await r.json();
    if (j.error || !j.address) return { inside: false };
    const a = j.address;
    if (a.country_code !== 'za') return { inside: false };
    const local = a.suburb || a.neighbourhood || a.village || a.town || a.city || a.county || '';
    const city = a.city || a.town || a.municipality || a.county || '';
    const place = [local, city !== local ? city : '', a.state].filter(Boolean).join(', ');
    return { inside: true, place: place || j.display_name };
  } catch {
    return { inside: null }; // offline / rate-limited: fall back to bounding box
  }
}

export const inBounds = (lat, lng) =>
  lat >= SA_BOUNDS[0][0] && lat <= SA_BOUNDS[1][0] && lng >= SA_BOUNDS[0][1] && lng <= SA_BOUNDS[1][1];

export const QUESTIONS = [
  { q: 'How many municipalities does South Africa have?', a: ['117', '257', '9', '400'], c: 1, e: '8 metros, 44 districts and 205 local municipalities make 257.' },
  { q: 'How often are local government elections held?', a: ['Every 3 years', 'Every 5 years', 'Every 7 years', 'Every 10 years'], c: 1, e: 'Councils serve a five-year term.' },
  { q: 'What is the minimum age to vote in South Africa?', a: ['16', '18', '21', '25'], c: 1, e: 'Citizens aged 18 and over may vote.' },
  { q: 'What does IDP stand for in municipal planning?', a: ['Internal Debt Plan', 'Integrated Development Plan', 'Infrastructure Delivery Policy', 'Independent District Programme'], c: 1, e: 'Every municipality must adopt an Integrated Development Plan.' },
  { q: 'Which of these is NOT one of the eight metropolitan municipalities?', a: ['Johannesburg', 'Polokwane', 'Cape Town', 'Mangaung'], c: 1, e: 'Polokwane is a local municipality; the others are metros.' },
  { q: '"Batho Pele", the public-service principle, means…', a: ['Work hard', 'People First', 'One Nation', 'Fair Share'], c: 1, e: 'Batho Pele (Sesotho) means "People First".' },
  { q: 'Who is elected to represent a single ward on the municipal council?', a: ['Premier', 'Ward councillor', 'Public Protector', 'Judge'], c: 1, e: 'Each ward elects one ward councillor.' },
  { q: 'Which sphere of government mainly handles refuse removal and municipal roads?', a: ['National', 'Provincial', 'Local', 'Traditional courts'], c: 2, e: 'Local government delivers basic services such as water, refuse and roads.' },
  { q: 'A ward committee may have up to how many members besides the ward councillor?', a: ['3', '5', '10', '25'], c: 2, e: 'Ward committees have a maximum of 10 members, chaired by the councillor.' },
  { q: 'Which document sets out the three spheres of government?', a: ['Freedom Charter', 'Constitution of 1996', 'Municipal Bylaws', 'Bill of Sale'], c: 1, e: 'The Constitution establishes national, provincial and local spheres.' },
];
