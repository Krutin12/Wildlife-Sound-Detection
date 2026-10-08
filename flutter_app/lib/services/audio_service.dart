import 'dart:async';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import '../config/app_constants.dart';

/// Service that handles audio recording, file picking, and playback.
class AudioService {
  final AudioRecorder _recorder = AudioRecorder();
  final AudioPlayer _player = AudioPlayer();
  bool _isRecording = false;
  String? _lastRecordingPath;

  bool get isRecording => _isRecording;
  String? get lastRecordingPath => _lastRecordingPath;

  // ── Recording ─────────────────────────────────────────────

  /// Check and request microphone permission.
  Future<bool> hasPermission() async {
    return await _recorder.hasPermission();
  }

  /// Start recording audio. Returns the file path or null.
  Future<String?> startRecording() async {
    if (!await hasPermission()) return null;

    final dir = await getTemporaryDirectory();
    final path =
        '${dir.path}/listenleaf_recording_${DateTime.now().millisecondsSinceEpoch}.wav';

    await _recorder.start(
      const RecordConfig(
        encoder: AudioEncoder.wav,
        sampleRate: 32000,
        numChannels: 1,
      ),
      path: path,
    );
    _isRecording = true;
    _lastRecordingPath = path;
    return path;
  }

  /// Stop recording and return the file path.
  Future<String?> stopRecording() async {
    if (!_isRecording) return _lastRecordingPath;
    final path = await _recorder.stop();
    _isRecording = false;
    _lastRecordingPath = path;
    return path;
  }

  /// Cancel recording and delete the temporary file.
  Future<void> cancelRecording() async {
    if (_isRecording) {
      await _recorder.stop();
      _isRecording = false;
    }
    if (_lastRecordingPath != null) {
      final file = File(_lastRecordingPath!);
      if (await file.exists()) await file.delete();
      _lastRecordingPath = null;
    }
  }

  // ── File Picker ───────────────────────────────────────────

  /// Pick an audio file from the device. Returns the File or null.
  Future<File?> pickAudioFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: AppConstants.allowedAudioExtensions,
    );
    if (result != null && result.files.single.path != null) {
      return File(result.files.single.path!);
    }
    return null;
  }

  // ── Playback ──────────────────────────────────────────────

  /// Play an audio file by path.
  Future<void> play(String path) async {
    await _player.play(DeviceFileSource(path));
  }

  /// Stop playback.
  Future<void> stopPlayback() async {
    await _player.stop();
  }

  /// Dispose all resources.
  Future<void> dispose() async {
    await _recorder.dispose();
    await _player.dispose();
  }
}
