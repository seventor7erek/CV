// Interactive 3D Globe — Canvas 2D renderer
// Tech Stack skills as markers on a rotating sphere with full physics.

interface Marker {
  lat: number;
  lng: number;
  label?: string;
}

interface Connection {
  from: [number, number];
  to: [number, number];
}

// ── Tech Stack markers spread evenly across the globe ──

const TECH_MARKERS: Marker[] = [
  // Content Production (northern latitudes)
  { lat: 62, lng: -120, label: "CapCut" },
  { lat: 52, lng: -70, label: "Captions App" },
  { lat: 58, lng: 15, label: "iPhone Filming" },
  { lat: 45, lng: 55, label: "Gimbal Operation" },
  { lat: 64, lng: 100, label: "Scripting" },
  { lat: 50, lng: 150, label: "On-Camera Presenting" },

  // Platforms & Strategy (tropical band)
  { lat: 28, lng: -145, label: "TikTok" },
  { lat: 22, lng: -55, label: "Instagram Reels" },
  { lat: 15, lng: -5, label: "YouTube Shorts" },
  { lat: 32, lng: 75, label: "Algorithm Research" },
  { lat: 12, lng: 125, label: "Hashtag Strategy" },
  { lat: 35, lng: 170, label: "SEO" },

  // Music & Audio (equatorial band)
  { lat: -3, lng: -100, label: "FL Studio" },
  { lat: -14, lng: -35, label: "SM7B" },
  { lat: -8, lng: 35, label: "Audient iD4" },
  { lat: -18, lng: 105, label: "Original Soundtracks" },
  { lat: 2, lng: 165, label: "DistroKid" },

  // Development & Tools (southern latitudes)
  { lat: -33, lng: -140, label: "TypeScript" },
  { lat: -40, lng: -65, label: "Astro" },
  { lat: -28, lng: -15, label: "Tailwind CSS" },
  { lat: -45, lng: 45, label: "Rust" },
  { lat: -50, lng: 95, label: "WebAssembly" },
  { lat: -55, lng: 135, label: "Vercel" },
  { lat: -60, lng: -170, label: "Cloudflare" },
  { lat: -38, lng: 175, label: "Git" },
];

// ── Connections between related skills ──

const TECH_CONNECTIONS: Connection[] = [
  // Dev relationships
  { from: [-33, -140], to: [-40, -65] },     // TypeScript ↔ Astro
  { from: [-40, -65], to: [-28, -15] },      // Astro ↔ Tailwind CSS
  { from: [-33, -140], to: [-45, 45] },      // TypeScript ↔ Rust
  { from: [-45, 45], to: [-50, 95] },        // Rust ↔ WebAssembly
  { from: [-55, 135], to: [-40, -65] },      // Vercel ↔ Astro
  { from: [-55, 135], to: [-60, -170] },     // Vercel ↔ Cloudflare
  { from: [-38, 175], to: [-33, -140] },     // Git ↔ TypeScript

  // Music relationships
  { from: [-3, -100], to: [-18, 105] },      // FL Studio ↔ Original Soundtracks
  { from: [-3, -100], to: [2, 165] },        // FL Studio ↔ DistroKid
  { from: [-14, -35], to: [-8, 35] },        // SM7B ↔ Audient iD4

  // Platform relationships
  { from: [28, -145], to: [22, -55] },       // TikTok ↔ Instagram Reels
  { from: [28, -145], to: [15, -5] },        // TikTok ↔ YouTube Shorts
  { from: [32, 75], to: [12, 125] },         // Algorithm Research ↔ Hashtag Strategy
  { from: [35, 170], to: [32, 75] },         // SEO ↔ Algorithm Research

  // Content relationships
  { from: [62, -120], to: [52, -70] },       // CapCut ↔ Captions App
  { from: [62, -120], to: [28, -145] },      // CapCut ↔ TikTok
  { from: [64, 100], to: [50, 150] },        // Scripting ↔ On-Camera Presenting
  { from: [58, 15], to: [45, 55] },          // iPhone Filming ↔ Gimbal Operation
];

// ── Math helpers ──

function latLngToXYZ(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function rotY3(x: number, y: number, z: number, angle: number): [number, number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos + z * sin, y, -x * sin + z * cos];
}

function rotX3(x: number, y: number, z: number, angle: number): [number, number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x, y * cos - z * sin, y * sin + z * cos];
}

function projectPoint(
  x: number, y: number, z: number,
  cx: number, cy: number, fov: number
): [number, number, number] {
  const scale = fov / (fov + z);
  return [x * scale + cx, y * scale + cy, z];
}

// ── Fibonacci sphere dot generation ──

function generateDots(count: number): [number, number, number][] {
  const dots: [number, number, number][] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < count; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    dots.push([
      Math.cos(theta) * Math.sin(phi),
      Math.cos(phi),
      Math.sin(theta) * Math.sin(phi),
    ]);
  }
  return dots;
}

// ── Globe initializer ──

export function initGlobe(canvas: HTMLCanvasElement): () => void {
  const markers = TECH_MARKERS;
  const connections = TECH_CONNECTIONS;

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Physics state ──
  let rotYVal = 0.4;
  let rotXVal = 0.3;
  let velocityY = 0;        // drag momentum
  let velocityX = 0;
  let time = 0;
  let animId = 0;

  // Drag state
  let dragActive = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartRotY = 0;
  let dragStartRotX = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastPointerTime = 0;

  // ── Colors ──
  const dotColorBase = "rgba(239, 68, 68, ";     // #EF4444
  const arcColor = "rgba(239, 68, 68, 0.4)";
  const markerDotColor = "rgba(239, 68, 68, 1)";
  // Labels: bright white for visibility
  const labelColor = (a: number) => `rgba(241, 241, 243, ${a})`;
  const pulseColor = (a: number) => `rgba(239, 68, 68, ${a})`;

  const dots = generateDots(1200);
  const autoRotateSpeed = 0.002;
  const friction = 0.95;        // momentum decay
  const minVelocity = 0.0001;   // threshold to stop momentum

  function draw() {
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.42;
    const fov = 600;

    // ── Physics: momentum + auto-rotate ──
    if (!dragActive) {
      // Apply momentum from drag release
      if (Math.abs(velocityY) > minVelocity || Math.abs(velocityX) > minVelocity) {
        rotYVal += velocityY;
        rotXVal += velocityX;
        rotXVal = Math.max(-1.2, Math.min(1.2, rotXVal));
        velocityY *= friction;
        velocityX *= friction;
        if (Math.abs(velocityY) < minVelocity) velocityY = 0;
        if (Math.abs(velocityX) < minVelocity) velocityX = 0;
      } else {
        // Auto rotate when momentum has died
        rotYVal += autoRotateSpeed;
      }
    }

    time += 0.015;

    ctx.clearRect(0, 0, w, h);

    // ── Outer glow ──
    const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.6);
    glowGrad.addColorStop(0, "rgba(239, 68, 68, 0.04)");
    glowGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Globe outline ──
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const ry = rotYVal;
    const rx = rotXVal;

    // ── Draw Fibonacci dots ──
    for (let i = 0; i < dots.length; i++) {
      let [x, y, z] = dots[i];
      x *= radius;
      y *= radius;
      z *= radius;

      [x, y, z] = rotX3(x, y, z, rx);
      [x, y, z] = rotY3(x, y, z, ry);

      if (z > 0) continue; // back-face cull — only front hemisphere

      const [sx, sy] = projectPoint(x, y, z, cx, cy, fov);
      const depthAlpha = Math.max(0.08, 1 - (z + radius) / (2 * radius));
      const dotSize = 1 + depthAlpha * 1;

      ctx.beginPath();
      ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = dotColorBase + depthAlpha.toFixed(2) + ")";
      ctx.fill();
    }

    // ── Draw arc connections ──
    for (const conn of connections) {
      const [lat1, lng1] = conn.from;
      const [lat2, lng2] = conn.to;

      let [x1, y1, z1] = latLngToXYZ(lat1, lng1, radius);
      let [x2, y2, z2] = latLngToXYZ(lat2, lng2, radius);

      [x1, y1, z1] = rotX3(x1, y1, z1, rx);
      [x1, y1, z1] = rotY3(x1, y1, z1, ry);
      [x2, y2, z2] = rotX3(x2, y2, z2, rx);
      [x2, y2, z2] = rotY3(x2, y2, z2, ry);

      // Skip only if BOTH endpoints are fully behind the sphere
      if (z1 > radius * 0.2 && z2 > radius * 0.2) continue;

      const [sx1, sy1] = projectPoint(x1, y1, z1, cx, cy, fov);
      const [sx2, sy2] = projectPoint(x2, y2, z2, cx, cy, fov);

      // Arc midpoint elevated above sphere surface
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const midZ = (z1 + z2) / 2;
      const midLen = Math.sqrt(midX * midX + midY * midY + midZ * midZ) || 1;
      const arcHeight = radius * 1.3;
      const elevX = (midX / midLen) * arcHeight;
      const elevY = (midY / midLen) * arcHeight;
      const elevZ = (midZ / midLen) * arcHeight;
      const [scx, scy] = projectPoint(elevX, elevY, elevZ, cx, cy, fov);

      // Fade arcs that are partially behind
      const avgZ = (z1 + z2) / 2;
      const arcAlpha = Math.max(0.08, Math.min(0.4, 0.4 * (1 - avgZ / radius)));

      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.quadraticCurveTo(scx, scy, sx2, sy2);
      ctx.strokeStyle = `rgba(239, 68, 68, ${arcAlpha.toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Traveling dot
      const t = (Math.sin(time * 1.2 + lat1 * 0.1) + 1) / 2;
      const tx = (1 - t) * (1 - t) * sx1 + 2 * (1 - t) * t * scx + t * t * sx2;
      const ty = (1 - t) * (1 - t) * sy1 + 2 * (1 - t) * t * scy + t * t * sy2;

      ctx.beginPath();
      ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${Math.max(0.3, arcAlpha + 0.2).toFixed(2)})`;
      ctx.fill();
    }

    // ── Draw skill markers — depth-sorted so front draws last ──
    const sortedMarkers: { marker: Marker; sx: number; sy: number; z: number }[] = [];

    for (const marker of markers) {
      let [x, y, z] = latLngToXYZ(marker.lat, marker.lng, radius);
      [x, y, z] = rotX3(x, y, z, rx);
      [x, y, z] = rotY3(x, y, z, ry);

      // Show markers on the front hemisphere (z < 0 = facing camera)
      if (z > radius * 0.15) continue;

      const [sx, sy] = projectPoint(x, y, z, cx, cy, fov);
      sortedMarkers.push({ marker, sx, sy, z });
    }

    // Sort back-to-front so front labels paint over back ones
    sortedMarkers.sort((a, b) => b.z - a.z);

    for (const { marker, sx, sy, z } of sortedMarkers) {
      // Depth factor: 1.0 at front face, fades toward edges
      const depthFactor = Math.max(0.15, 1 - (z + radius) / (2 * radius));

      // Pulse ring
      const pulse = Math.sin(time * 2 + marker.lat) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 5 + pulse * 5, 0, Math.PI * 2);
      ctx.strokeStyle = pulseColor(0.15 + pulse * 0.2);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Core dot
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5 * depthFactor + 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${(depthFactor * 0.9 + 0.1).toFixed(2)})`;
      ctx.fill();

      // Skill label — bright white, visible
      if (marker.label) {
        const fontSize = Math.round(12 + depthFactor * 2); // 12-14px based on depth
        ctx.font = `600 ${fontSize}px "Satoshi", system-ui, sans-serif`;
        ctx.fillStyle = labelColor(Math.max(0.3, depthFactor * 0.95));
        ctx.fillText(marker.label, sx + 10, sy + 4);
      }
    }

    if (!prefersReduced) {
      animId = requestAnimationFrame(draw);
    }
  }

  // ── Pointer drag handlers with momentum ──

  function onPointerDown(e: PointerEvent) {
    dragActive = true;
    velocityY = 0;
    velocityX = 0;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartRotY = rotYVal;
    dragStartRotX = rotXVal;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    lastPointerTime = performance.now();
    canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragActive) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    rotYVal = dragStartRotY + dx * 0.005;
    rotXVal = Math.max(-1.2, Math.min(1.2, dragStartRotX + dy * 0.005));

    // Track velocity for momentum
    const now = performance.now();
    const dt = now - lastPointerTime;
    if (dt > 0) {
      velocityY = (e.clientX - lastPointerX) * 0.005 * (16 / dt);
      velocityX = (e.clientY - lastPointerY) * 0.005 * (16 / dt);
    }
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    lastPointerTime = now;
  }

  function onPointerUp() {
    dragActive = false;
    // Clamp initial momentum so it doesn't fly off
    velocityY = Math.max(-0.08, Math.min(0.08, velocityY));
    velocityX = Math.max(-0.04, Math.min(0.04, velocityX));
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);

  // Start
  animId = requestAnimationFrame(draw);
  if (prefersReduced) draw();

  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
  };
}
