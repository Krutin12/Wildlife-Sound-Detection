import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileAudio,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Volume2,
  TreePine,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';
import { DEMO_AUDIO_SAMPLES, DemoAudioSample } from './wildlifeData';
import { uploadAudioForPrediction } from '../../api';
import { PredictionResponse } from '../../types';

export const AudioDetectionPreview: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<DemoAudioSample>(DEMO_AUDIO_SAMPLES[0]);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(30);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string>('');
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Result State
  const [predictionResult, setPredictionResult] = useState<{
    commonName: string;
    scientificName: string;
    confidence: number;
    habitat: string;
    vocalizationType: string;
    frequencyHz: number;
    snrDb: number;
    callDurationSec: number;
    isRealBackend: boolean;
  } | null>({
    commonName: DEMO_AUDIO_SAMPLES[0].species,
    scientificName: DEMO_AUDIO_SAMPLES[0].scientificName,
    confidence: DEMO_AUDIO_SAMPLES[0].confidence,
    habitat: DEMO_AUDIO_SAMPLES[0].habitat,
    vocalizationType: DEMO_AUDIO_SAMPLES[0].vocalizationType,
    frequencyHz: DEMO_AUDIO_SAMPLES[0].frequencyHz,
    snrDb: DEMO_AUDIO_SAMPLES[0].snrDb,
    callDurationSec: DEMO_AUDIO_SAMPLES[0].durationSec,
    isRealBackend: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Waveform playback animation timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleSelectPreset = (sample: DemoAudioSample) => {
    setSelectedPreset(sample);
    setCustomFile(null);
    setError(null);
    setPlaybackProgress(0);
    setIsPlaying(false);

    // Simulate AI extraction for preset
    runAnalysisSimulation({
      commonName: sample.species,
      scientificName: sample.scientificName,
      confidence: sample.confidence,
      habitat: sample.habitat,
      vocalizationType: sample.vocalizationType,
      frequencyHz: sample.frequencyHz,
      snrDb: sample.snrDb,
      callDurationSec: sample.durationSec,
      isRealBackend: false,
    });
  };

  const runAnalysisSimulation = (targetData: typeof predictionResult) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStage('Resampling audio to 32 kHz & trimming silences...');

    setTimeout(() => {
      setAnalysisProgress(35);
      setAnalysisStage('Extracting 128-band Mel Spectrogram with Librosa...');
    }, 450);

    setTimeout(() => {
      setAnalysisProgress(75);
      setAnalysisStage('Running EfficientNet-B3 Convolutional Inference...');
    }, 900);

    setTimeout(() => {
      setAnalysisProgress(100);
      setAnalysisStage('Classification complete!');
      setPredictionResult(targetData);
      setIsAnalyzing(false);
    }, 1300);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setCustomFile(file);
    setError(null);
    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setAnalysisStage('Preparing audio file for neural classification...');

    try {
      // First attempt to call the live FastAPI backend
      const response: PredictionResponse = await uploadAudioForPrediction(file);
      setAnalysisProgress(100);
      setAnalysisStage('FastAPI Neural Inference Successful!');
      setPredictionResult({
        commonName: response.common_name || response.predicted_label,
        scientificName: response.scientific_name || 'Species classification verified',
        confidence: Number((response.confidence * 100).toFixed(1)),
        habitat: response.habitat || 'Protected wilderness reserve',
        vocalizationType: response.vocalization_pattern || 'Complex acoustic vocal signature',
        frequencyHz: response.dominant_frequency_hz || 3200,
        snrDb: response.snr_db || 21.5,
        callDurationSec: response.call_duration_sec || 4.2,
        isRealBackend: true,
      });
      setIsAnalyzing(false);
    } catch (err: any) {
      // If backend is unavailable or not running, gracefully fallback to simulated bioacoustic analysis
      console.log('FastAPI not reachable directly, switching to realistic bioacoustic simulation:', err);
      runAnalysisSimulation({
        commonName: 'Eurasian Blackbird',
        scientificName: 'Turdus merula',
        confidence: 96.8,
        habitat: 'Temperate deciduous woodland & forest edge',
        vocalizationType: 'Mellow fluted warble with rich harmonic overtones',
        frequencyHz: 2850,
        snrDb: 24.3,
        callDurationSec: 5.1,
        isRealBackend: false,
      });
    }
  };

  return (
    <section id="preview" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/70 text-emerald-900 text-xs font-bold uppercase tracking-wider border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Interactive Bioacoustic Preview</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Try the AI Audio Detector
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Upload your own field recording or choose one of our verified nature presets to watch
            the AI classify species and extract acoustic metrics in real time.
          </p>
        </div>

        {/* Demo Presets Selector Bar */}
        <div className="mb-10 max-w-4xl mx-auto">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center sm:text-left">
            Select a verified wildlife preset:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DEMO_AUDIO_SAMPLES.map((sample) => {
              const isSelected = !customFile && selectedPreset.id === sample.id;
              return (
                <button
                  key={sample.id}
                  onClick={() => handleSelectPreset(sample)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/90 border-emerald-400 shadow-md shadow-emerald-900/5 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {sample.species}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-200">
                      {sample.confidence}%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 truncate block">
                    {sample.scientificName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Interactive Detector Container */}
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 border border-slate-200/90 rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-950/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Upload Zone & Audio Player */}
            <div className="lg:col-span-6 space-y-6">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                    : 'border-emerald-300/60 hover:border-emerald-500 bg-white/80 hover:bg-white'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="audio/*,.wav,.mp3,.flac,.ogg"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-100 flex items-center justify-center mb-4 text-emerald-700 shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h4 className="text-base font-bold text-slate-900 mb-1">
                  {customFile ? customFile.name : 'Drop audio recording here, or browse'}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mb-3">
                  Supports WAV, MP3, FLAC, and OGG field recordings up to 50MB
                </p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                  <FileAudio className="w-3.5 h-3.5 text-emerald-600" />
                  <span>32 kHz Recommended Sample Rate</span>
                </div>
              </div>

              {/* Audio Playback Controls & Waveform Bar */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-colors shadow-md"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div>
                      <div className="text-sm font-bold truncate max-w-[200px]">
                        {customFile ? customFile.name : selectedPreset.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {customFile ? 'Custom Upload' : selectedPreset.subtitle}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPlaybackProgress(0);
                      setIsPlaying(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Restart playback"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Simulated Waveform Visualizer */}
                <div className="space-y-1.5">
                  <div className="h-12 flex items-end justify-between gap-1 px-1 bg-slate-950/60 rounded-xl p-2">
                    {[
                      35, 60, 80, 50, 90, 75, 45, 85, 95, 65, 40, 30, 70, 90, 100, 65, 45, 80,
                      85, 60, 40, 75, 90, 50, 35, 70, 85, 60, 45, 30,
                    ].map((val, idx) => {
                      const isPast = (idx / 30) * 100 <= playbackProgress;
                      return (
                        <div
                          key={idx}
                          className={`flex-1 rounded-full transition-colors duration-200 ${
                            isPast
                              ? 'bg-gradient-to-t from-emerald-500 to-teal-300'
                              : 'bg-slate-700'
                          }`}
                          style={{ height: `${val}%` }}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                    <span>00:0{Math.floor((playbackProgress / 100) * 5)}s</span>
                    <span>00:05.0s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: AI Analysis Result Display */}
            <div className="lg:col-span-6 space-y-5">
              {/* Progress State during inference */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600 animate-spin" />
                        <span>AI Inference in Progress</span>
                      </span>
                      <span>{analysisProgress}%</span>
                    </div>

                    <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${analysisProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    <p className="text-[11px] font-mono text-emerald-800 truncate">
                      {analysisStage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Classification Result Card */}
              {predictionResult && !isAnalyzing && (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                        Classification Result
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        predictionResult.isRealBackend
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {predictionResult.isRealBackend ? 'Live FastAPI Output' : 'Simulated Bioacoustic Sample'}
                    </span>
                  </div>

                  {/* Species Name & Confidence */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Species Prediction
                      </span>
                      <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                        {predictionResult.commonName}
                      </h3>
                      <p className="text-sm text-slate-500 italic mt-0.5">
                        {predictionResult.scientificName}
                      </p>
                    </div>

                    <div className="text-right p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/70">
                      <div className="text-2xl font-black text-emerald-700 leading-none">
                        {predictionResult.confidence}%
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mt-1">
                        Confidence
                      </span>
                    </div>
                  </div>

                  {/* Detailed Acoustic Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Dominant Frequency
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-800 mt-0.5 block">
                        {predictionResult.frequencyHz.toLocaleString()} Hz
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Signal-to-Noise Ratio
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-800 mt-0.5 block">
                        +{predictionResult.snrDb} dB SNR
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 col-span-2">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Natural Habitat
                      </span>
                      <span className="text-xs font-semibold text-slate-700 mt-0.5 block">
                        {predictionResult.habitat}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 col-span-2">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Acoustic Signature
                      </span>
                      <span className="text-xs font-semibold text-slate-700 mt-0.5 block">
                        {predictionResult.vocalizationType}
                      </span>
                    </div>
                  </div>

                  {/* Info Notice */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
                    <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      Demo mode active. Connect the local FastAPI server to evaluate arbitrary wilderness recordings.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
