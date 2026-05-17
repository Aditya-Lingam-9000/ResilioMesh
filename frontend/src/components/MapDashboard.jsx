import { MapContainer, TileLayer, Marker, Popup, CircleMarker, LayerGroup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createIcon = (riskStyleStr) => {
  let colorClass = 'bg-emerald-500';
  if (riskStyleStr.includes('text-red-900')) colorClass = 'bg-red-500';
  if (riskStyleStr.includes('text-amber-900')) colorClass = 'bg-amber-500';

  return divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="h-4 w-4 rounded-full border-2 border-white shadow-md ${colorClass} animate-pulse"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
};

const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

const getReportCoords = (report) => {
  if (report?.device_gps && report?.location_source === 'device') {
    const lat = Number(report.device_gps.lat);
    const lng = Number(report.device_gps.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
  }

  if (!report?.location || report.location === 'unknown') return null;

  const coordsText = report.location.split(',');
  if (coordsText.length !== 2) return null;

  const lat = parseFloat(coordsText[0].trim());
  const lng = parseFloat(coordsText[1].trim());
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return [lat, lng];
};

const getConfidence = (report) => {
  if (typeof report?.confidence === 'number') {
    return clampValue(report.confidence, 0, 1);
  }
  return 0.5;
};

const getHeatColor = (confidence) => {
  const hue = Math.round(120 * confidence);
  return `hsl(${hue}, 85%, 50%)`;
};

export default function MapDashboard({ reports, riskStyle, showHeatmap }) {
  // Center map on standard India view coordinates initially (or roughly Vijayawada focus area)
  const defaultCenter = [16.5062, 80.6480];

  return (
    <div className="relative z-0 h-[450px] w-full overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-xl">
      {showHeatmap ? (
        <div className="pointer-events-none absolute right-4 top-4 z-[1000] rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[11px] text-slate-600 shadow-sm backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Heatmap</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Low</span>
            <div
              className="h-2 w-20 rounded-full"
              style={{ background: 'linear-gradient(90deg, #f87171 0%, #facc15 50%, #22c55e 100%)' }}
            />
            <span className="text-[10px] text-slate-500">High</span>
          </div>
        </div>
      ) : null}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {showHeatmap ? (
          <LayerGroup>
            {reports.map((report) => {
              const coords = getReportCoords(report);
              if (!coords) return null;

              const confidence = getConfidence(report);
              const heatColor = getHeatColor(confidence);
              const radius = 14 + confidence * 26;
              const fillOpacity = 0.2 + confidence * 0.35;

              return (
                <CircleMarker
                  key={`heat-${report.id}`}
                  center={coords}
                  radius={radius}
                  pathOptions={{ color: heatColor, fillColor: heatColor, fillOpacity, weight: 0 }}
                  interactive={false}
                />
              );
            })}
          </LayerGroup>
        ) : null}

        {reports.map((r) => {
          const coords = getReportCoords(r);
          if (!coords) return null;

          return (
            <Marker key={r.id} position={coords} icon={createIcon(riskStyle[r.risk_level])}>
              <Popup className="rounded-xl">
                <div className="text-sm">
                  <p className="font-bold text-slate-800">{r.id}</p>
                  <p className="mt-1">
                    Risk:{' '}
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${riskStyle[r.risk_level]}`}>
                      {r.risk_level}
                    </span>
                  </p>
                  <p className="mt-2 text-slate-600 font-medium">Need: {r.help_needed}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Confidence: {typeof r.confidence === 'number' ? r.confidence.toFixed(2) : '0.50'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{r.description || 'No description available.'}</p>
                  <p className="mt-3 border-t pt-2 text-xs font-semibold text-slate-400">Node: {r.source}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}