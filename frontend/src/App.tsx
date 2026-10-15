import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AudioUpload } from './components/AudioUpload';
import { AnalysisPreview } from './components/AnalysisPreview';
import { PredictionHistory } from './components/PredictionHistory';
import { SpeciesLibrary } from './components/SpeciesLibrary';
import { AnimalLocation } from './components/AnimalLocation';
import { AuthModal } from './components/AuthModal';
import { Settings } from './components/Settings';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { PredictionResponse, HistoryRecord, SpeciesRecord, DbStatus, UserProfile } from './types';
import {
  uploadAudioForPrediction,
  fetchPredictionHistory,
  deleteHistoryRecord,
  clearAllPredictionHistory,
  fetchSpeciesLibrary,
  fetchDbStatus,
} from './api';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'location' | 'history' | 'species' | 'analytics' | 'settings'>('upload');

  // User Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('listenleaf_user') || localStorage.getItem('wildsound_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [lastResult, setLastResult] = useState<PredictionResponse | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [speciesList, setSpeciesList] = useState<SpeciesRecord[]>([]);
  const [loadingSpecies, setLoadingSpecies] = useState(false);

  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  const loadDbStatus = async () => {
    try { setDbStatus(await fetchDbStatus()); }
    catch { setDbStatus(null); }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try { setHistory(await fetchPredictionHistory()); }
    catch (e) { console.error(e); }
    finally { setLoadingHistory(false); }
  };

  const loadSpecies = async () => {
    setLoadingSpecies(true);
    try { setSpeciesList(await fetchSpeciesLibrary()); }
    catch (e) { console.error(e); }
    finally { setLoadingSpecies(false); }
  };

  useEffect(() => {
    // Restore theme & accent from localStorage
    const savedTheme = localStorage.getItem('listenleaf_theme') || 'forest';
    const savedAccent = localStorage.getItem('listenleaf_accent') || '#3d6b4f';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.style.setProperty('--forest', savedAccent);

    loadDbStatus(); loadHistory(); loadSpecies();
  }, []);

  const handleAuthSuccess = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('listenleaf_user', JSON.stringify(user));
    localStorage.setItem('listenleaf_token', token);
  };

  const handleUserUpdate = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('listenleaf_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('listenleaf_user');
    localStorage.removeItem('listenleaf_token');
    localStorage.removeItem('wildsound_user');
    localStorage.removeItem('wildsound_token');
    setViewMode('landing');
  };

  const handleAudioAnalysis = async (file: File) => {
    setAudioFile(file);
    setLoadingAnalysis(true); setAnalysisError(null);
    try {
      const response = await uploadAudioForPrediction(file);
      setLastResult(response);
      await loadHistory(); await loadDbStatus();
    } catch (err: any) {
      setAnalysisError(err.message || 'Audio prediction failed. Make sure the backend is running.');
    } finally { setLoadingAnalysis(false); }
  };

  const handleDeleteHistoryItem = async (id: number) => {
    try { await deleteHistoryRecord(id); await loadHistory(); await loadDbStatus(); }
    catch { alert('Failed to delete record.'); }
  };

  const handleClearAllHistory = async () => {
    if (window.confirm('Clear all history records?')) {
      try { await clearAllPredictionHistory(); await loadHistory(); await loadDbStatus(); }
      catch { alert('Failed to clear history.'); }
    }
  };

  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onOpenLogin={() => setShowAuthModal(true)}
          onLaunchApp={() => {
            if (currentUser) {
              setViewMode('app');
            } else {
              setShowAuthModal(true);
            }
          }}
        />
        {showAuthModal && (
          <AuthModal
            onSuccess={(user, token) => {
              handleAuthSuccess(user, token);
              setShowAuthModal(false);
              setViewMode('app');
            }}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </>
    );
  }

  if (!currentUser) {
    return (
      <AuthModal
        onSuccess={(user, token) => {
          handleAuthSuccess(user, token);
          setViewMode('app');
        }}
        onClose={() => setViewMode('landing')}
      />
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onBackToLanding={() => setViewMode('landing')}
      />

      <main className="main-wrapper">
        {activeTab === 'upload' && (
          <>
            <Header dbStatus={dbStatus} user={currentUser} showStats={true} />
            <div className="upload-analysis-grid">
              <AudioUpload onAnalyze={handleAudioAnalysis} loading={loadingAnalysis} error={analysisError} onFileSelect={setAudioFile} />
              <AnalysisPreview result={lastResult} audioFile={audioFile} />
            </div>
          </>
        )}

        {activeTab === 'location' && (
          <AnimalLocation />
        )}

        {activeTab === 'history' && (
          <PredictionHistory
            history={history} loading={loadingHistory}
            onDeleteOne={handleDeleteHistoryItem} onClearAll={handleClearAllHistory} onRefresh={loadHistory}
          />
        )}

        {activeTab === 'species' && (
          <SpeciesLibrary speciesList={speciesList} loading={loadingSpecies} />
        )}

        {activeTab === 'settings' && (
          <Settings
            user={currentUser}
            onLogout={handleLogout}
            onUserUpdate={handleUserUpdate}
            authToken={localStorage.getItem('listenleaf_token') || ''}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard history={history} dbStatus={dbStatus} />
        )}
      </main>
    </div>
  );
};

export default App;
