/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version 4.6 – Stable cinematic intro
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💠 Awakening Heart : Oracle Opening initialized");

  const overlay   = document.getElementById("oracleOverlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const prompts   = [
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3")
  ];
  const enterBtn  = document.getElementById("temple-enter-button");
  const shaderW   = document.querySelector(".shader-wrapper");
  const bg        = document.getElementById("bgMusic");
  const audioUI   = document.querySelector(".audio-buttons");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");

  console.log("🎨 Elements found:", { overlay, temple, title, prompts, enterBtn });

  // 🟣 Initial cleanup — hide everything to avoid flicker
  gsap.set([title, ...prompts, enterBtn, audioUI], { autoAlpha: 0 });
  if (shaderW) gsap.set(shaderW, { autoAlpha: 0 });
  if (bg) { bg.pause(); bg.volume = 0; bg.muted = false; }

  // 🟣 Clear Webflow inline transforms from title
  if (title) {
    title.style.transform = "none";
    gsap.set(title, { clearProps: "transform", scale: 1 });
  }

  // 🕊️ Main opening timeline
  const tl = gsap.timeline({
    defaults: { ease: "sine.inOut" },
    onStart: () => console.log("🎬 Starting Oracle opening timeline"),
    onComplete: () => {
      console.log("✨ Oracle opening complete — Enter ready");
      gsap.to(enterBtn, { autoAlpha: 1, duration: 1, ease: "sine.inOut" });
      gsap.set(enterBtn, { pointerEvents: "auto", cursor: "pointer" });
      document.body.classList.add("oracle-ready");
    }
  });

  // Step 1 – fade in title, brighten, return to soft color
  tl.to(title, { autoAlpha: 1, duration: 1.2 })
    .to(title, { color: "hsl(268, 25%, 100%)", duration: 0.6 })
    .to(title, { color: "hsl(268, 50%, 60%)", duration: 1.2 }, ">0.1");

  // Step 2 – reflection prompts sequence
  prompts.forEach((p, i) => {
    const delay = i === 0 ? 0.5 : 0;
    if (p) {
      tl.to(p, { autoAlpha: 1, scale: 1, duration: 1, delay }, ">")
        .to(p, { autoAlpha: 0, scale: 0.9, duration: 1.2 }, ">2");
    }
  });

  // Step 3 – pause briefly before enabling Enter
  tl.to({}, { duration: 0.5 });

  // 🟣 Activate entry
  async function activateEntry() {
    if (window.__AH_STARTED) return;
    window.__AH_STARTED = true;
    console.log("🚪 Oracle entered");

    // Disable button & click area
    gsap.to(enterBtn, { autoAlpha: 0, duration: 0.6 });
    enterBtn.style.pointerEvents = "none";

    // Fade overlay + temple
    if (overlay) await gsap.to(overlay, { autoAlpha: 0, duration: 1.0 });
    if (temple) await gsap.to(temple, { autoAlpha: 0, duration: 1.0 });

    // Reveal shader
    if (window.AHShader?.reveal) window.AHShader.reveal();
    else if (shaderW) gsap.to(shaderW, { autoAlpha: 1, duration: 1 });

    // Start audio
    if (bg) {
      try {
        await bg.play();
        gsap.to(bg, { volume: 0.35, duration: 1.2 });
        console.log("🎵 Audio started");
      } catch (err) {
        console.warn("⚠️ Audio play blocked:", err);
      }
    }

    // Show sound buttons
    if (audioUI) gsap.to(audioUI, { autoAlpha: 1, duration: 0.6, pointerEvents: "auto" });
  }

  // 🟣 Interaction listeners
  enterBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    activateEntry();
  });

  // Click anywhere (after intro)
  document.addEventListener("click", (e) => {
    if (!window.__AH_STARTED && document.body.classList.contains("oracle-ready")) {
      activateEntry();
    }
  });

  // Sound controls
  btnSound?.addEventListener("click", async () => {
    if (bg?.paused) await bg.play();
    gsap.to(bg, { volume: 0.35, duration: 0.3 });
  });
  btnMute?.addEventListener("click", () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0, duration: 0.3, onComplete: () => bg.pause() });
  });
});
