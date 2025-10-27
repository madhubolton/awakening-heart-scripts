/*--------------------------------------------------------------
 🌺 Awakening Heart : Oracle Opening Sequence
 Version 5.6.8 | 2025-10-27
 - Fixes initial flicker
 - Adds Welcome prompt
 - Cross-fade zoom prompts with pauses
 - Starts shader before temple dissolve
 - Scales Metatron + audio fade-in
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("%c🌸 Awakening Heart : Oracle Opening initialized (v5.6.8)",
    "color:#b48ef5;font-weight:bold;");

  // --- Core DOM Elements ---
  const overlay  = document.getElementById("oracleOverlay");
  const temple   = document.getElementById("temple-container");
  const title    = document.getElementById("ah-title");
  const shaderW  = document.querySelector(".shader-wrapper");
  const metatron = document.getElementById("metatron");
  const audioUI  = document.querySelector(".audio-buttons");
  const bg       = document.getElementById("bgMusic");

  const prompts = [
    document.getElementById("prompt0"), // Welcome
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3"),
    document.getElementById("prompt4")  // You may enter
  ];

  // --- Safety + flicker prevention ---
  gsap.set([title, ...prompts, shaderW, metatron], {
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

  // 1️⃣ Title fade & glow
  tl.set(title, { visibility: "visible" })
    .to(title, { autoAlpha: 1, duration: 1.2, ease: "sine.out" })
    .to(title, {
      color: "hsl(268,60%,90%)",
      textShadow: "0 0 24px rgba(180,120,255,0.6)",
      duration: 1.2
    })
    .to(title, {
      color: "hsl(268,45%,70%)",
      textShadow: "0 0 8px rgba(180,120,255,0.3)",
      duration: 1.0
    })
    .addPause("+=0.5");

  // 2️⃣ Prompt sequence – cross-fade zooms
  prompts.forEach((p, i) => {
    if (!p) return;

    const pause = i === 0 ? 0 : 5; // prompt0 no delay, others pause 5s
    const zoomIn  = { scale: 0.85, autoAlpha: 0, visibility: "visible" };
    const zoomMid = { scale: 1.0, autoAlpha: 1, duration: 1.4, ease: "power2.out" };
    const zoomOut = { scale: 1.25, autoAlpha: 0, duration: 1.4, ease: "power2.in" };

    tl.fromTo(p, zoomIn, zoomMid);

    if (i < prompts.length - 1) {
      tl.addPause(`+=${pause}`);
      tl.to(p, zoomOut);
    }
  });

  // 3️⃣ Final prompt waits for click
  const finalPrompt = prompts[prompts.length - 1];
  if (finalPrompt) {
    finalPrompt.style.cursor = "pointer";
    finalPrompt.addEventListener("click", () => {
      console.log("🌌 Oracle entry clicked — dissolving temple…");

      const enterTl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

      enterTl
        // Shader fade-in starts slightly before temple fade
        .to(shaderW, { autoAlpha: 1, duration: 1.2 }, 0)
        .to(temple,  { autoAlpha: 0, duration: 1.6 }, "-=0.6")
        .fromTo(metatron,
          { scale: 0.66, autoAlpha: 0, visibility: "visible" },
          { scale: 1, autoAlpha: 1, duration: 2.5, ease: "power2.out" },
          "-=1.0"
        )
        .add(() => {
          if (bg) {
            bg.currentTime = 0;
            bg.play().then(() =>
              gsap.to(bg, { volume: 0.35, duration: 1.5 })
            ).catch(e => console.warn("Audio play blocked:", e));
          }
        });
    });
  }
});
