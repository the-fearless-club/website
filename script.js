console.log("SCRIPT LOADED");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM READY");

  // Chaos toggle
  const chaosBtn = document.getElementById("chaosBtn");
  chaosBtn.addEventListener("click", () => {
    document.body.classList.toggle("chaos");
  });

  // Github links per kaart
  const repoMap = {
    tree: "https://github.com/fearless-tree",
    cactus: "https://github.com/fearless-cactus",
    tomato: "https://github.com/lekrkoekje",
    goose: "https://github.com/Mehcann",
  };

  document.querySelectorAll(".card").forEach((card) => {
    const key = Object.keys(repoMap).find((k) => card.classList.contains(k));
    if (!key) return;

    const link = document.createElement("a");
    link.className = "github";
    link.href = repoMap[key];
    link.target = "_blank";
    link.rel = "noopener";
    link.innerHTML = "";

    link.addEventListener("click", (e) => e.stopPropagation());
    card.appendChild(link);
  });

  // Kaart click event
  const cards = document.querySelectorAll(".card");
  console.log("CARDS FOUND:", cards.length);

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      spawnClones(card);
    });
  });
});

// EXTREME clone spawner
function spawnClones(card) {
  const bg = getComputedStyle(card).backgroundImage;
  const SIZE = 120;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clones = [];

  function makeClone() {
    const el = document.createElement("div");
    el.className = "clone";
    el.style.backgroundImage = bg;

    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;

    const clone = {
      el,
      x: Math.random() * (vw - SIZE),
      y: Math.random() * (vh - SIZE),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    };

    el.style.transform = `translate3d(${clone.x}px, ${clone.y}px, 0)`;
    document.body.appendChild(el);
    clones.push(clone);
  }

  function animate() {
    // 🔥 EXTREME SPAWN: 2000 clones per frame
    for (let i = 0; i < 2000; i++) {
      makeClone();
    }

    clones.forEach((c) => {
      c.x += c.vx;
      c.y += c.vy;

      // Bounce aan schermranden
      if (c.x <= 0 || c.x >= vw - SIZE) c.vx *= -1;
      if (c.y <= 0 || c.y >= vh - SIZE) c.vy *= -1;

      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
