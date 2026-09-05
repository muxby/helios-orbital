"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useHeliosStore } from "@/lib/store";
import { subsolarDirection } from "./geo";

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDir;
  uniform float terminator;
  uniform float useMaps;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  void main() {
    vec3 n = normalize(vWorldNormal);
    float light = dot(n, normalize(sunDir));
    vec3 dayColor = mix(vec3(0.05, 0.12, 0.28), vec3(0.18, 0.42, 0.72), 0.55 + 0.45 * vUv.y);
    vec3 nightColor = vec3(0.012, 0.025, 0.055);
    if (useMaps > 0.5) {
      dayColor = texture2D(dayMap, vUv).rgb;
      nightColor = texture2D(nightMap, vUv).rgb * 1.15;
    }
    float t = terminator > 0.5 ? smoothstep(-0.04, 0.12, light) : 1.0;
    vec3 color = mix(nightColor * 0.28, dayColor, t);
    float spec = pow(max(light, 0.0), 28.0) * 0.14 * t;
    float limb = terminator > 0.5 ? (1.0 - smoothstep(0.02, 0.12, abs(light))) * 0.18 : 0.0;
    gl_FragColor = vec4(color + spec + vec3(0.35, 0.72, 0.95) * limb, 1.0);
  }
`;

const ATM_VERT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATM_FRAG = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.2);
    gl_FragColor = vec4(0.25, 0.72, 0.95, f * 0.42);
  }
`;

export function Earth() {
  const showTerminator = useHeliosStore((s) => s.showTerminator);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const sunMesh = useRef<THREE.Mesh>(null);
  const termRef = useRef<THREE.Mesh>(null);
  const sun = useMemo(() => new THREE.Vector3(1, 0.2, 0.4), []);
  const maps = useRef<{ day: THREE.Texture; night: THREE.Texture } | null>(null);
  const zAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  const uniforms = useMemo(
    () => ({
      dayMap: { value: new THREE.Texture() },
      nightMap: { value: new THREE.Texture() },
      sunDir: { value: sun },
      terminator: { value: 1 },
      useMaps: { value: 0 },
    }),
    [sun],
  );

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let alive = true;
    Promise.all([
      loader.loadAsync("/textures/earth-day.jpg"),
      loader.loadAsync("/textures/earth-night.jpg"),
    ])
      .then(([day, night]) => {
        if (!alive) return;
        day.colorSpace = THREE.SRGBColorSpace;
        night.colorSpace = THREE.SRGBColorSpace;
        day.anisotropy = 8;
        night.anisotropy = 8;
        maps.current = { day, night };
        if (matRef.current) {
          matRef.current.uniforms.dayMap.value = day;
          matRef.current.uniforms.nightMap.value = night;
          matRef.current.uniforms.useMaps.value = 1;
        }
      })
      .catch(() => {
        if (matRef.current) matRef.current.uniforms.useMaps.value = 0;
      });
    return () => {
      alive = false;
    };
  }, []);

  useFrame(() => {
    const epoch = useHeliosStore.getState().clock.epochMs;
    const on = useHeliosStore.getState().showTerminator;
    const dir = subsolarDirection(epoch);
    sun.set(dir.x, dir.y, dir.z);
    if (matRef.current) {
      matRef.current.uniforms.sunDir.value.copy(sun);
      matRef.current.uniforms.terminator.value = on ? 1 : 0;
    }
    if (lightRef.current) {
      lightRef.current.position.set(sun.x * 10, sun.y * 10, sun.z * 10);
      lightRef.current.intensity = on ? 1.25 : 0.55;
    }
    if (sunMesh.current) {
      sunMesh.current.position.copy(sun).multiplyScalar(14);
      sunMesh.current.visible = on;
    }
    if (termRef.current) {
      termRef.current.visible = on;
      termRef.current.quaternion.setFromUnitVectors(zAxis, sun.clone().normalize());
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
        />
      </mesh>
      <mesh ref={termRef} visible={showTerminator}>
        <ringGeometry args={[1.004, 1.012, 160]} />
        <meshBasicMaterial
          color="#7ee7f7"
          side={THREE.DoubleSide}
          transparent
          opacity={0.55}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={sunMesh} visible={showTerminator}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshBasicMaterial color="#fff4c4" toneMapped={false} />
      </mesh>
      <mesh scale={1.038}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={ATM_VERT}
          fragmentShader={ATM_FRAG}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <ambientLight intensity={showTerminator ? 0.12 : 0.45} />
      <directionalLight ref={lightRef} position={[8, 1.6, 3.2]} intensity={1.15} color="#f4f1e6" />
    </group>
  );
}
