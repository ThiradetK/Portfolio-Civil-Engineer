import { useEffect, useRef } from "react";
import * as THREE from "three";

function box(parent, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

export default function BuildingScene() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x101714, 0.035);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(8.2, 6.3, 10.8);
    camera.lookAt(0, 2.1, 0);
    let cameraBaseX = 8.2;
    let cameraBaseY = 6.3;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xd6e7db, 0x30352e, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffe5b2, 3.2);
    keyLight.position.set(-5, 10, 7);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x82c9cf, 2.4);
    rimLight.position.set(6, 7, -5);
    scene.add(rimLight);

    const structure = new THREE.Group();
    structure.position.x = 1.15;
    structure.position.y = 0.1;
    scene.add(structure);

    const concrete = new THREE.MeshStandardMaterial({
      color: 0x9b9e94,
      roughness: 0.78,
      metalness: 0.08,
    });
    const edge = new THREE.MeshStandardMaterial({
      color: 0xe0c78e,
      roughness: 0.38,
      metalness: 0.55,
      emissive: 0x362811,
      emissiveIntensity: 0.32,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x78b9bd,
      roughness: 0.18,
      metalness: 0.22,
      transparent: true,
      opacity: 0.34,
      transmission: 0.18,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x303b37,
      roughness: 0.62,
      metalness: 0.24,
    });
    const levels = [];
    const floorY = [0.65, 1.72, 2.79, 3.86];
    const width = 3.8;
    const depth = 3.15;
    const columns = [
      [-width / 2, -depth / 2],
      [width / 2, -depth / 2],
      [-width / 2, depth / 2],
      [width / 2, depth / 2],
    ];

    // The floor plates, perimeter beams, facade mullions and core stay legible as a structural frame.
    for (let i = 0; i < floorY.length; i += 1) {
      const level = new THREE.Group();
      level.position.y = -1.8;
      level.userData.targetY = floorY[i];
      structure.add(level);
      levels.push(level);

      box(level, [width, 0.13, depth], [0, 0, 0], concrete);
      for (const [x, z] of columns) {
        box(level, [0.22, 0.94, 0.22], [x, -0.48, z], concrete);
      }
      box(level, [width, 0.14, 0.17], [0, -0.47, -depth / 2], edge);
      box(level, [width, 0.14, 0.17], [0, -0.47, depth / 2], edge);
      box(level, [0.17, 0.14, depth], [-width / 2, -0.47, 0], edge);
      box(level, [0.17, 0.14, depth], [width / 2, -0.47, 0], edge);

      if (i < floorY.length - 1) {
        for (const x of [-1.28, 0, 1.28]) {
          box(level, [0.055, 0.76, 0.055], [x, 0.13, -depth / 2 + 0.12], dark);
          box(level, [0.055, 0.76, 0.055], [x, 0.13, depth / 2 - 0.12], dark);
        }
        const window = box(level, [2.45, 0.63, 0.035], [0, 0.15, depth / 2 - 0.04], glass);
        window.renderOrder = 1;
      }
    }

    const core = new THREE.Group();
    core.position.y = -1.6;
    core.userData.targetY = 2.25;
    structure.add(core);
    levels.push(core);
    box(core, [0.76, 4.45, 0.78], [0.78, 0, 0.66], dark);
    box(core, [0.81, 0.025, 0.83], [0.78, -0.42, 0.66], edge);
    for (let i = 0; i < 8; i += 1) {
      box(core, [0.82, 0.025, 0.84], [0.78, -1.85 + i * 0.5, 0.66], edge);
    }

    const roof = new THREE.Group();
    roof.position.y = -1.7;
    roof.userData.targetY = 4.8;
    structure.add(roof);
    levels.push(roof);
    box(roof, [4.2, 0.18, 3.55], [0, 0, 0], concrete);
    box(roof, [0.26, 0.55, 0.26], [-1.55, 0.34, -1.25], edge);
    box(roof, [0.26, 0.55, 0.26], [1.55, 0.34, -1.25], edge);
    box(roof, [0.26, 0.55, 0.26], [-1.55, 0.34, 1.25], edge);
    box(roof, [0.26, 0.55, 0.26], [1.55, 0.34, 1.25], edge);

    const site = new THREE.Group();
    scene.add(site);
    const ground = new THREE.GridHelper(28, 28, 0x6c9d8e, 0x30493f);
    ground.position.y = -0.05;
    ground.material.transparent = true;
    ground.material.opacity = 0.48;
    site.add(ground);
    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(5.25, 0.18, 4.6),
      new THREE.MeshStandardMaterial({ color: 0x56645a, roughness: 0.88 }),
    );
    foundation.position.set(1.15, 0.08, 0);
    site.add(foundation);

    const crane = new THREE.Group();
    crane.position.set(-2.35, 0, -1.9);
    scene.add(crane);
    box(crane, [0.12, 6.4, 0.12], [0, 3.2, 0], edge);
    box(crane, [0.12, 0.12, 4.5], [0, 6.1, -1.2], edge);
    box(crane, [0.12, 0.12, 1.2], [0, 6.1, 2.4], edge);
    for (let i = 0; i < 8; i += 1) {
      box(crane, [0.065, 0.065, 0.5], [0, 3.7 + i * 0.68, 0], dark);
    }
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1.65, 6),
      dark,
    );
    cable.position.set(0, 5.22, -2.1);
    crane.add(cable);
    box(crane, [0.64, 0.5, 0.55], [0, 4.22, -2.1], edge);

    const glow = new THREE.PointLight(0xf5cf83, 32, 9, 2);
    glow.position.set(3.15, 4.8, 3.8);
    scene.add(glow);

    const pointer = { x: 0, y: 0 };
    const targetPointer = { x: 0, y: 0 };
    let visible = true;
    let frame = 0;
    let previousTime = 0;
    let elapsed = 0;
    let intro = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onPointerMove = (event) => {
      const bounds = host.getBoundingClientRect();
      targetPointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      targetPointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    const onPointerLeave = () => {
      targetPointer.x = 0;
      targetPointer.y = 0;
    };
    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      const isNarrow = clientWidth < 640;
      cameraBaseX = isNarrow ? 9.5 : 8.2;
      cameraBaseY = isNarrow ? 6.7 : 6.3;
      camera.fov = isNarrow ? 42 : 32;
      camera.position.z = isNarrow ? 13 : 10.8;
      camera.position.x = cameraBaseX;
      camera.position.y = cameraBaseY;
      structure.position.x = isNarrow ? 0.35 : 1.15;
      foundation.position.x = isNarrow ? 0.35 : 1.15;
      crane.position.x = isNarrow ? -3.15 : -2.35;
      glow.position.x = isNarrow ? 2.35 : 3.15;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    resizeObserver.observe(host);
    intersectionObserver.observe(host);
    host.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave, { passive: true });

    const render = (time) => {
      frame = requestAnimationFrame(render);
      if (!visible) return;
      const delta = Math.min((time - (previousTime || time)) / 1000, 0.04);
      previousTime = time;
      elapsed += delta;
      const motion = reduceMotion.matches ? 0 : 1;
      pointer.x = THREE.MathUtils.damp(pointer.x, targetPointer.x * motion, 2.4, delta);
      pointer.y = THREE.MathUtils.damp(pointer.y, targetPointer.y * motion, 2.4, delta);
      if (!reduceMotion.matches) intro = Math.min(intro + delta * 0.48, 1);
      else intro = 1;
      const ease = 1 - (1 - intro) ** 3;
      for (const [index, level] of levels.entries()) {
        const lag = index * 0.075;
        const progress = THREE.MathUtils.clamp((ease - lag) / (1 - lag), 0, 1);
        level.position.y = THREE.MathUtils.damp(
          level.position.y,
          level.userData.targetY * progress + (1 - progress) * (level.userData.targetY - 1.8),
          3.5,
          delta,
        );
      }
      structure.rotation.y = pointer.x * 0.16 + Math.sin(elapsed * 0.24) * 0.035 * motion;
      structure.rotation.x = -pointer.y * 0.055;
      crane.rotation.y = Math.sin(elapsed * 0.18) * 0.025 * motion;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraBaseX + pointer.x * 0.55, 1.2, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraBaseY + pointer.y * 0.24, 1.2, delta);
      camera.lookAt(0, 2.15, 0);
      glow.intensity = 31 + Math.sin(elapsed * 0.75) * 2 * motion;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="building-scene" aria-hidden="true" />;
}
