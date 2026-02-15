import React, { useRef, useState } from 'react';
import { ShapeType, ParticleConfig } from '../types.ts';

interface ControlsProps {
  config: ParticleConfig;
  setConfig: React.Dispatch<React.SetStateAction<ParticleConfig>>;
  activeAudioSource: 'mic' | 'system' | null;
  onToggleAudio: (source: 'mic' | 'system') => void;
  permissionError: string | null;
}

const Controls: React.FC<ControlsProps> = ({
  config,
  setConfig,
  activeAudioSource,
  onToggleAudio,
  permissionError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleShapeChange = (shape: ShapeType) => {
    setConfig(prev => ({ ...prev, shape }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, color: e.target.value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxSize = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          const imageData = ctx?.getImageData(0, 0, width, height);

          setConfig(prev => ({
            ...prev,
            shape: ShapeType.CUSTOM,
            customImageData: imageData
          }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  if (isMinimized) {
    return (
      <div className="absolute top-4 left-4 md:bottom-8 md:left-1/2 md:top-auto md:transform md:-translate-x-1/2 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-4 shadow-2xl text-white hover:bg-white/10 transition-colors"
          title="Show Controls"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-50">
      {permissionError && (
        <div className="bg-red-500/80 text-white p-3 rounded-lg mb-4 text-center text-sm backdrop-blur-md">
          {permissionError}
        </div>
      )}

      <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transition-all duration-300">
        <button
          onClick={() => setIsMinimized(true)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          title="Minimize Controls"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="flex flex-wrap justify-center gap-2 mb-6 pr-8">
          {[ShapeType.STARS, ShapeType.HEART, ShapeType.SATURN, ShapeType.FIREWORKS].map(shape => (
            <button
              key={shape}
              onClick={() => handleShapeChange(shape)}
              className={`px-4 py-2 rounded-full text-sm font-['IBM_Plex_Mono'] transition-all duration-300 
                ${config.shape === shape
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
              {shape}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-3 rounded-xl border border-dashed transition-colors flex items-center justify-center gap-2 font-medium
                ${config.shape === ShapeType.CUSTOM
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {config.shape === ShapeType.CUSTOM ? 'Change Image' : 'Upload Custom Image'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <span className="text-gray-300 font-mono text-sm">Particle Color</span>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full border border-white/30"
                style={{ backgroundColor: config.color }}
              />
              <input
                type="color"
                value={config.color}
                onChange={handleColorChange}
                className="opacity-0 absolute w-8 h-8 cursor-pointer"
              />
              <span className="text-xs text-gray-500 font-mono">{config.color.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <span className="text-gray-300 font-mono text-sm">Sound Reactivity</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleAudio('mic')}
                className={`px-3 py-1 text-xs rounded-full transition-all ${activeAudioSource === 'mic'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                Mic
              </button>
              <button
                onClick={() => onToggleAudio('system')}
                className={`px-3 py-1 text-xs rounded-full transition-all ${activeAudioSource === 'system'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                Tab/Sys
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-mono">
            Designed and Coded by <a href="https://www.utkarshdesign.com/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline hover:text-blue-400">Utkarsh</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Controls;