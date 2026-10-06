"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { CanvasTexture, MeshStandardMaterial, SRGBColorSpace } from "three";

function cargoTexture(side: "long" | "door" | "roof") {
  const canvas = document.createElement("canvas");
  canvas.width = side === "long" ? 1024 : 512;
  canvas.height = 320;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = side === "roof" ? "#ba531d" : "#dc6b24";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const step = side === "long" ? 27 : 25;
  for (let x = 15; x < canvas.width; x += step) {
    ctx.fillStyle = "#a94617";
    ctx.fillRect(x, 7, 4, canvas.height - 14);
    ctx.fillStyle = "#f18937";
    ctx.fillRect(x + 5, 7, 3, canvas.height - 14);
  }
  ctx.strokeStyle = "#8f3e16";
  ctx.lineWidth = 9;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  if (side === "long") {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 185px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("JSL", canvas.width / 2, 171);
    ctx.font = "bold 27px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("JSLU 456789 2", canvas.width - 40, 49);
    ctx.fillText("CARGO / 001", canvas.width - 40, canvas.height - 34);
  }
  if (side === "door") {
    ctx.strokeStyle = "#703716";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 7);
    ctx.lineTo(canvas.width / 2, canvas.height - 7);
    ctx.stroke();
    ctx.strokeStyle = "#d5ad8e";
    ctx.lineWidth = 8;
    for (const x of [36, canvas.width / 2 - 27, canvas.width / 2 + 27, canvas.width - 36]) {
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x, canvas.height - 12);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "bold 44px Arial, sans-serif";
    ctx.fillText("JSL", 95, 110);
    ctx.font = "19px Arial, sans-serif";
    ctx.fillText("JSLU 456789 2", 84, 145);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function Container() {
  const ref = useRef<Group>(null);
  const materials = useMemo(() => {
    const long = cargoTexture("long");
    const door = cargoTexture("door");
    const roof = cargoTexture("roof");
    return [door, door, roof, roof, long, long].map((map) => new MeshStandardMaterial({ map, roughness: 0.76, metalness: 0.22 }));
  }, []);

  useFrame(({ gl }) => {
    if (!ref.current) return;
    const value = getComputedStyle(gl.domElement).getPropertyValue("--cargo-angle");
    const angle = Number.parseFloat(value);
    ref.current.rotation.y = Number.isFinite(angle) ? angle : 1.17;
  });

  return <>
    <ambientLight intensity={2.1} />
    <directionalLight position={[3, 5, 7]} intensity={2.7} />
    <directionalLight position={[-5, 2, -4]} intensity={1.1} />
    <group ref={ref} rotation={[0, 1.17, 0]}>
      <mesh material={materials} castShadow>
        <boxGeometry args={[4.55, 1.42, 1.62]} />
      </mesh>
      {[-2.29, 2.29].map((x) => <mesh key={x} position={[x, 0, 0]}>
        <boxGeometry args={[0.045, 1.46, 1.67]} />
        <meshStandardMaterial color="#904018" metalness={0.62} roughness={0.35} />
      </mesh>)}
    </group>
  </>;
}

export default function YardCargo3D() {
  return <Canvas orthographic camera={{ position: [0, 1.6, 9], zoom: 105, near: 0.1, far: 100 }} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
    <Container />
  </Canvas>;
}
