import { useState, useRef, useEffect } from "react";
import { BUILTIN_PHOTOS } from "./photos";

const ROUTE_COLORS = ["#2563EB","#7C3AED","#059669","#D97706"];
const ROUTE_EMOJIS = ["🚗","🚙","🚛","🏎️"];
const CITY = "קריית גת";

const DEFAULT_ADDRESSES = [
  { id:1,  name:"מבוא קדמה 5",     isStart:true, note:"נקודת מוצא" },
  { id:2,  name:"משה ברזני 23",     floor:"קרקע",        apt:"2",  code:"#2389", details:"ליד המעלית" },
  { id:3,  name:"הקוממיות 32",      floor:"3",            apt:"57",              details:"מספר בניין 805, דירות 49-60 | לעלות במדרגות האדומות שמובילות לבניין" },
  { id:4,  name:"חידקל 19",         floor:"לפני אחרונה", apt:"6",               details:"משפחת הכט | רחוב צדדי מול הפח הכתום | הבניין בסוף הרחוב רשום עליו חידקל" },
  { id:5,  name:"צהל 15",           floor:"4",            apt:"28", code:"#2369", details:"" },
  { id:6,  name:"התמרים 11",        floor:"1",                                   details:"דירות 19-24, דלת שמאלית" },
  { id:7,  name:"הרימון 87",        floor:"אחרונה",                              details:"משפחת שבות | הבניין של מספרת ראש העיר | מימין למספרה" },
  { id:8,  name:"שדרות גת 94",      floor:"אחרונה",                              details:"דירות 17-24, דירה בצד שמאל" },
  { id:9,  name:"שדרות גת 223",     floor:"1",                                   details:"דירה מימין | יש גגון בכניסה לבניין" },
  { id:10, name:"דוד המלך 5",       floor:"כניסה",        code:"#2580",          details:"דירה שנייה מימין" },
  { id:11, name:"אהוד בן גרא 1",                          apt:"10",              details:"הבניין שמול החניות — לא האחד שמאחורי הפיצוציה" },
  { id:12, name:"אליהו הנביא 10",   floor:"אחרונה",       apt:"15",              details:"דירות 1-16, דירה אחת לפני האחרונה | מול הבוטקה | השומר בישיבה של חב״ד" },
  { id:13, name:"שמואל הנביא 19",   floor:"3",            apt:"14",              details:"דירות 9-16, צד ימין מהכניסה" },
  { id:14, name:"שמואל הנביא 7",    floor:"2",            apt:"20",              details:"כניסה ב׳ | בניין מול המכולת" },
  { id:15, name:"השופטים 18/3",     floor:"1",                                   details:"סטיקר תן חיוך | בווייז: רחבת יפתח הגלעדי 3 | הבניין שממול יפתח 3, צד ימין, מאחורי פחי מחזור" },
  { id:16, name:"נתן אלבז 9",       floor:"2",            apt:"7",  code:"#1379", details:"" },
  { id:17, name:"שדרות לכיש 40",    floor:"כניסה",                               details:"משמאל לתחנה | רשום על הבניין 42 | ואהבת לרעך כמוך על הדלת" },
  { id:18, name:"שדרות לכיש 59",    floor:"2",                                   details:"מדרגה מתוקנת לבנה, דירה מימין | שלט רומתעש על הבניין משדרות לכיש" },
  { id:19, name:"משעול האיריס 3",   floor:"קרקע",                                details:"להכנס לרחוב צר מימין לבית כנסת | הבית בצד שמאל בצבע ורוד עם מחסן מתכת" },
  { id:20, name:"אדוריים 247",      floor:"6",            apt:"36",  isEnd:true,  note:"נקודת סיום" },
];

const PRESETS = {
  2: [
    [1,7,6,20,5,4,10,2,16],
    [1,9,8,19,3,15,11,14,13,12,17,18],
  ],
  3: [
    [1,3,15,11,13,12,14,18,17],
    [1,5,4,10,2,16],
    [1,19,8,9,20,6,7],
  ],
  4: [
    [1,12,13,14,18,17],
    [1,19,3,15,11],
    [1,8,9,20,6,7],
    [1,5,4,10,2,16],
  ],
  5: [
    [1,19,8,9,4],
    [1,5,20,6,7],
    [1,10,2,16],
    [1,3,15,18,17],
    [1,11,14,13,12],
  ],
};
const ROUTE_NAMES = {
  2:["צפון ומרכז","דרום-מערב"],
  3:["נביאים ולכיש ★ עדיף 2 אנשים","מרכז ומזרח","גת ודרום"],
  4:["נביאים ולכיש","גת ומרכז","גת ודרום","מרכז ומזרח"],
  5:["גת ומזרח","דרום וגת","מרכז","נביאים ולכיש","נביאים"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DATA_VERSION = "v4";

function loadState(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveState(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function resetIfNewVersion() {
  if (loadState("gmach_data_version", null) !== DATA_VERSION) {
    ["gmach_addresses","gmach_notes","gmach_routes_2","gmach_routes_3","gmach_routes_4"].forEach(k => localStorage.removeItem(k));
    saveState("gmach_data_version", DATA_VERSION);
  }
}
resetIfNewVersion();

function getWeekKey() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(),0,1);
  const week = Math.ceil(((d-jan1)/86400000+jan1.getDay()+1)/7);
  return `${d.getFullYear()}-W${week}`;
}
function formatWeekLabel(key) {
  if (!key) return "";
  const [year,w] = key.split("-W");
  return `שבוע ${w}, ${year}`;
}
function mapsUrl(name) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name+", "+CITY)}`;
}
function wazeUrl(name) {
  return `https://waze.com/ul?q=${encodeURIComponent(name+", "+CITY)}&navigate=yes`;
}
function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("popstate"));
}
function buildRoutes(numCars, addresses) {
  const preset = PRESETS[numCars];
  const names  = ROUTE_NAMES[numCars];
  const validIds = new Set(addresses.map(a=>a.id));
  const built = preset.map((ids,i) => ({
    id:i, ids:ids.filter(id=>validIds.has(id)),
    color:ROUTE_COLORS[i], emoji:ROUTE_EMOJIS[i],
    label:`רכב ${["א׳","ב׳","ג׳","ד׳","ה׳"][i]} — ${names[i]}`,
  }));
  const assigned = new Set(built.flatMap(r=>r.ids));
  const unassigned = addresses.filter(a=>!assigned.has(a.id)&&!a.isStart&&!a.isEnd);
  if (unassigned.length) built[0].ids=[...built[0].ids,...unassigned.map(a=>a.id)];
  const saved = loadState(`gmach_routes_${numCars}`, null);
  if (saved) return saved.map((r,i)=>({...built[i], ids:r.ids.filter(id=>validIds.has(id))}));
  return built;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,2400); return ()=>clearTimeout(t); },[]);
  return (
    <div style={{ position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
      background:"#1e293b",color:"#fff",borderRadius:12,padding:"10px 20px",
      fontSize:14,fontWeight:600,zIndex:9999,whiteSpace:"nowrap",
      boxShadow:"0 4px 24px #0003",pointerEvents:"none" }}>{msg}</div>
  );
}

// ─── Screen 1: כמה רכבים ─────────────────────────────────────────────────────
function PickCarsScreen() {
  const BG = ["#2563EB","#7C3AED","#059669","#D97706","#DC2626"];
  const LABELS = ["2 רכבים","3 רכבים","4 רכבים","5 רכבים"];
  return (
    <div style={{ minHeight:"100vh",background:"#f1f5f9",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,direction:"rtl" }}>
      <span style={{ fontSize:52,marginBottom:14 }}>🧡</span>
      <h1 style={{ fontWeight:800,fontSize:24,color:"#111827",margin:"0 0 6px",textAlign:"center" }}>גמ״ח חלוקה שבועית</h1>
      <p style={{ color:"#6b7280",fontSize:15,marginBottom:36,textAlign:"center" }}>כמה רכבים חולקים השבוע?</p>
      <div style={{ display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:300 }}>
        {[2,3,4].map((n,i)=>(
          <button key={n} onClick={()=>navigate(`/${n}cars/pick`)} style={{
            padding:"18px 0",borderRadius:16,border:"none",
            background:BG[i],color:"#fff",fontWeight:700,fontSize:18,cursor:"pointer",
            boxShadow:`0 4px 18px ${BG[i]}55`,
          }}>{LABELS[i]}</button>
        ))}
        <div style={{ borderTop:"1px solid #e5e7eb",marginTop:8,paddingTop:14,textAlign:"center" }}>
          <button onClick={()=>navigate("/manager")} style={{ background:"none",border:"none",color:"#9ca3af",fontSize:13,cursor:"pointer",fontWeight:600 }}>
            👨‍💼 כניסת מנהל
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 2: איזה רכב ──────────────────────────────────────────────────────
function PickRouteScreen({ numCars }) {
  const addresses = loadState("gmach_addresses", DEFAULT_ADDRESSES);
  const routes = buildRoutes(numCars, addresses);
  return (
    <div style={{ minHeight:"100vh",background:"#f1f5f9",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,direction:"rtl",position:"relative" }}>
      <button onClick={()=>navigate("/")} style={{ position:"absolute",top:20,right:20,background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#6b7280" }}>←</button>
      <span style={{ fontSize:52,marginBottom:14 }}>🚐</span>
      <h1 style={{ fontWeight:800,fontSize:22,color:"#111827",margin:"0 0 6px",textAlign:"center" }}>איזה רכב אתה?</h1>
      <p style={{ color:"#6b7280",fontSize:14,marginBottom:32,textAlign:"center" }}>בחר את המסלול שלך</p>
      <div style={{ display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:320 }}>
        {routes.map((route,i)=>{
          const stopCount = route.ids.filter(id=>{ const a=addresses.find(a=>a.id===id); return a&&!a.isStart; }).length;
          return (
            <button key={i} onClick={()=>navigate(`/${numCars}cars/route/${i+1}`)} style={{
              padding:"18px 20px",borderRadius:16,border:`2px solid ${route.color}`,
              background:"#fff",cursor:"pointer",textAlign:"right",
              display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 12px #0001",
            }}>
              <div style={{ width:48,height:48,borderRadius:"50%",background:route.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>{route.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:16,color:"#111827" }}>רכב {["א׳","ב׳","ג׳","ד׳","ה׳"][i]}</div>
                <div style={{ fontSize:12,color:"#6b7280",marginTop:2 }}>{stopCount} עצירות</div>
              </div>
              <div style={{ fontSize:20,color:route.color }}>‹</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Screen 3: פרטי בית + ניווט ────────────────────────────────────────────
function DriverView({ numCars, routeIdx }) {
  const addresses = loadState("gmach_addresses", DEFAULT_ADDRESSES);
  const notes     = loadState("gmach_notes", {});
  const [photos, setPhotos]     = useState(()=>{ const saved=loadState("gmach_photos",{}); return {...BUILTIN_PHOTOS,...saved}; });
  const [delivered, setDelivered] = useState(()=>loadState(`gmach_driver_${numCars}_${routeIdx}`,{}));

  useEffect(()=>{ saveState(`gmach_driver_${numCars}_${routeIdx}`, delivered); }, [delivered]);

  const routes  = buildRoutes(numCars, addresses);
  const route   = routes[routeIdx];
  const addrMap = Object.fromEntries(addresses.map(a=>[a.id,a]));

  if (!route) return (
    <div style={{ padding:40,textAlign:"center",direction:"rtl" }}>
      <div style={{ fontSize:40,marginBottom:12 }}>❓</div>
      <div style={{ fontWeight:700,color:"#374151" }}>המסלול לא נמצא</div>
      <button onClick={()=>navigate("/")} style={{ marginTop:16,padding:"10px 20px",background:"#2563EB",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600 }}>חזור לבית</button>
    </div>
  );

  const stopIds    = route.ids.filter(id=>!addrMap[id]?.isStart);
  const total      = stopIds.length;
  const doneCount  = stopIds.filter(id=>delivered[id]).length;
  const currentIdx = stopIds.findIndex(id=>!delivered[id]);
  const allDone    = currentIdx===-1;
  const currentId  = allDone ? null : stopIds[currentIdx];
  const addr       = currentId ? addrMap[currentId] : null;
  const manualNote = currentId ? (notes[currentId]||"") : "";
  const photo      = currentId ? (photos[currentId]||"") : "";
  const stopNum    = currentIdx+1;
  const pct        = total>0 ? (doneCount/total)*100 : 0;

  function markDelivered() {
    if (!currentId) return;
    setDelivered(d=>({...d,[currentId]:true}));
  }
  function goBack() {
    const prevId = stopIds[currentIdx-1];
    if (prevId) setDelivered(d=>({...d,[prevId]:false}));
  }
  function handlePhoto(src) {
    if (!currentId) return;
    const p = loadState("gmach_photos",{});
    p[currentId]=src;
    saveState("gmach_photos",p);
    setPhotos(prev=>({...prev,[currentId]:src}));
  }
  const navName = addr ? (addr.navName||addr.name) : "";
  const wazeHref = `https://waze.com/ul?q=${encodeURIComponent(navName+", "+CITY)}&navigate=yes`;
  const googleHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(navName+", "+CITY)}`;

  // All done
  if (allDone) return (
    <div style={{ minHeight:"100vh",background:"#f1f5f9",direction:"rtl",fontFamily:"'Segoe UI',system-ui,Arial,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:28 }}>
      <div style={{ fontSize:64,marginBottom:16 }}>🎉</div>
      <div style={{ fontWeight:800,fontSize:22,color:"#111827",marginBottom:6 }}>כל המשלוחים הושלמו!</div>
      <div style={{ color:"#6b7280",fontSize:14,marginBottom:28 }}>כל הכבוד! 🙌</div>
      <button onClick={()=>navigate(`/${numCars}cars/pick`)}
        style={{ padding:"12px 24px",borderRadius:12,border:"none",background:"#2563EB",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer" }}>
        חזור למסלולים
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"#f1f5f9",direction:"rtl",fontFamily:"'Segoe UI',system-ui,Arial,sans-serif",display:"flex",flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:route.color,color:"#fff",padding:"14px 16px 12px",flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <button onClick={()=>navigate(`/${numCars}cars/pick`)} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,color:"#fff",fontSize:14,cursor:"pointer",padding:"4px 10px",fontWeight:600 }}>←</button>
            <div>
              <div style={{ fontWeight:800,fontSize:17 }}>{route.emoji} {route.label}</div>
              <div style={{ fontSize:11,opacity:0.8 }}>עצירה {stopNum} מתוך {total}</div>
            </div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.22)",borderRadius:20,padding:"4px 14px",fontSize:15,fontWeight:800 }}>{doneCount}/{total}</div>
        </div>
        <div style={{ marginTop:10,background:"rgba(255,255,255,0.25)",borderRadius:99,height:6,overflow:"hidden" }}>
          <div style={{ height:"100%",width:`${pct}%`,background:"#fff",borderRadius:99,transition:"width 0.4s" }}/>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",padding:"16px 16px 24px",maxWidth:480,margin:"0 auto",width:"100%",boxSizing:"border-box" }}>
        <div style={{ background:"#fff",borderRadius:20,border:"2px solid #e5e7eb",overflow:"hidden",boxShadow:"0 4px 20px #0001",marginBottom:14 }}>

          {/* Address + details */}
          <div style={{ padding:"16px 16px 12px",borderBottom:"1px solid #f3f4f6" }}>
            <div style={{ fontWeight:800,fontSize:22,color:"#111827",lineHeight:1.2,marginBottom:4 }}>
              {addr.name}{addr.isEnd?" 🏁":""}
            </div>

            {(addr.floor||addr.apt||addr.code) && (
              <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:10 }}>
                {addr.floor && (
                  <div style={{ background:"#eff6ff",border:"2px solid #bfdbfe",borderRadius:10,padding:"8px 14px",textAlign:"center",minWidth:70 }}>
                    <div style={{ fontSize:10,color:"#3b82f6",fontWeight:700,marginBottom:1 }}>קומה</div>
                    <div style={{ fontSize:18,fontWeight:800,color:"#1d4ed8" }}>{addr.floor}</div>
                  </div>
                )}
                {addr.apt && (
                  <div style={{ background:"#f0fdf4",border:"2px solid #86efac",borderRadius:10,padding:"8px 14px",textAlign:"center",minWidth:70 }}>
                    <div style={{ fontSize:10,color:"#16a34a",fontWeight:700,marginBottom:1 }}>דירה</div>
                    <div style={{ fontSize:18,fontWeight:800,color:"#15803d" }}>{addr.apt}</div>
                  </div>
                )}
                {addr.code && (
                  <div style={{ background:"#fdf4ff",border:"2px solid #e9d5ff",borderRadius:10,padding:"8px 14px",textAlign:"center",minWidth:80 }}>
                    <div style={{ fontSize:10,color:"#7c3aed",fontWeight:700,marginBottom:1 }}>קוד</div>
                    <div style={{ fontSize:18,fontWeight:800,color:"#6d28d9",letterSpacing:1 }}>{addr.code}</div>
                  </div>
                )}
              </div>
            )}

            {addr.details && (
              <div style={{ marginTop:10,background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:10,padding:"10px 12px" }}>
                <div style={{ fontSize:10,color:"#92400e",fontWeight:700,marginBottom:4 }}>📝 הנחיות</div>
                {addr.details.split("|").map((line,i)=>(
                  <div key={i} style={{ fontSize:13,color:"#78350f",lineHeight:1.6 }}>
                    {i>0 && <span style={{ color:"#f59e0b",marginLeft:4 }}>› </span>}{line.trim()}
                  </div>
                ))}
              </div>
            )}

            {manualNote && (
              <div style={{ marginTop:8,background:"#f0f9ff",border:"1.5px solid #bae6fd",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#0369a1" }}>
                💬 {manualNote}
              </div>
            )}
          </div>

          {/* Photo */}
          <div>
            {photo ? (
              <img src={photo} alt="בית" style={{ width:"100%",height:"auto",maxHeight:320,objectFit:"contain",display:"block",background:"#f3f4f6" }}/>
            ) : (
              <label style={{ width:"100%",height:64,display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",color:"#d1d5db",background:"#f9fafb" }}>
                <span style={{ fontSize:18 }}>📷</span>
                <span style={{ fontSize:12 }}>הוסף תמונת בית</span>
                <input type="file" accept="image/*" style={{ display:"none" }}
                  onChange={e=>{ const file=e.target.files[0]; if(!file) return; const r=new FileReader(); r.onload=ev=>handlePhoto(ev.target.result); r.readAsDataURL(file); e.target.value=""; }}/>
              </label>
            )}
          </div>
        </div>

        {/* Nav buttons */}
        <div style={{ display:"flex",gap:10,marginBottom:10 }}>
          <a href={wazeHref} target="_blank" rel="noreferrer" style={{
            flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,
            padding:"13px 0",borderRadius:12,background:"#33ccff",color:"#000",
            fontWeight:700,fontSize:15,textDecoration:"none",
          }}>🚗 ווייז</a>
          <a href={googleHref} target="_blank" rel="noreferrer" style={{
            flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,
            padding:"13px 0",borderRadius:12,background:"#4285f4",color:"#fff",
            fontWeight:700,fontSize:15,textDecoration:"none",
          }}>🗺 גוגל</a>
        </div>

        {/* Delivered button */}
        <button onClick={markDelivered}
          style={{ width:"100%",padding:"16px 0",borderRadius:14,border:"none",background:"#16a34a",color:"#fff",fontWeight:800,fontSize:18,cursor:"pointer",boxShadow:"0 4px 14px #16a34a55",marginBottom:10 }}>
          ✓ נמסר — לעצירה הבאה
        </button>

        {stopNum > 1 && (
          <button onClick={goBack} style={{ alignSelf:"center",background:"none",border:"none",color:"#9ca3af",fontSize:12,cursor:"pointer",padding:6 }}>
            ↩ חזור לעצירה הקודמת
          </button>
        )}
      </div>
    </div>
  );
}


// ─── Address Card (Manager) ───────────────────────────────────────────────────
function AddressCard({ addr,color,index,photos,notes,delivered,
  onPhotoChange,onPhotoRemove,onNoteChange,onToggleDelivered,
  dragging,onDragStart,onDragEnd,onDragOver,onDrop,driverMode }) {
  const fileRef = useRef();
  const photo=photos[addr.id], note=notes[addr.id]||"", isDone=delivered[addr.id], isFixed=addr.isStart;
  return (
    <div draggable={!isFixed&&!driverMode} onDragStart={()=>onDragStart(addr.id)}
      onDragEnd={onDragEnd} onDragOver={e=>{e.preventDefault();onDragOver(addr.id);}} onDrop={()=>onDrop(addr.id)}
      style={{ background:isDone?"#f0fdf4":"#fff",border:`1.5px solid ${dragging?color:isDone?"#86efac":"#e5e7eb"}`,
        borderRadius:10,padding:"9px 12px",display:"flex",alignItems:"flex-start",gap:9,
        cursor:isFixed||driverMode?"default":"grab",opacity:isDone?0.72:1,userSelect:"none" }}>
      <div style={{ minWidth:26,height:26,borderRadius:"50%",background:isFixed?"#f3f4f6":color,color:isFixed?"#6b7280":"#fff",
        display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,flexShrink:0,marginTop:1,
        border:isFixed?"1.5px dashed #d1d5db":"none" }}>{index}</div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
          <span style={{ fontWeight:600,fontSize:14,color:isDone?"#6b7280":"#111827",textDecoration:isDone?"line-through":"none" }}>{addr.name}</span>
          {addr.floor && <span style={{ fontSize:10,background:"#eff6ff",color:"#2563EB",borderRadius:4,padding:"1px 5px" }}>קומה {addr.floor}</span>}
          {addr.apt   && <span style={{ fontSize:10,background:"#f0fdf4",color:"#16a34a",borderRadius:4,padding:"1px 5px" }}>ד׳ {addr.apt}</span>}
          {addr.code  && <span style={{ fontSize:10,background:"#fdf4ff",color:"#7c3aed",borderRadius:4,padding:"1px 5px" }}>{addr.code}</span>}
        </div>
        {!driverMode&&!isFixed && (
          <input value={note} onChange={e=>onNoteChange(addr.id,e.target.value)}
            placeholder="הערה (קומה, שם, הוראות...)"
            style={{ marginTop:5,width:"100%",fontSize:11,border:"1px solid #e5e7eb",borderRadius:6,padding:"3px 7px",background:"#f9fafb",color:"#374151",outline:"none",boxSizing:"border-box" }}/>
        )}
        {driverMode&&note && <div style={{ fontSize:12,color:"#6b7280",marginTop:3 }}>📝 {note}</div>}
        {photo ? (
          <div style={{ marginTop:6,position:"relative",display:"inline-block" }}>
            <img src={photo} alt="בית" style={{ width:84,height:64,objectFit:"cover",borderRadius:7,border:"1.5px solid #e5e7eb",display:"block" }}/>
            {!driverMode && <button onClick={()=>onPhotoRemove(addr.id)} style={{ position:"absolute",top:-6,left:-6,width:18,height:18,borderRadius:"50%",background:"#ef4444",color:"#fff",border:"none",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>×</button>}
          </div>
        ) : !isFixed && (
          <button onClick={()=>fileRef.current.click()} style={{ marginTop:5,fontSize:10,color:"#9ca3af",background:"none",border:"1px dashed #d1d5db",borderRadius:5,padding:"2px 7px",cursor:"pointer",display:"flex",alignItems:"center",gap:3 }}>📷 תמונת בית</button>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
          onChange={e=>{ const file=e.target.files[0]; if(!file) return; const r=new FileReader(); r.onload=ev=>onPhotoChange(addr.id,ev.target.result); r.readAsDataURL(file); e.target.value=""; }}/>
      </div>
      {!isFixed && (
        <div style={{ display:"flex",flexDirection:"column",gap:4,flexShrink:0 }}>
          <a href={wazeUrl(addr.name)} target="_blank" rel="noreferrer"
            style={{ width:28,height:28,borderRadius:7,background:"#f0fdf4",border:"1.5px solid #86efac",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,textDecoration:"none" }} title="ווייז">🚗</a>
          <button onClick={()=>onToggleDelivered(addr.id)}
            style={{ width:28,height:28,borderRadius:7,border:`1.5px solid ${isDone?"#86efac":"#d1d5db"}`,background:isDone?"#dcfce7":"#f9fafb",color:isDone?"#16a34a":"#9ca3af",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center" }}>
            {isDone?"✓":"○"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Route Column (Manager) ───────────────────────────────────────────────────
function RouteColumn({ route,addrMap,photos,notes,delivered,onPhotoChange,onPhotoRemove,onNoteChange,onToggleDelivered,dragState,onDragStart,onDragEnd,onDragOver,onDrop,driverMode,onShare,numCars }) {
  const addrs = route.ids.map(id=>addrMap[id]).filter(Boolean);
  const deliveredCount = route.ids.filter((id,i)=>i>0&&delivered[id]).length;
  const total = route.ids.length-1;
  const pct = total>0?Math.round((deliveredCount/total)*100):0;
  const driverUrl = `${window.location.origin}/${numCars}cars/route/${route.id+1}`;
  return (
    <div style={{ background:"#fafafa",borderRadius:14,border:"1.5px solid #e5e7eb",overflow:"hidden",flex:"1 1 280px",minWidth:0 }}>
      <div style={{ background:route.color,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:7 }}>
          <span style={{ fontSize:18 }}>{route.emoji}</span>
          <span style={{ color:"#fff",fontWeight:700,fontSize:14 }}>{route.label}</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
          <span style={{ background:"rgba(255,255,255,0.2)",color:"#fff",borderRadius:16,padding:"1px 9px",fontSize:12,fontWeight:600 }}>{deliveredCount}/{total}</span>
          {!driverMode && <button onClick={()=>onShare(route,driverUrl)} title="שלח לנהג" style={{ width:26,height:26,borderRadius:6,background:"rgba(255,255,255,0.2)",border:"none",cursor:"pointer",fontSize:14,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>📤</button>}
        </div>
      </div>
      <div style={{ height:4,background:"#e5e7eb" }}>
        <div style={{ height:"100%",width:`${pct}%`,background:route.color,transition:"width 0.3s" }}/>
      </div>
      <div style={{ padding:10,display:"flex",flexDirection:"column",gap:7 }}>
        {addrs.map((addr,i)=>(
          <AddressCard key={addr.id} addr={addr} color={route.color} index={i+1}
            photos={photos} notes={notes} delivered={delivered}
            onPhotoChange={onPhotoChange} onPhotoRemove={onPhotoRemove}
            onNoteChange={onNoteChange} onToggleDelivered={onToggleDelivered}
            dragging={dragState.over===addr.id}
            onDragStart={()=>onDragStart(addr.id,route.id)} onDragEnd={onDragEnd}
            onDragOver={()=>onDragOver(addr.id)} onDrop={()=>onDrop(addr.id,route.id)}
            driverMode={driverMode}/>
        ))}
      </div>
    </div>
  );
}

// ─── Add Address Modal ────────────────────────────────────────────────────────
function AddAddressModal({ onAdd, onClose }) {
  const [val,setVal]=useState("");
  return (
    <div style={{ position:"fixed",inset:0,background:"#0006",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff",borderRadius:14,padding:24,width:"100%",maxWidth:360 }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontWeight:700,fontSize:15,marginBottom:14 }}>➕ הוסף כתובת</div>
        <input autoFocus value={val} onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&val.trim()){onAdd(val.trim());onClose();}}}
          placeholder="שם רחוב ומספר בית"
          style={{ width:"100%",border:"1.5px solid #d1d5db",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box",direction:"rtl" }}/>
        <div style={{ display:"flex",gap:8,marginTop:14 }}>
          <button onClick={()=>{ if(val.trim()){onAdd(val.trim());onClose();}}} style={{ flex:1,padding:"9px 0",background:"#2563EB",color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14 }}>הוסף</button>
          <button onClick={onClose} style={{ flex:1,padding:"9px 0",background:"#f3f4f6",color:"#374151",border:"none",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:14 }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// ─── Manager View ─────────────────────────────────────────────────────────────
function ManagerView({ numCars:initCars }) {
  const [numCars,setNumCars] = useState(initCars||2);
  const [addresses,setAddresses] = useState(()=>loadState("gmach_addresses",DEFAULT_ADDRESSES));
  const [routes,setRoutes]       = useState(null);
  const [photos,setPhotos]       = useState(()=>loadState("gmach_photos",{}));
  const [notes,setNotes]         = useState(()=>loadState("gmach_notes",{}));
  const [delivered,setDelivered] = useState(()=>loadState("gmach_delivered",{}));
  const [history,setHistory]     = useState(()=>loadState("gmach_history",{}));
  const [tab,setTab]             = useState("routes");
  const [toast,setToast]         = useState(null);
  const [showAddAddr,setShowAddAddr] = useState(false);
  const [dragState,setDragState] = useState({dragging:null,fromRoute:null,over:null});
  const addrById = Object.fromEntries(addresses.map(a=>[a.id,a]));

  useEffect(()=>{ setRoutes(buildRoutes(numCars,addresses)); },[numCars,addresses]);
  useEffect(()=>{ saveState("gmach_addresses",addresses); },[addresses]);
  useEffect(()=>{ saveState("gmach_photos",photos); },[photos]);
  useEffect(()=>{ saveState("gmach_notes",notes); },[notes]);
  useEffect(()=>{ saveState("gmach_delivered",delivered); },[delivered]);
  useEffect(()=>{ saveState("gmach_history",history); },[history]);
  useEffect(()=>{ if(routes) saveState(`gmach_routes_${numCars}`,routes); },[routes,numCars]);

  const totalDelivered = Object.values(delivered).filter(Boolean).length;
  const totalStops = addresses.filter(a=>!a.isStart).length;

  function handleDragStart(addrId,routeId){ setDragState({dragging:addrId,fromRoute:routeId,over:null}); }
  function handleDragEnd(){ setDragState({dragging:null,fromRoute:null,over:null}); }
  function handleDragOver(addrId){ setDragState(s=>({...s,over:addrId})); }
  function handleDrop(targetId,targetRouteId){
    const {dragging,fromRoute}=dragState;
    if(!dragging||dragging===targetId){handleDragEnd();return;}
    setRoutes(prev=>{
      const next=prev.map(r=>({...r,ids:[...r.ids]}));
      const src=next.find(r=>r.id===fromRoute), dst=next.find(r=>r.id===targetRouteId);
      if(!src||!dst||addrById[dragging]?.isStart) return prev;
      src.ids=src.ids.filter(id=>id!==dragging);
      const ti=dst.ids.indexOf(targetId);
      ti===-1?dst.ids.push(dragging):dst.ids.splice(ti+1,0,dragging);
      return next;
    });
    handleDragEnd();
  }
  function handleShare(route,driverUrl){
    const lines=route.ids.map((id,i)=>{ const a=addrById[id]; if(!a) return null; const n=notes[id]?` — ${notes[id]}`:""; return `${i+1}. ${a.name}${n}\n🧭 ${mapsUrl(a.name)}`; }).filter(Boolean).join("\n\n");
    const waText=`*${route.label}*\n\n🔗 פתח את המסלול שלך:\n${driverUrl}\n\n${lines}\n\n_גמ״ח חלוקה שבועית_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`,"_blank");
    setToast("נשלח לנהג 📤");
  }
  function handleResetWeek(){
    const wk=getWeekKey();
    setHistory(h=>({...h,[wk]:{delivered:{...delivered},notes:{...notes}}}));
    setDelivered({});
    setToast("השבוע נשמר ✅");
  }
  function handleAddAddress(name){
    const newAddr={id:Date.now(),name};
    setAddresses(a=>{ const endIdx=a.findIndex(x=>x.isEnd); const arr=[...a]; arr.splice(endIdx>=0?endIdx:arr.length,0,newAddr); return arr; });
    setToast(`נוספה: ${name}`);
  }

  if(!routes) return <div style={{ padding:40,textAlign:"center",color:"#94a3b8" }}>טוען...</div>;

  const TAB=(active)=>({ padding:"7px 16px",border:"none",background:"none",cursor:"pointer",fontWeight:600,fontSize:13,color:active?"#2563EB":"#6b7280",borderBottom:active?"2.5px solid #2563EB":"2.5px solid transparent" });

  return (
    <div style={{ minHeight:"100vh",background:"#f1f5f9",fontFamily:"'Segoe UI',Arial,sans-serif",direction:"rtl" }}>
      <div style={{ background:"#fff",borderBottom:"1.5px solid #e5e7eb",padding:"12px 16px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <button onClick={()=>navigate("/")} style={{ background:"none",border:"none",cursor:"pointer",fontSize:18,padding:0,color:"#6b7280" }}>←</button>
          <span style={{ fontSize:20 }}>🧡</span>
          <div>
            <div style={{ fontWeight:800,fontSize:15,color:"#111827" }}>גמ״ח — {numCars} רכבים</div>
            <div style={{ fontSize:11,color:"#6b7280" }}>{totalDelivered}/{totalStops} נמסרו • {formatWeekLabel(getWeekKey())}</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
          {[2,3,4,5].map(n=>(
            <button key={n} onClick={()=>setNumCars(n)} style={{ padding:"5px 12px",borderRadius:8,border:"1.5px solid",borderColor:numCars===n?"#2563EB":"#d1d5db",background:numCars===n?"#2563EB":"#fff",color:numCars===n?"#fff":"#374151",fontWeight:600,fontSize:12,cursor:"pointer" }}>{n}</button>
          ))}
        </div>
      </div>
      <div style={{ background:"#fff",borderBottom:"1px solid #f3f4f6",display:"flex",padding:"0 16px",gap:4 }}>
        <button style={TAB(tab==="routes")} onClick={()=>setTab("routes")}>🗺 מסלולים</button>
        <button style={TAB(tab==="history")} onClick={()=>setTab("history")}>📅 היסטוריה</button>
      </div>
      <div style={{ padding:"10px 16px 0" }}>
        <div style={{ background:"#e5e7eb",borderRadius:99,height:7,overflow:"hidden" }}>
          <div style={{ height:"100%",width:`${(totalDelivered/totalStops)*100}%`,background:"linear-gradient(90deg,#2563EB,#7C3AED)",borderRadius:99,transition:"width 0.3s" }}/>
        </div>
        {totalDelivered===totalStops&&totalStops>0&&<div style={{ textAlign:"center",fontWeight:700,color:"#16a34a",fontSize:14,marginTop:6 }}>🎉 כל המשלוחים הושלמו!</div>}
      </div>
      <div style={{ padding:"14px 16px 40px" }}>
        {tab==="routes" && (
          <>
            <div style={{ display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center" }}>
              <button onClick={()=>setShowAddAddr(true)} style={{ padding:"7px 14px",borderRadius:8,border:"1.5px solid #d1fae5",background:"#ecfdf5",color:"#059669",fontWeight:600,fontSize:12,cursor:"pointer" }}>➕ הוסף כתובת</button>
              <button onClick={handleResetWeek} style={{ padding:"7px 14px",borderRadius:8,border:"1.5px solid #fde68a",background:"#fffbeb",color:"#92400e",fontWeight:600,fontSize:12,cursor:"pointer" }}>📦 סיים שבוע</button>
              <span style={{ fontSize:11,color:"#9ca3af" }}>💡 גרור כתובות בין רכבים</span>
            </div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:14,alignItems:"flex-start" }}>
              {routes.map(route=>(
                <RouteColumn key={route.id} route={route} addrMap={addrById} photos={photos} notes={notes} delivered={delivered}
                  onPhotoChange={(id,src)=>setPhotos(p=>({...p,[id]:src}))}
                  onPhotoRemove={id=>setPhotos(p=>{const n={...p};delete n[id];return n;})}
                  onNoteChange={(id,val)=>setNotes(n=>({...n,[id]:val}))}
                  onToggleDelivered={id=>setDelivered(d=>({...d,[id]:!d[id]}))}
                  dragState={dragState} onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver} onDrop={handleDrop}
                  driverMode={false} onShare={handleShare} numCars={numCars}/>
              ))}
            </div>
          </>
        )}
        {tab==="history" && (
          <div style={{ background:"#fff",borderRadius:14,border:"1.5px solid #e5e7eb",overflow:"hidden" }}>
            {Object.keys(history).length===0
              ? <div style={{ padding:40,textAlign:"center",color:"#9ca3af",fontSize:14 }}>אין היסטוריה עדיין.</div>
              : Object.keys(history).sort().reverse().map(wk=>{
                const snap=history[wk], cnt=Object.values(snap.delivered||{}).filter(Boolean).length;
                return (
                  <div key={wk} style={{ padding:"12px 16px",borderBottom:"1px solid #f3f4f6" }}>
                    <div style={{ fontWeight:700,fontSize:14,color:"#111827",marginBottom:6 }}>📅 {formatWeekLabel(wk)}</div>
                    <div style={{ fontSize:12,color:"#6b7280",marginBottom:8 }}>{cnt} / {totalStops} נמסרו</div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                      {addresses.filter(a=>!a.isStart).map(a=>{
                        const done=snap.delivered?.[a.id];
                        return <span key={a.id} style={{ fontSize:11,padding:"2px 8px",borderRadius:20,background:done?"#dcfce7":"#fee2e2",color:done?"#16a34a":"#dc2626" }}>{done?"✅":"❌"} {a.name}</span>;
                      })}
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
      </div>
      {showAddAddr&&<AddAddressModal onAdd={handleAddAddress} onClose={()=>setShowAddAddr(false)}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
function parseAppRoute() {
  const path = window.location.pathname;
  const carsMatch  = path.match(/\/(2|3|4|5)cars/);
  const pickMatch  = path.includes("/pick");
  const routeMatch = path.match(/\/route\/(\d+)/);
  const managerMatch = path.includes("/manager");
  return {
    numCars:   carsMatch ? parseInt(carsMatch[1]) : null,
    isPick:    pickMatch,
    routeIdx:  routeMatch ? parseInt(routeMatch[1])-1 : null,
    isManager: managerMatch,
  };
}

export default function App() {
  const [,forceUpdate] = useState(0);
  useEffect(()=>{
    const h=()=>forceUpdate(n=>n+1);
    window.addEventListener("popstate",h);
    return ()=>window.removeEventListener("popstate",h);
  },[]);

  const { numCars,isPick,routeIdx,isManager } = parseAppRoute();
  if (isManager)                           return <ManagerView numCars={2}/>;
  if (numCars && !isPick && routeIdx===null) return <ManagerView numCars={numCars}/>;
  if (!numCars)                            return <PickCarsScreen/>;
  if (isPick)                              return <PickRouteScreen numCars={numCars}/>;
  if (routeIdx!==null)                     return <DriverView numCars={numCars} routeIdx={routeIdx}/>;
  return <PickCarsScreen/>;
}
