console.log('SCRIPT LOADED');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM READY');

  // chaos toggle
  const chaosBtn = document.getElementById('chaosBtn');
  chaosBtn.addEventListener('click', () => {
    document.body.classList.toggle('chaos');
  });

  // github
  const repoMap = {
    tree: 'https://github.com/fearless-tree',
    cactus: 'https://github.com/fearless-cactus',
    tomato: 'https://github.com/lekrkoekje',
    goose: 'https://github.com/Mehcann',
  };

  // voeg github links toe aan kaarten
  document.querySelectorAll('.card').forEach((card) => {
    const key = Object.keys(repoMap).find((k) => card.classList.contains(k));
    if (!key) return;

    const link = document.createElement('a');
    link.className = 'github';
    link.href = repoMap[key];
    link.target = '_blank';
    link.rel = 'noopener';
    link.innerHTML = '';

    link.addEventListener('click', (e) => e.stopPropagation());
    card.appendChild(link);
  });

  // kaart klik
  const cards = document.querySelectorAll('.card');
  console.log('CARDS FOUND:', cards.length);

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      console.log('CARD CLICKED');
      spawnClones(card);
    });
  });
});

// clone spawner
function spawnClones(card) {
  console.log('SPAWN CLONES FIRED');

  const bg = getComputedStyle(card).backgroundImage;
  console.log('BG IMAGE:', bg);

  const COUNT = 100;
  const SIZE = 120;
  const BOUNCE_TIME = 3000;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const clones = [];
  const start = performance.now();

  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'clone';
    el.style.backgroundImage = bg;

    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 2;

    const clone = {
      el,
      x: Math.random() * (vw - SIZE),
      y: Math.random() * (vh - SIZE),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      falling: false,
    };

    el.style.transform = `translate3d(${clone.x}px, ${clone.y}px, 0)`;
    document.body.appendChild(el);
    clones.push(clone);
  }

  function animate(now) {
    clones.forEach((c) => {
      if (!c.falling && now - start > BOUNCE_TIME) {
        c.falling = true;
        c.vx *= 0.2; // behoud richting
        c.vy = 2; // begin val
      }

      if (c.falling) {
        c.vy += 0.4; // gravity
      }

      c.x += c.vx;
      c.y += c.vy;

      // bounce alleen zolang ze NIET vallen
      if (!c.falling) {
        if (c.x <= 0 || c.x >= vw - SIZE) c.vx *= -1;
        if (c.y <= 0 || c.y >= vh - SIZE) c.vy *= -1;
      }

      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
    });

    // cleanup pas als ze onder beeld zijn
    if (clones.every((c) => c.y > vh + SIZE)) {
      clones.forEach((c) => c.el.remove());
      return;
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
