/*--------------------------------------------------------------
  Awakening Heart : Cinematic Intro Timeline
  Plays once on page load, then reveals the Enter button.
  Safe with ah-enter.js (it sets a flag so ah-enter won't double-fade).
  Version 1.0
--------------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", () => {
  console.log("🎬 ah-intro.js loaded");

  // Element references (match your Webflow)
  const overlay  = document.getElementById("oracleOverlay");
  const temple   = document.getElementById("temple-container");
  const title    = document.getElementById("ah-title");
  const metatron = document.querySelector(".Metatron");
  const enterBtn = document.getElementById("temple-enter-button");

  // Prompts are IDs in your build
  const prompts = [
    document.getElementById("prompt1"),
    document.getElementById("prompt2"),
    document.getElementById("prompt3"),
  ];

  // Soft guards so timeline never crashes if something is missing
  const present = (el) => !!el;
  console.log("🎞 intro elements:", { overlay, temple, title, prompts, metatron, enterBtn });

  // Initial state: hide title, prompts, enter
  gsap.set([title, ...prompts.filter(Boolean), enterBtn], { autoAlpha: 0 });

  // Tell ah-enter.js that WE handle revealing the Enter button
  window.AH_INTRO_HANDLES_ENTER = true;

  // Build timeline
  const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

  // 1) Scene opens – hold for 1s
  tl.to({}, { duration: 1.0 });

  // 2) Title flash-burn (if present)
  if (present(title)) {
    tl.to(title, { autoAlpha: 1, duration: 0.2 })
      .to(title, {
        scale: 1.3,
        // HSB(268,25,100) ≈ HSL(268,100%,??). We'll approximate a bright lavender glow:
        color: "hsl(268, 60%, 90%)",
        textShadow: "0 0 24px rgba(180,150,255,0.85)",
        duration: 0.32,
        ease: "power2.out",
      })
      .to(title, {
        scale: 1,
        // HSB(268,50,60) ≈ a deeper purple:
        color: "hsl(268, 50%, 60%)",
        textShadow: "none",
        duration: 0.36,
        ease: "power2.inOut",
      })
      .to({}, { duration: 0.5 }); // pause
  }

  // Helper to animate each prompt
  const promptBeat = (el) => {
    if (!present(el)) return;
    tl.to(el, { autoAlpha: 1, duration: 0.01, onStart: () => gsap.set(el, { scale: 0.5 }) })
      .to(el, { scale: 1, duration: 0.8, ease: "power2.out" })
      .to({}, { duration: 2.0 }) // on-screen pause
      .to(el, { scale: 0.3, autoAlpha: 0, duration: 0.8, ease: "power2.in" })
      .to({}, { duration: 0.2 }); // small gap before next
  };

  // 3–5) Prompts in sequence
  prompts.forEach(promptBeat);

  // 6) Reveal Enter button (we keep click-anywhere logic inside ah-enter.js)
  if (present(enterBtn)) {
    tl.to(enterBtn, {
      autoAlpha: 1,
      duration: 1.0,
      onStart: () => {
        enterBtn.style.cursor = "pointer";
        enterBtn.style.pointerEvents = "auto";
      },
      onComplete: () => {
        window.AH_INTRO_DONE = true;
        console.log("✅ Intro complete — Enter is ready");
      },
    });
  }

  // Start intro when page fully loaded (ensures fonts/layout are ready)
  window.addEventListener("load", () => {
    console.log("▶️ Starting intro timeline");
    tl.play(0);
  });
});
