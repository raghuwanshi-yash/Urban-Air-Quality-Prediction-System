import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import "./App.css";

// ─── Data & Config ────────────────────────────────────────────────────────────

const FIELDS = [
  {
    key: "pm25", label: "PM2.5", unit: "µg/m³", placeholder: "85",
    tip: "Fine particles < 2.5µm that bypass nasal filters and penetrate deep into lung tissue.",
  },
  {
    key: "pm10", label: "PM10", unit: "µg/m³", placeholder: "150",
    tip: "Coarse particles < 10µm. Inhaled into the upper airways, aggravating asthma.",
  },
  {
    key: "no2", label: "NO₂", unit: "µg/m³", placeholder: "60",
    tip: "Nitrogen dioxide from vehicle exhaust and power plants. Irritates the respiratory tract.",
  },
  {
    key: "so2", label: "SO₂", unit: "µg/m³", placeholder: "20",
    tip: "Sulphur dioxide from burning coal and oil. Causes acid rain and breathing difficulty.",
  },
  {
    key: "co", label: "CO", unit: "mg/m³", placeholder: "1.5",
    tip: "Carbon monoxide from incomplete combustion. Binds to haemoglobin, reducing oxygen delivery.",
  },
  {
    key: "o3", label: "O₃", unit: "µg/m³", placeholder: "90",
    tip: "Ground-level ozone. Not directly emitted — forms when sunlight reacts with NOx and VOCs.",
  },
];

const RISK = {
  Low:            { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", insight: "Air quality is good. Enjoy outdoor activities freely." },
  Moderate:       { color: "#d97706", bg: "#fffbeb", border: "#fcd34d", insight: "Acceptable air quality. Sensitive individuals should consider limiting prolonged outdoor exertion." },
  Unhealthy:      { color: "#ea580c", bg: "#fff7ed", border: "#fdba74", insight: "Health effects possible for everyone. Limit outdoor activity, especially near traffic." },
  "Very Unhealthy":{ color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", insight: "Health alert. Everyone should avoid prolonged outdoor exposure. Keep windows closed." },
  Severe:         { color: "#7c3aed", bg: "#faf5ff", border: "#c4b5fd", insight: "Emergency conditions. Stay indoors. Air purifiers recommended. Avoid any outdoor activity." },
};

const AQI_TREND = [
  { day: "Apr 1", aqi: 42  }, { day: "Apr 2", aqi: 68  },
  { day: "Apr 3", aqi: 95  }, { day: "Apr 4", aqi: 120 },
  { day: "Apr 5", aqi: 88  }, { day: "Apr 6", aqi: 55  },
  { day: "Apr 7", aqi: 145 }, { day: "Apr 8", aqi: 210 },
  { day: "Apr 9", aqi: 175 }, { day: "Apr 10", aqi: 130 },
  { day: "Apr 11", aqi: 76 }, { day: "Apr 12", aqi: 49 },
];

const POLLUTANTS = [
  { name: "PM2.5", value: 85,  safe: 60,  color: "#3b82f6" },
  { name: "PM10",  value: 150, safe: 100, color: "#8b5cf6" },
  { name: "NO₂",   value: 60,  safe: 80,  color: "#06b6d4" },
  { name: "SO₂",   value: 20,  safe: 80,  color: "#10b981" },
  { name: "CO×10", value: 15,  safe: 40,  color: "#f59e0b" },
  { name: "O₃",    value: 90,  safe: 100, color: "#ef4444" },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function InfoTooltip({ text }) {
  return (
    <span className="tooltip-wrap">
      <span className="tooltip-icon">i</span>
      <span className="tooltip-box">{text}</span>
    </span>
  );
}
function AqiGauge({ value, max = 300 }) {
  const pct   = Math.min(value / max, 1);
  const R     = 54;
  const circ  = 2 * Math.PI * R;
  const dash  = circ * 0.75;
  const offset = dash - pct * dash;
  const color = value <= 50 ? "#16a34a" : value <= 100 ? "#d97706" : value <= 200 ? "#ea580c" : "#dc2626";

  return (
    <svg className="gauge-svg" viewBox="0 0 120 80">
      <circle cx="60" cy="68" r={R} fill="none" stroke="#f1f5f9"
        strokeWidth="10" strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset="0" strokeLinecap="round"
        transform="rotate(-225 60 68)" />
      <circle cx="60" cy="68" r={R} fill="none" stroke={color}
        strokeWidth="10" strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-225 60 68)"
        style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1), stroke 0.4s ease" }} />
      <text x="60" y="62" textAnchor="middle" fontSize="22" fontWeight="800"
        fill={color} fontFamily="Inter, sans-serif"
        style={{ transition: "fill 0.4s ease" }}>{value}</text>
      <text x="60" y="74" textAnchor="middle" fontSize="7.5" fill="#9ca3af" fontFamily="Inter, sans-serif">
        AQI
      </text>
    </svg>
  );
}

function LineTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const level = v <= 50 ? "Low" : v <= 100 ? "Moderate" : v <= 200 ? "Unhealthy" : "Severe";
  const r = RISK[level];
  return (
    <div className="chart-tip" style={{ borderLeftColor: r.color }}>
      <p className="ct-date">{label}</p>
      <p className="ct-val" style={{ color: r.color }}>{v}</p>
      <p className="ct-level" style={{ color: r.color }}>{level}</p>
    </div>
  );
}

function BarTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = POLLUTANTS.find(p => p.name === label);
  const v = payload[0].value;
  const over = item && v > item.safe;
  return (
    <div className="chart-tip" style={{ borderLeftColor: item?.color || "#3b82f6" }}>
      <p className="ct-date">{label}</p>
      <p className="ct-val" style={{ color: item?.color }}>{v} <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af" }}>µg/m³</span></p>
      {item?.safe && (
        <p className="ct-level" style={{ color: over ? "#dc2626" : "#16a34a" }}>
          {over ? `+${v - item.safe} above limit` : "Within safe limit"}
        </p>
      )}
    </div>
  );
}

function ColoredBar(props) {
  const { x, y, width, height, index } = props;
  const item = POLLUTANTS[index];
  return <rect x={x} y={y} width={width} height={Math.max(height, 0)} fill={item?.color || "#3b82f6"} rx={4} />;
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [form,      setForm]    = useState({ pm25: "", pm10: "", no2: "", so2: "", co: "", o3: "" });
  const [result,    setResult]  = useState(null);
  const [loading,   setLoading] = useState(false);
  const [error,     setError]   = useState("");
  const [hasSubmit, setHasSubmit] = useState(false);
  const resultRef = useRef(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setResult(null);
    for (const f of FIELDS) {
      if (form[f.key] === "" || isNaN(+form[f.key])) { setError(`Enter a valid value for ${f.label}.`); return; }
      if (+form[f.key] < 0) { setError(`${f.label} cannot be negative.`); return; }
    }
    setLoading(true); setHasSubmit(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/predict", {
        pm25: +form.pm25, pm10: +form.pm10,
        no2:  +form.no2,  so2:  +form.so2,
        co:   +form.co,   o3:   +form.o3,
      });
      setResult(res.data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    } catch (err) {
      setError(err.response?.data?.error ?? (err.request ? "Cannot reach Flask server on port 5000." : "Unexpected error."));
    } finally { setLoading(false); }
  }

  const meta = result ? (RISK[result.risk_level] ?? RISK.Severe) : null;
  const avgAqi = Math.round(AQI_TREND.reduce((s, d) => s + d.aqi, 0) / AQI_TREND.length);

  return (
    <div className="root">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-left">
          <div className="header-dot" />
          <div>
            <h1 className="header-title">AirSense</h1>
            <p className="header-sub">Urban Air Quality Intelligence</p>
          </div>
        </div>
        <div className="header-right">
          <span className="status-pill">
            <span className="status-pulse" />
            Live Model
          </span>
        </div>
      </header>

      {/* ── Main 2-column ──────────────────────────────────────────────── */}
      <main className="main">

        {/* LEFT — Input ──────────────────────────────────────────── */}
        <div className="panel-left">
          <div className="section-label">Pollutant Readings</div>
          <p className="section-hint">Enter sensor values to generate an AI-powered AQI prediction and health risk assessment.</p>

          <form onSubmit={onSubmit} noValidate className="form">
            <div className="field-grid">
              {FIELDS.map(({ key, label, unit, placeholder, tip }) => (
                <div className="field" key={key}>
                  <div className="field-label-row">
                    <label htmlFor={key} className="field-label">{label}</label>
                    <span className="field-unit">{unit}</span>
                    <InfoTooltip text={tip} />
                  </div>
                  <input
                    id={key} name={key} type="number" min="0" step="any"
                    placeholder={placeholder} value={form[key]}
                    onChange={onChange} required className="field-input"
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="error-msg" role="alert">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="7" cy="7" r="6" stroke="#dc2626" strokeWidth="1.3"/>
                  <path d="M7 4v3M7 9v.5" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <><span className="spinner" />Analysing…</>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Predict AQI
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT — Result ─────────────────────────────────────────── */}
        <div className="panel-right" ref={resultRef}>
          <div className="section-label">Live Result</div>

          {!hasSubmit && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="11.5" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3"/>
                  <path d="M14 8v6.5l3.5 2" stroke="#d1d5db" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="empty-title">No prediction yet</p>
              <p className="empty-body">Enter pollutant readings on the left and click <strong>Predict AQI</strong> to see real-time results.</p>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <span className="spinner-lg" />
              <p className="empty-body" style={{ marginTop: 12 }}>Running AI model…</p>
            </div>
          )}

          {result && meta && !loading && (
            <div className="result-body">

              {/* Gauge + score */}
              <div className="gauge-wrap" style={{ borderColor: meta.border, background: meta.bg }}>
                <AqiGauge value={result.predicted_aqi} />
                <div className="gauge-info">
                  <span className="risk-pill" style={{ background: meta.border, color: meta.color }}>
                    {result.risk_level}
                  </span>
                </div>
              </div>

              {/* Insight */}
              <p className="result-insight">{meta.insight}</p>

              {/* Input echo */}
              <div className="echo-grid">
                {FIELDS.map(f => (
                  <div className="echo-item" key={f.key}>
                    <span className="echo-label">{f.label}</span>
                    <span className="echo-val">{form[f.key] || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Dashboard ──────────────────────────────────────────────────── */}
      <section className="dashboard-wrapper">
  <div className="dashboard-container">

        {/* Section header */}
        <div className="dash-hdr">
          <div>
            <h2 className="dash-title">Air Quality Analytics</h2>
            <p className="dash-sub">Historical trends and pollutant breakdown for this monitoring station</p>
          </div>
          <div className="kpi-strip">
            <div className="kpi">
              <span className="kpi-num" style={{ color: "#2563eb" }}>{avgAqi}</span>
              <span className="kpi-lbl">12-day avg</span>
            </div>
            <div className="kpi-sep" />
            <div className="kpi">
              <span className="kpi-num" style={{ color: "#dc2626" }}>210</span>
              <span className="kpi-lbl">Peak</span>
            </div>
            <div className="kpi-sep" />
            <div className="kpi">
              <span className="kpi-num" style={{ color: "#16a34a" }}>42</span>
              <span className="kpi-lbl">Low</span>
            </div>
          </div>
        </div>

        {/* Charts side by side, no card boxing */}
        <div className="charts-wrap">

          {/* Line chart */}
          <div className="chart-block">
            <div className="chart-hdr">
              <p className="chart-title">AQI Trend</p>
              <p className="chart-desc">April 1–12 · Daily readings</p>
            </div>
            <div className="ref-legend">
              <span className="rl-item"><span className="rl-line" style={{ background: "#16a34a" }} />Safe ≤100</span>
              <span className="rl-item"><span className="rl-line" style={{ background: "#dc2626" }} />Unhealthy ≥200</span>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={AQI_TREND} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 240]} tick={{ fontSize: 10.5, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <ReferenceLine y={100} stroke="#16a34a" strokeDasharray="5 4" strokeWidth={1.2} />
                <ReferenceLine y={200} stroke="#dc2626" strokeDasharray="5 4" strokeWidth={1.2} />
                <Tooltip content={<LineTooltipContent />} />
                <Line type="monotone" dataKey="aqi" stroke="#2563eb" strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "#fff", stroke: "#2563eb", strokeWidth: 2 }}
                  activeDot={{ r: 5.5, fill: "#2563eb", strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Divider */}
          <div className="charts-divider" />

          {/* Bar chart */}
          <div className="chart-block">
            <div className="chart-hdr">
              <p className="chart-title">Pollutant Breakdown</p>
              <p className="chart-desc">Current readings · CO scaled ×10 for visibility</p>
            </div>
            <div className="bar-legend">
              {POLLUTANTS.map(p => (
                <span className="rl-item" key={p.name}>
                  <span className="rl-dot" style={{ background: p.color }} />{p.name}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={POLLUTANTS} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10.5, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip content={<BarTooltipContent />} cursor={{ fill: "rgba(37,99,235,.04)" }} />
                <Bar dataKey="value" shape={<ColoredBar />} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
        </div>
</section>

      <footer className="footer">
        AirSense · AI-powered urban air quality monitoring
      </footer>
    </div>
  );
}