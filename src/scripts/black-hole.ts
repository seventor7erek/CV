interface OrbitalParticle {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  trail: { x: number; y: number }[];
  opacity: number;
  size: number;
  phase: number;
}

export function init(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let centerX = 0;
  let centerY = 0;
  let mouseX = -9999;
  let mouseY = -9999;
  let animId = 0;
  let time = 0;

  const isMobile = window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 120 : 250;
  const TRAIL_LENGTH = isMobile ? 5 : 8;
  const MOUSE_RADIUS = 150;
  const MOUSE_STRENGTH = 0.0008;

  const particles: OrbitalParticle[] = [];

  function resize(): void {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement!;
    width = parent.clientWidth;
    height = parent.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    centerX = width / 2;
    centerY = height / 2;
  }

  function createParticle(): OrbitalParticle {
    const minRadius = 20;
    const maxRadius = Math.min(width, height) * 0.45;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);

    // Kepler: closer orbits are faster
    const speed = (0.002 + Math.random() * 0.004) * (1 + (maxRadius - radius) / maxRadius * 2);

    return {
      angle: Math.random() * Math.PI * 2,
      radius,
      baseRadius: radius,
      speed: Math.random() > 0.5 ? speed : -speed,
      trail: [],
      opacity: 0.3 + Math.random() * 0.7,
      size: 0.5 + (1 - radius / maxRadius) * 1.5,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function initParticles(): void {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  // --- Static fallback for reduced motion ---
  if (reducedMotion) {
    resize();
    // Draw a static radial glow
    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.35);
    grad.addColorStop(0, "rgba(59, 130, 246, 0.08)");
    grad.addColorStop(0.5, "rgba(59, 130, 246, 0.03)");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    return () => {};
  }

  // --- Animation ---
  resize();
  initParticles();

  function drawCentralGlow(): void {
    // Breathing glow — slow sine wave
    const breathe = 0.04 + Math.sin(time * 0.008) * 0.02;
    const glowRadius = Math.min(width, height) * 0.25;

    const grad = ctx!.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
    grad.addColorStop(0, `rgba(59, 130, 246, ${breathe})`);
    grad.addColorStop(0.3, `rgba(59, 130, 246, ${breathe * 0.5})`);
    grad.addColorStop(0.7, `rgba(59, 130, 246, ${breathe * 0.15})`);
    grad.addColorStop(1, "transparent");

    ctx!.fillStyle = grad;
    ctx!.beginPath();
    ctx!.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    ctx!.fill();

    // Inner dark void
    const voidGrad = ctx!.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15);
    voidGrad.addColorStop(0, "rgba(10, 10, 15, 0.9)");
    voidGrad.addColorStop(1, "transparent");
    ctx!.fillStyle = voidGrad;
    ctx!.beginPath();
    ctx!.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx!.fill();
  }

  function animate(): void {
    time++;

    // Trail persistence — semi-transparent clear
    ctx!.fillStyle = "rgba(10, 10, 15, 0.12)";
    ctx!.fillRect(0, 0, width, height);

    drawCentralGlow();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Orbital wobble for natural feel
      const wobble = Math.sin(time * 0.01 + p.phase) * 8;
      const currentRadius = p.baseRadius + wobble;
      p.radius += (currentRadius - p.radius) * 0.05;

      // Update angle
      p.angle += p.speed;

      // Compute position
      let x = centerX + Math.cos(p.angle) * p.radius;
      let y = centerY + Math.sin(p.angle) * p.radius * 0.6; // elliptical

      // Mouse attraction
      const dx = mouseX - x;
      const dy = mouseY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
        x += dx * force * MOUSE_STRENGTH * 60;
        y += dy * force * MOUSE_STRENGTH * 60;
      }

      // Push trail
      p.trail.push({ x, y });
      if (p.trail.length > TRAIL_LENGTH) {
        p.trail.shift();
      }

      // Draw trail
      if (p.trail.length > 1) {
        for (let t = 0; t < p.trail.length - 1; t++) {
          const alpha = (t / p.trail.length) * p.opacity * 0.3;
          ctx!.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
          ctx!.lineWidth = p.size * 0.5;
          ctx!.beginPath();
          ctx!.moveTo(p.trail[t].x, p.trail[t].y);
          ctx!.lineTo(p.trail[t + 1].x, p.trail[t + 1].y);
          ctx!.stroke();
        }
      }

      // Draw particle
      ctx!.fillStyle = `rgba(59, 130, 246, ${p.opacity * 0.6})`;
      ctx!.beginPath();
      ctx!.arc(x, y, p.size, 0, Math.PI * 2);
      ctx!.fill();

      // Brighter core for close particles
      if (p.baseRadius < 80) {
        ctx!.fillStyle = `rgba(147, 197, 253, ${p.opacity * 0.3})`;
        ctx!.beginPath();
        ctx!.arc(x, y, p.size * 0.5, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    animId = requestAnimationFrame(animate);
  }

  // Mouse handlers
  function onMouseMove(e: MouseEvent): void {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }

  function onMouseLeave(): void {
    mouseX = -9999;
    mouseY = -9999;
  }

  // Touch handlers
  function onTouchMove(e: TouchEvent): void {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;
  }

  function onTouchEnd(): void {
    mouseX = -9999;
    mouseY = -9999;
  }

  // Resize
  window.addEventListener("resize", () => {
    resize();
    initParticles();
  });

  canvas.addEventListener("mousemove", onMouseMove, { passive: true });
  canvas.addEventListener("mouseleave", onMouseLeave);
  canvas.addEventListener("touchmove", onTouchMove, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd);

  animId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("mouseleave", onMouseLeave);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("touchend", onTouchEnd);
  };
}
