// ===== screen navigation =====
function goTo(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + name);
  if (target) target.classList.add('active');

  if (name === 'lock') resetKeypad();
}

document.querySelectorAll('[data-goto]').forEach(el => {
  el.addEventListener('click', (e) => {
    spawnRipple(el, e);
    const dest = el.dataset.goto;

    // little celebration when they finally say yes
    if (dest === 'letter' && el.classList.contains('btn-primary')) {
      burstConfetti();
    }

    setTimeout(() => goTo(dest), dest === 'letter' ? 180 : 0);
  });
});

// ===== ripple effect on any tappable control =====
function spawnRipple(el, evt) {
  const rect = el.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height) * 1.2;
  const x = (evt.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
  const y = (evt.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
}

// ===== fake password keypad: any 4 taps "unlocks" it =====
const heartSlots = document.querySelectorAll('#heartsRow .heart-slot');
const burstLayer = document.getElementById('burstLayer');
let tapCount = 0;

function resetKeypad() {
  tapCount = 0;
  heartSlots.forEach(h => {
    h.textContent = '🤍';
    h.classList.remove('filled');
  });
}

function spawnHeartBurst() {
  if (!burstLayer) return;
  const emojis = ['💕', '💛', '✨', '🤍'];
  for (let i = 0; i < 10; i++) {
    const h = document.createElement('span');
    h.className = 'burst-heart';
    h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
    const dist = 90 + Math.random() * 70;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist - 40;
    h.style.setProperty('--fly-to', `translate(${x}px, ${y}px)`);
    h.style.left = '50%';
    h.style.top = '40%';
    burstLayer.appendChild(h);
    setTimeout(() => h.remove(), 950);
  }
}

document.querySelectorAll('#keypad .key').forEach(key => {
  key.addEventListener('click', (e) => {
    spawnRipple(key, e);
    const k = key.dataset.key;

    if (k === 'back') {
      if (tapCount > 0) {
        tapCount--;
        heartSlots[tapCount].textContent = '🤍';
        heartSlots[tapCount].classList.remove('filled');
      }
      return;
    }

    if (k === 'enter') {
      if (tapCount >= 1) {
        spawnHeartBurst();
        setTimeout(() => goTo('ready'), 300);
      }
      return;
    }

    if (tapCount < 4) {
      heartSlots[tapCount].textContent = '❤️';
      heartSlots[tapCount].classList.add('filled');
      tapCount++;
    }

    if (tapCount === 4) {
      spawnHeartBurst();
      setTimeout(() => goTo('ready'), 420);
    }
  });
});

// ===== confetti burst (canvas-based, lightweight) =====
const canvas = document.getElementById('confettiCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let confettiPieces = [];
let confettiRAF = null;

function resizeCanvas() {
  if (!canvas) return;
  const stack = document.getElementById('screenStack');
  const rect = stack.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const confettiColors = ['#A9D6E8', '#F4B9C4', '#FBF6EC', '#5B8FA8', '#E08A9B'];

function burstConfetti() {
  if (!ctx) return;
  resizeCanvas();
  const count = 60;
  const cx = canvas.width / 2;
  for (let i = 0; i < count; i++) {
    confettiPieces.push({
      x: cx + (Math.random() - 0.5) * 60,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 9 - 4,
      size: Math.random() * 6 + 4,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
      life: 0,
    });
  }
  if (!confettiRAF) animateConfetti();
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confettiPieces.forEach(p => {
    p.vy += 0.22; // gravity
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotSpeed;
    p.life++;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, 1 - p.life / 90);
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }
    ctx.restore();
  });

  confettiPieces = confettiPieces.filter(p => p.life < 90 && p.y < canvas.height + 40);

  if (confettiPieces.length > 0) {
    confettiRAF = requestAnimationFrame(animateConfetti);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiRAF = null;
  }
}
