// Ilustraciones 3D del simulador (cerámica blanca + cromo + verde de marca), modeladas por código.
// Se renderizan con scripts/3d/render.mjs y se guardan en public/3d/*.webp.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const q = new URLSearchParams(location.search);
const NAME = q.get('scene');
const OUT = { hero: [1200, 1080], percent: [900, 900] }[NAME] ?? [960, 960];
const SS = 1.6; // supersampling
const W = Math.round(OUT[0] * SS);
const H = Math.round(OUT[1] * SS);

const C = {
  b100: '#d7eee7', b200: '#b0dccf', b300: '#7fc4b1', b400: '#45a68f', b500: '#138a73', b600: '#0f7563', b700: '#0d6153', b800: '#0b4d43',
};

const M = {
  chrome: new THREE.MeshPhysicalMaterial({ color: 0xe9edef, metalness: 1, roughness: 0.13 }),
  satin: new THREE.MeshPhysicalMaterial({ color: 0xdfe5e6, metalness: 1, roughness: 0.3 }),
  ceramic: new THREE.MeshPhysicalMaterial({ color: 0xf9faf8, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15 }),
  pedestal: new THREE.MeshPhysicalMaterial({ color: 0xf1f3f0, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
  green: new THREE.MeshPhysicalMaterial({ color: C.b500, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.18 }),
  greenDeep: new THREE.MeshPhysicalMaterial({ color: C.b700, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }),
  mint: new THREE.MeshPhysicalMaterial({ color: C.b100, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.12 }),
  glow: new THREE.MeshPhysicalMaterial({ color: C.b200, emissive: C.b400, emissiveIntensity: 1.3, roughness: 0.12, clearcoat: 1 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x123b33, metalness: 0.1, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 }),
  rubber: new THREE.MeshPhysicalMaterial({ color: 0x29312f, roughness: 0.62 }),
  screenText: new THREE.MeshBasicMaterial({ color: new THREE.Color(C.b200).multiplyScalar(1.15) }),
};

const mesh = (geo, mat) => {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};
const rbox = (w, h, d, r = 0.08, seg = 6) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));

let FONT;

/* ---------- reusable parts ---------- */
function coinGeo(r = 0.6, t = 0.16) {
  const V = THREE.Vector2;
  const pts = [new V(0, -t / 2 + 0.014), new V(r * 0.8, -t / 2 + 0.014), new V(r * 0.84, -t / 2 + 0.002)];
  const rr = t / 2;
  for (let i = 0; i <= 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI;
    pts.push(new V(r - rr + Math.cos(a) * rr, Math.sin(a) * rr));
  }
  pts.push(new V(r * 0.84, t / 2 - 0.002), new V(r * 0.8, t / 2 - 0.014), new V(0, t / 2 - 0.014));
  return new THREE.LatheGeometry(pts, 96);
}

function coin({ r = 0.6, t = 0.16, mat = M.chrome, symbol = '$', symMat } = {}) {
  const g = new THREE.Group();
  g.add(mesh(coinGeo(r, t), mat));
  if (symbol && FONT) {
    const tg = new TextGeometry(symbol, { font: FONT, size: r * 0.95, depth: 0.03, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 3 });
    tg.computeBoundingBox();
    const bb = tg.boundingBox;
    tg.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, 0);
    const s = mesh(tg, symMat ?? mat);
    s.rotation.x = -Math.PI / 2;
    s.position.y = t / 2 - 0.016;
    g.add(s);
  }
  return g;
}

function coinStack(n, opts = {}) {
  const g = new THREE.Group();
  const t = opts.t ?? 0.16;
  for (let i = 0; i < n; i++) {
    const c = coin({ ...opts, symbol: i === n - 1 ? opts.symbol ?? '$' : null });
    c.position.set(Math.sin(i * 1.7) * 0.025, t / 2 + i * (t + 0.004), Math.cos(i * 2.3) * 0.025);
    c.rotation.y = i * 0.7;
    g.add(c);
  }
  return g;
}

function pedestal(r = 2, h = 0.24, mat = M.pedestal) {
  const V = THREE.Vector2;
  const e = 0.08;
  const pts = [new V(0, 0), new V(r - e, 0)];
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2);
    pts.push(new V(r - e + Math.cos(a) * e, e + Math.sin(a) * e));
  }
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push(new V(r - e + Math.cos(a) * e, h - e + Math.sin(a) * e));
  }
  pts.push(new V(0, h));
  return mesh(new THREE.LatheGeometry(pts, 128), mat);
}

function textMesh(str, size, depth, mat, bevel = true) {
  const tg = new TextGeometry(str, { font: FONT, size, depth, curveSegments: 12, bevelEnabled: bevel, bevelThickness: depth * 0.18, bevelSize: size * 0.025, bevelSegments: 5 });
  tg.computeBoundingBox();
  const bb = tg.boundingBox;
  tg.translate(-(bb.max.x + bb.min.x) / 2, -bb.min.y, -(bb.max.z + bb.min.z) / 2);
  return mesh(tg, mat);
}

/* ---------- scenes ---------- */
const SCENES = {
  hero() {
    const g = new THREE.Group();
    const calc = new THREE.Group();
    calc.add(mesh(rbox(2.3, 3.2, 0.46, 0.26, 8), M.ceramic));
    const screen = mesh(rbox(1.92, 0.86, 0.1, 0.1), M.glass);
    screen.position.set(0, 0.97, 0.21);
    calc.add(screen);
    const txt = textMesh('1.245.000', 0.2, 0.01, M.screenText, false);
    txt.position.set(0.14, 0.87, 0.265);
    calc.add(txt);
    const dollar = textMesh('$', 0.18, 0.01, M.screenText, false);
    dollar.position.set(-0.68, 0.87, 0.265);
    calc.add(dollar);
    const k = 0.38;
    const gap = 0.1;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const op = c === 3;
        const eq = op && r === 3;
        const key = mesh(rbox(k, k, 0.16, 0.1), eq ? M.green : op ? M.greenDeep : M.mint);
        key.position.set(-0.72 + c * (k + gap), 0.18 - r * (k + gap), 0.23);
        calc.add(key);
      }
    }
    calc.rotation.set(-0.2, -0.36, 0.02);
    calc.position.set(-0.35, 1.75, 0);
    g.add(calc);

    const c1 = coin({ r: 0.62, symMat: M.chrome });
    c1.rotation.set(1.15, 0.2, -0.35);
    c1.position.set(1.45, 2.65, 0.55);
    g.add(c1);
    const c2 = coin({ r: 0.5, mat: M.green, symMat: M.green });
    c2.rotation.set(0.85, -0.3, 0.5);
    c2.position.set(1.75, 1.35, 0.95);
    g.add(c2);
    const stack = coinStack(4, { r: 0.6 });
    stack.position.set(1.25, 0, 0.9);
    g.add(stack);
    return { group: g, az: 22, el: 14, margin: 1.12 };
  },

  vivienda() {
    const g = new THREE.Group();
    g.add(pedestal(2.05));
    const base = 0.24;
    const house = new THREE.Group();
    const body = mesh(rbox(2.1, 1.5, 1.8, 0.1), M.ceramic);
    body.position.y = 0.75;
    house.add(body);
    const s = new THREE.Shape();
    s.moveTo(-1.32, 0);
    s.lineTo(1.32, 0);
    s.lineTo(0, 1.0);
    s.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(s, { depth: 2.0, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 6, curveSegments: 8 });
    roofGeo.translate(0, 0, -1.0);
    const roof = mesh(roofGeo, M.green);
    roof.position.y = 1.5;
    house.add(roof);
    const door = mesh(rbox(0.5, 0.88, 0.14, 0.06), M.greenDeep);
    door.position.set(0.45, 0.44, 0.9);
    house.add(door);
    const knob = mesh(new THREE.SphereGeometry(0.045, 24, 16), M.chrome);
    knob.position.set(0.6, 0.44, 0.98);
    house.add(knob);
    const win = mesh(rbox(0.52, 0.46, 0.1, 0.06), M.glow);
    win.position.set(-0.48, 0.86, 0.9);
    house.add(win);
    const round = mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 48), M.glow);
    round.rotation.x = Math.PI / 2;
    round.position.set(0, 1.86, 1.06);
    house.add(round);
    const chim = mesh(rbox(0.3, 0.6, 0.3, 0.05), M.ceramic);
    chim.position.set(-0.68, 2.08, -0.35);
    house.add(chim);
    house.position.y = base;
    house.rotation.y = -0.1;
    g.add(house);
    const st = coinStack(3, { r: 0.36, t: 0.11 });
    st.position.set(1.35, base, 1.05);
    g.add(st);
    return { group: g, az: 30, el: 18, margin: 1.08 };
  },

  vehiculo() {
    const g = new THREE.Group();
    g.add(pedestal(2.35));
    const base = 0.24;
    const car = new THREE.Group();
    const s = new THREE.Shape();
    s.moveTo(-2.0, 0.42);
    s.lineTo(-1.82, 0.42);
    s.absarc(-1.25, 0.42, 0.57, Math.PI, 0, true);
    s.lineTo(0.68, 0.42);
    s.absarc(1.25, 0.42, 0.57, Math.PI, 0, true);
    s.lineTo(2.0, 0.42);
    s.quadraticCurveTo(2.18, 0.42, 2.18, 0.62);
    s.lineTo(2.18, 0.86);
    s.quadraticCurveTo(2.16, 1.08, 1.86, 1.12);
    s.lineTo(-1.86, 1.16);
    s.quadraticCurveTo(-2.12, 1.14, -2.14, 0.9);
    s.lineTo(-2.14, 0.62);
    s.quadraticCurveTo(-2.14, 0.42, -2.0, 0.42);
    const bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.14, bevelSegments: 8, curveSegments: 24 });
    bodyGeo.translate(0, 0, -0.75);
    car.add(mesh(bodyGeo, M.green));
    const cab = new THREE.Shape();
    cab.moveTo(-1.55, 1.05);
    cab.lineTo(1.0, 1.05);
    cab.quadraticCurveTo(0.62, 1.78, 0.18, 1.8);
    cab.lineTo(-0.95, 1.8);
    cab.quadraticCurveTo(-1.38, 1.78, -1.55, 1.05);
    const cabGeo = new THREE.ExtrudeGeometry(cab, { depth: 1.3, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 8, curveSegments: 24 });
    cabGeo.translate(0, 0, -0.65);
    car.add(mesh(cabGeo, M.glass));
    const pillar = mesh(rbox(0.1, 0.66, 1.62, 0.04), M.green);
    pillar.position.set(-0.35, 1.44, 0);
    car.add(pillar);
    for (const x of [-1.25, 1.25]) {
      for (const z of [-0.8, 0.8]) {
        const tire = mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.36, 48), M.rubber);
        tire.rotation.x = Math.PI / 2;
        tire.position.set(x, 0.47, z);
        car.add(tire);
        const hub = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.38, 48), M.chrome);
        hub.rotation.x = Math.PI / 2;
        hub.position.set(x, 0.47, z);
        car.add(hub);
      }
    }
    for (const z of [-0.5, 0.5]) {
      const hl = mesh(rbox(0.1, 0.16, 0.34, 0.04), M.glow);
      hl.position.set(2.3, 0.86, z);
      car.add(hl);
    }
    const grille = mesh(rbox(0.08, 0.12, 0.7, 0.03), M.chrome);
    grille.position.set(2.31, 0.64, 0);
    car.add(grille);
    car.position.y = base;
    car.scale.setScalar(0.92);
    g.add(car);
    return { group: g, az: 38, el: 16, margin: 1.06 };
  },

  libre() {
    const g = new THREE.Group();
    g.add(pedestal(2.0));
    const base = 0.24;
    const w = new THREE.Group();
    const card = mesh(rbox(1.9, 1.2, 0.06, 0.06), M.ceramic);
    card.position.set(-0.1, 1.75, -0.05);
    card.rotation.z = 0.07;
    w.add(card);
    const stripe = mesh(rbox(1.9, 0.18, 0.07, 0.02), M.b ?? M.mint);
    stripe.position.set(-0.1, 1.95, -0.05);
    stripe.rotation.z = 0.07;
    w.add(stripe);
    const card2 = mesh(rbox(1.9, 1.2, 0.06, 0.06), M.mint);
    card2.position.set(0.15, 1.6, 0.06);
    card2.rotation.z = -0.1;
    w.add(card2);
    const body = mesh(rbox(2.5, 1.7, 0.52, 0.24, 8), M.green);
    body.position.y = 0.85;
    w.add(body);
    const flap = mesh(rbox(1.0, 0.66, 0.6, 0.2, 8), M.greenDeep);
    flap.position.set(0.85, 0.95, 0.06);
    w.add(flap);
    const clasp = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 40), M.chrome);
    clasp.rotation.x = Math.PI / 2;
    clasp.position.set(0.98, 0.95, 0.38);
    w.add(clasp);
    w.position.y = base;
    w.rotation.y = -0.25;
    g.add(w);
    const c = coin({ r: 0.52 });
    c.rotation.set(0.95, 0.5, 0.35);
    c.position.set(-1.25, base + 0.5, 0.85);
    g.add(c);
    const st = coinStack(2, { r: 0.5 });
    st.position.set(1.1, base, 1.05);
    g.add(st);
    return { group: g, az: 26, el: 16, margin: 1.08 };
  },

  libranza() {
    const g = new THREE.Group();
    g.add(pedestal(2.1));
    const base = 0.24;
    const b = new THREE.Group();
    const body = mesh(rbox(2.7, 1.85, 0.9, 0.22, 8), M.ceramic);
    body.position.y = 0.925;
    b.add(body);
    const band = mesh(rbox(2.74, 0.22, 0.94, 0.08), M.green);
    band.position.y = 1.2;
    b.add(band);
    const lid = mesh(rbox(2.72, 0.05, 0.92, 0.02), M.mint);
    lid.position.y = 1.42;
    b.add(lid);
    const handle = mesh(new THREE.TorusGeometry(0.42, 0.085, 24, 64, Math.PI), M.chrome);
    handle.position.set(0, 1.85, 0);
    b.add(handle);
    for (const x of [-0.42, 0.42]) {
      const mount = mesh(rbox(0.22, 0.12, 0.3, 0.05), M.chrome);
      mount.position.set(x, 1.86, 0);
      b.add(mount);
    }
    for (const x of [-0.8, 0.8]) {
      const clasp = mesh(rbox(0.3, 0.26, 0.1, 0.05), M.chrome);
      clasp.position.set(x, 1.2, 0.49);
      b.add(clasp);
    }
    b.position.y = base;
    b.rotation.y = -0.2;
    g.add(b);
    const st = coinStack(3, { r: 0.4, t: 0.12 });
    st.position.set(1.35, base, 0.95);
    g.add(st);
    return { group: g, az: 28, el: 16, margin: 1.08 };
  },

  cdt() {
    const g = new THREE.Group();
    g.add(pedestal(2.0));
    const base = 0.24;
    const counts = [3, 6, 10];
    counts.forEach((n, i) => {
      const st = coinStack(n, { r: 0.5, t: 0.15, mat: i === 2 ? M.chrome : M.satin, symbol: '$' });
      st.position.set(-1.1 + i * 1.1, base, 0.2 - i * 0.35);
      g.add(st);
    });
    const top = coin({ r: 0.5, t: 0.15, mat: M.green, symbol: '%', symMat: M.green });
    top.position.set(1.1, base + 0.075 + 10 * 0.154 + 0.5, -0.5);
    top.rotation.set(0.5, 0.1, -0.15);
    g.add(top);
    return { group: g, az: 24, el: 16, margin: 1.1 };
  },

  percent() {
    const g = new THREE.Group();
    g.add(pedestal(1.7));
    const pct = textMesh('%', 1.9, 0.55, M.green);
    pct.position.set(0, 0.24, 0);
    g.add(pct);
    const c = coin({ r: 0.5 });
    c.rotation.set(1.3, 0, -0.25);
    c.position.set(1.15, 0.24 + 0.5, 0.75);
    g.add(c);
    return { group: g, az: 24, el: 14, margin: 1.12 };
  },
};

/* ---------- render ---------- */
async function main() {
  FONT = await new FontLoader().loadAsync('/node_modules/three/examples/fonts/helvetiker_bold.typeface.json');
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const env = new RoomEnvironment();
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(5, 7), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.b400).multiplyScalar(5), side: THREE.DoubleSide }));
  panel.position.set(-9, 3, -2);
  panel.lookAt(0, 0, 0);
  env.add(panel);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.03).texture;

  const spec = SCENES[NAME]();
  const { group } = spec;
  scene.add(group);

  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(center.x - 4, box.max.y + 9, center.z + 5);
  key.target.position.copy(center);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -sphere.radius * 1.6;
  sc.right = sc.top = sphere.radius * 1.6;
  sc.near = 0.5;
  sc.far = 40;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 18;
  key.shadow.blurSamples = 24;
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd7eee7, 0.55));
  const rim = new THREE.PointLight(C.b300, 40, 0, 2);
  rim.position.set(center.x - 3.5, box.max.y + 1, center.z - 3.5);
  scene.add(rim);

  // ground: soft shadow + contact occlusion
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.08 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = box.min.y;
  ground.receiveShadow = true;
  scene.add(ground);
  const blobCv = document.createElement('canvas');
  blobCv.width = blobCv.height = 256;
  const bx = blobCv.getContext('2d');
  const grd = bx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(23,33,31,0.28)');
  grd.addColorStop(0.55, 'rgba(23,33,31,0.12)');
  grd.addColorStop(1, 'rgba(23,33,31,0)');
  bx.fillStyle = grd;
  bx.fillRect(0, 0, 256, 256);
  const blobTex = new THREE.CanvasTexture(blobCv);
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, toneMapped: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  const size = box.getSize(new THREE.Vector3());
  blob.scale.set(size.x * 1.25, size.z * 1.35, 1);
  blob.position.set(center.x, box.min.y + 0.002, center.z);
  scene.add(blob);

  const camera = new THREE.PerspectiveCamera(26, W / H, 0.1, 200);
  const az = THREE.MathUtils.degToRad(spec.az);
  const el = THREE.MathUtils.degToRad(spec.el);
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  const dist = (sphere.radius / Math.sin(Math.min(vfov, hfov) / 2)) * (spec.margin ?? 1.1) * 0.74;
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  camera.position.copy(center).addScaledVector(dir, dist);
  camera.lookAt(center);

  renderer.render(scene, camera);

  // downscale (supersampled) and encode
  const out = document.createElement('canvas');
  out.width = OUT[0];
  out.height = OUT[1];
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, OUT[0], OUT[1]);
  window.__result = {
    webp: out.toDataURL('image/webp', 0.86),
    png: out.toDataURL('image/png'),
    info: `${OUT[0]}x${OUT[1]} gl=${renderer.getContext().getParameter(renderer.getContext().VERSION)}`,
  };
}

main().catch((e) => {
  window.__error = String(e?.stack ?? e);
});
