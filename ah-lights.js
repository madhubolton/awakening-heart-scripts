/*--------------------------------------------------------------
  Awakening Heart : Stairway Light Cycle
  Gentle looping color transitions on platform geometry.
  Version: 1.0 | Date: 2025-10-21
--------------------------------------------------------------*/
const tl=gsap.timeline({
  repeat:-1,yoyo:true,
  defaults:{ease:"sine.inOut",duration:2.5}
});
tl.to("#floor-shape",{fill:"#726b84"},0)
  .to("#riser1-shape",{fill:"#625c72"},0.25)
  .to("#step1-shape",{fill:"#9c90b0"},0.5)
  .to("#riser2-shape",{fill:"#827696"},0.75)
  .to("#step2-shape",{fill:"#c8c0de"},1.0)
  .to("#plinth-face-shape",{fill:"#a297b8"},1.25)
  .to("#plinth-top-shape",{fill:"#f0e9fb"},1.5);// JavaScript Document