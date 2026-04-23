import { useState, useEffect, useRef, useCallback } from "react";
import { API_URL, STAFF_PASSWORD } from "./config";

// ─── API CALLS ───
async function api(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString(), { redirect: "follow" });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: "Invalid JSON", drivers: [], races: [], results: [] }; }
  } catch (e) {
    console.error("API Error:", e);
    return { error: e.message, drivers: [], races: [], results: [] };
  }
}

// ─── CONSTANTS ───
const SIMS = ["Le Mans Ultimate", "iRacing", "AC Evo"];
const SIM_COLORS = { "Le Mans Ultimate": "#00d4ff", "iRacing": "#3b8bff", "AC Evo": "#ef3340" };

const TRACKS_BY_SIM = {
  "Le Mans Ultimate": ["Le Mans","Spa-Francorchamps","Monza","Bahrain","Portimao","Fuji Speedway","COTA","Interlagos","Imola","Silverstone","Sebring","Lusail","Jeddah","Barcelona-Catalunya","Nurburgring","Road Atlanta","Zandvoort","Paul Ricard"],
  "iRacing": ["Daytona","Spa-Francorchamps","Monza","Suzuka","Watkins Glen","Road America","Nurburgring Nordschleife","COTA","Interlagos","Silverstone","Sebring","Imola","Barcelona-Catalunya","Bathurst","Laguna Seca","Indianapolis","Long Beach","Brands Hatch","Oulton Park","Okayama"],
  "AC Evo": ["Monza","Spa-Francorchamps","Imola","Nurburgring Nordschleife","Silverstone","Barcelona-Catalunya","Brands Hatch","Mugello","Vallelunga","Laguna Seca","Suzuka","Red Bull Ring","Zandvoort","Paul Ricard"]
};

const CARS_BY_SIM = {
  "Le Mans Ultimate": {
    Hypercar:["Toyota GR010 Hybrid","Porsche 963","Ferrari 499P","Cadillac V-Series.R","Peugeot 9X8","BMW M Hybrid V8","Lamborghini SC63","Alpine A424","Isotta Fraschini Tipo 6","Genesis Hypercar"],
    LMP2:["ORECA 07 LMP2","Duqueine D08 LMP2"],
    LMGT3:["Porsche 911 GT3 R","Ferrari 296 GT3","BMW M4 GT3","McLaren 720S GT3","Lamborghini Huracan GT3","Aston Martin Vantage GT3","Corvette Z06 GT3.R","Ford Mustang GT3","Mercedes-AMG GT3"],
    GTE:["Porsche 911 RSR","Ferrari 488 GTE","Corvette C8.R GTE","Aston Martin Vantage GTE","BMW M8 GTE"]
  },
  "iRacing": {
    GTP:["Porsche 963 GTP","Cadillac V-Series.R GTP","BMW M Hybrid V8","Acura ARX-06 GTP"],
    LMP2:["Dallara P217 LMP2"],
    GT3:["Porsche 911 GT3 R","Ferrari 296 GT3","BMW M4 GT3","McLaren 720S GT3 EVO","Mercedes-AMG GT3","Lamborghini Huracan GT3 EVO","Aston Martin Vantage GT3","Ford Mustang GT3"],
    GT4:["Porsche 718 Cayman GT4","BMW M4 GT4","McLaren 570S GT4","Mercedes-AMG GT4"],
    "NASCAR Cup":["Chevrolet Camaro ZL1","Ford Mustang","Toyota Camry"],
    Formula:["Dallara F3","Dallara IR-04","Formula Vee"]
  },
  "AC Evo": {
    GT3:["Porsche 911 GT3 R","Ferrari 296 GT3","BMW M4 GT3","McLaren 720S GT3","Lamborghini Huracan GT3","Mercedes-AMG GT3"],
    GT4:["Porsche 718 Cayman GT4","BMW M4 GT4","Maserati MC GT4"],
    Street:["Porsche 911 GT3 RS","Ferrari SF90","Lamborghini Revuelto","BMW M3"],
    "Open Wheel":["Tatuus F4","Dallara F3"]
  }
};

const CC = { Hypercar:"#ef3340", LMP2:"#3b8bff", LMGT3:"#f5a623", GTE:"#00d4ff", GTP:"#ef3340", GT3:"#f5a623", GT4:"#22c55e", "NASCAR Cup":"#ff6b00", Formula:"#a855f7", Street:"#ec4899", "Open Wheel":"#a855f7" };

// ─── MAIN APP ───
export default function App() {
  const [drivers, setDrivers] = useState([]);
  const [races, setRaces] = useState([]);
  const [results, setResults] = useState([]);
  const [tab, setTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { const s = localStorage.getItem("vsd-staff"); if (s === "true") setIsStaff(true); }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await api("getAll");
    if (!data.error) { setDrivers(data.drivers || []); setRaces(data.races || []); setResults(data.results || []); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const notify = (m, e) => { setToast({ m, e }); setTimeout(() => setToast(null), 3000); };
  const enrichedRaces = races.map(race => ({ ...race, results: results.filter(r => r.raceId === race.id) }));

  const doLogin = async (pwd) => {
    if (pwd === STAFF_PASSWORD) { setIsStaff(true); localStorage.setItem("vsd-staff", "true"); setShowLogin(false); notify("Login staff riuscito!"); }
    else { notify("Password errata!", true); }
  };
  const doLogout = () => { setIsStaff(false); localStorage.removeItem("vsd-staff"); notify("Logout effettuato"); };

  if (loading) return (<div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"#060d1f",gap:16 }}><div style={{ display:"flex",gap:2 }}><span style={{ fontFamily:"Orbitron",fontWeight:800,fontSize:32,color:"#00d4ff" }}>V</span><span style={{ fontFamily:"Orbitron",fontWeight:800,fontSize:32,color:"#3b8bff" }}>S</span><span style={{ fontFamily:"Orbitron",fontWeight:800,fontSize:32,color:"#ef3340" }}>D</span></div><p style={{ color:"#5a7a9a",letterSpacing:2,fontSize:12 }}>CARICAMENTO DATI...</p></div>);

  const tabs = [{ id:"home",l:"Home" },{ id:"drivers",l:"Piloti" },...(isStaff?[{ id:"newrace",l:"+ Gara" }]:[]),{ id:"results",l:"Risultati" },{ id:"laps",l:"Best Laps" },...(isStaff?[{ id:"import",l:"Import JSON" }]:[])];

  return (
    <div style={{ minHeight:"100vh",background:"#060d1f" }}>
      <header style={{ background:"linear-gradient(180deg,#0a1832,#060d1f)",borderBottom:"1px solid #0f2847",padding:"12px 16px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ display:"flex",gap:1,background:"#0a1832",border:"1px solid #1a3a5c",borderRadius:8,padding:"5px 10px" }}>
              <span style={{ fontFamily:"Orbitron",fontWeight:800,fontSize:20,color:"#00d4ff" }}>V</span>
              <span style={{ fontFamily:"Orbitron",fontWeight:800,fontSize:20,color:"#3b8bff" }}>S</span>
              <span style={{ fontFamily:"Orbitron",fontWeight:800,fontSize:20,color:"#ef3340" }}>D</span>
            </div>
            <div><div style={{ fontFamily:"Orbitron",fontSize:15,fontWeight:700,color:"#e2e8f0",letterSpacing:3 }}>RACE HUB</div><div style={{ fontSize:10,color:"#5a7a9a",letterSpacing:1 }}>Virtual Sim-Driver • Multi-Sim Race Tracker</div></div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ display:"flex",gap:16 }}>
              {[["Piloti",drivers.length,"#00d4ff"],["Gare",races.length,"#f5a623"]].map(([l,v,c])=>(<div key={l} style={{ textAlign:"center" }}><div style={{ fontFamily:"Orbitron",fontSize:18,fontWeight:700,color:c }}>{v}</div><div style={{ fontSize:9,color:"#5a7a9a",letterSpacing:1,textTransform:"uppercase" }}>{l}</div></div>))}
            </div>
            {isStaff?(<div style={{ display:"flex",alignItems:"center",gap:8 }}><span style={{ fontSize:10,color:"#22c55e",fontWeight:600 }}>● STAFF</span><button onClick={doLogout} style={{ ...btnStyle,background:"none",border:"1px solid #1a3a5c",color:"#5a7a9a",padding:"4px 10px",fontSize:10 }}>Logout</button></div>):(<button onClick={()=>setShowLogin(true)} style={{ ...btnStyle,background:"none",border:"1px solid #1a3a5c",color:"#7db8e8",padding:"5px 14px",fontSize:11 }}>Staff Login</button>)}
          </div>
        </div>
      </header>

      <nav style={{ background:"#0a1228",borderBottom:"1px solid #0f2847",overflowX:"auto",display:"flex" }}>
        <div style={{ display:"flex",maxWidth:1200,margin:"0 auto",width:"100%" }}>
          {tabs.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"10px 18px",background:"none",border:"none",cursor:"pointer",fontSize:11,fontFamily:"'Barlow Condensed'",fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:tab===t.id?"#00d4ff":"#5a7a9a",borderBottom:tab===t.id?"2px solid #00d4ff":"2px solid transparent",whiteSpace:"nowrap" }}>{t.l}</button>))}
        </div>
      </nav>

      {showLogin&&<LoginModal onLogin={doLogin} onClose={()=>setShowLogin(false)}/>}
      {toast&&<div style={{ position:"fixed",top:12,right:12,padding:"8px 18px",borderRadius:8,background:toast.e?"#7f1d1d":"#052e16",border:`1px solid ${toast.e?"#ef4444":"#22c55e"}`,color:"#fff",fontSize:13,fontWeight:500,zIndex:999 }}>{toast.m}</div>}

      <main style={{ maxWidth:1200,margin:"0 auto",padding:"20px 16px 40px" }}>
        {tab==="home"&&<Home drivers={drivers} races={enrichedRaces} setTab={setTab} isStaff={isStaff}/>}
        {tab==="drivers"&&<Drivers drivers={drivers} races={enrichedRaces} isStaff={isStaff} loadData={loadData} notify={notify}/>}
        {tab==="newrace"&&isStaff&&<NewRace drivers={drivers} loadData={loadData} notify={notify}/>}
        {tab==="results"&&<Results races={enrichedRaces} drivers={drivers} isStaff={isStaff} loadData={loadData} notify={notify}/>}
        {tab==="laps"&&<Laps races={enrichedRaces} drivers={drivers}/>}
        {tab==="import"&&isStaff&&<Import drivers={drivers} loadData={loadData} notify={notify}/>}
      </main>
      <footer style={{ textAlign:"center",padding:"12px",fontSize:10,color:"#2a4060",borderTop:"1px solid #0f2847",letterSpacing:1 }}>VSD Race Hub — Virtual Sim-Driver — LMU / iRacing / AC Evo</footer>
    </div>
  );
}

function LoginModal({ onLogin, onClose }) {
  const [pwd, setPwd] = useState("");
  return (<div style={{ position:"fixed",inset:0,background:"#000000aa",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000 }} onClick={onClose}><div style={{ background:"#0a1832",border:"1px solid #1a3a5c",borderRadius:12,padding:28,minWidth:300,maxWidth:400 }} onClick={e=>e.stopPropagation()}><h3 style={{ fontFamily:"Orbitron",fontSize:16,color:"#e2e8f0",marginBottom:6,letterSpacing:2 }}>STAFF LOGIN</h3><p style={{ fontSize:12,color:"#5a7a9a",marginBottom:16 }}>Inserisci la password dello staff VSD.</p><input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Password staff..." onKeyDown={e=>e.key==="Enter"&&onLogin(pwd)} style={{ width:"100%",padding:"10px 14px",fontSize:14,background:"#060d1f",border:"1px solid #1a3a5c",borderRadius:6,color:"#e2e8f0",marginBottom:14,fontFamily:"inherit" }}/><div style={{ display:"flex",gap:8 }}><Btn onClick={()=>onLogin(pwd)}>Accedi</Btn><Btn2 onClick={onClose}>Annulla</Btn2></div></div></div>);
}

const btnStyle = { fontFamily:"'Barlow Condensed'",fontWeight:600,fontSize:12,letterSpacing:1,borderRadius:6,border:"none",cursor:"pointer",textTransform:"uppercase" };
const Btn = ({children,onClick,style})=><button onClick={onClick} style={{ ...btnStyle,padding:"7px 18px",color:"#fff",background:"linear-gradient(135deg,#00d4ff,#3b8bff)",...style }}>{children}</button>;
const Btn2 = ({children,onClick,style})=><button onClick={onClick} style={{ ...btnStyle,padding:"7px 18px",color:"#7db8e8",background:"transparent",border:"1px solid #1a3a5c",...style }}>{children}</button>;
const Card = ({children,style})=><div style={{ background:"linear-gradient(135deg,#0a1832,#0d1f3c)",border:"1px solid #12305a",borderRadius:10,padding:"16px 18px",marginBottom:14,...style }}>{children}</div>;
const Sec = ({t})=><h2 style={{ fontFamily:"Orbitron",fontSize:14,fontWeight:600,color:"#e2e8f0",letterSpacing:2,textTransform:"uppercase",marginBottom:14,borderLeft:"3px solid #00d4ff",paddingLeft:10 }}>{t}</h2>;
const Empty = ({t})=><div style={{ textAlign:"center",padding:28,color:"#3d5a80",fontSize:13,background:"#0a183244",border:"1px dashed #12305a",borderRadius:10,marginBottom:14 }}>{t}</div>;
const Pill = ({cls})=><span style={{ display:"inline-block",padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:700,letterSpacing:1,background:(CC[cls]||"#3b8bff")+"22",color:CC[cls]||"#3b8bff" }}>{cls}</span>;
const SimBadge = ({sim})=><span style={{ display:"inline-block",padding:"2px 7px",borderRadius:4,fontSize:9,fontWeight:700,letterSpacing:1,background:(SIM_COLORS[sim]||"#3b8bff")+"22",color:SIM_COLORS[sim]||"#3b8bff",marginRight:4 }}>{sim==="Le Mans Ultimate"?"LMU":sim==="AC Evo"?"ACE":sim}</span>;
const TH = ({children})=><th style={{ textAlign:"left",padding:"7px 9px",fontSize:9,fontWeight:600,color:"#5a7a9a",letterSpacing:1,textTransform:"uppercase",borderBottom:"1px solid #12305a" }}>{children}</th>;
const TD = ({children,style})=><td style={{ padding:"7px 9px",fontSize:12,...style }}>{children}</td>;
const mono = { fontFamily:"Orbitron,monospace",fontSize:11 };
const iSm = { fontFamily:"inherit",fontSize:11,padding:"5px 7px",background:"#060d1f",border:"1px solid #1a3a5c",borderRadius:4,color:"#e2e8f0" };
const fSel = { fontFamily:"inherit",fontSize:11,padding:"5px 8px",background:"#0a1832",border:"1px solid #1a3a5c",borderRadius:5,color:"#7db8e8" };
const Inp = ({label,value,onChange,type="text",placeholder,style:ws})=>(<div style={{ flex:"1 1 160px",display:"flex",flexDirection:"column",gap:3,...ws }}><label style={{ fontSize:9,color:"#5a7a9a",fontWeight:600,letterSpacing:1,textTransform:"uppercase" }}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ fontFamily:"inherit",fontSize:12,padding:"7px 10px",background:"#060d1f",border:"1px solid #1a3a5c",borderRadius:5,color:"#e2e8f0" }}/></div>);
const Sel = ({label,value,onChange,options})=>(<div style={{ flex:"1 1 160px",display:"flex",flexDirection:"column",gap:3 }}><label style={{ fontSize:9,color:"#5a7a9a",fontWeight:600,letterSpacing:1,textTransform:"uppercase" }}>{label}</label><select value={value} onChange={e=>onChange(e.target.value)} style={{ fontFamily:"inherit",fontSize:12,padding:"7px 10px",background:"#060d1f",border:"1px solid #1a3a5c",borderRadius:5,color:"#e2e8f0" }}>{options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>);

function Home({drivers,races,setTab,isStaff}) {
  const recent = [...races].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,6);
  const simCounts = SIMS.map(s=>({sim:s,count:races.filter(r=>r.sim===s).length,color:SIM_COLORS[s]}));
  return (<div style={{ animation:"fadeIn .3s ease" }}>
    <Card style={{ position:"relative",overflow:"hidden" }}><div style={{ position:"absolute",top:-40,right:-40,width:180,height:180,background:"radial-gradient(circle,#00d4ff12,transparent 70%)",borderRadius:"50%" }}/><div style={{ position:"relative",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:14 }}><div><div style={{ fontFamily:"Orbitron",fontSize:20,fontWeight:700,color:"#e2e8f0",letterSpacing:2 }}>Virtual Sim-Driver</div><p style={{ color:"#7db8e8",marginTop:5,fontSize:13 }}>Database risultati e statistiche — LMU, iRacing, AC Evo</p></div>{isStaff&&(<div style={{ display:"flex",gap:8,flexWrap:"wrap" }}><Btn onClick={()=>setTab("newrace")}>+ Registra Gara</Btn><Btn2 onClick={()=>setTab("import")}>Import JSON</Btn2></div>)}</div></Card>
    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:16 }}>{simCounts.map(sc=>(<div key={sc.sim} style={{ background:"#0a183288",border:"1px solid #12305a",borderRadius:8,padding:12,textAlign:"center",borderTop:`3px solid ${sc.color}` }}><div style={{ fontFamily:"Orbitron",fontSize:24,fontWeight:800,color:sc.color }}>{sc.count}</div><div style={{ fontSize:10,color:"#5a7a9a",letterSpacing:1,marginTop:3 }}>{sc.sim==="Le Mans Ultimate"?"LMU":sc.sim}</div></div>))}</div>
    <Sec t="Ultime Gare"/>
    {recent.length===0?<Empty t="Nessuna gara registrata."/>:(<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:10 }}>{recent.map(r=>{const w=r.results?.sort((a,b)=>(parseInt(a.position)||99)-(parseInt(b.position)||99))[0];const dn=drivers.find(d=>d.id===w?.driverId)?.name;return(<div key={r.id} style={{ background:"#0a183288",border:"1px solid #12305a",borderRadius:8,overflow:"hidden",display:"flex" }}><div style={{ width:4,background:SIM_COLORS[r.sim]||"#3b8bff" }}/><div style={{ padding:"10px 12px",flex:1 }}><div style={{ fontFamily:"'Barlow Condensed'",fontWeight:600,fontSize:14,color:"#e2e8f0" }}>{r.track}</div><div style={{ display:"flex",gap:4,alignItems:"center",marginTop:3,flexWrap:"wrap" }}><SimBadge sim={r.sim||"Le Mans Ultimate"}/><Pill cls={r.carClass}/><span style={{ fontSize:10,color:"#5a7a9a" }}>{r.date}</span></div>{dn&&<div style={{ fontSize:11,color:"#f5a623",marginTop:3 }}>&#127942; {dn}</div>}</div></div>)})}</div>)}
  </div>);
}

function Drivers({drivers,races,isStaff,loadData,notify}) {
  const [open,setOpen]=useState(false);const [f,sF]=useState({name:"",steamId:"",sgName:""});const [saving,setSaving]=useState(false);
  const add=async()=>{if(!f.name.trim())return notify("Inserisci il nome!",true);setSaving(true);await api("addDriver",{name:f.name.trim(),steamId:f.steamId.trim(),sgName:f.sgName.trim(),password:STAFF_PASSWORD});sF({name:"",steamId:"",sgName:""});setOpen(false);await loadData();setSaving(false);notify("Pilota aggiunto!")};
  const del=async(id,name)=>{if(!confirm(`Rimuovere ${name}?`))return;await api("deleteDriver",{id,password:STAFF_PASSWORD});await loadData();notify("Rimosso",true)};
  const rc=id=>races.filter(r=>r.results?.some(x=>x.driverId===id)).length;
  const wins=id=>races.filter(r=>r.results?.sort((a,b)=>(parseInt(a.position)||99)-(parseInt(b.position)||99))[0]?.driverId===id).length;
  return (<div style={{ animation:"fadeIn .3s ease" }}>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8 }}><Sec t="Roster Piloti VSD"/>{isStaff&&<Btn onClick={()=>setOpen(!open)}>{open?"Chiudi":"+ Nuovo Pilota"}</Btn>}</div>
    {open&&<Card><div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:10 }}><Inp label="Nome *" value={f.name} onChange={v=>sF(x=>({...x,name:v}))} placeholder="es. Mario Rossi"/><Inp label="Steam ID" value={f.steamId} onChange={v=>sF(x=>({...x,steamId:v}))} placeholder="Opzionale"/><Inp label="Nome SimGrid / iRacing" value={f.sgName} onChange={v=>sF(x=>({...x,sgName:v}))} placeholder="Opzionale"/></div><Btn onClick={add} style={{ opacity:saving?.5:1 }}>{saving?"Salvataggio...":"Conferma"}</Btn></Card>}
    {drivers.length===0?<Empty t="Nessun pilota registrato."/>:(<div style={{ display:"flex",flexDirection:"column",gap:6 }}>{drivers.map(d=>(<div key={d.id} style={{ display:"flex",alignItems:"center",gap:10,background:"#0a183288",border:"1px solid #12305a",borderRadius:8,padding:"10px 14px" }}><div style={{ width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#00d4ff33,#3b8bff33)",color:"#00d4ff",fontFamily:"Orbitron",fontWeight:700,fontSize:15,flexShrink:0 }}>{(d.name||"?")[0]}</div><div style={{ flex:1 }}><div style={{ fontWeight:600,color:"#e2e8f0",fontSize:13 }}>{d.name}</div><div style={{ fontSize:10,color:"#5a7a9a",display:"flex",gap:8,flexWrap:"wrap" }}><span>{rc(d.id)} gare</span>{wins(d.id)>0&&<span style={{ color:"#f5a623" }}>&#127942; {wins(d.id)}</span>}{d.sgName&&<span style={{ color:"#3b8bff" }}>{d.sgName}</span>}</div></div>{isStaff&&<button onClick={()=>del(d.id,d.name)} style={{ background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:16,opacity:.4 }}>x</button>}</div>))}</div>)}
  </div>);
}

function NewRace({drivers,loadData,notify}) {
  const [f,sF]=useState({date:new Date().toISOString().split("T")[0],sim:"Le Mans Ultimate",track:"Le Mans",carClass:"GTE",event:"",results:[]});const [saving,setSaving]=useState(false);
  const tracks=TRACKS_BY_SIM[f.sim]||[];const classes=CARS_BY_SIM[f.sim]||{};const cars=classes[f.carClass]||[];
  const setSim=sim=>sF(x=>({...x,sim,track:(TRACKS_BY_SIM[sim]||[])[0]||"",carClass:Object.keys(CARS_BY_SIM[sim]||{})[0]||"",results:x.results.map(r=>({...r,vehicle:""}))}));
  const addRow=()=>sF(x=>({...x,results:[...x.results,{driverId:"",position:x.results.length+1,vehicle:"",qualiBest:"",raceBest:"",qualiPos:""}]}));
  const upd=(i,k,v)=>sF(x=>{const r=[...x.results];r[i]={...r[i],[k]:v};return{...x,results:r}});
  const del=i=>sF(x=>({...x,results:x.results.filter((_,j)=>j!==i)}));
  const doSave=async()=>{if(!f.results.length)return notify("Aggiungi almeno un risultato!",true);if(f.results.some(r=>!r.driverId))return notify("Seleziona un pilota!",true);setSaving(true);await api("addRace",{raceData:JSON.stringify({date:f.date,track:f.track,carClass:f.carClass,eventName:f.event,sim:f.sim,results:f.results.map(r=>({driverId:r.driverId,position:parseInt(r.position)||99,vehicle:r.vehicle,qualiBestLap:r.qualiBest||"",raceBestLap:r.raceBest||"",qualiPos:r.qualiPos?parseInt(r.qualiPos):""}))}),password:STAFF_PASSWORD});sF({date:new Date().toISOString().split("T")[0],sim:"Le Mans Ultimate",track:"Le Mans",carClass:"GTE",event:"",results:[]});await loadData();setSaving(false);notify("Gara registrata!")};
  return (<div style={{ animation:"fadeIn .3s ease" }}>
    <Sec t="Registra Nuova Gara"/>
    <Card><div style={{ display:"flex",gap:10,flexWrap:"wrap" }}><Inp label="Data" type="date" value={f.date} onChange={v=>sF(x=>({...x,date:v}))}/><Sel label="Simulatore" value={f.sim} onChange={setSim} options={SIMS.map(s=>({v:s,l:s}))}/><Sel label="Tracciato" value={f.track} onChange={v=>sF(x=>({...x,track:v}))} options={tracks.map(t=>({v:t,l:t}))}/><Sel label="Classe" value={f.carClass} onChange={v=>sF(x=>({...x,carClass:v,results:x.results.map(r=>({...r,vehicle:""}))}))} options={Object.keys(classes).map(c=>({v:c,l:c}))}/><Inp label="Nome Evento" value={f.event} onChange={v=>sF(x=>({...x,event:v}))} placeholder="es. Round 3"/></div></Card>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}><span style={{ fontFamily:"'Barlow Condensed'",fontSize:13,fontWeight:600,color:"#7db8e8",letterSpacing:1 }}>RISULTATI PILOTI</span><Btn2 onClick={addRow}>+ Aggiungi Pilota</Btn2></div>
    {f.results.length===0?<Empty t="Clicca '+ Aggiungi Pilota' per inserire i risultati"/>:(<Card style={{ overflowX:"auto" }}><table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr><TH>Pos</TH><TH>Q.Pos</TH><TH>Pilota</TH><TH>Veicolo</TH><TH>Best Quali</TH><TH>Best Gara</TH><TH></TH></tr></thead><tbody>{f.results.map((r,i)=>(<tr key={i} style={{ borderBottom:"1px solid #0f284722" }}><td style={{ padding:4 }}><input type="number" min={1} value={r.position} onChange={e=>upd(i,"position",e.target.value)} style={{ ...iSm,width:44 }}/></td><td style={{ padding:4 }}><input type="number" min={1} value={r.qualiPos} onChange={e=>upd(i,"qualiPos",e.target.value)} placeholder="-" style={{ ...iSm,width:44 }}/></td><td style={{ padding:4 }}><select value={r.driverId} onChange={e=>upd(i,"driverId",e.target.value)} style={{ ...iSm,minWidth:120 }}><option value="">-- Pilota --</option>{drivers.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></td><td style={{ padding:4 }}><select value={r.vehicle} onChange={e=>upd(i,"vehicle",e.target.value)} style={{ ...iSm,minWidth:140 }}><option value="">-- Veicolo --</option>{cars.map(v=><option key={v} value={v}>{v}</option>)}</select></td><td style={{ padding:4 }}><input value={r.qualiBest} onChange={e=>upd(i,"qualiBest",e.target.value)} placeholder="1:52.345" style={{ ...iSm,width:90,...mono }}/></td><td style={{ padding:4 }}><input value={r.raceBest} onChange={e=>upd(i,"raceBest",e.target.value)} placeholder="1:53.012" style={{ ...iSm,width:90,...mono }}/></td><td style={{ padding:4 }}><button onClick={()=>del(i)} style={{ background:"none",border:"none",color:"#ef4444",cursor:"pointer",opacity:.5 }}>x</button></td></tr>))}</tbody></table></Card>)}
    {f.results.length>0&&<Btn onClick={doSave} style={{ opacity:saving?.5:1 }}>{saving?"Salvataggio...":"Salva Gara"}</Btn>}
  </div>);
}

function Results({races,drivers,isStaff,loadData,notify}) {
  const [fc,sFc]=useState("ALL");const [ft,sFt]=useState("ALL");const [fs,sFs]=useState("ALL");
  const used=[...new Set(races.map(r=>r.track))];
  const filtered=races.filter(r=>fc==="ALL"||r.carClass===fc).filter(r=>ft==="ALL"||r.track===ft).filter(r=>fs==="ALL"||r.sim===fs).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const del=async id=>{if(!confirm("Eliminare?"))return;await api("deleteRace",{id,password:STAFF_PASSWORD});await loadData();notify("Eliminata",true)};
  return (<div style={{ animation:"fadeIn .3s ease" }}>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8 }}><Sec t="Storico Risultati"/><div style={{ display:"flex",gap:6,flexWrap:"wrap" }}><select value={fs} onChange={e=>sFs(e.target.value)} style={fSel}><option value="ALL">Tutti i sim</option>{SIMS.map(s=><option key={s} value={s}>{s}</option>)}</select><select value={fc} onChange={e=>sFc(e.target.value)} style={fSel}><option value="ALL">Tutte le classi</option>{Object.keys(CC).map(c=><option key={c} value={c}>{c}</option>)}</select><select value={ft} onChange={e=>sFt(e.target.value)} style={fSel}><option value="ALL">Tutti i tracciati</option>{used.map(t=><option key={t} value={t}>{t}</option>)}</select></div></div>
    {filtered.length===0?<Empty t="Nessuna gara trovata."/>:filtered.map(race=>{const sorted=[...(race.results||[])].sort((a,b)=>(parseInt(a.position)||99)-(parseInt(b.position)||99));return(<Card key={race.id}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}><div><div style={{ display:"flex",alignItems:"center",gap:6,fontWeight:600,color:"#e2e8f0",fontSize:13,flexWrap:"wrap" }}><SimBadge sim={race.sim||"Le Mans Ultimate"}/><Pill cls={race.carClass}/>{race.track}</div><div style={{ fontSize:10,color:"#5a7a9a",marginTop:2 }}>{race.date}{race.eventName&&` - ${race.eventName}`} - {sorted.length} piloti</div></div>{isStaff&&<button onClick={()=>del(race.id)} style={{ background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:13,opacity:.4 }}>del</button>}</div><div style={{ overflowX:"auto" }}><table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr><TH>Pos</TH><TH>Q.Pos</TH><TH>Pilota</TH><TH>Veicolo</TH><TH>Best Quali</TH><TH>Best Gara</TH></tr></thead><tbody>{sorted.map(res=>{const dn=drivers.find(d=>d.id===res.driverId)?.name||"?";const p=parseInt(res.position)||99;const pc=p===1?"#FFD700":p===2?"#C0C0C0":p===3?"#CD7F32":"#c8d6e5";return(<tr key={res.id||res.driverId} style={{ borderBottom:"1px solid #0f284711" }}><TD style={{ fontWeight:800,color:pc,...mono }}>P{p}</TD><TD style={{ opacity:.5,...mono,fontSize:10 }}>{res.qualiPos?`P${res.qualiPos}`:"-"}</TD><TD style={{ fontWeight:600 }}>{dn}</TD><TD style={{ fontSize:11,opacity:.6 }}>{res.vehicle||"-"}</TD><TD style={{ ...mono,color:"#a855f7",fontWeight:600 }}>{res.qualiBestLap||"-"}</TD><TD style={{ ...mono,color:"#00d4ff",fontWeight:600 }}>{res.raceBestLap||"-"}</TD></tr>)})}</tbody></table></div></Card>)})}
  </div>);
}

function Laps({races,drivers}) {
  const [sd,sSd]=useState("ALL");const [sc,sSc]=useState("ALL");const [ss,sSs]=useState("ALL");
  const recs={};races.forEach(race=>{if(sc!=="ALL"&&race.carClass!==sc)return;if(ss!=="ALL"&&race.sim!==ss)return;race.results?.forEach(res=>{if(sd!=="ALL"&&res.driverId!==sd)return;const k=`${res.driverId}|${race.track}|${race.carClass}|${race.sim||"LMU"}`;if(!recs[k])recs[k]={driverId:res.driverId,track:race.track,cls:race.carClass,sim:race.sim||"Le Mans Ultimate",vehicle:res.vehicle,qB:null,rB:null,bestP:null};if(res.qualiBestLap&&(!recs[k].qB||res.qualiBestLap<recs[k].qB))recs[k].qB=res.qualiBestLap;if(res.raceBestLap&&(!recs[k].rB||res.raceBestLap<recs[k].rB)){recs[k].rB=res.raceBestLap;recs[k].vehicle=res.vehicle}const p=parseInt(res.position);if(p&&(!recs[k].bestP||p<recs[k].bestP))recs[k].bestP=p})});
  const rows=Object.values(recs).sort((a,b)=>a.track.localeCompare(b.track)||(a.rB||"z").localeCompare(b.rB||"z"));
  const abs={};races.forEach(race=>race.results?.forEach(res=>{const k=`${race.track}|${race.carClass}|${race.sim||"LMU"}`;if(!abs[k])abs[k]={track:race.track,cls:race.carClass,sim:race.sim||"Le Mans Ultimate",qB:null,qD:null,rB:null,rD:null,rV:null};if(res.qualiBestLap&&(!abs[k].qB||res.qualiBestLap<abs[k].qB)){abs[k].qB=res.qualiBestLap;abs[k].qD=res.driverId}if(res.raceBestLap&&(!abs[k].rB||res.raceBestLap<abs[k].rB)){abs[k].rB=res.raceBestLap;abs[k].rD=res.driverId;abs[k].rV=res.vehicle}}));
  return (<div style={{ animation:"fadeIn .3s ease" }}>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8 }}><Sec t="Best Lap Times"/><div style={{ display:"flex",gap:6,flexWrap:"wrap" }}><select value={ss} onChange={e=>sSs(e.target.value)} style={fSel}><option value="ALL">Tutti i sim</option>{SIMS.map(s=><option key={s} value={s}>{s}</option>)}</select><select value={sd} onChange={e=>sSd(e.target.value)} style={fSel}><option value="ALL">Tutti i piloti</option>{drivers.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><select value={sc} onChange={e=>sSc(e.target.value)} style={fSel}><option value="ALL">Tutte le classi</option>{Object.keys(CC).map(c=><option key={c} value={c}>{c}</option>)}</select></div></div>
    {rows.length===0?<Empty t="Nessun tempo registrato."/>:(<Card style={{ overflowX:"auto" }}><table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr><TH>Sim</TH><TH>Tracciato</TH><TH>Classe</TH><TH>Pilota</TH><TH>Veicolo</TH><TH>Best Quali</TH><TH>Best Gara</TH><TH>Best Pos</TH></tr></thead><tbody>{rows.map((r,i)=>(<tr key={i} style={{ borderBottom:"1px solid #0f284711" }}><TD><SimBadge sim={r.sim}/></TD><TD>{r.track}</TD><TD><Pill cls={r.cls}/></TD><TD style={{ fontWeight:600 }}>{drivers.find(d=>d.id===r.driverId)?.name||"?"}</TD><TD style={{ fontSize:11,opacity:.6 }}>{r.vehicle||"-"}</TD><TD style={{ ...mono,color:"#a855f7",fontWeight:600 }}>{r.qB||"-"}</TD><TD style={{ ...mono,color:"#00d4ff",fontWeight:600 }}>{r.rB||"-"}</TD><TD style={{ ...mono,fontWeight:700,color:r.bestP===1?"#FFD700":"#c8d6e5" }}>{r.bestP?`P${r.bestP}`:"-"}</TD></tr>))}</tbody></table></Card>)}
    {Object.keys(abs).length>0&&(<><Sec t="Record Assoluti del Team"/><Card style={{ overflowX:"auto" }}><table style={{ width:"100%",borderCollapse:"collapse" }}><thead><tr><TH>Sim</TH><TH>Tracciato</TH><TH>Classe</TH><TH>Record Quali</TH><TH>Pilota</TH><TH>Record Gara</TH><TH>Pilota</TH><TH>Veicolo</TH></tr></thead><tbody>{Object.values(abs).sort((a,b)=>a.track.localeCompare(b.track)).map((r,i)=>(<tr key={i} style={{ borderBottom:"1px solid #0f284711" }}><TD><SimBadge sim={r.sim}/></TD><TD>{r.track}</TD><TD><Pill cls={r.cls}/></TD><TD style={{ ...mono,color:"#a855f7",fontWeight:700 }}>{r.qB||"-"}</TD><TD>{drivers.find(d=>d.id===r.qD)?.name||"-"}</TD><TD style={{ ...mono,color:"#00d4ff",fontWeight:700 }}>{r.rB||"-"}</TD><TD>{drivers.find(d=>d.id===r.rD)?.name||"-"}</TD><TD style={{ fontSize:11,opacity:.6 }}>{r.rV||"-"}</TD></tr>))}</tbody></table></Card></>)}
  </div>);
}

function Import({drivers,loadData,notify}) {
  const [json,setJson]=useState("");const [parsed,setParsed]=useState(null);const [preview,setPreview]=useState(null);
  const [cfg,sCfg]=useState({sim:"Le Mans Ultimate",track:TRACKS_BY_SIM["Le Mans Ultimate"][0],cls:"GTE",date:new Date().toISOString().split("T")[0],names:"",event:""});
  const [saving,setSaving]=useState(false);const ref=useRef(null);
  const setSim=sim=>sCfg(c=>({...c,sim,track:(TRACKS_BY_SIM[sim]||[])[0]||"",cls:Object.keys(CARS_BY_SIM[sim]||{})[0]||""}));
  const handleFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setJson(ev.target.result);setParsed(null);setPreview(null)};r.readAsText(f)};
  const doParse=()=>{try{setParsed(JSON.parse(json));notify("JSON parsato!")}catch(e){notify("Errore: "+e.message,true)}};
  const doFilter=()=>{if(!parsed)return;const names=cfg.names.split(",").map(n=>n.trim().toLowerCase()).filter(Boolean);if(!names.length)return notify("Inserisci almeno un nome!",true);const entries=extract(parsed);if(!entries.length)return notify("Struttura JSON non riconosciuta.",true);const filtered=entries.filter(e=>names.some(n=>e.name.toLowerCase().includes(n)));if(!filtered.length)return notify("Nessun pilota trovato.",true);setPreview(filtered);notify(`${filtered.length} piloti trovati!`)};
  const doImport=async()=>{if(!preview)return;setSaving(true);let cd=[...drivers];for(const entry of preview){const exists=cd.find(d=>d.name.toLowerCase().includes(entry.name.toLowerCase())||entry.name.toLowerCase().includes(d.name.toLowerCase()));if(!exists){const res=await api("addDriver",{name:entry.name,password:STAFF_PASSWORD});if(res.id)cd.push({id:res.id,name:entry.name})}}const fd=await api("getAll");const fdr=fd.drivers||cd;const results=preview.map(e=>{const d=fdr.find(x=>x.name.toLowerCase().includes(e.name.toLowerCase())||e.name.toLowerCase().includes(x.name.toLowerCase()));return{driverId:d?.id||"",position:e.position,vehicle:e.vehicle||"",qualiBestLap:e.raceBestLap||"",raceBestLap:e.raceBestLap||"",qualiPos:e.qualiPos||""}});await api("addRace",{raceData:JSON.stringify({date:cfg.date,track:cfg.track,carClass:cfg.cls,eventName:cfg.event,sim:cfg.sim,results}),password:STAFF_PASSWORD});await loadData();setSaving(false);notify(`${results.length} risultati importati!`);setParsed(null);setPreview(null);setJson("")};
  const tracks=TRACKS_BY_SIM[cfg.sim]||[];const classes=Object.keys(CARS_BY_SIM[cfg.sim]||{});
  return (<div style={{ animation:"fadeIn .3s ease" }}>
    <Sec t="Importazione JSON"/>
    <Card><p style={{ fontSize:12,color:"#7db8e8",lineHeight:1.6 }}>Importa risultati da file JSON (SimGrid, LMU, iRacing, ecc.). Il sistema filtra solo i piloti del team VSD.</p></Card>
    <Card><div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:10 }}><Inp label="Data" type="date" value={cfg.date} onChange={v=>sCfg(c=>({...c,date:v}))}/><Sel label="Simulatore" value={cfg.sim} onChange={setSim} options={SIMS.map(s=>({v:s,l:s}))}/><Sel label="Tracciato" value={cfg.track} onChange={v=>sCfg(c=>({...c,track:v}))} options={tracks.map(t=>({v:t,l:t}))}/><Sel label="Classe" value={cfg.cls} onChange={v=>sCfg(c=>({...c,cls:v}))} options={classes.map(c=>({v:c,l:c}))}/><Inp label="Evento" value={cfg.event} onChange={v=>sCfg(c=>({...c,event:v}))} placeholder="Opzionale"/></div><Inp label="Nomi Piloti Team (virgola)" value={cfg.names} onChange={v=>sCfg(c=>({...c,names:v}))} placeholder="es. Demetrio, Casesi" style={{ flex:"1 1 100%",marginBottom:10 }}/></Card>
    <Card><div style={{ display:"flex",gap:8,marginBottom:10,flexWrap:"wrap" }}><Btn2 onClick={()=>ref.current?.click()}>Carica File</Btn2><input ref={ref} type="file" accept=".json" style={{ display:"none" }} onChange={handleFile}/><Btn onClick={doParse} style={{ opacity:json?1:.4 }}>Analizza</Btn>{parsed&&<Btn onClick={doFilter} style={{ background:"linear-gradient(135deg,#f5a623,#ef3340)" }}>Filtra Team</Btn>}{preview&&<Btn onClick={doImport} style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)",opacity:saving?.5:1 }}>{saving?"Importazione...":"Importa"}</Btn>}</div><textarea value={json} onChange={e=>{setJson(e.target.value);setParsed(null);setPreview(null)}} placeholder="Incolla qui il JSON..." rows={8} style={{ width:"100%",fontFamily:"monospace",fontSize:11,padding:10,background:"#050b18",border:"1px solid #1a3a5c",borderRadius:6,color:"#7db8e8",resize:"vertical" }}/></Card>
    {preview&&(<Card><span style={{ fontFamily:"'Barlow Condensed'",fontSize:13,fontWeight:600,color:"#22c55e",letterSpacing:1 }}>ANTEPRIMA - {preview.length} PILOTI</span><table style={{ width:"100%",borderCollapse:"collapse",marginTop:8 }}><thead><tr><TH>Pos</TH><TH>Pilota</TH><TH>Veicolo</TH><TH>Best Lap</TH></tr></thead><tbody>{preview.map((e,i)=>(<tr key={i} style={{ borderBottom:"1px solid #0f284711" }}><TD style={{ fontWeight:700 }}>P{e.position}</TD><TD style={{ fontWeight:600 }}>{e.name}</TD><TD style={{ fontSize:11,opacity:.6 }}>{e.vehicle||"-"}</TD><TD style={{ ...mono,color:"#00d4ff" }}>{e.raceBestLap||"-"}</TD></tr>))}</tbody></table></Card>)}
  </div>);
}

function extract(data) {
  let e=[];
  if(data?.sessionResult?.leaderBoardLines)e=data.sessionResult.leaderBoardLines.map((l,i)=>({position:i+1,name:[l.currentDriver?.firstName,l.currentDriver?.lastName].filter(Boolean).join(" ")||l.currentDriver?.shortName||"",raceBestLap:fmtMs(l.timing?.bestLap),vehicle:l.car?.carModel?.toString()||""}));
  else if(data?.results&&Array.isArray(data.results))e=data.results.map((x,i)=>({position:x.position||x.pos||i+1,name:x.driverName||x.driver?.name||x.name||[x.firstName,x.lastName].filter(Boolean).join(" ")||"",raceBestLap:x.bestLapTime||x.bestLap||x.fastestLap||"",vehicle:x.vehicle||x.car||x.carName||"",qualiPos:x.qualifyingPosition||null}));
  else if(Array.isArray(data))e=data.map((x,i)=>({position:x.position||x.pos||i+1,name:x.driverName||x.driver?.name||x.name||[x.firstName,x.lastName].filter(Boolean).join(" ")||"",raceBestLap:x.bestLapTime||x.bestLap||x.fastestLap||"",vehicle:x.vehicle||x.car||x.carName||""}));
  else if(data?.leaderboard)e=data.leaderboard.map((x,i)=>({position:x.position||i+1,name:x.driverName||x.name||"",raceBestLap:x.bestLap||"",vehicle:x.vehicle||x.car||""}));
  else if(data?.drivers&&Array.isArray(data.drivers))e=data.drivers.map((x,i)=>({position:x.position||i+1,name:x.name||x.driverName||"",raceBestLap:x.bestLap||"",vehicle:x.vehicle||x.car||""}));
  return e.filter(x=>x.name);
}
function fmtMs(ms){if(!ms||ms<=0)return"";const s=ms/1000;return`${Math.floor(s/60)}:${(s%60).toFixed(3).padStart(6,"0")}`}
