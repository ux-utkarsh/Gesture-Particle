export enum ShapeType {
  STARS = 'Stars',
  HEART = 'Heart',
  SATURN = 'Saturn',
  FLOWER = 'Flower',
  FIREWORKS = 'Fireworks',
  CUSTOM = 'Custom',
}

export interface ParticleConfig {
  shape: ShapeType;
  color: string;
  isSoundEnabled: boolean;
  customImageData?: ImageData | null;
}

export interface HandGesture {
  zoom: number; // 1.0 is default
  rotation: number; // radians
  isActive: boolean;
}

export interface AudioData {
  volume: number; // 0 to 1
  beat: boolean;
}