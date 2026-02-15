import * as THREE from 'three';
import { ShapeType } from '../types.ts';

const COUNT = 3000;

export const generateParticles = (shape: ShapeType, imageData?: ImageData | null): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];

  switch (shape) {
    case ShapeType.HEART:
      generateHeart(positions);
      break;
    case ShapeType.SATURN:
      generateSaturn(positions);
      break;
    case ShapeType.FLOWER:
      generateFlower(positions);
      break;
    case ShapeType.FIREWORKS:
      generateFireworks(positions);
      break;
    case ShapeType.CUSTOM:
      if (imageData) {
        generateFromImage(positions, imageData);
      } else {
        generateSphere(positions);
      }
      break;
    case ShapeType.STARS:
    default:
      generateSphere(positions);
      break;
  }

  const float32Array = new Float32Array(positions);
  geometry.setAttribute('position', new THREE.BufferAttribute(float32Array, 3));
  geometry.center();
  return geometry;
};

const generateSphere = (positions: number[]) => {
  for (let i = 0; i < COUNT; i++) {
    const phi = Math.acos(-1 + (2 * i) / COUNT);
    const theta = Math.sqrt(COUNT * Math.PI) * phi;
    const r = 4 + Math.random() * 0.5;
    positions.push(
      r * Math.cos(theta) * Math.sin(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(phi)
    );
  }
};

const generateHeart = (positions: number[]) => {
  for (let i = 0; i < COUNT; i++) {
    const t = Math.random() * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const z = (Math.random() - 0.5) * 2;
    const scale = 0.35;
    const spread = Math.sqrt(Math.random()); 
    positions.push(x * scale * spread, y * scale * spread, z * spread);
  }
};

const generateSaturn = (positions: number[]) => {
  for (let i = 0; i < COUNT * 0.4; i++) {
    const phi = Math.acos(-1 + (2 * i) / (COUNT * 0.4));
    const theta = Math.sqrt((COUNT * 0.4) * Math.PI) * phi;
    const r = 2.5;
    positions.push(
      r * Math.cos(theta) * Math.sin(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(phi)
    );
  }
  for (let i = 0; i < COUNT * 0.6; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 2;
    positions.push(
      r * Math.cos(theta),
      (Math.random() - 0.5) * 0.2,
      r * Math.sin(theta)
    );
  }
};

const generateFlower = (positions: number[]) => {
  for (let i = 0; i < COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = 2 + Math.sin(5 * theta) * Math.sin(5 * phi);
    positions.push(
      r * Math.cos(theta) * Math.sin(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(phi)
    );
  }
};

const generateFireworks = (positions: number[]) => {
  for (let i = 0; i < COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = Math.random() * 6;
    const spread = Math.pow(Math.random(), 0.5);
    positions.push(
      r * spread * Math.cos(theta) * Math.sin(phi),
      r * spread * Math.sin(theta) * Math.sin(phi),
      r * spread * Math.cos(phi)
    );
  }
};

const generateFromImage = (positions: number[], imageData: ImageData) => {
  const { width, height, data } = imageData;
  const targetCount = COUNT;
  const validPixels: {x: number, y: number}[] = [];

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
      if (alpha > 128 && brightness > 50) {
        validPixels.push({ x, y });
      }
    }
  }

  for (let i = 0; i < targetCount; i++) {
    const pixel = validPixels[Math.floor(Math.random() * validPixels.length)];
    if (pixel) {
      const posX = (pixel.x - width / 2) * 0.05;
      const posY = -(pixel.y - height / 2) * 0.05;
      const posZ = (Math.random() - 0.5) * 1;
      positions.push(posX, posY, posZ);
    } else {
       positions.push(0,0,0);
    }
  }
};