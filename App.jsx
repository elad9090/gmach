import { useState, useRef, useEffect } from "react";

const ROUTE_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706"];
const ROUTE_EMOJIS = ["🚗", "🚙", "🚛", "🏎️"];
const CITY = "קריית גת";

const DEFAULT_ADDRESSES = [
  { id: 1,  name: "מבוא קדמה 5",    note: "נקודת מוצא", isStart: true },
  { id: 2,  name: "משה ברזני 23" },
  { id: 3,  name: "הקוממיות 32" },
  { id: 4,  name: "חידקל 19" },
  { id: 5,  name: "צהל 15" },
  { id: 6,  name: "התמרים 11" },
  { id: 7,  name: "הרימון 87" },
  { id: 8,  name: "שדרות גת 94" },
  { id: 9,  name: "שדרות גת 223" },
  { id: 10, name: "דוד המלך 5" },
  { id: 11, name: "אהוד בן גרא 1" },
  { id: 12, name: "אליהו הנביא 10" },
  { id: 13, name: "שמואל הנביא 19" },
  { id: 14, name: "שמואל הנביא 7" },
  { id: 15, name: "השופטים 18" },
  { id: 16, name: "נתן אלבז 9" },
  { id: 17, name: "שדרות לכיש 40" },
  { id: 18, name: "שדרות לכיש 59" },
  { id: 19, name: "משעול האיריס 3" },
  { id: 20, name: "אדוריים 247", note: "נקודת סיום", isEnd: true },
];

const PRESETS = {
  2: [[1,2,3,4,5,6,7,8,9],[1,10,11,12,13,14,15,16,17,18,19,20]],
  3: [[1,2,3,4,5,6,7],[1,8,9,10,11],[1,12,13,14,15,16,17,18,19,20]],
  4: [[1,2,3,4,5],[1,6,7,8,9],[1,10,11,12,13,14,15],[1,16,17,18,19,20]],
};
const ROUTE_NAMES = {
  2: ["מזרח וצפון","מרכז ודרום-מערב"],
  3: ["מזרח","גת ומרכז צפון","נביאים ודרום-מערב"],
  4: ["מזרח (קריה)","צפון וגת","מרכז ונביאים","דרום-מערב ולכיש"],
};

// ─── URL Router ───────────────────────────────────────────────────────────────
// Parses: /2cars, /3cars, /4cars, /2cars/route/1, /3cars/route/2 ...
function parseRoute() {
  const path = window.location.pathname;
  const carsMatch = path.match(/\/(2|3|4)cars/);
  const routeMatch = path.match(/\/route\/(\d+)/);
  return {
    numCars: carsMatch ? parseInt(carsMatch[1]) : null,
    routeIdx: routeMatch ? parseInt(routeMatch[1]) - 1 : null, // 0-indexed
  };
}

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("popstate"));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekKey() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}
function formatWeekLabel(key) {
  if (!key) return "";
  const [year, w] = key.split("-W");
  return `שבוע ${w}, ${year}`;
}
function mapsUrl(name) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name + ", " + CITY)}`;
}
function loadState(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveState(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function buildRoutes(numCars, addresses) {
  const preset = PRESETS[numCars];
  const names  = ROUTE_NAMES[numCars];
  const validIds = new Set(addresses.map(a => a.id));
  const built = preset.map((ids, i) => ({
    id: i, ids: ids.filter(id => validIds.has(id)),
    color: ROUTE_COLORS[i], emoji: ROUTE_EMOJIS[i],
    label: `רכב ${["א׳","ב׳","ג׳","ד׳"][i]} — ${names[i]}`,
  }));
  const assigned = new Set(built.flatMap(r => r.ids));
  const unassigned = addresses.filter(a => !assigned.has(a.id) && !a.isStart && !a.isEnd);
  if (unassigned.length) built[0].ids = [...built[0].ids, ...unassigned.map(a => a.id)];
  const saved = loadState(`gmach_routes_${numCars}`, null);
  if (saved) return saved.map((r, i) => ({ ...built[i], ids: r.ids.filter(id => validIds.has(id)) }));
  return built;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"#1e293b", color:"#fff", borderRadius:12, padding:"10px 20px",
      fontSize:14, fontWeight:600, zIndex:9999, whiteSpace:"nowrap",
      boxShadow:"0 4px 24px #0003", pointerEvents:"none",
    }}>{msg}</div>
  );
}

// ─── Home — pick num cars ─────────────────────────────────────────────────────
function HomePage() {
  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, direction:"rtl" }}>
      <span style={{ fontSize:48, marginBottom:12 }}>🧡</span>
      <h1 style={{ fontWeight:800, fontSize:24, color:"#111827", margin:"0 0 6px" }}>גמ״ח חלוקה שבועית</h1>
      <p style={{ color:"#6b7280", fontSize:14, marginBottom:32 }}>כמה רכבים חולקים השבוע?</p>
      <div style={{ display:"flex", flexDirection:"column", gap:12, width:"100%", maxWidth:280 }}>
        {[2,3,4].map(n => (
          <button key={n} onClick={() => navigate(`/${n}cars`)} style={{
            padding:"16px 0", borderRadius:14, border:"none",
            background: n===2 ? "#2563EB" : n===3 ? "#7C3AED" : "#059669",
            color:"#fff", fontWeight:700, fontSize:17, cursor:"pointer",
            boxShadow:`0 4px 14px ${n===2?"#2563EB44":n===3?"#7C3AED44":"#05966944"}`,
          }}>
            {["🚗 2 רכבים","🚙🚛 3 רכבים","🚗🚙🚛🏎️ 4 רכבים"][n-2]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Map View ─────────────────────────────────────────────────────────────────
function MapView({ routes, addresses }) {
  const positions = {};
  addresses.forEach((a, i) => {
    positions[a.id] = { x: 50 + (i % 5) * 90, y: 40 + Math.floor(i / 5) * 72 };
  });
  return (
    <div style={{ overflowX:"auto", padding:"8px 0" }}>
      <svg width={480} height={340} style={{ display:"block", margin:"0 auto", background:"#f8fafc", borderRadius:12, border:"1.5px solid #e5e7eb" }}>
        {routes.map((route, ri) => {
          const pts = route.ids.map(id => positions[id]).filter(Boolean);
          if (pts.length < 2) return null;
          const d = pts.map((p,i) => `${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
          return <path key={ri} d={d} fill="none" stroke={route.color} strokeWidth={2.5} strokeDasharray={ri===0?"":"6 3"} opacity={0.7} />;
        })}
        {addresses.map(a => {
          const p = positions[a.id];
          const ri = routes.findIndex(r => r.ids.includes(a.id) && !a.isStart);
          const col = ri >= 0 ? routes[ri].color : "#94a3b8";
          return (
            <g key={a.id}>
              <circle cx={p.x} cy={p.y} r={a.isStart ? 10 : 7} fill={col} opacity={0.9} />
              <text x={p.x} y={p.y+4} textAnchor="middle" fontSize={9} fill="#fff" fontWeight={700}>{a.id}</text>
            </g>
          );
        })}
        {routes.map((route, ri) => (
          <g key={ri}>
            <rect x={8} y={8 + ri*22} width={12} height={12} rx={3} fill={route.color} />
            <text x={24} y={19 + ri*22} fontSize={11} fill="#374151" fontWeight={600}>{route.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Address Card ─────────────────────────────────────────────────────────────
function AddressCard({ addr, color, index, photos, notes, delivered,
  onPhotoChange, onPhotoRemove, onNoteChange, onToggleDelivered,
  dragging, onDragStart, onDragEnd, onDragOver, onDrop, driverMode }) {

  const fileRef = useRef();
  const photo = photos[addr.id];
  const note = notes[addr.id] || "";
  const isDone = delivered[addr.id];
  const isFixed = addr.isStart;

  return (
    <div
      draggable={!isFixed && !driverMode}
      onDragStart={() => onDragStart(addr.id)}
      onDragEnd={onDragEnd}
      onDragOver={e => { e.preventDefault(); onDragOver(addr.id); }}
      onDrop={() => onDrop(addr.id)}
      style={{
        background: isDone ? "#f0fdf4" : "#fff",
        border: `1.5px solid ${dragging ? color : isDone ? "#86efac" : "#e5e7eb"}`,
        borderRadius: 10, padding: "9px 12px",
        display:"flex", alignItems:"flex-start", gap:9,
        cursor: isFixed || driverMode ? "default" : "grab",
        opacity: isDone ? 0.72 : 1,
        transition:"border-color 0.15s, opacity 0.2s", userSelect:"none",
      }}
    >
      <div style={{
        minWidth:26, height:26, borderRadius:"50%",
        background: isFixed ? "#f3f4f6" : color,
        color: isFixed ? "#6b7280" : "#fff",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontWeight:700, fontSize:12, flexShrink:0, marginTop:1,
        border: isFixed ? "1.5px dashed #d1d5db" : "none",
      }}>{index}</div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{
            fontWeight:600, fontSize:14,
            color: isDone ? "#6b7280" : "#111827",
            textDecoration: isDone ? "line-through" : "none",
          }}>{addr.name}</span>
          {addr.note && (
            <span style={{ fontSize:10, background:"#f3f4f6", color:"#6b7280", borderRadius:5, padding:"1px 6px" }}>{addr.note}</span>
          )}
        </div>

        {!driverMode && !isFixed && (
          <input value={note} onChange={e => onNoteChange(addr.id, e.target.value)}
            placeholder="הערה (קומה, שם, הוראות...)"
            style={{ marginTop:5, width:"100%", fontSize:11, border:"1px solid #e5e7eb", borderRadius:6, padding:"3px 7px", background:"#f9fafb", color:"#374151", outline:"none", boxSizing:"border-box" }}
          />
        )}
        {driverMode && note && (
          <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>📝 {note}</div>
        )}

        {photo ? (
          <div style={{ marginTop:6, position:"relative", display:"inline-block" }}>
            <img src={photo} alt="בית" style={{ width:84, height:64, objectFit:"cover", borderRadius:7, border:"1.5px solid #e5e7eb", display:"block" }} />
            {!driverMode && (
              <button onClick={() => onPhotoRemove(addr.id)} style={{
                position:"absolute", top:-6, left:-6, width:18, height:18,
                borderRadius:"50%", background:"#ef4444", color:"#fff",
                border:"none", cursor:"pointer", fontSize:10,
                display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700,
              }}>×</button>
            )}
          </div>
        ) : !isFixed && (
          <button onClick={() => fileRef.current.click()} style={{
            marginTop:5, fontSize:10, color:"#9ca3af", background:"none",
            border:"1px dashed #d1d5db", borderRadius:5, padding:"2px 7px",
            cursor:"pointer", display:"flex", alignItems:"center", gap:3,
          }}>📷 תמונת בית</button>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
          onChange={e => {
            const file = e.target.files[0]; if (!file) return;
            const r = new FileReader();
            r.onload = ev => onPhotoChange(addr.id, ev.target.result);
            r.readAsDataURL(file); e.target.value = "";
          }}
        />
      </div>

      {!isFixed && (
        <div style={{ display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
          <a href={mapsUrl(addr.name)} target="_blank" rel="noreferrer" title="נווט"
            style={{ width:28, height:28, borderRadius:7, background:"#eff6ff", border:"1.5px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, textDecoration:"none" }}>🧭</a>
          <button onClick={() => onToggleDelivered(addr.id)}
            style={{
              width:28, height:28, borderRadius:7,
              border:`1.5px solid ${isDone ? "#86efac" : "#d1d5db"}`,
              background: isDone ? "#dcfce7" : "#f9fafb",
              color: isDone ? "#16a34a" : "#9ca3af",
              cursor:"pointer", fontSize:15,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>{isDone ? "✓" : "○"}</button>
        </div>
      )}
    </div>
  );
}

// ─── Route Column ─────────────────────────────────────────────────────────────
function RouteColumn({ route, addrMap, photos, notes, delivered,
  onPhotoChange, onPhotoRemove, onNoteChange, onToggleDelivered,
  dragState, onDragStart, onDragEnd, onDragOver, onDrop,
  driverMode, onShare, numCars }) {

  const addrs = route.ids.map(id => addrMap[id]).filter(Boolean);
  const deliveredCount = route.ids.filter((id, i) => i > 0 && delivered[id]).length;
  const total = route.ids.length - 1;
  const pct = total > 0 ? Math.round((deliveredCount / total) * 100) : 0;
  const driverUrl = `${window.location.origin}/${numCars}cars/route/${route.id + 1}`;

  return (
    <div style={{ background:"#fafafa", borderRadius:14, border:"1.5px solid #e5e7eb", overflow:"hidden", flex:"1 1 280px", minWidth:0 }}>
      <div style={{ background:route.color, padding:"11px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:18 }}>{route.emoji}</span>
          <span style={{ color:"#fff", fontWeight:700, fontSize:14 }}>{route.label}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ background:"rgba(255,255,255,0.2)", color:"#fff", borderRadius:16, padding:"1px 9px", fontSize:12, fontWeight:600 }}>
            {deliveredCount}/{total}
          </span>
          {!driverMode && (
            <button onClick={() => onShare(route, driverUrl)} title="שלח לנהג"
              style={{ width:26, height:26, borderRadius:6, background:"rgba(255,255,255,0.2)", border:"none", cursor:"pointer", fontSize:14, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
              📤
            </button>
          )}
        </div>
      </div>
      <div style={{ height:4, background:"#e5e7eb" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:route.color, transition:"width 0.3s" }} />
      </div>
      <div style={{ padding:10, display:"flex", flexDirection:"column", gap:7 }}>
        {addrs.map((addr, i) => (
          <AddressCard key={addr.id}
            addr={addr} color={route.color} index={i+1}
            photos={photos} notes={notes} delivered={delivered}
            onPhotoChange={onPhotoChange} onPhotoRemove={onPhotoRemove}
            onNoteChange={onNoteChange} onToggleDelivered={onToggleDelivered}
            dragging={dragState.over === addr.id}
            onDragStart={() => onDragStart(addr.id, route.id)}
            onDragEnd={onDragEnd}
            onDragOver={() => onDragOver(addr.id)}
            onDrop={() => onDrop(addr.id, route.id)}
            driverMode={driverMode}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Add Address Modal ────────────────────────────────────────────────────────
function AddAddressModal({ onAdd, onClose }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, background:"#0006", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:14, padding:24, width:"100%", maxWidth:360 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>➕ הוסף כתובת</div>
        <input autoFocus value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key==="Enter" && val.trim()) { onAdd(val.trim()); onClose(); }}}
          placeholder="שם רחוב ומספר בית"
          style={{ width:"100%", border:"1.5px solid #d1d5db", borderRadius:8, padding:"9px 12px", fontSize:14, outline:"none", boxSizing:"border-box", direction:"rtl" }}
        />
        <div style={{ display:"flex", gap:8, marginTop:14 }}>
          <button onClick={() => { if (val.trim()) { onAdd(val.trim()); onClose(); }}}
            style={{ flex:1, padding:"9px 0", background:"#2563EB", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:14 }}>הוסף</button>
          <button onClick={onClose}
            style={{ flex:1, padding:"9px 0", background:"#f3f4f6", color:"#374151", border:"none", borderRadius:8, fontWeight:600, cursor:"pointer", fontSize:14 }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// ─── Driver View (route page) ─────────────────────────────────────────────────
function DriverView({ numCars, routeIdx }) {
  const addresses = loadState("gmach_addresses", DEFAULT_ADDRESSES);
  const photosInit = loadState("gmach_photos", {});
  const notes = loadState("gmach_notes", {});
  const [photos, setPhotos] = useState(photosInit);
  const [delivered, setDelivered] = useState(() => loadState(`gmach_driver_delivered_${numCars}_${routeIdx}`, {}));

  const routes = buildRoutes(numCars, addresses);
  const route  = routes[routeIdx];

  useEffect(() => {
    saveState(`gmach_driver_delivered_${numCars}_${routeIdx}`, delivered);
  }, [delivered]);

  if (!route) return (
    <div style={{ padding:40, textAlign:"center", direction:"rtl" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>❓</div>
      <div style={{ fontWeight:700, color:"#374151" }}>המסלול לא נמצא</div>
      <button onClick={() => navigate("/")} style={{ marginTop:16, padding:"10px 20px", background:"#2563EB", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}>חזור לבית</button>
    </div>
  );

  const addrMap = Object.fromEntries(addresses.map(a => [a.id, a]));
  // Stops = all ids excluding start point
  const stopIds = route.ids.filter(id => !addrMap[id]?.isStart);
  const total = stopIds.length;
  const doneCount = stopIds.filter(id => delivered[id]).length;

  // Find current stop = first undelivered stop; if all done, show finish screen
  const currentIdx = stopIds.findIndex(id => !delivered[id]);
  const allDone = currentIdx === -1;
  const currentId = allDone ? null : stopIds[currentIdx];
  const addr = currentId ? addrMap[currentId] : null;
  const note = currentId ? (notes[currentId] || "") : "";
  const photo = currentId ? (photos[currentId] || "") : "";
  const stopNum = currentIdx + 1;

  function markDelivered() {
    if (!currentId) return;
    setDelivered(d => ({ ...d, [currentId]: true }));
  }
  function goBackOne() {
    // Un-mark the previous stop so driver can go back if they clicked too fast
    const prevId = stopIds[currentIdx - 1];
    if (prevId) setDelivered(d => ({ ...d, [prevId]: false }));
  }
  function handlePhoto(src) {
    if (!currentId) return;
    const p = loadState("gmach_photos", {});
    p[currentId] = src;
    saveState("gmach_photos", p);
    setPhotos(p);
  }

  const pct = total > 0 ? (doneCount / total) * 100 : 0;

  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", direction:"rtl", fontFamily:"'Segoe UI',system-ui,Arial,sans-serif", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:route.color, color:"#fff", padding:"16px 16px 14px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:18, margin:"0 0 2px" }}>{route.emoji} {route.label}</div>
            <div style={{ fontSize:11, opacity:0.8 }}>גמ״ח חלוקה שבועית</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.22)", borderRadius:20, padding:"5px 16px", fontSize:15, fontWeight:800 }}>
            {doneCount} / {total}
          </div>
        </div>
        <div style={{ marginTop:12, background:"rgba(255,255,255,0.25)", borderRadius:99, height:7, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:"#fff", borderRadius:99, transition:"width 0.4s" }} />
        </div>
      </div>

      {/* Main content: ONE screen at a time */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"20px 18px", maxWidth:480, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>

        {allDone ? (
          /* ── Finish screen ── */
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
            <div style={{ fontWeight:800, fontSize:22, color:"#111827", marginBottom:6 }}>כל המשלוחים הושלמו!</div>
            <div style={{ color:"#6b7280", fontSize:14, marginBottom:28 }}>כל הכבוד, {route.label.split("—")[0].trim()} סיים את המסלול 🙌</div>
            {stopIds.length > 0 && (
              <button onClick={() => setDelivered(d => ({ ...d, [stopIds[stopIds.length-1]]: false }))}
                style={{ padding:"10px 20px", borderRadius:10, border:"1.5px solid #e5e7eb", background:"#fff", color:"#6b7280", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                ↩ חזור לעצירה האחרונה
              </button>
            )}
          </div>
        ) : (
          /* ── Current stop card ── */
          <>
            {/* Stop indicator */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{
                width:46, height:46, borderRadius:"50%", background:route.color,
                color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                fontWeight:800, fontSize:19, flexShrink:0, boxShadow:`0 4px 14px ${route.color}55`,
              }}>{stopNum}</div>
              <div>
                <div style={{ fontSize:11, color:"#9ca3af", fontWeight:600 }}>עצירה {stopNum} מתוך {total}</div>
                <div style={{ fontSize:13, color:"#6b7280" }}>{addr.isEnd ? "🏁 עצירה אחרונה" : "בדרך לכתובת"}</div>
              </div>
            </div>

            {/* Big address card */}
            <div style={{ background:"#fff", borderRadius:20, border:"2px solid #e5e7eb", overflow:"hidden", boxShadow:"0 6px 24px #0001", flex:1, display:"flex", flexDirection:"column" }}>

              {/* Photo — large, top of card */}
              <div style={{ position:"relative", background:"#f3f4f6", minHeight:200 }}>
                {photo ? (
                  <img src={photo} alt="בית" style={{ width:"100%", height:220, objectFit:"cover", display:"block" }} />
                ) : (
                  <label style={{
                    width:"100%", height:200, display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer",
                    color:"#9ca3af", background:"repeating-linear-gradient(45deg,#f9fafb,#f9fafb 10px,#f3f4f6 10px,#f3f4f6 20px)",
                  }}>
                    <span style={{ fontSize:32 }}>📷</span>
                    <span style={{ fontSize:13, fontWeight:600 }}>הוסף תמונת בית</span>
                    <input type="file" accept="image/*" style={{ display:"none" }}
                      onChange={e => {
                        const file = e.target.files[0]; if (!file) return;
                        const r = new FileReader();
                        r.onload = ev => handlePhoto(ev.target.result);
                        r.readAsDataURL(file); e.target.value = "";
                      }}
                    />
                  </label>
                )}
                {photo && (
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,0.5))", padding:"24px 16px 10px" }}>
                    <span style={{ color:"#fff", fontSize:12, fontWeight:600 }}>תמונת הבית</span>
                  </div>
                )}
              </div>

              {/* Address + note */}
              <div style={{ padding:"18px 18px 16px", flex:1 }}>
                <div style={{ fontWeight:800, fontSize:24, color:"#111827", lineHeight:1.25 }}>
                  {addr.name}{addr.isEnd ? " 🏁" : ""}
                </div>
                {addr.note && (
                  <span style={{ fontSize:11, background:"#f3f4f6", color:"#6b7280", borderRadius:6, padding:"2px 8px", display:"inline-block", marginTop:6 }}>{addr.note}</span>
                )}

                {note ? (
                  <div style={{ marginTop:14, display:"flex", alignItems:"flex-start", gap:8, background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:12, padding:"12px 14px" }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>📝</span>
                    <div>
                      <div style={{ fontSize:11, color:"#92400e", fontWeight:700, marginBottom:2 }}>הערה</div>
                      <div style={{ fontSize:15, color:"#78350f", lineHeight:1.4, fontWeight:600 }}>{note}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop:14, fontSize:13, color:"#d1d5db" }}>אין הערה לכתובת זו</div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <a href={mapsUrl(addr.name)} target="_blank" rel="noreferrer"
                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"15px 0", borderRadius:14, background:"#eff6ff", border:"2px solid #bfdbfe", color:"#1d4ed8", fontWeight:700, fontSize:15, textDecoration:"none" }}>
                🧭 נווט
              </a>
              <button onClick={markDelivered}
                style={{ flex:2, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"15px 0", borderRadius:14, border:"none", background:"#16a34a", color:"#fff", fontWeight:800, fontSize:16, cursor:"pointer", boxShadow:"0 4px 14px #16a34a55" }}>
                ✓ נמסר — לעצירה הבאה
              </button>
            </div>

            {stopNum > 1 && (
              <button onClick={goBackOne} style={{ marginTop:10, alignSelf:"center", background:"none", border:"none", color:"#9ca3af", fontSize:12, cursor:"pointer", padding:6 }}>
                ↩ חזור לעצירה הקודמת
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Manager View ─────────────────────────────────────────────────────────────
function ManagerView({ numCars }) {
  const [addresses, setAddresses] = useState(() => loadState("gmach_addresses", DEFAULT_ADDRESSES));
  const [routes, setRoutes]       = useState(null);
  const [photos, setPhotos]       = useState(() => loadState("gmach_photos", {}));
  const [notes, setNotes]         = useState(() => loadState("gmach_notes", {}));
  const [delivered, setDelivered] = useState(() => loadState("gmach_delivered", {}));
  const [history, setHistory]     = useState(() => loadState("gmach_history", {}));
  const [tab, setTab]             = useState("routes");
  const [toast, setToast]         = useState(null);
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [dragState, setDragState] = useState({ dragging:null, fromRoute:null, over:null });

  const addrById = Object.fromEntries(addresses.map(a => [a.id, a]));

  useEffect(() => {
    const built = buildRoutes(numCars, addresses);
    setRoutes(built);
  }, [numCars, addresses]);

  useEffect(() => { saveState("gmach_addresses", addresses); }, [addresses]);
  useEffect(() => { saveState("gmach_photos", photos); },      [photos]);
  useEffect(() => { saveState("gmach_notes", notes); },        [notes]);
  useEffect(() => { saveState("gmach_delivered", delivered); },[delivered]);
  useEffect(() => { saveState("gmach_history", history); },    [history]);
  useEffect(() => { if (routes) saveState(`gmach_routes_${numCars}`, routes); }, [routes, numCars]);

  const totalDelivered = Object.values(delivered).filter(Boolean).length;
  const totalStops = addresses.filter(a => !a.isStart).length;

  function handleToggleDelivered(id) { setDelivered(d => ({ ...d, [id]: !d[id] })); }
  function handlePhotoChange(id, src) { setPhotos(p => ({ ...p, [id]: src })); }
  function handlePhotoRemove(id) { setPhotos(p => { const n={...p}; delete n[id]; return n; }); }
  function handleNoteChange(id, val) { setNotes(n => ({ ...n, [id]: val })); }

  function handleResetWeek() {
    const wk = getWeekKey();
    setHistory(h => ({ ...h, [wk]: { delivered:{...delivered}, notes:{...notes} } }));
    setDelivered({});
    setToast("השבוע נשמר בהיסטוריה ✅");
  }

  function handleAddAddress(name) {
    const newAddr = { id: Date.now(), name };
    setAddresses(a => {
      const endIdx = a.findIndex(x => x.isEnd);
      const arr = [...a];
      arr.splice(endIdx >= 0 ? endIdx : arr.length, 0, newAddr);
      return arr;
    });
    setToast(`נוספה: ${name}`);
  }

  function handleDragStart(addrId, routeId) { setDragState({ dragging:addrId, fromRoute:routeId, over:null }); }
  function handleDragEnd() { setDragState({ dragging:null, fromRoute:null, over:null }); }
  function handleDragOver(addrId) { setDragState(s => ({ ...s, over:addrId })); }
  function handleDrop(targetAddrId, targetRouteId) {
    const { dragging, fromRoute } = dragState;
    if (!dragging || dragging === targetAddrId) { handleDragEnd(); return; }
    setRoutes(prev => {
      const next = prev.map(r => ({ ...r, ids:[...r.ids] }));
      const src = next.find(r => r.id === fromRoute);
      const dst = next.find(r => r.id === targetRouteId);
      if (!src || !dst || addrById[dragging]?.isStart) return prev;
      src.ids = src.ids.filter(id => id !== dragging);
      const ti = dst.ids.indexOf(targetAddrId);
      ti === -1 ? dst.ids.push(dragging) : dst.ids.splice(ti+1, 0, dragging);
      return next;
    });
    handleDragEnd();
  }

  function handleShare(route, driverUrl) {
    // Copy link + open WhatsApp
    const lines = route.ids.map((id, i) => {
      const addr = addrById[id]; if (!addr) return null;
      const n = notes[id] ? ` — ${notes[id]}` : "";
      return `${i+1}. ${addr.name}${n}\n🧭 ${mapsUrl(addr.name)}`;
    }).filter(Boolean).join("\n\n");
    const waText = `*${route.label}*\n\n🔗 פתח את המסלול שלך:\n${driverUrl}\n\n${lines}\n\n_גמ״ח חלוקה שבועית_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank");
    setToast("נשלח לנהג בוואטסאפ 📤");
  }

  if (!routes) return <div style={{ padding:40, textAlign:"center", color:"#94a3b8" }}>טוען...</div>;

  const TAB = (active) => ({
    padding:"7px 16px", border:"none", background:"none", cursor:"pointer",
    fontWeight:600, fontSize:13,
    color: active ? "#2563EB" : "#6b7280",
    borderBottom: active ? "2.5px solid #2563EB" : "2.5px solid transparent",
    transition:"all 0.15s",
  });

  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", fontFamily:"'Segoe UI',Arial,sans-serif", direction:"rtl" }}>
      {/* TOP BAR */}
      <div style={{ background:"#fff", borderBottom:"1.5px solid #e5e7eb", padding:"12px 16px", position:"sticky", top:0, zIndex:10, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => navigate("/")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, padding:0 }}>←</button>
          <span style={{ fontSize:22 }}>🧡</span>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:"#111827" }}>גמ״ח — {numCars} רכבים</div>
            <div style={{ fontSize:11, color:"#6b7280" }}>{totalDelivered} / {totalStops} נמסרו • {formatWeekLabel(getWeekKey())}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {[2,3,4].map(n => (
            <button key={n} onClick={() => navigate(`/${n}cars`)} style={{
              padding:"5px 12px", borderRadius:8, border:"1.5px solid",
              borderColor: numCars===n ? "#2563EB" : "#d1d5db",
              background: numCars===n ? "#2563EB" : "#fff",
              color: numCars===n ? "#fff" : "#374151",
              fontWeight:600, fontSize:12, cursor:"pointer",
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ background:"#fff", borderBottom:"1px solid #f3f4f6", display:"flex", padding:"0 16px", gap:4 }}>
        <button style={TAB(tab==="routes")} onClick={() => setTab("routes")}>🗺 מסלולים</button>
        <button style={TAB(tab==="map")} onClick={() => setTab("map")}>📍 מפה</button>
        <button style={TAB(tab==="history")} onClick={() => setTab("history")}>📅 היסטוריה</button>
      </div>

      {/* PROGRESS */}
      <div style={{ padding:"10px 16px 0" }}>
        <div style={{ background:"#e5e7eb", borderRadius:99, height:7, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${(totalDelivered/totalStops)*100}%`, background:"linear-gradient(90deg,#2563EB,#7C3AED)", borderRadius:99, transition:"width 0.3s" }} />
        </div>
        {totalDelivered === totalStops && totalStops > 0 && (
          <div style={{ textAlign:"center", fontWeight:700, color:"#16a34a", fontSize:14, marginTop:6 }}>🎉 כל המשלוחים הושלמו!</div>
        )}
      </div>

      {/* CONTENT */}
      <div style={{ padding:"14px 16px 40px" }}>
        {tab === "routes" && (
          <>
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
              <button onClick={() => setShowAddAddr(true)} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid #d1fae5", background:"#ecfdf5", color:"#059669", fontWeight:600, fontSize:12, cursor:"pointer" }}>➕ הוסף כתובת</button>
              <button onClick={handleResetWeek} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid #fde68a", background:"#fffbeb", color:"#92400e", fontWeight:600, fontSize:12, cursor:"pointer" }}>📦 סיים שבוע ושמור</button>
              <span style={{ fontSize:11, color:"#9ca3af" }}>💡 גרור כתובות בין רכבים</span>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:14, alignItems:"flex-start" }}>
              {routes.map(route => (
                <RouteColumn key={route.id} route={route}
                  addrMap={addrById} photos={photos} notes={notes} delivered={delivered}
                  onPhotoChange={handlePhotoChange} onPhotoRemove={handlePhotoRemove}
                  onNoteChange={handleNoteChange} onToggleDelivered={handleToggleDelivered}
                  dragState={dragState}
                  onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver} onDrop={handleDrop}
                  driverMode={false} onShare={handleShare} numCars={numCars}
                />
              ))}
            </div>
          </>
        )}
        {tab === "map" && <MapView routes={routes} addresses={addresses} />}
        {tab === "history" && (
          <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #e5e7eb", overflow:"hidden" }}>
            {Object.keys(history).length === 0 ? (
              <div style={{ padding:40, textAlign:"center", color:"#9ca3af", fontSize:14 }}>אין היסטוריה עדיין.</div>
            ) : Object.keys(history).sort().reverse().map(wk => {
              const snap = history[wk];
              const cnt = Object.values(snap.delivered||{}).filter(Boolean).length;
              return (
                <div key={wk} style={{ padding:"12px 16px", borderBottom:"1px solid #f3f4f6" }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#111827", marginBottom:6 }}>📅 {formatWeekLabel(wk)}</div>
                  <div style={{ fontSize:12, color:"#6b7280", marginBottom:8 }}>{cnt} / {totalStops} נמסרו</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {addresses.filter(a => !a.isStart).map(a => {
                      const done = snap.delivered?.[a.id];
                      return (
                        <span key={a.id} style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background: done ? "#dcfce7" : "#fee2e2", color: done ? "#16a34a" : "#dc2626" }}>
                          {done ? "✅" : "❌"} {a.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddAddr && <AddAddressModal onAdd={handleAddAddress} onClose={() => setShowAddAddr(false)} />}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── Root Router ──────────────────────────────────────────────────────────────
export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const { numCars, routeIdx } = parseRoute();

  if (!numCars) return <HomePage />;
  if (routeIdx !== null) return <DriverView numCars={numCars} routeIdx={routeIdx} />;
  return <ManagerView numCars={numCars} />;
}
