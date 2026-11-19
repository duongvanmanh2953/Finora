/**
 * Voice Quick Entry Manager (Web Speech API)
 * Zero paid external API dependency.
 * Works natively on Android Chrome, Safari, Desktop Chrome/Edge with Vietnamese language support.
 */

export type VoiceStatus = 'idle' | 'listening' | 'recognizing' | 'error' | 'unsupported';

export interface VoiceRecognitionOptions {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (errorMsg: string) => void;
  onStatusChange: (status: VoiceStatus) => void;
  lang?: string;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

export class VoiceInputManager {
  private recognition: any = null;
  private status: VoiceStatus = 'idle';

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'vi-VN';
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  public getStatus(): VoiceStatus {
    return this.status;
  }

  public start(options: VoiceRecognitionOptions): boolean {
    if (!this.recognition) {
      options.onStatusChange('unsupported');
      options.onError('Thiết bị hoặc trình duyệt hiện tại chưa hỗ trợ nhận diện giọng nói tiếng Việt.');
      return false;
    }

    try {
      this.status = 'listening';
      options.onStatusChange('listening');

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || '';
          if (item.isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (final) {
          this.status = 'recognizing';
          options.onStatusChange('recognizing');
          options.onTranscript(final.trim(), true);
        } else if (interim) {
          options.onTranscript(interim.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.status = 'error';
        options.onStatusChange('error');
        let errorMsg = 'Không thể thu âm giọng nói.';
        if (event.error === 'not-allowed') {
          errorMsg = 'Quyền truy cập Micro bị từ chối. Vui lòng cho phép quyền trong cài đặt trình duyệt.';
        } else if (event.error === 'no-speech') {
          errorMsg = 'Chưa nghe rõ giọng nói. Bạn hãy nói to và rõ hơn nhé.';
        } else if (event.error === 'network') {
          errorMsg = 'Lỗi kết nối mạng khi xử lý giọng nói.';
        }
        options.onError(errorMsg);
      };

      this.recognition.onend = () => {
        if (this.status === 'listening' || this.status === 'recognizing') {
          this.status = 'idle';
          options.onStatusChange('idle');
        }
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.status = 'error';
      options.onStatusChange('error');
      options.onError(err?.message || 'Không thể kích hoạt micro ghi âm.');
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && (this.status === 'listening' || this.status === 'recognizing')) {
      try {
        this.recognition.stop();
      } catch {}
      this.status = 'idle';
    }
  }
}

export const voiceManager = new VoiceInputManager();
