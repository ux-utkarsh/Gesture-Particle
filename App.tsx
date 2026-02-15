import React, { useState, useEffect, useRef } from 'react';
import ParticleScene from './components/ParticleScene.tsx';
import Controls from './components/Controls.tsx';
import { ParticleConfig, ShapeType, HandGesture, AudioData } from './types.ts';
import { AudioAnalyzer } from './utils/audioUtils.ts';
import { HandTracker } from './utils/handUtils.ts';

const App: React.FC = () => {
  const [config, setConfig] = useState<ParticleConfig>({
    shape: ShapeType.HEART,
    color: '#3b82f6',
    isSoundEnabled: false,
    customImageData: null,
  });

  // Use refs for high-frequency updates to avoid re-renders
  const gestureRef = useRef<HandGesture>({ zoom: 1, rotation: 0, isActive: false });
  const audioRef = useRef<AudioData>({ volume: 0, beat: false });

  // Only store UI-relevant state
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [activeAudioSource, setActiveAudioSource] = useState<'mic' | 'system' | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const handTrackerRef = useRef<HandTracker | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    audioAnalyzerRef.current = new AudioAnalyzer();

    if (videoRef.current) {
      handTrackerRef.current = new HandTracker(
        videoRef.current,
        (gesture) => {
          const wasActive = gestureRef.current.isActive;
          gestureRef.current = gesture;
          // Only update state if active status changes to minimize re-renders
          if (gesture.isActive !== wasActive) {
            setIsGestureActive(gesture.isActive);
          }
        },
        canvasRef.current
      );

      handTrackerRef.current.start().catch(err => {
        console.warn("Camera init failed:", err);
        setPermissionError("Camera access denied. Gestures disabled.");
      });
    }

    return () => {
      audioAnalyzerRef.current?.stop();
      handTrackerRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    let animationId: number;
    const updateAudio = () => {
      if (audioAnalyzerRef.current && activeAudioSource && config.isSoundEnabled) {
        const data = audioAnalyzerRef.current.getAudioData();
        audioRef.current = data;
      } else {
        audioRef.current = { volume: 0, beat: false };
      }
      animationId = requestAnimationFrame(updateAudio);
    };
    updateAudio();
    return () => cancelAnimationFrame(animationId);
  }, [activeAudioSource, config.isSoundEnabled]);

  const handleToggleAudio = async (source: 'mic' | 'system') => {
    if (!audioAnalyzerRef.current) return;

    // If clicking the same active source, turn it off
    if (activeAudioSource === source) {
      audioAnalyzerRef.current.stop();
      setActiveAudioSource(null);
      setConfig(prev => ({ ...prev, isSoundEnabled: false }));
      return;
    }

    // Switching or turning on
    try {
      await audioAnalyzerRef.current.start(source);
      setActiveAudioSource(source);
      setConfig(prev => ({ ...prev, isSoundEnabled: true }));
      setPermissionError(null);
    } catch (err) {
      console.error(err);
      setPermissionError(`Failed to access ${source === 'mic' ? 'microphone' : 'system/tab'} audio.`);
      setConfig(prev => ({ ...prev, isSoundEnabled: false }));
      setActiveAudioSource(null);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-black">
      <div className="absolute top-4 right-4 w-48 z-50 rounded-lg border border-white/20 overflow-hidden bg-black/50 backdrop-blur-md">
        <video
          ref={videoRef}
          className="w-full h-auto opacity-80"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      <ParticleScene
        config={config}
        gestureRef={gestureRef}
        audioRef={audioRef}
      />

      <div className={`absolute top-8 left-8 text-left pointer-events-none transition-opacity duration-1000 z-10 ${isGestureActive ? 'opacity-30' : 'opacity-80'}`}>
        <h1 className="text-white text-3xl font-light tracking-widest uppercase mb-2">Gesture Particles</h1>
        <p className="text-blue-300 text-sm font-mono">Show hand to interact<br />Pinch to Zoom<br />Rotate to Turn</p>
      </div>

      <Controls
        config={config}
        setConfig={setConfig}
        activeAudioSource={activeAudioSource}
        onToggleAudio={handleToggleAudio}
        permissionError={permissionError}
      />
    </div>
  );
};

export default App;