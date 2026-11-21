import { useEffect, useRef } from "react";
import * as THREE from "three";

const STAGES = 8;

function makeSteelAssembly(parent, segments, { stage, order, retire, radius = 0.009, mode = "scale" }) {
  const geometry = new THREE.CylinderGeometry(radius, radius, 1, 8, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x3c4140, metalness: 0.58, roughness: 0.48, transparent: true, opacity: 0.96 });
  const mesh = new THREE.InstancedMesh(geometry, material, segments.length);
  const up = new THREE.Vector3(0, 1, 0);
  const direction = new THREE.Vector3();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  segments.forEach(([start, end], index) => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    direction.subVectors(b, a);
    const length = direction.length();
    position.addVectors(a, b).multiplyScalar(0.5);
    quaternion.setFromUnitVectors(up, direction.normalize());
    scale.set(1, length, 1);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.visible = false;
  parent.add(mesh);
  return { mesh, start: (stage + 0.06 + order * 0.78) / STAGES, mode, retire, baseOpacity: material.opacity, cutawayDetail: true };
}

function makeRebarCage(parent, { x, z, bottom, top, width = 0.24, depth = 0.24, stage, order = 0, retire }) {
  const segments = [];
  const hx = width / 2;
  const hz = depth / 2;
  const perimeter = [[-hx, -hz], [0, -hz], [hx, -hz], [hx, 0], [hx, hz], [0, hz], [-hx, hz], [-hx, 0]];
  perimeter.forEach(([dx, dz]) => segments.push([[x + dx, bottom, z + dz], [x + dx, top, z + dz]]));
  for (let y = bottom + 0.17; y < top; y += 0.2) {
    for (let index = 0; index < perimeter.length; index += 1) {
      const a = perimeter[index];
      const b = perimeter[(index + 1) % perimeter.length];
      segments.push([[x + a[0], y, z + a[1]], [x + b[0], y, z + b[1]]]);
    }
  }
  return makeSteelAssembly(parent, segments, { stage, order, retire, radius: 0.008, mode: "rise" });
}

function makeBeamCage(parent, { axis, center, start, end, y, section = 0.22, stage, order, retire }) {
  const segments = [];
  const half = section / 2;
  const offsets = [[-half, -half], [half, -half], [half, half], [-half, half]];
  offsets.forEach(([a, b]) => {
    const p0 = axis === "x" ? [start, y + a, center + b] : [center + a, y + b, start];
    const p1 = axis === "x" ? [end, y + a, center + b] : [center + a, y + b, end];
    segments.push([p0, p1]);
  });
  for (let distance = start + 0.18; distance < end; distance += 0.24) {
    offsets.forEach(([a, b], index) => {
      const next = offsets[(index + 1) % offsets.length];
      const p0 = axis === "x" ? [distance, y + a, center + b] : [center + a, y + b, distance];
      const p1 = axis === "x" ? [distance, y + next[0], center + next[1]] : [center + next[0], y + next[1], distance];
      segments.push([p0, p1]);
    });
  }
  return makeSteelAssembly(parent, segments, { stage, order, retire, radius: 0.008, mode: "scale" });
}

function addCylinderBetween(parent, from, to, radius, material, radialSegments = 8) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius, direction.length(), radialSegments), material);
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createModel(scene, pieces) {
  function makeTexture(width, height, paint, repeat = [1, 1]) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    paint(context, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
    texture.anisotropy = 4;
    return texture;
  }
  function grainTexture(base, seed, amount = 900) {
    return makeTexture(192, 192, (context, width, height) => {
      context.fillStyle = base;
      context.fillRect(0, 0, width, height);
      let value = seed;
      const random = () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
      };
      for (let i = 0; i < amount; i += 1) {
        const alpha = 0.025 + random() * 0.12;
        context.fillStyle = random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(35,42,38,${alpha})`;
        const size = 0.4 + random() * 1.8;
        context.fillRect(random() * width, random() * height, size, size);
      }
    });
  }
  const concreteTexture = grainTexture("#b9bab1", 17, 1200);
  const plasterTexture = grainTexture("#e6e5dc", 37, 650);
  const soilTexture = grainTexture("#888a7e", 43, 1500);
  const woodTexture = makeTexture(256, 192, (context, width, height) => {
    context.fillStyle = "#96704f";
    context.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 32) {
      context.fillStyle = y % 64 === 0 ? "#a07a57" : "#8a6547";
      context.fillRect(0, y, width, 29);
      context.fillStyle = "rgba(42,31,22,.35)";
      context.fillRect(0, y + 29, width, 3);
      for (let x = 14; x < width; x += 37) {
        context.strokeStyle = "rgba(64,43,28,.16)";
        context.beginPath();
        context.ellipse(x, y + 13, 4 + (x % 9), 2, 0, 0, Math.PI * 2);
        context.stroke();
      }
    }
  });
  const blockTexture = makeTexture(256, 160, (context, width, height) => {
    context.fillStyle = "#aaa99f";
    context.fillRect(0, 0, width, height);
    for (let row = 0; row < 5; row += 1) {
      const y = row * 32;
      let x = row % 2 ? -28 : 0;
      while (x < width) {
        context.fillStyle = (Math.floor((x + 256) / 64) + row) % 3 === 0 ? "#c8c8be" : "#c2c2b8";
        context.fillRect(x + 2, y + 2, 60, 28);
        context.fillStyle = "rgba(73,78,70,.22)";
        context.fillRect(x, y, 64, 2);
        context.fillRect(x, y, 2, 32);
        x += 64;
      }
    }
  });
  const pavingTexture = makeTexture(128, 128, (context) => {
    context.fillStyle = "#b9bbb2";
    context.fillRect(0, 0, 128, 128);
    context.strokeStyle = "rgba(87,94,88,.42)";
    context.lineWidth = 2;
    for (let i = 0; i <= 128; i += 32) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, 128);
      context.moveTo(0, i);
      context.lineTo(128, i);
      context.stroke();
    }
    context.fillStyle = "rgba(255,255,255,.15)";
    context.fillRect(3, 3, 26, 26);
  });
  const material = (color, options = {}) => new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.78,
    metalness: options.metalness ?? 0.02,
    map: options.map ?? null,
    bumpMap: options.bumpMap ?? null,
    bumpScale: options.bumpScale ?? 0,
    transparent: Boolean(options.opacity && options.opacity < 1),
    opacity: options.opacity ?? 1,
    side: THREE.DoubleSide,
  });
  const mats = {
    concrete: material(0xb7b8ae, { map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.025 }),
    slab: material(0xc8c8be, { map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.02 }),
    foundation: material(0x999c94, { map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.025 }),
    blinding: material(0xbfc1b7, { map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.018 }),
    excavation: material(0x555d55),
    form: material(0x9b6949, { map: woodTexture, bumpMap: woodTexture, bumpScale: 0.015 }),
    steel: material(0x4a504d, { metalness: 0.55, roughness: 0.48 }),
    block: material(0xbdbfb5, { map: blockTexture, bumpMap: blockTexture, bumpScale: 0.012 }),
    plaster: material(0xe4e4da, { map: plasterTexture, bumpMap: plasterTexture, bumpScale: 0.008 }),
    glass: material(0x638b91, { opacity: 0.56, metalness: 0.12, roughness: 0.2 }),
    frame: material(0x384641, { metalness: 0.48, roughness: 0.36 }),
    pipe: material(0x537e75, { metalness: 0.2, roughness: 0.5 }),
    conduit: material(0xc3864d, { metalness: 0.12, roughness: 0.5 }),
    paving: material(0xc0c0b5, { map: pavingTexture, bumpMap: pavingTexture, bumpScale: 0.01 }),
    soil: material(0x8d8e81, { map: soilTexture, bumpMap: soilTexture, bumpScale: 0.045 }),
    green: material(0x617b65, { roughness: 0.96 }),
    darkGreen: material(0x405c4c, { roughness: 0.96 }),
    machine: material(0xc79643, { roughness: 0.58, metalness: 0.12 }),
    rubber: material(0x303532, { roughness: 0.96 }),
    cabGlass: material(0x577e80, { opacity: 0.68, metalness: 0.08, roughness: 0.24 }),
    white: material(0xf4f1e8),
  };

  function addBox(parent, size, position, stage, order, mat, mode = "rise", retire = null) {
    const geometry = new THREE.BoxGeometry(...size);
    const exteriorOrSection = mat === mats.block || mat === mats.plaster || mat === mats.concrete || mat === mats.foundation;
    const hideSlab = (mat === mats.slab || mat === mats.foundation) && size[0] > 5;
    const hideWhenCutaway = (exteriorOrSection && position[2] > 1.8 && position[2] < 2.5) || hideSlab;
    const pieceMaterial = retire === null && !hideWhenCutaway ? mat : mat.clone();
    const mesh = new THREE.Mesh(geometry, pieceMaterial);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.visible = false;
    parent.add(mesh);
    pieces.push({
      mesh,
      start: (stage + 0.06 + order * 0.78) / STAGES,
      mode,
      retire,
      targetY: position[1],
      baseOpacity: pieceMaterial.opacity,
      hideWhenCutaway,
    });
    return mesh;
  }

  function addLine(parent, points, stage, order, color = 0x414744, retire = null, opacity = 1) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p)));
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
    line.visible = false;
    parent.add(line);
    pieces.push({ mesh: line, start: (stage + 0.06 + order * 0.78) / STAGES, mode: "rise", retire, baseOpacity: line.material.opacity });
    return line;
  }

  function addCage(args) {
    pieces.push(makeRebarCage(base, args));
  }

  function addAssembly(group, stage, order, retire = null, mode = "scale") {
    group.visible = false;
    base.add(group);
    const fadeMaterials = [];
    if (retire !== null) {
      group.traverse((object) => {
        if (!object.material) return;
        object.material = object.material.clone();
        fadeMaterials.push({ material: object.material, opacity: object.material.opacity });
      });
    }
    pieces.push({ mesh: group, start: (stage + 0.06 + order * 0.78) / STAGES, mode, retire, targetY: group.position.y, fadeMaterials });
  }

  const base = new THREE.Group();
  scene.add(base);

  // Permanent site datum and the excavation outline.
  const earth = new THREE.Mesh(new THREE.BoxGeometry(12, 0.34, 9.8), mats.soil);
  earth.position.set(0, -0.18, 0);
  earth.receiveShadow = true;
  base.add(earth);
  const siteLines = new THREE.GridHelper(11.6, 24, 0xb9bdb4, 0xd0d2cb);
  siteLines.position.y = 0.005;
  siteLines.material.transparent = true;
  siteLines.material.opacity = 0.38;
  base.add(siteLines);

  // Temporary perimeter hoarding and a compact tracked excavator for the earthworks phase.
  const fenceZ = [-4.15, 4.15];
  fenceZ.forEach((z) => {
    for (let x = -5.1; x <= 5.1; x += 0.85) {
      if (z > 0 && Math.abs(x) < 1.7) continue;
      addBox(base, [0.055, 1.25, 0.055], [x, 0.64, z], 0, 0.12, mats.frame, "rise", 7.62);
      addBox(base, [0.84, 0.82, 0.035], [x + 0.42, 0.61, z], 0, 0.19, mats.form, "span-x", 7.62);
    }
  });
  [-5.15, 5.15].forEach((x) => {
    for (let z = -3.35; z <= 3.35; z += 0.9) {
      addBox(base, [0.055, 1.25, 0.055], [x, 0.64, z], 0, 0.12, mats.frame, "rise", 7.62);
      addBox(base, [0.035, 0.82, 0.88], [x, 0.61, z + 0.44], 0, 0.19, mats.form, "span-z", 7.62);
    }
  });
  const excavator = new THREE.Group();
  [-0.38, 0.38].forEach((z) => {
    const track = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.27, 0.28), mats.rubber);
    track.position.set(-4.16, 0.21, z);
    track.castShadow = true;
    excavator.add(track);
    [-4.78, -4.35, -3.92].forEach((x) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.11, 12), mats.frame);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.21, z + (z > 0 ? 0.17 : -0.17));
      excavator.add(wheel);
    });
  });
  const excavatorChassis = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.38, 0.84), mats.machine);
  excavatorChassis.position.set(-4.05, 0.62, 0);
  excavatorChassis.castShadow = true;
  excavator.add(excavatorChassis);
  const counterweight = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.82), mats.machine);
  counterweight.position.set(-4.56, 0.82, 0);
  counterweight.castShadow = true;
  excavator.add(counterweight);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.92, 0.68), mats.cabGlass);
  cab.position.set(-3.76, 1.22, -0.12);
  cab.castShadow = true;
  excavator.add(cab);
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.78), mats.machine);
  cabRoof.position.set(-3.76, 1.72, -0.12);
  excavator.add(cabRoof);
  addCylinderBetween(excavator, [-3.52, 1.33, 0.18], [-3.06, 1.96, 0.18], 0.12, mats.machine, 10);
  addCylinderBetween(excavator, [-3.06, 1.96, 0.18], [-2.42, 1.36, 0.18], 0.095, mats.machine, 10);
  addCylinderBetween(excavator, [-3.4, 1.45, 0.28], [-3.01, 1.81, 0.28], 0.036, mats.steel, 8);
  addCylinderBetween(excavator, [-3.01, 1.81, 0.28], [-2.48, 1.39, 0.28], 0.028, mats.steel, 8);
  const bucketShape = new THREE.Shape();
  bucketShape.moveTo(-0.14, 0.12);
  bucketShape.lineTo(0.17, 0.06);
  bucketShape.lineTo(0.12, -0.12);
  bucketShape.lineTo(-0.16, -0.09);
  bucketShape.closePath();
  const bucket = new THREE.Mesh(new THREE.ExtrudeGeometry(bucketShape, { depth: 0.28, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.015, bevelThickness: 0.015 }), mats.frame);
  bucket.position.set(-2.4, 1.05, 0.04);
  bucket.rotation.z = -0.22;
  bucket.castShadow = true;
  excavator.add(bucket);
  addAssembly(excavator, 0, 0.4, 1.6, "rise");

  const mixerTruck = new THREE.Group();
  const mixerChassis = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.3, 0.62), mats.frame);
  mixerChassis.position.set(-3.92, 0.55, 3.12);
  mixerTruck.add(mixerChassis);
  const mixerCab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.82, 0.72), mats.machine);
  mixerCab.position.set(-4.75, 0.98, 3.12);
  mixerCab.castShadow = true;
  mixerTruck.add(mixerCab);
  const mixerWindshield = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.42, 0.52), mats.cabGlass);
  mixerWindshield.position.set(-4.38, 1.08, 3.12);
  mixerTruck.add(mixerWindshield);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.54, 1.25, 16, 1), mats.plaster);
  drum.rotation.set(0.12, 0, Math.PI / 2 - 0.18);
  drum.position.set(-3.52, 1.02, 3.12);
  drum.castShadow = true;
  mixerTruck.add(drum);
  const drumBand = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.028, 8, 20), mats.machine);
  drumBand.rotation.set(0.12, Math.PI / 2, -0.18);
  drumBand.position.set(-3.52, 1.02, 3.12);
  mixerTruck.add(drumBand);
  [-4.72, -3.88, -3.12].forEach((x) => {
    [-1, 1].forEach((side) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.15, 14), mats.rubber);
      tire.rotation.x = Math.PI / 2;
      tire.position.set(x, 0.25, 3.12 + side * 0.36);
      tire.castShadow = true;
      mixerTruck.add(tire);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 10), mats.steel);
      hub.rotation.x = Math.PI / 2;
      hub.position.copy(tire.position);
      mixerTruck.add(hub);
    });
  });
  addCylinderBetween(mixerTruck, [-2.95, 0.84, 3.12], [-2.55, 0.38, 3.12], 0.035, mats.frame, 8);
  addAssembly(mixerTruck, 1, 0.38, 2.2, "rise");

  const gridX = [-2.7, 0, 2.7];
  const gridZ = [-2.05, 2.05];

  // Excavation pockets and lean-concrete blinding under each isolated footing.
  gridX.forEach((x) => gridZ.forEach((z) => {
    addBox(base, [1.2, 0.035, 1.2], [x, -0.025, z], 0, 0.78, mats.excavation, "scale");
    addBox(base, [1.62, 0.06, 1.62], [x, -0.76, z], 1, 0.03, mats.blinding, "scale");
    addBox(base, [1.45, 0.18, 1.45], [x, -0.62, z], 1, 0.45, mats.foundation, "rise");
    const rebar = [];
    for (let i = -0.55; i <= 0.55; i += 0.18) {
      rebar.push([[x + i, -0.67, z - 0.55], [x + i, -0.67, z + 0.55]]);
      rebar.push([[x - 0.55, -0.67, z + i], [x + 0.55, -0.67, z + i]]);
    }
    pieces.push(makeSteelAssembly(base, rebar, { stage: 1, order: 0.16, retire: 1.42, radius: 0.011, mode: "scale" }));
    addBox(base, [0.62, 0.42, 0.62], [x, -0.29, z], 1, 0.78, mats.concrete, "rise");
  }));

  // Reinforced-concrete ground beams connect all isolated footings.
  gridZ.forEach((z) => pieces.push(makeBeamCage(base, { axis: "x", center: z, start: -2.8, end: 2.8, y: 0.08, stage: 1, order: 0.34, retire: 1.68 })));
  gridX.forEach((x) => pieces.push(makeBeamCage(base, { axis: "z", center: x, start: -2.18, end: 2.18, y: 0.08, stage: 1, order: 0.34, retire: 1.68 })));
  gridZ.forEach((z) => addBox(base, [5.6, 0.32, 0.32], [0, 0.08, z], 1, 0.62, mats.concrete, "span-x"));
  gridX.forEach((x) => addBox(base, [0.32, 0.32, 4.35], [x, 0.08, 0], 1, 0.7, mats.concrete, "span-z"));
  addBox(base, [5.55, 0.2, 4.2], [0, 0.31, 0], 1, 0.82, mats.foundation, "scale");

  // Ground-floor rebar, columns, beams and the first suspended slab.
  const groundSlabBars = [];
  for (let x = -2.65; x <= 2.65; x += 0.3) groundSlabBars.push([[x, 0.48, -2.35], [x, 0.48, 2.35]]);
  for (let z = -2.35; z <= 2.35; z += 0.3) groundSlabBars.push([[-2.65, 0.48, z], [2.65, 0.48, z]]);
  pieces.push(makeSteelAssembly(base, groundSlabBars, { stage: 2, order: 0.16, retire: 2.9, radius: 0.008, mode: "scale" }));
  addBox(base, [6.05, 0.14, 5.05], [0, 0.5, 0], 2, 0.36, mats.slab, "scale");
  gridX.forEach((x) => gridZ.forEach((z) => {
    addCage({ x, z, bottom: -0.45, top: 2.9, stage: 2, order: 0.04, width: 0.23, depth: 0.23, retire: 2.58 });
    [-1, 1].forEach((side) => addBox(base, [0.37, 2.66, 0.045], [x, 1.64, z + side * 0.19], 2, 0.25, mats.form, "rise", 2.45));
    addBox(base, [0.34, 2.72, 0.34], [x, 1.64, z], 2, 0.46, mats.concrete, "rise");
  }));
  gridZ.forEach((z) => addBox(base, [5.7, 0.34, 0.36], [0, 2.91, z], 2, 0.65, mats.concrete, "span-x"));
  gridX.forEach((x) => addBox(base, [0.36, 0.34, 4.4], [x, 2.91, 0], 2, 0.72, mats.concrete, "span-z"));

  // First-floor formwork deck and temporary shores, followed by visible slab mesh and concrete.
  gridX.forEach((x) => gridZ.forEach((z) => {
    addBox(base, [0.1, 2.76, 0.1], [x, 1.68, z], 3, 0.04, mats.form, "rise", 4.7);
  }));
  for (let x = -2.8; x <= 2.8; x += 0.55) {
    addBox(base, [0.045, 0.08, 4.95], [x, 3.0, 0], 3, 0.21, mats.form, "span-x", 4.7);
  }
  const slabBars = [];
  for (let x = -2.85; x <= 2.85; x += 0.28) slabBars.push([[x, 3.11, -2.45], [x, 3.11, 2.45]]);
  for (let z = -2.45; z <= 2.45; z += 0.28) slabBars.push([[-2.85, 3.11, z], [2.85, 3.11, z]]);
  pieces.push(makeSteelAssembly(base, slabBars, { stage: 3, order: 0.25, retire: 3.78, radius: 0.008, mode: "scale" }));
  addBox(base, [6.35, 0.2, 5.35], [0, 3.16, 0], 3, 0.55, mats.slab, "scale");

  // Upper frame, stair flight, roof slab and parapet.
  gridX.forEach((x) => gridZ.forEach((z) => {
    addCage({ x, z, bottom: 3.28, top: 5.74, stage: 4, order: 0.04, width: 0.23, depth: 0.23, retire: 4.55 });
    [-1, 1].forEach((side) => addBox(base, [0.37, 2.38, 0.045], [x, 4.51, z + side * 0.19], 4, 0.2, mats.form, "rise", 4.35));
    addBox(base, [0.34, 2.42, 0.34], [x, 4.51, z], 4, 0.38, mats.concrete, "rise");
  }));
  gridZ.forEach((z) => addBox(base, [5.7, 0.34, 0.36], [0, 5.75, z], 4, 0.52, mats.concrete, "span-x"));
  gridX.forEach((x) => addBox(base, [0.36, 0.34, 4.4], [x, 5.75, 0], 4, 0.58, mats.concrete, "span-z"));
  // Roof deck props, formwork and reinforcement are removed after the roof pour cures.
  for (let x = -2.8; x <= 2.8; x += 1.1) {
    for (let z = -2.2; z <= 2.2; z += 1.1) {
      addBox(base, [0.075, 2.36, 0.075], [x, 4.42, z], 4, 0.62, mats.form, "rise", 5.45);
    }
  }
  for (let x = -2.8; x <= 2.8; x += 0.55) {
    addBox(base, [0.05, 0.08, 4.95], [x, 5.7, 0], 4, 0.67, mats.form, "span-x", 5.45);
  }
  const roofBars = [];
  for (let x = -2.85; x <= 2.85; x += 0.28) roofBars.push([[x, 5.86, -2.45], [x, 5.86, 2.45]]);
  for (let z = -2.45; z <= 2.45; z += 0.28) roofBars.push([[-2.85, 5.86, z], [2.85, 5.86, z]]);
  pieces.push(makeSteelAssembly(base, roofBars, { stage: 4, order: 0.7, retire: 4.94, radius: 0.008, mode: "scale" }));
  addBox(base, [6.35, 0.2, 5.35], [0, 5.98, 0], 4, 0.77, mats.slab, "scale");
  // Simple, legible stair: two inclined stringers and repeated treads.
  const stair = new THREE.Group();
  base.add(stair);
  const stairBeam = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.16, 0.14), mats.concrete);
  stairBeam.position.set(-1.45, 1.73, 0.38);
  stairBeam.rotation.z = -0.69;
  stairBeam.castShadow = true;
  stair.add(stairBeam);
  const stairBeam2 = stairBeam.clone();
  stairBeam2.position.z = 1.35;
  stair.add(stairBeam2);
  stair.visible = false;
  pieces.push({ mesh: stair, start: (4.45 + 0.06) / STAGES, mode: "rise" });
  for (let i = 0; i < 9; i += 1) {
    addBox(base, [0.72, 0.1, 0.98], [-2.14 + i * 0.19, 0.62 + i * 0.27, 0.87], 4, 0.49, mats.slab, "scale");
  }
  addBox(base, [6.1, 0.42, 0.15], [0, 6.28, 2.52], 4, 0.83, mats.concrete, "span-x");
  addBox(base, [6.1, 0.42, 0.15], [0, 6.28, -2.52], 4, 0.83, mats.concrete, "span-x");
  addBox(base, [0.15, 0.42, 5.05], [-3.02, 6.28, 0], 4, 0.86, mats.concrete, "span-z");
  addBox(base, [0.15, 0.42, 5.05], [3.02, 6.28, 0], 4, 0.86, mats.concrete, "span-z");
  addBox(base, [6.1, 0.025, 5.05], [0, 6.105, 0], 6, 0.08, mats.darkGreen, "scale");
  for (let x = -3.05; x <= 3.05; x += 0.45) {
    addBox(base, [0.045, 0.52, 0.045], [x, 6.32, 2.52], 4, 0.91, mats.frame, "rise", 7.62);
  }
  addBox(base, [6.2, 0.1, 0.08], [0, 6.59, 2.52], 4, 0.94, mats.frame, "span-x", 7.62);

  // Masonry infill is built as separate panels around genuine door/window voids.
  function wallPanel(size, position, stage, order = 0.3, mat = mats.block, retire = null) {
    addBox(base, size, position, stage, order, mat, "scale", retire);
  }
  function openingWallX(x1, x2, z, y0, y1, opening, stage, order = 0.2, window = true, wallMaterial = mats.block) {
    const width = x2 - x1;
    const mid = (x1 + x2) / 2;
    const openWidth = opening?.width ?? 0;
    const openHeight = opening?.height ?? 0;
    const sill = opening?.sill ?? 0;
    if (!opening) return wallPanel([width, y1 - y0, 0.14], [mid, (y0 + y1) / 2, z], stage, order, wallMaterial);
    const sideW = (width - openWidth) / 2;
    wallPanel([sideW, y1 - y0, 0.14], [x1 + sideW / 2, (y0 + y1) / 2, z], stage, order, wallMaterial);
    wallPanel([sideW, y1 - y0, 0.14], [x2 - sideW / 2, (y0 + y1) / 2, z], stage, order, wallMaterial);
    if (sill > 0) wallPanel([openWidth, sill, 0.14], [mid, y0 + sill / 2, z], stage, order + 0.12, wallMaterial);
    wallPanel([openWidth, y1 - (y0 + sill + openHeight), 0.14], [mid, y0 + sill + openHeight + (y1 - y0 - sill - openHeight) / 2, z], stage, order + 0.24, wallMaterial);
    if (window) {
      const centerY = y0 + sill + openHeight / 2;
      addBox(base, [openWidth, 0.045, 0.07], [mid, centerY - openHeight / 2 + 0.03, z + 0.015], stage, order + 0.34, mats.frame, "span-x");
      addBox(base, [openWidth, 0.045, 0.07], [mid, centerY + openHeight / 2 - 0.03, z + 0.015], stage, order + 0.34, mats.frame, "span-x");
      addBox(base, [0.045, openHeight, 0.07], [mid - openWidth / 2 + 0.03, centerY, z + 0.015], stage, order + 0.34, mats.frame, "rise");
      addBox(base, [0.045, openHeight, 0.07], [mid + openWidth / 2 - 0.03, centerY, z + 0.015], stage, order + 0.34, mats.frame, "rise");
      addBox(base, [0.035, openHeight, 0.04], [mid, centerY, z + 0.045], stage, order + 0.38, mats.frame, "rise");
      addBox(base, [openWidth - 0.08, openHeight - 0.08, 0.025], [mid, centerY, z + 0.045], stage, order + 0.4, mats.glass, "scale");
    }
  }
  function openingWallZ(x, z1, z2, y0, y1, opening, stage, order = 0.2, wallMaterial = mats.block, window = true) {
    const depth = z2 - z1;
    const mid = (z1 + z2) / 2;
    const openWidth = opening?.width ?? 0;
    const openHeight = opening?.height ?? 0;
    const sill = opening?.sill ?? 0;
    if (!opening) return wallPanel([0.14, y1 - y0, depth], [x, (y0 + y1) / 2, mid], stage, order, wallMaterial);
    const side = (depth - openWidth) / 2;
    wallPanel([0.14, y1 - y0, side], [x, (y0 + y1) / 2, z1 + side / 2], stage, order, wallMaterial);
    wallPanel([0.14, y1 - y0, side], [x, (y0 + y1) / 2, z2 - side / 2], stage, order, wallMaterial);
    wallPanel([0.14, sill, openWidth], [x, y0 + sill / 2, mid], stage, order + 0.12, wallMaterial);
    wallPanel([0.14, y1 - (sill + openHeight), openWidth], [x, y0 + sill + openHeight / 2 + (y1 - y0 - sill - openHeight) / 2, mid], stage, order + 0.24, wallMaterial);
    if (!window) return;
    const frameX = x + (x > 0 ? 0.02 : -0.02);
    addBox(base, [0.06, 0.04, openWidth], [frameX, y0 + sill + 0.03, mid], stage, order + 0.35, mats.frame, "span-z");
    addBox(base, [0.06, 0.04, openWidth], [frameX, y0 + sill + openHeight - 0.03, mid], stage, order + 0.35, mats.frame, "span-z");
    addBox(base, [0.06, openHeight, 0.04], [frameX, y0 + sill + openHeight / 2, mid - openWidth / 2 + 0.02], stage, order + 0.35, mats.frame, "rise");
    addBox(base, [0.06, openHeight, 0.04], [frameX, y0 + sill + openHeight / 2, mid + openWidth / 2 - 0.02], stage, order + 0.35, mats.frame, "rise");
    addBox(base, [0.025, openHeight - 0.08, openWidth - 0.08], [frameX + (x > 0 ? 0.035 : -0.035), y0 + sill + openHeight / 2, mid], stage, order + 0.4, mats.glass, "scale");
  }

  // Ground floor: wide glazed openings and a front entry door.
  openingWallX(-2.68, -0.08, 2.14, 0.34, 2.82, { width: 1.35, height: 1.25, sill: 0.82 }, 5, 0.1);
  openingWallX(0.08, 2.68, 2.14, 0.34, 2.82, { width: 0.92, height: 2.12, sill: 0 }, 5, 0.18, false);
  addBox(base, [0.84, 2.08, 0.045], [1.38, 1.42, 2.225], 6, 0.28, mats.frame, "rise");
  addBox(base, [0.72, 1.94, 0.025], [1.38, 1.42, 2.255], 6, 0.35, mats.glass, "scale");
  openingWallZ(-2.98, -1.98, 1.98, 0.34, 2.82, { width: 1.25, height: 1.24, sill: 0.82 }, 5, 0.26);
  openingWallZ(2.98, -1.98, 1.98, 0.34, 2.82, { width: 1.2, height: 1.18, sill: 0.86 }, 5, 0.32);
  openingWallX(-2.68, -0.08, -2.14, 0.34, 2.82, { width: 1.2, height: 1.15, sill: 0.9 }, 5, 0.36);
  openingWallX(0.08, 2.68, -2.14, 0.34, 2.82, { width: 1.35, height: 1.15, sill: 0.9 }, 5, 0.4);

  // Upper floor infill, including repeated window modules.
  openingWallX(-2.68, -0.08, 2.14, 3.36, 5.66, { width: 1.5, height: 1.34, sill: 0.96 }, 5, 0.48);
  openingWallX(0.08, 2.68, 2.14, 3.36, 5.66, { width: 1.5, height: 1.34, sill: 0.96 }, 5, 0.54);
  openingWallZ(-2.98, -1.98, 1.98, 3.36, 5.66, { width: 1.35, height: 1.34, sill: 0.96 }, 5, 0.58);
  openingWallZ(2.98, -1.98, 1.98, 3.36, 5.66, { width: 1.35, height: 1.34, sill: 0.96 }, 5, 0.64);
  openingWallX(-2.68, -0.08, -2.14, 3.36, 5.66, { width: 1.45, height: 1.3, sill: 0.98 }, 5, 0.67);
  openingWallX(0.08, 2.68, -2.14, 3.36, 5.66, { width: 1.45, height: 1.3, sill: 0.98 }, 5, 0.7);

  // Internal partitions and door openings complete the basic room layout.
  [-1, 1].forEach((floor) => {
    const y0 = floor < 0 ? 0.52 : 3.36;
    const y1 = floor < 0 ? 2.82 : 5.66;
    const height = y1 - y0;
    const centerY = (y0 + y1) / 2;
    const wallZ = -0.3;
    wallPanel([1.72, height, 0.12], [-1.54, centerY, wallZ], 5, 0.75);
    wallPanel([1.72, height, 0.12], [1.54, centerY, wallZ], 5, 0.75);
    wallPanel([0.92, 0.36, 0.12], [0, y1 - 0.18, wallZ], 5, 0.82);
  });

  // Exterior finish coat follows the service inspection while keeping every opening clear.
  openingWallX(-2.68, -0.08, 2.23, 0.34, 2.82, { width: 1.35, height: 1.25, sill: 0.82 }, 6, 0.66, false, mats.plaster);
  openingWallX(0.08, 2.68, 2.23, 0.34, 2.82, { width: 0.92, height: 2.12, sill: 0 }, 6, 0.66, false, mats.plaster);
  openingWallX(-2.68, -0.08, -2.23, 0.34, 2.82, { width: 1.2, height: 1.15, sill: 0.9 }, 6, 0.67, false, mats.plaster);
  openingWallX(0.08, 2.68, -2.23, 0.34, 2.82, { width: 1.35, height: 1.15, sill: 0.9 }, 6, 0.68, false, mats.plaster);
  openingWallX(-2.68, -0.08, 2.23, 3.36, 5.66, { width: 1.5, height: 1.34, sill: 0.96 }, 6, 0.7, false, mats.plaster);
  openingWallX(0.08, 2.68, 2.23, 3.36, 5.66, { width: 1.5, height: 1.34, sill: 0.96 }, 6, 0.7, false, mats.plaster);
  openingWallX(-2.68, -0.08, -2.23, 3.36, 5.66, { width: 1.45, height: 1.3, sill: 0.98 }, 6, 0.71, false, mats.plaster);
  openingWallX(0.08, 2.68, -2.23, 3.36, 5.66, { width: 1.45, height: 1.3, sill: 0.98 }, 6, 0.71, false, mats.plaster);
  openingWallZ(-3.06, -1.98, 1.98, 0.34, 2.82, { width: 1.25, height: 1.24, sill: 0.82 }, 6, 0.72, mats.plaster, false);
  openingWallZ(3.06, -1.98, 1.98, 0.34, 2.82, { width: 1.2, height: 1.18, sill: 0.86 }, 6, 0.72, mats.plaster, false);
  openingWallZ(-3.06, -1.98, 1.98, 3.36, 5.66, { width: 1.35, height: 1.34, sill: 0.96 }, 6, 0.73, mats.plaster, false);
  openingWallZ(3.06, -1.98, 1.98, 3.36, 5.66, { width: 1.35, height: 1.34, sill: 0.96 }, 6, 0.73, mats.plaster, false);

  // Small service rough-in runs, deliberately visible before the envelope closes.
  const serviceLines = [
    [[-2.35, 0.42, 1.84], [-2.35, 2.46, 1.84], [-1.75, 2.46, 1.84]],
    [[-2.35, 0.42, 1.7], [-2.35, 0.42, -1.7], [-1.2, 0.42, -1.7]],
    [[-2.2, 3.45, 1.8], [-2.2, 5.48, 1.8], [-1.5, 5.48, 1.8]],
    [[-1.9, 3.5, -1.72], [2.35, 3.5, -1.72]],
  ];
  serviceLines.forEach((points, i) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "centripetal", 0.25);
    const geometry = new THREE.TubeGeometry(curve, (points.length - 1) * 10, i % 2 ? 0.035 : 0.024, 6, false);
    const mesh = new THREE.Mesh(geometry, i % 2 ? mats.pipe : mats.conduit);
    mesh.visible = false;
    mesh.castShadow = true;
    base.add(mesh);
    pieces.push({ mesh, start: (5 + 0.08 + i * 0.08) / STAGES, mode: "rise", baseOpacity: mesh.material.opacity });
  });

  // Temporary access scaffold is erected for facade work and removed at handover.
  const scaffoldX = [-3.45, -1.75, 0, 1.75, 3.45];
  const scaffoldZ = [-2.7, 2.7];
  scaffoldX.forEach((x) => scaffoldZ.forEach((z) => {
    addBox(base, [0.055, 6.45, 0.055], [x, 3.2, z], 6, 0.03, mats.frame, "rise", 7.62);
    [1.15, 3.15, 5.2].forEach((y, index) => {
      addBox(base, [0.06, 0.055, 0.06], [x, y, z], 6, 0.08 + index * 0.08, mats.form, "rise", 7.62);
    });
  }));
  scaffoldZ.forEach((z) => {
    [1.15, 3.15, 5.2].forEach((y, index) => {
      addBox(base, [6.95, 0.055, 0.055], [0, y, z], 6, 0.13 + index * 0.07, mats.form, "span-x", 7.62);
    });
    [-2.575, -0.875, 0.875, 2.575].forEach((x, index) => {
      addLine(base, [[x, 0.2, z], [x + (index % 2 ? -0.8 : 0.8), 2.05, z]], 6, 0.32, 0x626d66, 7.62);
      addLine(base, [[x, 2.1, z], [x + (index % 2 ? 0.8 : -0.8), 4.1, z]], 6, 0.38, 0x626d66, 7.62);
    });
  });

  // Exterior plaster reveals, balcony edge/rail, perimeter paving and light landscaping.
  [
    { size: [0.15, 2.28, 0.15], pos: [-2.95, 4.5, 2.38] },
    { size: [0.15, 2.28, 0.15], pos: [2.95, 4.5, 2.38] },
  ].forEach(({ size, pos }) => addBox(base, size, pos, 6, 0.32, mats.plaster, "rise"));
  addBox(base, [2.45, 0.14, 0.5], [1.58, 3.54, 2.48], 6, 0.42, mats.slab, "span-x");
  for (let x = 0.48; x <= 2.68; x += 0.42) {
    addBox(base, [0.045, 0.64, 0.045], [x, 3.92, 2.68], 6, 0.55, mats.frame, "rise");
  }
  addBox(base, [2.3, 0.06, 0.06], [1.58, 4.23, 2.68], 6, 0.61, mats.frame, "span-x");
  addBox(base, [10.7, 0.1, 1.25], [0, 0.035, 5.1], 7, 0.08, mats.paving, "scale");
  addBox(base, [1.6, 0.1, 6.8], [5.9, 0.035, 0], 7, 0.15, mats.paving, "scale");
  addBox(base, [1.5, 0.1, 6.8], [-5.9, 0.035, 0], 7, 0.2, mats.paving, "scale");
  // Low-poly planting beds with layered foliage rather than decorative geometry.
  [-4.55, 4.55].forEach((x) => {
    addBox(base, [1.05, 0.18, 0.82], [x, 0.08, 2.9], 7, 0.34, mats.darkGreen, "scale");
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 1.05, 7), mats.form);
    trunk.position.set(x, 0.68, 2.9);
    trunk.castShadow = true;
    trunk.visible = false;
    base.add(trunk);
    pieces.push({ mesh: trunk, start: (7 + 0.45) / STAGES, mode: "rise" });
    [
      [0, 1.35, 0, 0.75],
      [-0.25, 1.07, 0.1, 0.62],
      [0.22, 1.08, -0.12, 0.62],
    ].forEach(([dx, y, dz, radius], j) => {
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 1), j === 0 ? mats.green : mats.darkGreen);
      crown.position.set(x + dx, y, 2.9 + dz);
      crown.castShadow = true;
      crown.visible = false;
      base.add(crown);
      pieces.push({ mesh: crown, start: (7 + 0.5 + j * 0.025) / STAGES, mode: "scale" });
    });
  });

  return { materials: mats, base };
}

function progressFor(piece, progress, reducedMotion, cutaway, delta) {
  const revealDuration = reducedMotion ? 0.00001 : 0.052;
  const reveal = THREE.MathUtils.clamp((progress - piece.start) / revealDuration, 0, 1);
  const eased = reveal * reveal * (3 - 2 * reveal);
  if (reveal <= 0) {
    piece.mesh.visible = false;
    return;
  }
  piece.mesh.visible = true;
  piece.mesh.position.y = piece.targetY === undefined ? piece.mesh.position.y : piece.targetY + (1 - eased) * 0.42;
  const scale = Math.max(0.001, eased);
  if (piece.mode === "span-x") {
    piece.mesh.scale.set(scale, 1, 1);
  } else if (piece.mode === "span-z") {
    piece.mesh.scale.set(1, 1, scale);
  } else if (piece.mode === "scale") {
    piece.mesh.scale.set(scale, scale, scale);
  } else {
    piece.mesh.scale.set(1, scale, 1);
  }
  const cutawayTarget = cutaway && piece.hideWhenCutaway ? 0 : 1;
  const cutawayFactor = reducedMotion
    ? cutawayTarget
    : (piece.cutawayFactor ?? 1) + (cutawayTarget - (piece.cutawayFactor ?? 1)) * (1 - Math.exp(-14 * delta));
  piece.cutawayFactor = cutawayFactor;
  let retirementFade = 0;
  if (piece.retire !== null && piece.retire !== undefined && !(cutaway && piece.cutawayDetail)) {
    retirementFade = THREE.MathUtils.clamp((progress - piece.retire / STAGES) / 0.04, 0, 1);
  }
  piece.mesh.visible = cutawayFactor > 0.005 && retirementFade < 0.995;
  if ((piece.retire !== null && piece.retire !== undefined) || piece.hideWhenCutaway) {
    const materials = piece.fadeMaterials ?? (piece.mesh.material ? [{ material: piece.mesh.material, opacity: piece.baseOpacity ?? 1 }] : []);
    materials.forEach(({ material, opacity }) => {
      material.transparent = true;
      material.opacity = opacity * cutawayFactor * (1 - retirementFade);
      material.depthWrite = material.opacity > 0.995;
    });
  }
}

export default function ConstructionScene({ progressRef, viewRef }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9ece6);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(10.5, 8.4, 12.7);
    camera.lookAt(0, 2.55, 0);

    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5));
    renderer.shadowMap.enabled = window.innerWidth > 700;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf6f5ed, 0x85877e, 2.25));
    const sun = new THREE.DirectionalLight(0xfff3dc, 3.1);
    sun.position.set(-7, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc8ddd4, 1.15);
    fill.position.set(8, 6, -7);
    scene.add(fill);

    const pieces = [];
    const { base } = createModel(scene, pieces);
    base.position.set(1.15, 0, 0);
    const cameraTarget = new THREE.Vector3(1.15, 2.65, 0);
    const desiredCamera = new THREE.Vector3();
    const orbit = viewRef.current;
    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    const setSize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      renderer.shadowMap.enabled = width > 700;
      sun.castShadow = width > 700;
      camera.aspect = width / height;
      camera.position.set(width < 650 ? 13.3 : 10.5, width < 650 ? 10.2 : 8.4, width < 650 ? 15.8 : 12.7);
      camera.lookAt(cameraTarget);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(host);
    setSize();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = false;
    let animationId = 0;
    const startRendering = () => {
      if (visible && !document.hidden && !animationId) animationId = requestAnimationFrame(render);
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) startRendering();
      else {
        cancelAnimationFrame(animationId);
        animationId = 0;
      }
    });
    visibilityObserver.observe(host);
    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
        animationId = 0;
      } else startRendering();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    const onPointerMove = (event) => {
      if (drag && event.pointerId === drag.pointerId) {
        const deltaX = event.clientX - drag.lastX;
        const deltaY = event.clientY - drag.lastY;
        if (!drag.active) {
          const totalX = event.clientX - drag.startX;
          const totalY = event.clientY - drag.startY;
          if (Math.abs(totalX) > 5 && Math.abs(totalX) > Math.abs(totalY) * 1.15) {
            drag.active = true;
            host.classList.add("is-dragging");
            host.style.cursor = "grabbing";
          } else if (Math.abs(totalY) > 8) {
            drag = null;
            return;
          }
        }
        if (drag?.active) {
          orbit.targetAzimuth -= deltaX * 0.008;
          if (drag.pointerType === "mouse") {
            orbit.targetPitch = THREE.MathUtils.clamp(orbit.targetPitch + deltaY * 0.006, -0.3, 0.42);
          }
          orbit.velocity = -deltaX * 0.0007;
          drag.lastX = event.clientX;
          drag.lastY = event.clientY;
        }
      }
      const bounds = host.getBoundingClientRect();
      pointerTarget.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2);
    };
    let drag = null;
    const onPointerDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        lastX: event.clientX,
        startY: event.clientY,
        lastY: event.clientY,
        pointerType: event.pointerType,
        active: event.pointerType === "mouse",
      };
      orbit.velocity = 0;
      if (drag.active) {
        host.classList.add("is-dragging");
        host.style.cursor = "grabbing";
        host.setPointerCapture(event.pointerId);
      }
    };
    const finishDrag = (event) => {
      if (drag?.pointerId === event.pointerId) {
        drag = null;
        host.classList.remove("is-dragging");
        host.style.cursor = "grab";
        if (event.pointerType === "mouse" && host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
      }
    };
    const resetViewOnScroll = () => {
      const fullTurn = Math.PI * 2;
      orbit.targetAzimuth = Math.round(orbit.azimuth / fullTurn) * fullTurn;
      orbit.targetPitch = 0;
      orbit.targetZoom = 1;
      orbit.velocity = 0;
      pointerTarget.set(0, 0);
    };
    const onKeyDown = (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        orbit.targetAzimuth += event.key === "ArrowLeft" ? -0.16 : 0.16;
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        orbit.targetPitch = THREE.MathUtils.clamp(orbit.targetPitch + (event.key === "ArrowUp" ? 0.08 : -0.08), -0.3, 0.42);
      } else if (event.key === "+" || event.key === "=") {
        orbit.targetZoom = Math.min(1.3, orbit.targetZoom + 0.12);
      } else if (event.key === "-") {
        orbit.targetZoom = Math.max(0.82, orbit.targetZoom - 0.12);
      } else if (event.key === "Home") {
        event.preventDefault();
        const fullTurn = Math.PI * 2;
        orbit.targetAzimuth = Math.round(orbit.azimuth / fullTurn) * fullTurn;
        orbit.targetPitch = 0;
        orbit.targetZoom = 1;
      }
    };
    host.style.cursor = "grab";
    host.tabIndex = 0;
    host.setAttribute("role", "group");
    host.setAttribute("aria-label", "Interactive 3D building model");
    host.setAttribute("aria-describedby", "building-keyboard-help");
    host.addEventListener("keydown", onKeyDown);
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerup", finishDrag);
    host.addEventListener("pointercancel", finishDrag);
    window.addEventListener("scroll", resetViewOnScroll, { passive: true });
    let lastFrame = performance.now();
    const render = (timestamp = performance.now()) => {
      animationId = 0;
      if (!visible || document.hidden) return;
      const delta = Math.min((timestamp - lastFrame) / 1000, 0.05);
      lastFrame = timestamp;
      pointer.lerp(pointerTarget, reducedMotion ? 0.04 : 0.035);
      const progress = THREE.MathUtils.clamp(progressRef.current, 0, 1);
      if (!reducedMotion && !drag?.active && Math.abs(orbit.velocity ?? 0) > 0.0001) {
        orbit.targetAzimuth += orbit.velocity;
        orbit.velocity *= Math.exp(-7 * delta);
      }
      const orbitDamping = reducedMotion ? 1 : 1 - Math.exp(-8 * delta);
      orbit.azimuth += (orbit.targetAzimuth - orbit.azimuth) * orbitDamping;
      orbit.pitch += (orbit.targetPitch - orbit.pitch) * orbitDamping;
      orbit.zoom += (orbit.targetZoom - orbit.zoom) * orbitDamping;
      pieces.forEach((piece) => progressFor(piece, progress, reducedMotion, orbit.cutaway, delta));
      if (!reducedMotion) {
        base.rotation.y = progress * 0.22 + pointer.x * 0.018;
        base.rotation.x = pointer.y * -0.009;
      }
      const angle = progress * Math.PI * 1.6 + orbit.azimuth;
      const width = host.clientWidth;
      const aspect = width / Math.max(host.clientHeight, 1);
      const baseDistance = 25.5;
      const distance = aspect < 1
        ? baseDistance * (1.35 / aspect) * (width < 650 ? 0.68 : 1.36)
        : baseDistance * (width < 1200 ? 1.6 : 1.4);
      const frameOffset = width >= 1200 ? 6.5 : width > 860 ? 10.5 : width >= 650 ? 8 : 0;
      const verticalFraming = width < 650 ? 3.8 : width <= 860 ? 4.2 : 0;
      const cameraAngle = 0.69 + angle;
      const screenOffset = frameOffset * Math.cos(0.69);
      const focusX = cameraTarget.x - Math.cos(cameraAngle) * screenOffset + Math.sin(progress * Math.PI * 2) * 0.48;
      const focusZ = cameraTarget.z + Math.sin(cameraAngle) * screenOffset;
      const cameraElevation = THREE.MathUtils.clamp(0.35 + orbit.pitch, 0.1, 0.77);
      desiredCamera.set(
        cameraTarget.x + distance * Math.sin(cameraAngle) / orbit.zoom,
        cameraTarget.y + (distance * cameraElevation - progress * 0.55) / orbit.zoom,
        cameraTarget.z + distance * Math.cos(cameraAngle) / orbit.zoom,
      );
      if (reducedMotion) camera.position.copy(desiredCamera);
      else camera.position.lerp(desiredCamera, 0.045);
      camera.lookAt(focusX, cameraTarget.y + verticalFraming + progress * 0.13, focusZ);
      camera.updateMatrixWorld();
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(render);
    };
    startRendering();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("scroll", resetViewOnScroll);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointerup", finishDrag);
      host.removeEventListener("pointercancel", finishDrag);
      host.removeEventListener("keydown", onKeyDown);
      host.classList.remove("is-dragging");
      host.style.cursor = "";
      const geometries = new Set();
      const materials = new Set();
      const textures = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        const objectMaterials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
        objectMaterials.forEach((mat) => {
          materials.add(mat);
          [mat.map, mat.bumpMap, mat.normalMap, mat.roughnessMap, mat.metalnessMap].forEach((texture) => {
            if (texture) textures.add(texture);
          });
        });
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((mat) => mat.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progressRef, viewRef]);

  return <div className="construction-scene" ref={hostRef} />;
}
