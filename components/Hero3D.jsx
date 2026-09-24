"use client";

import { useEffect, useRef, useState } from "react";

const PALETTE = [0x34d399, 0x22d3ee, 0x60a5fa, 0x94a3b8, 0xfbbf24, 0x38bdf8];

/** Cheap SVG stand-in used if WebGL is unavailable. */
function CityFallback() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" role="img" aria-label="City illustration">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#sky)" />
      {[20, 60, 95, 150, 195, 240, 275].map((x, i) => (
        <rect
          key={x}
          x={x}
          y={110 - (i % 3) * 22}
          width={26 + (i % 2) * 8}
          height={90 + (i % 3) * 22}
          rx="3"
          fill={i % 2 ? "#134e4a" : "#1e293b"}
        />
      ))}
      <circle cx="160" cy="150" r="7" fill="#f87171" className="animate-pulse" />
      <path d="M160 150V96" stroke="#f87171" strokeWidth="2" strokeDasharray="4 4" />
    </svg>
  );
}

export default function Hero3D({ className = "" }) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    import("three")
      .then((THREE) => {
        const mount = mountRef.current;
        if (disposed || !mount || !THREE) return;

        let renderer;
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch {
          setFailed(true);
          return;
        }

        const width = mount.clientWidth || 520;
        const height = mount.clientHeight || 380;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);

        // Pull the camera back on narrow/tall canvases so the whole block is visible.
        const base = { x: 10.5, y: 8.5, z: 13 };
        const frameCamera = (w, h) => {
          const aspect = w / h;
          const fit = 1.3 * (1 + Math.max(0, 1.5 - aspect) * 0.35);
          base.x = 10.5 * fit;
          base.y = 8.5 * fit;
          base.z = 13 * fit;
          camera.position.set(base.x, base.y, base.z);
          camera.lookAt(0, 1.4, 0);
        };
        frameCamera(width, height);

        scene.add(new THREE.HemisphereLight(0xa7f3d0, 0x0b1220, 1.05));
        const key = new THREE.DirectionalLight(0xffffff, 1.5);
        key.position.set(7, 12, 6);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0x38bdf8, 0.7);
        rim.position.set(-8, 5, -7);
        scene.add(rim);

        const city = new THREE.Group();
        scene.add(city);

        const disposables = [];
        const track = (resource) => {
          disposables.push(resource);
          return resource;
        };

        // Ground disc
        const ground = new THREE.Mesh(
          track(new THREE.CircleGeometry(10.5, 56)),
          track(new THREE.MeshStandardMaterial({ color: 0x0b1729, roughness: 0.95 }))
        );
        ground.rotation.x = -Math.PI / 2;
        city.add(ground);

        // Road running diagonally through the block
        const road = new THREE.Mesh(
          track(new THREE.PlaneGeometry(20, 3.4)),
          track(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }))
        );
        road.rotation.x = -Math.PI / 2;
        road.rotation.z = Math.PI / 12;
        road.position.y = 0.02;
        city.add(road);

        const markGeo = track(new THREE.BoxGeometry(1.5, 0.04, 0.18));
        const markMat = track(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 }));
        for (let i = -6; i <= 6; i += 1) {
          const mark = new THREE.Mesh(markGeo, markMat);
          mark.position.set(i * 1.55, 0.05, i * 0.4);
          mark.rotation.y = Math.PI / 12;
          city.add(mark);
        }

        // Buildings — a low-poly block with the road and plaza kept clear
        for (let x = -4; x <= 4; x += 1) {
          for (let z = -4; z <= 4; z += 1) {
            if (Math.abs(z - x * 0.25) < 1.9) continue; // keep the road clear
            if (Math.abs(x) < 1 && Math.abs(z) < 1) continue; // leave the plaza
            if ((x + z) % 7 === 0) continue;

            const h = 1.4 + Math.random() * 4.6;
            const w = 0.85 + Math.random() * 0.5;
            const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            const box = new THREE.Mesh(
              track(new THREE.BoxGeometry(w, h, w)),
              track(
                new THREE.MeshStandardMaterial({
                  color,
                  roughness: 0.55,
                  metalness: 0.15,
                  flatShading: true,
                })
              )
            );
            box.position.set(
              x * 1.75 + (Math.random() - 0.5) * 0.4,
              h / 2,
              z * 1.75 + (Math.random() - 0.5) * 0.4
            );
            city.add(box);

            if (Math.random() > 0.55) {
              const win = new THREE.Mesh(
                track(new THREE.BoxGeometry(w * 0.5, 0.14, 0.05)),
                track(
                  new THREE.MeshStandardMaterial({
                    color: 0xfff7d6,
                    emissive: 0xfde68a,
                    emissiveIntensity: 0.9,
                  })
                )
              );
              win.position.set(box.position.x, h * 0.65, box.position.z - w / 2 - 0.03);
              city.add(win);
            }
          }
        }

        // The reported issue: pulsing marker ring plus floating pin
        const ring = new THREE.Mesh(
          track(new THREE.TorusGeometry(0.62, 0.07, 10, 40)),
          track(
            new THREE.MeshStandardMaterial({
              color: 0xf87171,
              emissive: 0xef4444,
              emissiveIntensity: 1.1,
            })
          )
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(0, 0.06, 0);
        city.add(ring);

        const pin = new THREE.Mesh(
          track(new THREE.ConeGeometry(0.34, 0.95, 6)),
          track(
            new THREE.MeshStandardMaterial({
              color: 0xfca5a5,
              emissive: 0xef4444,
              emissiveIntensity: 0.8,
              flatShading: true,
            })
          )
        );
        pin.rotation.x = Math.PI;
        pin.position.set(0, 2.1, 0);
        city.add(pin);

        const halo = new THREE.Mesh(
          track(new THREE.SphereGeometry(0.22, 16, 16)),
          track(
            new THREE.MeshStandardMaterial({
              color: 0xfecaca,
              emissive: 0xf87171,
              emissiveIntensity: 1.4,
            })
          )
        );
        halo.position.set(0, 2.68, 0);
        city.add(halo);

        // Interaction: idle spin, drag to orbit, gentle pointer parallax
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        let pointer = { x: 0, y: 0 };
        let dragging = false;
        let dragYaw = 0;
        let lastPointer = { x: 0, y: 0 };

        const onPointerDown = (event) => {
          dragging = true;
          lastPointer = { x: event.clientX, y: event.clientY };
          mount.style.cursor = "grabbing";
        };
        const onPointerUp = () => {
          dragging = false;
          mount.style.cursor = "grab";
        };
        const onPointerMove = (event) => {
          const rect = mount.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
          if (dragging) {
            dragYaw += (event.clientX - lastPointer.x) * 0.008;
            lastPointer = { x: event.clientX, y: event.clientY };
          }
        };

        mount.style.cursor = "grab";
        mount.addEventListener("pointerdown", onPointerDown);
        mount.addEventListener("pointermove", onPointerMove);
        mount.addEventListener("pointerup", onPointerUp);
        mount.addEventListener("pointerleave", onPointerUp);

        const observer = new ResizeObserver(() => {
          const w = mount.clientWidth || width;
          const h = mount.clientHeight || height;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          frameCamera(w, h);
        });
        observer.observe(mount);

        let frame = 0;
        let elapsed = 0;
        let spin = 0;
        let last = performance.now();

        const renderFrame = (now) => {
          const delta = Math.min((now - last) / 1000, 0.05);
          last = now;
          elapsed += delta;

          if (!reduced) {
            if (!dragging) spin += delta * 0.1;
            city.rotation.y = spin + dragYaw;

            const pulse = 1 + Math.sin(elapsed * 2.4) * 0.16;
            ring.scale.setScalar(pulse);
            ring.material.emissiveIntensity = 0.7 + Math.sin(elapsed * 2.4) * 0.5;

            const bob = Math.sin(elapsed * 1.6) * 0.14;
            pin.position.y = 2.1 + bob;
            halo.position.y = 2.68 + bob;

            camera.position.x += (base.x + pointer.x * 1.6 - camera.position.x) * 0.06;
            camera.position.z += (base.z - pointer.x * 1.2 - camera.position.z) * 0.06;
            camera.position.y += (base.y + pointer.y * 0.9 + Math.sin(elapsed * 0.5) * 0.25 - camera.position.y) * 0.06;
            camera.lookAt(0, 1.4, 0);
          }

          renderer.render(scene, camera);
          frame = requestAnimationFrame(renderFrame);
        };

        if (reduced) {
          city.rotation.y = 0.4;
          renderer.render(scene, camera);
        } else {
          frame = requestAnimationFrame(renderFrame);
        }

        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          mount.removeEventListener("pointerdown", onPointerDown);
          mount.removeEventListener("pointermove", onPointerMove);
          mount.removeEventListener("pointerup", onPointerUp);
          mount.removeEventListener("pointerleave", onPointerUp);
          disposables.forEach((resource) => resource?.dispose?.());
          renderer.dispose();
          if (renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement);
          }
        };
      })
      .catch(() => setFailed(true));

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  if (failed) {
    return (
      <div className={className}>
        <CityFallback />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ touchAction: "pan-y" }}
      aria-label="Interactive 3D model of a city block with a reported issue marker"
      role="img"
    />
  );
}
