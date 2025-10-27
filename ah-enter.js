/*--------------------------------------------------------------
 🌺 Awakening Heart : Oracle Opening Sequence
 Version 5.6.7 | 2025-10-27
 Fixes flicker • Adds welcome prompt • Crossfade zoom • Shader + Metatron timing
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("%c🌸 Awakening Heart : Oracle Opening initialized (v5.6.7)",
    "color:#b48ef5;font-weight:bold;");

  // --- Core DOM Elements ---
  const overlay   = document.getElementById("oracleOverlay");
  const temple    = document.getElementById("temple-container");
  const title     = document.getElementById("ah-title");
  const shaderW   = document.querySelector(".shader-wrapper");
  const metatron  = document.getElementById("metatron");
  const audioUI   = document.querySelector(".audio-buttons");
  const bg        = document.getElementById("bgMusic");
  const btnSound  = document.getElementById("btnSound");
  const btnMute   = document.getElementById("btnMute");

  const prompts = [
    document.getElementById("prompt0"), // Welcome
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3"),
    document.getElementById("prompt4")  // You may enter
  ];

  // --- Prevent flicker ---
  gsap.set([title, ...prompts, shaderW, temple, metatron], {
    autoAlpha: 0,
    visibility: "hidden"
  });
  if (bg) { bg.pause(); bg.volume = 0; bg.muted = false; }

  // --- Main timeline ---
  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    onStart:  () => console.log("📜 Oracle opening sequence started"),
    onComplete: () => console.log("✨ Oracle intro complete – ready for entry")
  });

  // 1️⃣ Title fade + gentle glow
  tl.set(title, { visibility: "visible" })
    .to(title, { autoAlpha: 1, duration: 1.2, ease: "sine.out" })
    .to(title, {
      color: "hsl(268,60%,90%)",
      textShadow: "0 0 24px rgba(180,120,255,0.6)",
      duration: 1.4,
      ease: "sine.inOut"
    })
    .to(title, {
      color: "hsl(268,40%,70%)",
      textShadow: "0 0 8px rgba(180,120,255,0.3)",
      duration: 1.2,
      ease: "sine.inOut"
    })
    .addPause("+=0.4");

  // 2️⃣ Prompt sequence – crossfade zooms
  prompts.forEach((p, i) => {
    if (!p) return;
    const delay = i === 0 ? 0 : 5; // prompt0 no pause; others 5s

    tl.set(p, { visibility: "visible" });

    // Zoom-in
    tl.fromTo(p,
      { scale: 0.8, autoAlpha: 0 },
      { scale: 1.0, autoAlpha: 1, duration: 1.6, ease: "power2.out" }
    );

    // Pause (except for last prompt)
    if (i < prompts.length - 1) tl.addPause(`+=${delay}`);

    // Zoom-out fade (except last prompt)
    if (i < prompts.length - 1) {
      tl.to(p, { scale: 1.2, autoAlpha: 0, duration: 1.6, ease: "power2.in" });
    }
  });

  // 3️⃣ Final prompt stays visible until click
  const finalPrompt = prompts[prompts.length - 1];
  finalPrompt.style.cursor = "pointer";
  finalPrompt.addEventListener("click", () => {
    console.log("🌌 Enter clicked – launching temple dissolve");

    const enterTl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

    enterTl
      // Shader starts slightly before temple dissolve
      .to(shaderW, { autoAlpha: 1, duration: 1.2, ease: "power1.inOut" })
      .to(temple,  { autoAlpha: 0, duration: 1.6, ease: "power1.inOut" }, "-=0.6")
      .fromTo(metatron,
        { scale: 0.66, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 2.5, ease: "power2.out" },
        "-=1.0"
      )
      .add(() => {
        if (bg) {
          bg.currentTime = 0;
          bg.play();
          gsap.to(bg, { volume: 0.35, duration: 1.5 });
        }
      });
  });
});
