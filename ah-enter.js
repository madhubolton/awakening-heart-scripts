/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version 5.1 – Clean optimized cinematic version
  Author: Madhu Bolton
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("💠 Awakening Heart : Oracle Opening initialized (v5.0)");

  // 🔹 Core DOM elements
  const overlay    = document.getElementById("oracleOverlay");
  const temple     = document.getElementById("temple-container");
  const titleWrap  = document.querySelector(".title-wrapper");
  const title      = document.getElementById("ah-title");
  const prompts    = [
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3")
  ];
  const enterBtn   = document.getElementById("temple-enter-button");
  const shaderW    = document.querySelector(".shader-wrapper");
  const bg         = document.getElementById("bgMusic");
  const audioUI    = document.querySelector(".audio-buttons");
  const btnSound   = document.getElementById("btnSound");
  const btnMute    = document.getElementById("btnMute");

  // 🔹 Flags
  let oracleReady = false;
  let oracleEntered = false;

  // 🟣 Reset and hide everything to prevent flicker
  gsap.set([title, ...prompts, enterBtn, audioUI, shaderW], {
    autoAlpha: 0,
    pointerEvents: "none",
  });
  if (bg) { bg.pause(); bg.volume = 0; bg.muted = false; }

  // 🧹 Clear any Webflow transforms
  [title, titleWrap].forEach(el => {
    if (el) {
      el.style.transform = "none";
      gsap.set(el, { clearProps: "transform", scale: 1 });
    }
  });

  // 🎬 Main cinematic timeline
const tl = gsap.timeline({
  defaults: { ease: "sine.inOut" },
  onStart: () => console.log("🎞️ Oracle opening sequence started"),
});

// Step 1 — Title fade-in and gentle glow
tl.to(title, { autoAlpha: 1, duration: 1.5 })
  .to(title, { color: "hsl(268, 30%, 85%)", duration: 0.8 })
  .to(title, { color: "hsl(268, 50%, 60%)", duration: 1.5 }, ">0.1");

// Step 2 — Reflection prompts (sequential)
prompts.forEach((p, i) => {
  if (!p) return;
  const delay = i === 0 ? 0.5 : 0;
  tl.to(p, { autoAlpha: 1, duration: 1, delay }, ">")
    .to(p, { autoAlpha: 0, duration: 1.2 }, ">2");
});

// Step 3 — Short pause
tl.to({}, { duration: 0.6 });

// Step 4 — Enter button reveal (AFTER everything)
tl.to(enterBtn, { 
  autoAlpha: 1, 
  duration: 1, 
  ease: "sine.inOut", 
  onStart: () => {
    gsap.set(enterBtn, { pointerEvents: "auto", cursor: "pointer" });
    console.log("✨ Oracle intro complete — Enter ready");
    oracleReady = true;
  }
});

  // 🚪 Entry activation (triggered by click)
  async function activateEntry() {
    if (oracleEntered || !oracleReady) return;
    oracleEntered = true;
    console.log("🚪 Oracle entered");

    // Hide Enter button immediately
    gsap.to(enterBtn, { autoAlpha: 0, duration: 0.6, ease: "sine.inOut" });
    gsap.set(enterBtn, { pointerEvents: "none" });

    // Fade temple and overlay
    await gsap.to([overlay, temple], { autoAlpha: 0, duration: 1.2, ease: "sine.inOut" });

    // Reveal shader
    if (window.AHShader?.reveal) window.AHShader.reveal();
    else if (shaderW) gsap.to(shaderW, { autoAlpha: 1, duration: 1.2 });

    // Start audio
    if (bg) {
      try {
        await bg.play();
        gsap.to(bg, { volume: 0.35, duration: 1.2, ease: "sine.inOut" });
        console.log("🎵 Audio started");
      } catch (err) {
        console.warn("⚠️ Audio blocked:", err);
      }
    }

    // Show sound controls
    if (audioUI) {
      gsap.to(audioUI, { autoAlpha: 1, duration: 0.6 });
      gsap.set(audioUI, { pointerEvents: "auto" });
    }
  }

  // 🖱️ Click anywhere (after ready)
  document.addEventListener("click", (e) => {
    if (oracleReady && !oracleEntered && !audioUI?.contains(e.target)) {
      activateEntry();
    }
  });

  // 🖱️ Click Enter button
  enterBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    activateEntry();
  });

  // 🎧 Sound controls
  btnSound?.addEventListener("click", async () => {
    if (bg?.paused) await bg.play();
    gsap.to(bg, { volume: 0.35, duration: 0.3 });
  });
  btnMute?.addEventListener("click", () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0, duration: 0.3, onComplete: () => bg.pause() });
  });
});
