/*--------------------------------------------------------------
  Awakening Heart : Shader Manager
  Reveals and initializes Unicorn Studio shader canvas.
  Version: 1.0 | Date: 2025-10-21
--------------------------------------------------------------*/
window.AHShader = {
  reveal() {
    setTimeout(() => {
      const shader = document.querySelector('.shader-wrapper');
      if (!shader) return;
      shader.style.cssText = `
        display:block;opacity:1;visibility:visible;pointer-events:auto;
        width:100%;height:100%;position:absolute;top:0;left:0;z-index:1;
      `;
      gsap.to(shader, { autoAlpha: 1, duration: 1 });
      this.start();
    }, 800);
  },
  start() {
    if (window.shaderStarted) return;
    window.shaderStarted = true;
    console.log('🌀 Starting shader...');
    const tryInit = () => {
      const canvas = document.querySelector('.shader-wrapper canvas');
      if (window.UnicornStudio && canvas) {
        try { UnicornStudio.init(); console.log('✨ Shader initialized'); }
        catch (e) { console.warn('Shader init error:', e); }
      } else requestAnimationFrame(tryInit);
    };
    tryInit();
  }
};// JavaScript Document