import React, { useEffect, useRef, useState } from 'react';
import { Mic, Send, Square, Trash2, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface VoiceRecorderBarProps {
  conversationId: string;
  onClose: () => void;
  onSent: () => void;
}

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({
  conversationId,
  onClose,
  onSent,
}) => {
  const { uploadAttachment, sendMessage } = useChat();

  const supported =
    typeof window !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';

  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [liveBars, setLiveBars] = useState<number[]>(new Array(24).fill(0.15));
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedPeaks, setCapturedPeaks] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const peaksAccumulatorRef = useRef<number[]>([]);

  const cleanupStreams = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
  };

  useEffect(() => {
    return () => {
      cleanupStreams();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = async () => {
    if (!supported) {
      setError('Microphone recording is not supported in this browser.');
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      peaksAccumulatorRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        const rawPeaks = peaksAccumulatorRef.current;
        const sampled: number[] = [];
        const targetBins = 28;
        if (rawPeaks.length > 0) {
          for (let i = 0; i < targetBins; i++) {
            const idx = Math.floor((i / targetBins) * rawPeaks.length);
            sampled.push(rawPeaks[idx]);
          }
        }
        setCapturedPeaks(sampled);
        cleanupStreams();
      };

      recorder.start();
      setRecording(true);
      setElapsedSec(0);

      timerRef.current = window.setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);

      const sampleWaveform = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length / 255;
        const level = Math.max(0.12, Math.min(1, avg * 2.2));
        peaksAccumulatorRef.current.push(level);
        setLiveBars((prev) => [...prev.slice(1), level]);
        rafRef.current = requestAnimationFrame(sampleWaveform);
      };
      sampleWaveform();
    } catch {
      setError('Microphone permission denied or no audio input device found.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const handleSendVoice = async () => {
    if (!recordedBlob) return;
    setUploading(true);
    setError(null);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Could not read audio recording.'));
        reader.readAsDataURL(recordedBlob);
      });

      const meta = await uploadAttachment({
        conversationId,
        fileName: `voice_${Date.now()}.webm`,
        mimeType: recordedBlob.type || 'audio/webm',
        base64Data,
        kind: 'audio',
        durationSec: Math.max(1, elapsedSec),
        waveformPeaks: capturedPeaks,
      });

      const ok = await sendMessage({
        conversationId,
        kind: 'voice',
        text: 'Voice message',
        attachment: meta,
      });
      if (ok) onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload voice note.');
    } finally {
      setUploading(false);
    }
  };

  const fmtTimer = (sec: number) =>
    `${Math.floor(sec / 60)
      .toString()
      .padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 space-y-2">
      {error && (
        <div className="flex items-center justify-between text-xs text-red-600 dark:text-red-400">
          <span>{error}</span>
          <button type="button" onClick={onClose} className="font-semibold cursor-pointer">
            Close
          </button>
        </div>
      )}

      {!supported ? (
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span>Voice recording is unavailable in this browser or device context.</span>
          <button type="button" onClick={onClose} className="font-semibold text-blue-600 cursor-pointer">
            Dismiss
          </button>
        </div>
      ) : recordedBlob && previewUrl ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[200px]">
            <VoiceMessagePlayer
              src={previewUrl}
              durationSec={elapsedSec}
              waveformPeaks={capturedPeaks}
              isOutgoing={false}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRecordedBlob(null);
                setPreviewUrl(null);
                setElapsedSec(0);
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 cursor-pointer"
              title="Discard recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={handleSendVoice}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {uploading ? 'Uploading...' : 'Send Voice'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              onMouseDown={!recording ? startRecording : undefined}
              onMouseUp={recording ? stopRecording : undefined}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
                recording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title={recording ? 'Stop recording' : 'Tap or press & hold to record'}
            >
              {recording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-4 h-4" />}
            </button>

            {recording ? (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 tabular-nums shrink-0">
                  REC {fmtTimer(elapsedSec)}
                </span>
                <div className="flex items-center gap-[3px] h-6 flex-1 overflow-hidden">
                  {liveBars.map((bar, i) => (
                    <span
                      key={i}
                      className="flex-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                      style={{ height: `${Math.round(bar * 100)}%` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Tap microphone or press &amp; hold to record real voice audio
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              cleanupStreams();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label="Cancel voice recording"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
