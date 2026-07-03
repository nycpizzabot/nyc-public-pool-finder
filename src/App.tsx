
import { useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, ExternalLink, MapPin, Navigation, Phone, Search, Waves } from 'lucide-react';
import poolsData from './pools.json';
import 'leaflet/dist/leaflet.css';
import './styles.css';

type Pool = {
  id: string;
  name: string;
  borough: string;
  address: string;
  url: string;
  types: string[];
  closed: boolean;
  accessible: boolean;
  lat: number;
  lng: number;
  telephone?: string;
  image?: string;
};

type UserLocation = { lat: number; lng: number; accuracy?: number };

const pools = poolsData as Pool[];
const nycCenter: [number, number] = [40.7128, -73.95];
const boroughs = ['All', ...Array.from(new Set(pools.map((pool) => pool.borough)))] as const;

function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function poolIcon(pool: Pool) {
  return L.divIcon({
    className: 'pool-pin-wrap',
    html: `<div class="pool-pin ${pool.closed ? 'closed' : ''}"><span>🏊</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 36],
    popupAnchor: [0, -34],
  });
}

const userIcon = L.divIcon({
  className: 'user-pin-wrap',
  html: '<div class="user-pin"><span></span></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapFocus({ selected, userLocation }: { selected?: Pool; userLocation?: UserLocation }) {
  const map = useMap();
  if (selected) {
    setTimeout(() => map.flyTo([selected.lat, selected.lng], 15, { duration: 0.6 }), 0);
  } else if (userLocation) {
    setTimeout(() => map.flyTo([userLocation.lat, userLocation.lng], 12, { duration: 0.6 }), 0);
  }
  return null;
}

function PoolCard({ pool, distance, onSelect, selected }: { pool: Pool; distance?: number; onSelect: () => void; selected: boolean }) {
  return (
    <article className={`pool-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div>
        <div className="card-title-row">
          <h3>{pool.name}</h3>
          {typeof distance === 'number' && <span className="distance">{distance.toFixed(distance < 10 ? 1 : 0)} mi</span>}
        </div>
        <p className="address"><MapPin size={14} /> {pool.address}</p>
        <div className="chips">
          <span>{pool.borough}</span>
          {pool.accessible && <span>Accessible</span>}
          {pool.closed && <span className="closed-chip">Currently closed</span>}
        </div>
      </div>
      <a href={pool.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={`Open ${pool.name} on NYC Parks`}>
        <ExternalLink size={18} />
      </a>
    </article>
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [borough, setBorough] = useState('All');
  const [hideClosed, setHideClosed] = useState(false);
  const [selected, setSelected] = useState<Pool | undefined>();
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>();
  const [locationMessage, setLocationMessage] = useState('');

  const poolsWithDistance = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return pools
      .filter((pool) => borough === 'All' || pool.borough === borough)
      .filter((pool) => !hideClosed || !pool.closed)
      .filter((pool) => {
        if (!normalizedQuery) return true;
        return [pool.name, pool.address, pool.borough, pool.types.join(' ')].join(' ').toLowerCase().includes(normalizedQuery);
      })
      .map((pool) => ({ ...pool, distance: userLocation ? milesBetween(userLocation, pool) : undefined }))
      .sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
        return a.borough.localeCompare(b.borough) || a.name.localeCompare(b.name);
      });
  }, [borough, hideClosed, query, userLocation]);

  const nearest = poolsWithDistance[0];

  function locateMe() {
    setLocationMessage('Finding your location…');
    if (!navigator.geolocation) {
      setLocationMessage('This browser does not support geolocation.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy });
        setSelected(undefined);
        setLocationMessage('Location enabled. Distances are sorted nearest-first.');
      },
      (error) => setLocationMessage(error.message || 'Location permission was not granted.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow"><Waves size={18} /> NYC Parks Outdoor Pools</p>
          <h1>Find a public pool near you</h1>
          <p>Map of {pools.length} free NYC outdoor pool locations with official NYC Parks source links.</p>
        </div>
        <button className="locate-button" onClick={locateMe}><Crosshair size={19} /> Use my GPS</button>
      </section>

      <section className="controls" aria-label="Pool filters">
        <label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pool, address, type…" /></label>
        <select value={borough} onChange={(event) => setBorough(event.target.value)} aria-label="Filter by borough">
          {boroughs.map((item) => <option key={item}>{item}</option>)}
        </select>
        <label className="toggle"><input type="checkbox" checked={hideClosed} onChange={(event) => setHideClosed(event.target.checked)} /> Hide closed</label>
      </section>

      {locationMessage && <p className="location-message"><Navigation size={15} /> {locationMessage}</p>}
      {userLocation && nearest && <p className="nearest">Nearest in current filters: <strong>{nearest.name}</strong> ({nearest.distance?.toFixed(1)} miles)</p>}

      <section className="map-list-layout">
        <div className="map-panel">
          <MapContainer center={nycCenter} zoom={11} scrollWheelZoom className="pool-map">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapFocus selected={selected} userLocation={userLocation} />
            {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}><Popup>Your current location{userLocation.accuracy ? ` (±${Math.round(userLocation.accuracy)}m)` : ''}</Popup></Marker>}
            {poolsWithDistance.map((pool) => (
              <Marker key={pool.id} position={[pool.lat, pool.lng]} icon={poolIcon(pool)} eventHandlers={{ click: () => setSelected(pool) }}>
                <Popup>
                  <div className="popup">
                    <strong>{pool.name}</strong>
                    <p>{pool.address}</p>
                    {pool.closed && <p className="popup-alert">Currently closed — check NYC Parks.</p>}
                    <p>{pool.types.join(', ')}</p>
                    {pool.telephone && <p><Phone size={12} /> {pool.telephone}</p>}
                    <a href={pool.url} target="_blank" rel="noreferrer">NYC Parks details</a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <aside className="list-panel" aria-label="Pools list">
          <div className="list-header"><strong>{poolsWithDistance.length} pools</strong><span>Tap a card or map pin</span></div>
          <div className="cards">
            {poolsWithDistance.map((pool) => <PoolCard key={pool.id} pool={pool} distance={pool.distance} selected={selected?.id === pool.id} onSelect={() => setSelected(pool)} />)}
          </div>
        </aside>
      </section>

      <footer>Data from <a href="https://www.nycgovparks.org/facilities/outdoor-pools" target="_blank" rel="noreferrer">NYC Parks Free Outdoor Pools</a>. Confirm hours, rules, and closures before visiting.</footer>
    </main>
  );
}

export default App;
