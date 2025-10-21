/*--------------------------------------------------------------
  Awakening Heart : Metatron Engine Core
  Handles facet + portal GSAP animations from JSON config.
  Version: 1.0 | Date: 2025-10-21
--------------------------------------------------------------*/
const deepMerge = (a,b)=>{if(!b)return a;const o={...a};
  for(const k in b)o[k]=(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k]))
    ? deepMerge(a[k]||{},b[k]):b[k];return o;};

const DEFAULTS={
  timing:{facetsDelay:0,portalsDelay:4},
  facets:{groups:{},sequence:[],styles:{},delayBetweenGroups:0.4},
  portals:{groups:{},sequence:[],styles:{},delayBetweenGroups:0.3}
};

function readSceneConfig(){
  const el=document.getElementById('scene-config');
  if(!el)return DEFAULTS;
  try{return deepMerge(DEFAULTS,JSON.parse(el.textContent.trim()));}
  catch(e){console.warn('Bad scene JSON',e);return DEFAULTS;}
}
window.AHCONFIG=readSceneConfig();

window.metatron={
  startFacets(cfg=window.AHCONFIG.facets){
    this.stopFacets();let total=0;
    (cfg.sequence||[]).forEach(g=>{
      const ids=cfg.groups[g]||[],style=cfg.styles[g]||{};
      ids.forEach((id,i)=>{
        const el=document.getElementById(id);
        if(!el)return;
        const shape=el.tagName==='g'?el.querySelector('polygon, polyline'):el;
        if(!shape)return;
        gsap.to(shape,{fill:style.fill||"#bb9adc",
          duration:style.duration||2.5,repeat:-1,yoyo:true,
          ease:"sine.inOut",delay:total+i*0.1});
      });
      total+=cfg.delayBetweenGroups||0;
    });
  },
  startPortals(cfg=window.AHCONFIG.portals){
    this.stopPortals();let total=0;
    (cfg.sequence||[]).forEach(g=>{
      const ids=cfg.groups[g]||[],style=cfg.styles[g]||{};
      ids.forEach((id,i)=>{
        const el=document.getElementById(id);
        if(!el)return;
        gsap.to(el,{fill:style.fill||"#ed95df",
          duration:style.duration||1.5,repeat:-1,yoyo:true,
          ease:"sine.inOut",delay:total+i*0.1});
      });
      total+=cfg.delayBetweenGroups||0;
    });
  },
  stopFacets(){gsap.killTweensOf("polygon, polyline");},
  stopPortals(){gsap.killTweensOf("path, circle, polygon");},
  stopAll(){this.stopFacets();this.stopPortals();}
};

window.addEventListener('DOMContentLoaded',()=>{
  const t=window.AHCONFIG.timing||{};
  setTimeout(()=>window.metatron.startFacets(),(t.facetsDelay||0)*1000);
  setTimeout(()=>window.metatron.startPortals(),(t.portalsDelay||0)*1000);
});// JavaScript Document