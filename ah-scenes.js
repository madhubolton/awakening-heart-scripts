/*--------------------------------------------------------------
  Awakening Heart : Scene 1 Timeline
  Positions and animates text blocks when activated.
  Version: 1.0 | Date: 2025-10-21
--------------------------------------------------------------*/
document.addEventListener("DOMContentLoaded",()=>{
  const tl=gsap.timeline({paused:true});
  tl.fromTo('[data-scene="1"][data-role="intro"]',{opacity:0},
             {opacity:1,x:-300,y:-200,duration:1,ease:"power2.out"})
    .fromTo('[data-scene="1"][data-role="distinction"]',{opacity:0},
             {opacity:1,x:300,y:-200,duration:1,ease:"power2.out"})
    .fromTo('[data-scene="1"][data-role="quote"]',{opacity:0,scale:0.5},
             {opacity:1,scale:1,duration:1,ease:"back.out(1.7)"})
    .fromTo('[data-scene="1"][data-role="share"]',{opacity:0},
             {opacity:1,x:-300,y:200,duration:1,ease:"power2.out"})
    .fromTo('[data-scene="1"][data-role="practice"]',{opacity:0},
             {opacity:1,x:300,y:200,duration:1,ease:"power2.out"});
  document.querySelector('[data-entry-id="top"]')
    ?.addEventListener("click",()=>tl.restart());
});// JavaScript Document