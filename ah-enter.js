/*--------------------------------------------------------------
  Awakening Heart : Enter (diagnostic base)
  Fades in the Enter SVG, allows click anywhere, 
  fades temple, overlay, starts shader + audio.
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  const overlay   = document.getElementById("overlay") || document.getElementById("oracleOverlay");
  const temple    = document.getElementById("temple-container");
  const enterBtn  = document.getElementById("temple-enter-button");
  const shaderW   = document.querySelector(".shader-wrapper");
  const bg        = document.getElementById("bgMusic");
  const audioUI   = document.querySelector(".audio-buttons");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");

  console.log("✨ DOM ready", { overlay, temple, enterBtn, shaderW, bg });

  // --- make sure everything starts hidden / paused -------------
  if (shaderW) gsap.set(shaderW, { autoAlpha: 0 });
  if (audioUI) gsap.set(audioUI, { autoAlpha: 0, pointerEvents: "none" });
  if (bg) { bg.pause(); bg.volume = 0; bg.muted = false; }

  // --- fade the enter button in once the page is fully loaded ---
  window.addEventListener("load", () => {
    if (enterBtn) {
      gsap.fromTo(enterBtn, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, ease: "sine.inOut" });
      console.log("✅ Enter fade started");
    }
  });

  // --- main sequence --------------------------------------------
  async function activateEntry() {
    if (window.__AH_STARTED) return;
    window.__AH_STARTED = true;
    console.log("🚪 Sequence triggered");

    if (enterBtn) enterBtn.style.pointerEvents = "none";

    // fade overlay
    if (overlay) await gsap.to(overlay, { autoAlpha: 0, duration: 0.8, ease: "sine.inOut" });

    // reveal shader
    if (window.AHShader?.reveal) window.AHShader.reveal();
    else if (shaderW) gsap.to(shaderW, { autoAlpha: 1, duration: 1 });

    // fade temple
    if (temple) await gsap.to(temple, { autoAlpha: 0, duration: 1.2, ease: "sine.inOut" });

    // start audio
    if (bg) {
      try {
        await bg.play();
        gsap.to(bg, { volume: 0.35, duration: 1.2, ease: "sine.inOut" });
        console.log("🎶 audio started");
      } catch (e) {
        console.warn("audio play blocked:", e);
      }
    }

    // show sound buttons
    if (audioUI) gsap.to(audioUI, { autoAlpha: 1, duration: 0.6, pointerEvents: "auto" });
  }

  // --- listeners ------------------------------------------------
  // click on the button
  enterBtn?.addEventListener("click", (e) => { e.stopPropagation(); activateEntry(); });

  // click anywhere else on page
  document.addEventListener("click", (e) => {
    if (!window.__AH_STARTED && !audioUI?.contains(e.target)) activateEntry();
  });

  // sound controls
  btnSound?.addEventListener("click", async () => {
    if (bg?.paused) await bg.play();
    gsap.to(bg, { volume: 0.35, duration: 0.3 });
  });
  btnMute?.addEventListener("click", () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0, duration: 0.3, onComplete: () => bg.pause() });
  });
});
