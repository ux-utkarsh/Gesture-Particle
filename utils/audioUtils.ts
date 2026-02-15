export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;

  async start(source: 'mic' | 'system' = 'mic'): Promise<void> {
    if (this.audioContext) {
      // If already running, stop first to switch source if needed, or just return?
      // For simplicity, let's assume we stop and restart if called again, or the caller handles it.
      // But to be safe, if we are already running, we should just return if it's the same source? 
      // Actually, user might want to switch. Let's close and restart if context exists.
      this.stop();
    }

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    try {
      if (source === 'system') {
        console.log("Requesting system audio...");
        this.stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1, height: 1 },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            // @ts-ignore - chrome specific
            suppressLocalAudioPlayback: false
          }
        });

        // Check if user actually shared audio
        if (this.stream.getAudioTracks().length === 0) {
          console.warn("No system audio track found.");
          this.stopStream();
          throw new Error("No system audio provided. Please ensure you checked 'Share Audio'.");
        }
      } else {
        console.log("Requesting microphone audio...");
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
      }
    } catch (err) {
      console.error(`Failed to get ${source} audio:`, err);
      this.stop(); // Cleanup
      throw err;
    }

    if (this.stream) {
      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
      this.sourceNode.connect(this.analyser);
    }
  }

  private stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  stop(): void {
    this.stopStream();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  getAudioData(): { volume: number; beat: boolean } {
    if (!this.analyser || !this.dataArray) {
      return { volume: 0, beat: false };
    }

    // @ts-ignore - mismatch in lib types
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate average volume
    let sum = 0;
    // Focus on bass frequencies (lower half of bins)
    const bassBins = Math.floor(this.dataArray.length / 4);
    for (let i = 0; i < bassBins; i++) {
      sum += this.dataArray[i];
    }
    const volume = sum / bassBins / 255; // Normalized 0-1

    // Simple beat detection: if volume > threshold
    const beat = volume > 0.4;

    return { volume, beat };
  }
}