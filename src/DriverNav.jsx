import { useState, useEffect, useRef } from "react";

// ─── Hebrew turn instructions ─────────────────────────────────────────────────
function hebrewInstruction(instruction) {
  if (!instruction) return "";
  const text = instruction.text || instruction;
  const map = {
    "Head": "נסע",
    "Turn left": "פנה שמאלה",
    "Turn right": "פנה ימינה",
    "Turn sharp left": "פנה חדה שמאלה",
    "Turn sharp right": "פנה חדה ימינה",
    "Turn slight left": "פנה מעט שמאלה",
    "Turn slight right": "פנה מעט ימינה",
    "Continue": "המשך",
    "Roundabout": "כיכר",
    "U-turn": "פנה פניית פרסה",
    "Arrive": "הגעת ליעד",
    "Depart": "צא לדרך",
    "Keep left": "הישאר שמאל",
    "Keep right": "הישאר ימין",
    "Merge": "התמזג",
    "On ramp": "כנס לכביש",
    "Off ramp": "צא מהכביש",
    "Fork": "בצומת, פנה",
    "End of road": "סוף הדרך",
    "north": "צפונה",
    "south": "דרומה",
    "east": "מזרחה",
    "west": "מערבה",
  };
  let result = text;
  Object.entries(map).forEach(([en, he]) => {
    result = result.replace(new RegExp(en, "gi"), he);
  });
  return result;
}

function formatDist(meters) {
  if (meters < 1000) return `${Math.round(meters)} מ׳`;
  return `${(meters / 1000).toFixed(1)} ק״מ`;
}

function formatTime(seconds) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} דק׳`;
  return `${Math.floor(m/60)}:${String(m%60).padStart(2,'0')} שע׳`;
}

// ─── Map component using Leaflet ──────────────────────────────────────────────
export default function DriverNav({ addr, onArrived, stopNum, total, routeColor }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routingRef = useRef(null);
  const markerRef = useRef(null);
  const watchRef = useRef(null);
  const [userPos, setUserPos] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const CITY = "קריית גת";

  // Load Leaflet dynamically
  useEffect(() => {
    if (window.L) { initMap(); return; }

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(cssLink);

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => {
      const lrScript = document.createElement("script");
      lrScript.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.js";
      lrScript.onload = initMap;
      lrScript.onerror = () => initMapWithoutRouting();
      document.head.appendChild(lrScript);
    };
    document.head.appendChild(script);

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  function initMap() {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Default center: Kiryat Gat
    map.setView([31.61, 34.77], 14);

    // Start GPS watch
    if (navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition(
        pos => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setUserPos({ lat, lng });
          updateUserMarker(L, map, lat, lng);
          setLoading(false);
          buildRoute(L, map, lat, lng);
        },
        err => {
          setError("לא ניתן לגשת למיקום. אנא אשר גישה.");
          setLoading(false);
          // Try geocoding the address and show it on map
          geocodeAndShow(L, map);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    } else {
      setError("הדפדפן לא תומך ב-GPS");
      setLoading(false);
      geocodeAndShow(L, map);
    }
  }

  function initMapWithoutRouting() {
    initMap();
  }

  function updateUserMarker(L, map, lat, lng) {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        html: `<div style="width:18px;height:18px;background:#2563EB;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px #0004;"></div>`,
        className: "", iconSize: [18, 18], iconAnchor: [9, 9],
      });
      markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
    }
  }

  function buildRoute(L, map, fromLat, fromLng) {
    if (!window.L.Routing || routingRef.current) return;

    // Geocode destination
    const query = encodeURIComponent(`${addr.name}, ${CITY}, ישראל`);
    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { "Accept-Language": "he" }
    })
    .then(r => r.json())
    .then(data => {
      if (!data.length) { setError("לא נמצאה הכתובת במפה"); return; }
      const destLat = parseFloat(data[0].lat);
      const destLng = parseFloat(data[0].lon);

      // Destination marker
      const destIcon = L.divIcon({
        html: `<div style="background:${routeColor};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;border:3px solid #fff;box-shadow:0 2px 8px #0004;">${stopNum}</div>`,
        className: "", iconSize: [32, 32], iconAnchor: [16, 16],
      });
      L.marker([destLat, destLng], { icon: destIcon }).addTo(map)
        .bindPopup(addr.name).openPopup();

      // Routing
      const routing = L.Routing.control({
        waypoints: [
          L.latLng(fromLat, fromLng),
          L.latLng(destLat, destLng),
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        lineOptions: { styles: [{ color: routeColor, weight: 5, opacity: 0.8 }] },
        createMarker: () => null, // use our own markers
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
          language: "he",
        }),
      }).addTo(map);

      routingRef.current = routing;

      routing.on("routesfound", e => {
        const route = e.routes[0];
        setSummary({ dist: route.summary.totalDistance, time: route.summary.totalTime });
        const instructions = route.instructions || [];
        setSteps(instructions);
        setCurrentStep(0);
      });

      routing.on("routingerror", () => {
        setError("לא ניתן לחשב מסלול — בדוק חיבור לאינטרנט");
      });

      // Hide default routing panel
      const panel = document.querySelector(".leaflet-routing-container");
      if (panel) panel.style.display = "none";
    })
    .catch(() => setError("שגיאה בטעינת המפה"));
  }

  function geocodeAndShow(L, map) {
    const query = encodeURIComponent(`${addr.name}, ${CITY}, ישראל`);
    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`)
    .then(r => r.json())
    .then(data => {
      if (!data.length) return;
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      map.setView([lat, lng], 16);
      const icon = L.divIcon({
        html: `<div style="background:${routeColor};color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;border:3px solid #fff;box-shadow:0 2px 8px #0004;">${stopNum}</div>`,
        className: "", iconSize: [36, 36], iconAnchor: [18, 18],
      });
      L.marker([lat, lng], { icon }).addTo(map).bindPopup(addr.name).openPopup();
    })
    .catch(() => {});
  }

  const step = steps[currentStep];

  return (
    <div style={{ minHeight:"100vh", background:"#111827", display:"flex", flexDirection:"column", direction:"rtl", fontFamily:"'Segoe UI',system-ui,Arial,sans-serif" }}>

      {/* Top instruction bar */}
      <div style={{ background: routeColor, padding:"14px 16px", flexShrink:0, zIndex:10 }}>
        {loading && (
          <div style={{ color:"#fff", fontWeight:600, fontSize:15, textAlign:"center" }}>מאתר מיקום... 📍</div>
        )}
        {error && (
          <div style={{ color:"#fef08a", fontWeight:600, fontSize:14, textAlign:"center" }}>⚠️ {error}</div>
        )}
        {!loading && !error && step && (
          <div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:20, marginBottom:4 }}>
              {step.type === "WaypointReached" || step.type === "DestinationReached" ? "🏁 הגעת!" : "➡️ " + hebrewInstruction(step)}
            </div>
            {step.distance > 0 && (
              <div style={{ color:"rgba(255,255,255,0.8)", fontSize:14 }}>{formatDist(step.distance)}</div>
            )}
          </div>
        )}
        {!loading && !error && !step && summary && (
          <div style={{ color:"#fff", fontWeight:700, fontSize:16, textAlign:"center" }}>
            {formatDist(summary.dist)} • {formatTime(summary.time)}
          </div>
        )}
      </div>

      {/* Steps nav arrows */}
      {steps.length > 0 && (
        <div style={{ background:"#1f2937", padding:"8px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <button onClick={() => setCurrentStep(s => Math.max(0, s-1))} disabled={currentStep === 0}
            style={{ background:"none", border:"none", color: currentStep===0 ? "#4b5563" : "#fff", fontSize:20, cursor:"pointer", padding:"4px 8px" }}>‹</button>
          <span style={{ color:"#9ca3af", fontSize:12 }}>{currentStep+1} / {steps.length}</span>
          <button onClick={() => setCurrentStep(s => Math.min(steps.length-1, s+1))} disabled={currentStep === steps.length-1}
            style={{ background:"none", border:"none", color: currentStep===steps.length-1 ? "#4b5563" : "#fff", fontSize:20, cursor:"pointer", padding:"4px 8px" }}>›</button>
        </div>
      )}

      {/* Map */}
      <div ref={mapRef} style={{ flex:1, minHeight:0 }} />

      {/* Bottom bar */}
      <div style={{ background:"#1f2937", padding:"12px 16px", flexShrink:0, display:"flex", gap:10, alignItems:"center" }}>
        <div style={{ flex:1 }}>
          <div style={{ color:"#9ca3af", fontSize:11, marginBottom:2 }}>יעד • עצירה {stopNum}/{total}</div>
          <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>{addr.name}</div>
          {addr.floor && <div style={{ color:"#6b7280", fontSize:12, marginTop:1 }}>קומה {addr.floor}{addr.apt ? ` • דירה ${addr.apt}` : ""}</div>}
        </div>
        <button onClick={onArrived}
          style={{ padding:"12px 20px", borderRadius:12, border:"none", background:"#16a34a", color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer", whiteSpace:"nowrap", boxShadow:"0 4px 14px #16a34a55" }}>
          🏠 הגענו
        </button>
      </div>
    </div>
  );
}
