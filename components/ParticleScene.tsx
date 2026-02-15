import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ParticleConfig, HandGesture, AudioData } from '../types.ts';
import { generateParticles } from '../utils/particleUtils.ts';

interface ParticleSceneProps {
  config: ParticleConfig;
  gestureRef: React.MutableRefObject<HandGesture>;
  audioRef: React.MutableRefObject<AudioData>;
}

const ParticleScene: React.FC<ParticleSceneProps> = ({ config, gestureRef, audioRef }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const frameIdRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    if (pointsRef.current) {
      sceneRef.current.remove(pointsRef.current);
      pointsRef.current.geometry.dispose();
      const material = pointsRef.current.material;
      if (Array.isArray(material)) {
        material.forEach(m => m.dispose());
      } else {
        material.dispose();
      }
    }

    const geometry = generateParticles(config.shape, config.customImageData);

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    if (context) {
      context.beginPath();
      context.arc(16, 16, 14, 0, Math.PI * 2);
      context.fillStyle = '#ffffff';
      context.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      color: config.color,
      size: 0.15,
      map: texture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    sceneRef.current.add(points);
    pointsRef.current = points;

  }, [config.shape, config.customImageData, config.color]);

  useEffect(() => {
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      if (pointsRef.current && sceneRef.current && cameraRef.current && rendererRef.current) {
        const points = pointsRef.current;
        const material = points.material as THREE.PointsMaterial;
        const currentGesture = gestureRef.current;
        const currentAudio = audioRef.current;

        points.rotation.y += 0.002;

        if (currentGesture.isActive) {
          const targetRotationY = -currentGesture.rotation;

          // Smooth rotation using shortest path
          const PI2 = Math.PI * 2;
          let delta = (targetRotationY - points.rotation.y) % PI2;
          if (delta > Math.PI) delta -= PI2;
          if (delta < -Math.PI) delta += PI2;

          points.rotation.y += delta * 0.1;

          const targetScale = currentGesture.zoom;
          points.scale.setScalar(THREE.MathUtils.lerp(points.scale.x, targetScale, 0.1));
        } else {
          points.scale.setScalar(THREE.MathUtils.lerp(points.scale.x, 1, 0.05));
        }

        if (config.isSoundEnabled) {
          const baseSize = 0.15;
          const targetSize = baseSize + (currentAudio.volume * 0.3);
          material.size = targetSize;

          if (currentAudio.beat) {
            points.position.x = (Math.random() - 0.5) * 0.3;
            points.position.y = (Math.random() - 0.5) * 0.3;
            points.position.z = (Math.random() - 0.5) * 0.2;
          } else {
            points.position.x = THREE.MathUtils.lerp(points.position.x, 0, 0.1);
            points.position.y = THREE.MathUtils.lerp(points.position.y, 0, 0.1);
            points.position.z = THREE.MathUtils.lerp(points.position.z, 0, 0.1);
          }
          points.rotation.y += currentAudio.volume * 0.05;
        } else {
          material.size = 0.15;
          points.position.set(0, 0, 0);
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [config.isSoundEnabled]);

  return <div ref={mountRef} className="absolute inset-0" />;
};

export default ParticleScene;