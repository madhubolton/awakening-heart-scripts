/*--------------------------------------------------------------
  Awakening Heart : Audio Reactive Extension
  Links analyser amplitude to visual scale / glow effects.
  Version: 1.0 | Date: 2025-10-21
--------------------------------------------------------------*/
window.AHReactive = {
  analyser:null,dataArray:null,audioCtx:null,source:null,
  reactiveEls:[],intensity:0.6,

  initAudioReactive(audioEl){
    try{
      this.audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      this.source=this.audioCtx.createMediaElementSource(audioEl);
      this.analyser=this.audioCtx.createAnalyser();
      this.analyser.fftSize=256;
      this.dataArray=new Uint8Array(this.analyser.frequencyBinCount);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
      this.loop();
      console.log("🎧 Audio reactive engine ready");
    }catch(e){console.warn("Audio reactive init failed:",e);}
  },

  loop(){
    if(!this.analyser)return;
    this.analyser.getByteFrequencyData(this.dataArray);
    const avg=this.dataArray.reduce((a,b)=>a+b)/this.dataArray.length;
    const amp=avg/255;
    this.updateElements(amp);
    requestAnimationFrame(()=>this.loop());
  },

  updateElements(amp){
    this.reactiveEls.forEach(el=>{
      const { baseScale,type } = el.dataset;
      const scale=1+amp*this.intensity*parseFloat(baseScale||0.05);
      const opacity=0.6+amp*this.intensity*0.8;
      if(type==="scale")
        gsap.to(el,{scale,transformOrigin:"center",duration:0.1});
      else if(type==="glow")
        el.style.filter=`drop-shadow(0 0 ${6+amp*10}px rgba(255,255,255,${opacity}))`;
    });
  },

  register(el,type,baseScale=0.05){
    if(!el)return;
    el.dataset.type=type;
    el.dataset.baseScale=baseScale;
    this.reactiveEls.push(el);
  }
};

// --- integrate with Metatron ---
(function(){
  const sF=window.metatron.startFacets;
  const sP=window.metatron.startPortals;

  window.metatron.startFacets=function(cfg=window.AHCONFIG.facets){
    sF.call(this,cfg);
    Object.values(cfg.groups).flat().forEach(id=>{
      const el=document.getElementById(id);
      if(!el)return;
      const shape=el.tagName==='g'?el.querySelector('polygon, polyline'):el;
      const hasReactive=Object.values(cfg.styles).find(s=>s.effects&&s.effects.reactive);
      if(hasReactive&&shape)window.AHReactive.register(shape,"scale",0.04);
    });
  };

  window.metatron.startPortals=function(cfg=window.AHCONFIG.portals){
    sP.call(this,cfg);
    Object.values(cfg.groups).flat().forEach(id=>{
      const el=document.getElementById(id);
      if(!el)return;
      const hasReactive=Object.values(cfg.styles).find(s=>s.effects&&s.effects.reactive);
      if(hasReactive)window.AHReactive.register(el,"glow",0.03);
    });
  };
})();// JavaScript Document