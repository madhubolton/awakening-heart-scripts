/*--------------------------------------------------------------
  Awakening Heart : Asset Preloader + Overlay Controller
  Loads essential media before revealing start buttons.
  Version: 1.0 | Date: 2025-10-21
--------------------------------------------------------------*/
document.addEventListener('DOMContentLoaded', async () => {
  const overlay  = document.getElementById('oracleOverlay');
  const btnGroup = document.querySelector('.oracle-buttons');
  const bg       = document.getElementById('bgMusic');

  const preload = urls => Promise.all(urls.map(url => new Promise(res => {
    if (!url) return res();
    const a = new Audio(); a.src = url;
    a.addEventListener('canplaythrough', res, { once: true });
    a.addEventListener('error', res, { once: true });
  })));

  const assets = [
    bg?.querySelector('source')?.src,
    'https://cdn.prod.website-files.com/679e869aea3320bf53bd1d1c/68e42cc1d20f8098e788c799_ah_vo_test.mp3'
  ];

  await Promise.all([preload(assets), new Promise(r => setTimeout(r, 3000))]);
  gsap.to(btnGroup, { autoAlpha: 1, duration: 1.2 });
  btnGroup.style.pointerEvents = 'auto';
  console.log('✅ Assets preloaded');

  window.AHOverlay = {
    hide() {
      gsap.to(overlay, {
        autoAlpha: 0, duration: 0.8,
        onComplete: () => overlay.style.display = 'none'
      });
    }
  };
});// JavaScript Document