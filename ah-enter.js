/*--------------------------------------------------------------
  Awakening Heart : Oracle Opening Sequence
  Version 5.6.4 | 2025-10-27
  Adds Welcome prompt and smooth zoom animation
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("🌸 Awakening Heart : Oracle Opening initialized (v5.6.4)");

  // --- Core DOM elements ---
  const overlay   = document.getElementById("oracleOverlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const shaderW   = document.querySelector(".shader-wrapper");
  const audioUI   = document.querySelector(".audio-buttons");
  const bg        = document.getElementById("bgMusic");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");

  const prompts = [
    document.getElementById("prompt0"), // 👋 new “Welcome”
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt4")  // “You may enter. Click when ready.”
  ];

  // --- Safety check ---
  console.log("🧩 Elements found:", { overlay, temple, title, prompts, shaderW });

  // --- Reset states to prevent flicker ---
  gsap.set([title, ...prompts, audioUI, shaderW], { autoAlpha: 0, scale: 0.8, pointerEvents: "none" });
  if (bg) { bg.pause(); bg.volume = 0; bg.muted = false; }

  // --- Main cinematic timeline ---
  const tl = gsap.timeline({
    defaults: { ease: "sine.inOut" },
    onStart: () => console.log("🎞️ Oracle opening sequence started"),
    onComplete: () => console.log("✨ Oracle intro complete – ready for entry")
  });

  // 1️⃣ Title fade and glow
  tl.to(title, { autoAlpha: 1, duration: 1.2 })
    .to(title, { color: "hsl(268, 30%, 85%)", duration: 0.8 })
    .to(title, { color: "hsl(268, 50%, 60%)", duration: 1.0 }, ">-0.4")
    .addPause("+=" + 0.5);

  // 2️⃣ Prompt sequence – zoom from center and fade out
  prompts.forEach((p, i) => {
    if (!p) return;
    tl.to(p, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.8,
      ease: "power2.out"
    })
    .addPause("+=" + 2.0) // display time
    .to(p, {
      autoAlpha: 0,
      scale: 0.8,
      duration: 0.8,
      ease: "power2.in"
    });
  });

  // 3️⃣ Reveal click layer & enable scene
  tl.call(() => {
    console.log("🌺 Invitation prompt visible – awaiting click");
    document.body.style.cursor = "pointer";
    if (audioUI) gsap.to(audioUI, { autoAlpha: 1, duration: 1 });
  });

  // --- Click triggers the main scene ---
  document.addEventListener("click", (e) => {
    if (!window.__SCENE_STARTED && !e.target.closest(".audio-buttons")) {
      window.__SCENE_STARTED = true;
      console.log("🕊️ Oracle entered");
      if (window.triggerScene) window.triggerScene(); // link to ah-scenes
    }
  });

  // --- Sound buttons ---
  btnSound?.addEventListener("click", async () => {
    if (bg?.paused) await bg.play();
    gsap.to(bg, { volume: 0.35, duration: 0.3 });
  });

  btnMute?.addEventListener("click", () => {
    if (!bg) return;
    gsap.to(bg, { volume: 0, duration: 0.3, onComplete: () => bg.pause() });
  });
});
