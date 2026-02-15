import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { HandGesture } from "../types.ts";

export class HandTracker {
  private detector: handPoseDetection.HandDetector | null = null;
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private onGesture: (gesture: HandGesture) => void;
  private animationFrameId: number | null = null;

  constructor(
    videoElement: HTMLVideoElement,
    onGesture: (gesture: HandGesture) => void,
    canvasElement?: HTMLCanvasElement | null
  ) {
    this.videoElement = videoElement;
    this.onGesture = onGesture;
    if (canvasElement) {
      this.canvasElement = canvasElement;
      this.canvasCtx = canvasElement.getContext('2d');
    }
  }

  async start() {
    console.log("Starting HandTracker...");
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      console.log("TensorFlow.js backend ready:", tf.getBackend());

      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig = {
        runtime: 'tfjs',
        modelType: 'full',
        maxHands: 2,
      } as handPoseDetection.MediaPipeHandsTfjsModelConfig;

      console.log("Loading HandPose model...");
      this.detector = await handPoseDetection.createDetector(model, detectorConfig);
      console.log("HandPose detector created.");

      // Setup camera stream
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            frameRate: { ideal: 30 }
          },
          audio: false
        });
        this.videoElement.srcObject = stream;

        await new Promise<void>((resolve) => {
          this.videoElement.onloadedmetadata = () => {
            this.videoElement.play();
            this.videoElement.width = this.videoElement.videoWidth;
            this.videoElement.height = this.videoElement.videoHeight;
            console.log(`Video metadata loaded. Size: ${this.videoElement.width}x${this.videoElement.height}`);
            resolve();
          };
        });

        console.log("Starting detection loop.");
        this.updateDebugStatus("Tracking Active");
        this.detectHands();
      } else {
        console.error("Camera access not supported/available.");
        this.updateDebugStatus("Camera Error");
      }
    } catch (err) {
      console.error("Error starting HandTracker:", err);
      this.updateDebugStatus("Init Error: " + err);
    }
  }

  private updateDebugStatus(status: string) {
    if (this.canvasElement && this.canvasCtx) {
      this.canvasCtx.save();
      this.canvasCtx.fillStyle = 'red';
      this.canvasCtx.font = '16px Arial';
      this.canvasCtx.fillText(status, 10, 20);
      this.canvasCtx.restore();
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
    }
  }

  private async detectHands() {
    if (!this.detector || !this.videoElement) return;

    if (this.videoElement.readyState === 4) { // HAVE_ENOUGH_DATA
      try {
        const hands = await this.detector.estimateHands(this.videoElement);
        // console.log("Hands detected:", hands.length); // Verbose log
        this.onResults(hands);
      } catch (error) {
        console.error("Error detecting hands:", error);
      }
    } else {
      console.log("Waiting for video readyState...", this.videoElement.readyState);
    }

    this.animationFrameId = requestAnimationFrame(this.detectHands.bind(this));
  }


  private onResults(hands: handPoseDetection.Hand[]) {
    // Canvas drawing
    if (this.canvasElement && this.canvasCtx) {
      // Resize canvas to match video if needed
      if (this.canvasElement.width !== this.videoElement.videoWidth ||
        this.canvasElement.height !== this.videoElement.videoHeight) {
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
      }

      this.canvasCtx.save();
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

      // Draw hands
      for (const hand of hands) {
        this.drawHand(this.canvasCtx, hand.keypoints);
      }
      this.canvasCtx.restore();
    }

    // Gesture logic
    if (hands && hands.length > 0) {
      const hand = hands[0];
      // TFJS keypoints: 4 is thumb tip, 8 is index tip
      // Keypoints objects have {x, y, name}
      const thumbTip = hand.keypoints[4];
      const indexTip = hand.keypoints[8];

      const dx = thumbTip.x - indexTip.x;
      const dy = thumbTip.y - indexTip.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const zoom = Math.max(0.5, Math.min(3.0, distance * 0.05)); // Adjusted multiplier for TFJS pixel coords
      const rotation = Math.atan2(dy, dx);

      this.onGesture({
        zoom,
        rotation,
        isActive: true
      });
    } else {
      this.onGesture({
        zoom: 1,
        rotation: 0,
        isActive: false
      });
    }
  }

  private drawHand(ctx: CanvasRenderingContext2D, keypoints: handPoseDetection.Keypoint[]) {
    ctx.fillStyle = '#60a5fa';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    // Draw points
    for (const kp of keypoints) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Simple skeleton connections (MediaPipe Hands topology subset)
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],         // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],         // Index
      [0, 9], [9, 10], [10, 11], [11, 12],    // Middle
      [0, 13], [13, 14], [14, 15], [15, 16],  // Ring
      [0, 17], [17, 18], [18, 19], [19, 20],  // Pinky
      [5, 9], [9, 13], [13, 17]               // Palm
    ];

    ctx.beginPath();
    for (const [start, end] of connections) {
      const p1 = keypoints[start];
      const p2 = keypoints[end];
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
  }
}