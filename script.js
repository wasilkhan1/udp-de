/* UDP — Unified Data Pipeline
   All interactions are plain JavaScript. */

const stages = {
  source:{i:"01 / 06",t:"S3 Raw Data",d:"Raw customer, product, pricing and order files land in S3. The orders flow uses landing and processed locations so consumed files can be moved after ingestion.",tags:["S3","CSV","Landing","Processed"]},
  lakeflow:{i:"02 / 06",t:"Lakeflow Jobs",d:"The notebook-based pipeline is organized into setup, dimension processing and fact processing. Lakeflow Jobs provides the repeatable workflow layer.",tags:["Lakeflow Jobs","Databricks","Notebooks","Workflow"]},
  bronze:{i:"03 / 06",t:"Bronze — Raw Delta",d:"Source data is ingested with Spark and written as Delta tables. Ingestion metadata such as read timestamp, file name and file size is retained.",tags:["PySpark","Delta","Metadata","CDF"]},
  silver:{i:"04 / 06",t:"Silver — Trusted Data",d:"Silver handles dirty source data: duplicate removal, trimming, casing, city corrections, invalid IDs, inconsistent dates, invalid prices and product enrichment.",tags:["Data Quality","PySpark","Standardization","Joins"]},
  gold:{i:"05 / 06",t:"Gold — Analytics",d:"Gold contains business-ready data. Orders are aggregated from daily to monthly grain and combined with product, customer and date dimensions.",tags:["Fact","Dimensions","Monthly Grain","Delta"]},
  serve:{i:"06 / 06",t:"Serving — Dashboards + Genie",d:"The Gold analytics layer is the consumption boundary: governed data can be exposed through dashboards and Genie for business analytics.",tags:["Dashboards","Genie","Gold","Unity Catalog"]}
};

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function updateStage(key){
  const s=stages[key]; if(!s)return;
  $("#stageIndex").textContent=s.i;
  $("#stageTitle").textContent=s.t;
  $("#stageText").textContent=s.d;
  $("#stageTags").innerHTML=s.tags.map(x=>`<b>${x}</b>`).join("");
}
$$(".node").forEach(n=>n.addEventListener("click",()=>{
  $$(".node").forEach(x=>x.classList.remove("active"));
  n.classList.add("active"); updateStage(n.dataset.stage);
}));
updateStage("source");

/* Mobile navigation */
$("#menuToggle")?.addEventListener("click",()=>$("#navLinks").classList.toggle("open"));
$$("#navLinks a").forEach(a=>a.addEventListener("click",()=>$("#navLinks").classList.remove("open")));

/* Light / dark theme toggle. Light is the default. */
const savedTheme=localStorage.getItem("udp-theme");
if(savedTheme) document.documentElement.dataset.theme=savedTheme;
$("#themeToggle")?.addEventListener("click",()=>{
  const dark=document.documentElement.dataset.theme==="dark";
  if(dark) delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme="dark";
  localStorage.setItem("udp-theme",dark?"light":"dark");
});

/* Reveal sections as they enter the viewport. */
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");observer.unobserve(e.target)}});
},{threshold:.1});
$$(".reveal").forEach(x=>observer.observe(x));

/* Active nav item */
const links=[...$$("#navLinks a")];
const sections=[...$$("main section[id]")];
const navObserver=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(!e.isIntersecting)return;
    links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+e.target.id));
  });
},{rootMargin:"-45% 0px -45% 0px"});
sections.forEach(s=>navObserver.observe(s));

/* Subtle particle/node background */
const canvas=$("#networkCanvas"),ctx=canvas.getContext("2d");
let particles=[];
function resize(){
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;
  canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const count=innerWidth<700?22:48;
  particles=Array.from({length:count},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-.5)*.16,vy:(Math.random()-.5)*.16,r:.5+Math.random()}));
}
function animate(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  particles.forEach(p=>{
    p.x+=p.vx;p.y+=p.vy;
    if(p.x<0||p.x>innerWidth)p.vx*=-1;
    if(p.y<0||p.y>innerHeight)p.vy*=-1;
  });
  for(let i=0;i<particles.length;i++)for(let j=i+1;j<particles.length;j++){
    const a=particles[i],b=particles[j],d=Math.hypot(a.x-b.x,a.y-b.y);
    if(d<125){
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
      ctx.strokeStyle=`rgba(255,91,69,${(1-d/125)*.08})`;ctx.stroke();
    }
  }
  particles.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle="rgba(255,91,69,.35)";ctx.fill()});
  requestAnimationFrame(animate);
}
if(!matchMedia("(prefers-reduced-motion: reduce)").matches){resize();animate();addEventListener("resize",resize)}
else canvas.style.display="none";
