import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useLanguage } from './contexts/LanguageContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Explore } from './pages/Explore';
import { SettingsPanel } from './components/SettingsPanel';
import { Loader2, Download, Sparkles, Share2, Dice5, Globe, Lock } from 'lucide-react';
import { ImageGallery } from './components/ImageGallery';
import { AdvancedOptions } from './components/AdvancedOptions';
import { Lightbox } from './components/Lightbox';
import { ImageUpload } from './components/ImageUpload';
import { supabase } from './lib/supabase';

const SURPRISE_PROMPTS = [
  'A stunning aurora borealis over a frozen landscape with crystalline ice formations, ultra detailed, 8k',
  'An enchanted forest with bioluminescent mushrooms and ethereal creatures, magical atmosphere, detailed',
  'A futuristic cyberpunk cityscape at night with neon signs and flying vehicles, 8k, cinematic',
  'An underwater temple with ancient ruins and mysterious glowing artifacts, detailed, atmospheric',
  'A steampunk airship flying through cotton candy clouds, detailed mechanical parts, vibrant colors',
];

const STYLE_KEYWORDS: { [key: string]: string } = {
  cinematic: ', dramatic lighting, cinematic composition, movie still, 8k',
  anime: ', anime style, vibrant colors, detailed illustration, cel shading',
  '3d': ', 3D rendered, professional 3D model, studio lighting, detailed',
  digital: ', digital art, artistic style, hand painted, vibrant',
  photo: ', professional photography, realistic, high quality, detailed',
};

interface GalleryImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

function App() {
  const { session, loading: authLoading, user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | null>(null);
  const [activeView, setActiveView] = useState<'create' | 'explore'>('create');
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [safetyTolerance, setSafetyTolerance] = useState(2);
  const [error, setError] = useState('');
  const [style, setStyle] = useState<string>('');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [lightboxImageId, setLightboxImageId] = useState<string | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>('');
  const [publicToggle, setPublicToggle] = useState(false);
  const [promptStrength, setPromptStrength] = useState(0.8);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [inferenceSteps, setInferenceSteps] = useState(50);
  const [negativePrompt, setNegativePrompt] = useState('');

  const isDark = theme === 'dark';
  const selectedImage = images.find((img) => img.id === selectedImageId);

  const handleModeChange = (newMode: 'create' | 'edit') => {
    setMode(newMode);
    if (newMode === 'create') {
      setReferenceImageUrl('');
    }
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center`}>
        <Sparkles className={`w-8 h-8 animate-spin ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        {authScreen === 'signup' ? <Signup onSwitchToLogin={() => setAuthScreen('login')} /> : <Login onSwitchToSignup={() => setAuthScreen('signup')} />}
        <SettingsPanel />
      </>
    );
  }

  const handleSurpriseMe = () => {
    setPrompt(SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)]);
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    if (mode === 'edit' && !referenceImageUrl) {
      setError(t('uploadReferenceRequired'));
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      let finalPrompt = prompt;
      if (mode === 'create' && style && STYLE_KEYWORDS[style]) finalPrompt += STYLE_KEYWORDS[style];

      const requestBody: any = {
        prompt: finalPrompt,
        safetyTolerance,
        mode,
        ...(seed !== undefined && { seed })
      };

      if (mode === 'create') {
        requestBody.aspectRatio = aspectRatio;
      } else {
        requestBody.imageUrl = referenceImageUrl;
        requestBody.promptStrength = promptStrength;
        requestBody.guidanceScale = guidanceScale;
        requestBody.inferenceSteps = inferenceSteps;
        if (negativePrompt.trim()) requestBody.negativePrompt = negativePrompt;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || t('generationError'));
      const newImage: GalleryImage = { id: crypto.randomUUID(), url: data.imageUrl, prompt: finalPrompt, timestamp: Date.now() };
      setImages((prev) => [newImage, ...prev]);
      setSelectedImageId(newImage.id);
      if (user) {
        await supabase.from('generated_images').insert({ user_id: user.id, url: data.imageUrl, prompt: finalPrompt, is_public: publicToggle });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('generationError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedImage) return;
    try {
      const response = await fetch(selectedImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${selectedImage.timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleShare = async () => {
    if (!selectedImage || !navigator.share) return;
    try {
      await navigator.share({ title: 'AI Generated Image', text: selectedImage.prompt, url: selectedImage.url });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <nav className={`sticky top-0 z-50 ${isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200'} border-b backdrop-blur-md`}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Sparkles className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('appName')}</h1>
            </div>
            <div className={`flex gap-2 ${isDark ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100 border-gray-300'} border rounded-lg p-1`}>
              <button onClick={() => setActiveView('create')} className={`px-4 py-2 rounded-md font-medium ${activeView === 'create' ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-700') : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>{t('navCreate')}</button>
              <button onClick={() => setActiveView('explore')} className={`px-4 py-2 rounded-md font-medium ${activeView === 'explore' ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-700') : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>{t('navExplore')}</button>
            </div>
          </div>
        </div>
      </nav>

      {activeView === 'explore' && <Explore />}

      {activeView === 'create' && (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-4 py-12 max-w-3xl h-full flex flex-col">
                <div className="space-y-6 flex-1 flex flex-col">
                  <div className={`${isDark ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border-gray-700/50' : 'bg-white/60 border-gray-200'} backdrop-blur-xl rounded-2xl p-6 shadow-2xl border`}>
                    <div className="space-y-4">
                      <div className={`flex gap-2 p-1 ${isDark ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100 border-gray-300'} border rounded-lg mb-4`}>
                        <button onClick={() => handleModeChange('create')} className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all ${mode === 'create' ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-700') : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')}`}>
                          {t('modeCreate')}
                        </button>
                        <button onClick={() => handleModeChange('edit')} className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all ${mode === 'edit' ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-700') : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')}`}>
                          {t('modeEdit')}
                        </button>
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        <span className="font-semibold">{t('modelUsing')}:</span> {mode === 'create' ? 'FLUX 1.1 Pro' : 'FLUX Kontext Pro'}
                      </div>
                      <div className="flex gap-2">
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !isLoading && prompt.trim()) generateImage(); }} placeholder={mode === 'create' ? t('promptPlaceholder') : t('promptPlaceholderEdit')} className={`flex-1 px-6 py-4 ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none h-24`} disabled={isLoading} />
                        {mode === 'create' && <button onClick={handleSurpriseMe} disabled={isLoading} className={`px-4 py-3 rounded-xl ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} shadow-lg`}><Dice5 className="w-5 h-5" /></button>}
                      </div>
                      {mode === 'edit' && <ImageUpload onImageSelect={setReferenceImageUrl} onImageClear={() => setReferenceImageUrl('')} previewUrl={referenceImageUrl} />}
                      <AdvancedOptions
                        aspectRatio={aspectRatio}
                        onAspectRatioChange={setAspectRatio}
                        safetyTolerance={safetyTolerance}
                        onSafetyToleranceChange={setSafetyTolerance}
                        style={style}
                        onStyleChange={setStyle}
                        seed={seed}
                        onSeedChange={setSeed}
                        mode={mode}
                        promptStrength={promptStrength}
                        onPromptStrengthChange={setPromptStrength}
                        guidanceScale={guidanceScale}
                        onGuidanceScaleChange={setGuidanceScale}
                        inferenceSteps={inferenceSteps}
                        onInferenceStepsChange={setInferenceSteps}
                        negativePrompt={negativePrompt}
                        onNegativePromptChange={setNegativePrompt}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setPublicToggle(!publicToggle)} className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium ${publicToggle ? (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700') : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600')}`}>
                          {publicToggle ? <><Globe className="w-4 h-4" />{t('makePublic')}</> : <><Lock className="w-4 h-4" />{t('makePrivate')}</>}
                        </button>
                        <button onClick={generateImage} disabled={isLoading || !prompt.trim() || (mode === 'edit' && !referenceImageUrl)} className="flex-1 py-2 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold text-white">
                          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />{t('generating')}</> : <><Sparkles className="w-4 h-4 inline mr-2" />{t('generateImage')}</>}
                        </button>
                      </div>
                      {error && <div className={`p-4 rounded-xl border ${isDark ? 'bg-red-900/30 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}><p className="text-sm">{error}</p></div>}
                    </div>
                  </div>
                  {selectedImage && !isLoading && (
                    <div className={`flex-1 ${isDark ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border-gray-700/50' : 'bg-white/60 border-gray-200'} backdrop-blur-xl rounded-2xl p-6 shadow-2xl border flex flex-col`}>
                      <div className="flex-1 flex items-center justify-center mb-4 cursor-pointer" onClick={() => setLightboxImageId(selectedImage.id)}>
                        <img src={selectedImage.url} alt={selectedImage.prompt} className="max-w-full max-h-full rounded-xl shadow-2xl" />
                      </div>
                      <div className="space-y-3">
                        <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selectedImage.prompt}</p>
                        <div className="flex gap-2">
                          <button onClick={handleDownload} className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${isDark ? 'bg-gradient-to-r from-cyan-600 to-blue-700' : 'bg-gradient-to-r from-cyan-500 to-blue-600'} text-white`}>
                            <Download className="w-4 h-4" />{t('download')}
                          </button>
                          {navigator.share && (
                            <button onClick={handleShare} className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <Share2 className="w-4 h-4" />{t('share')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className={`w-full lg:w-72 ${isDark ? 'border-t lg:border-t-0 lg:border-l border-gray-700/50 bg-gray-900/30' : 'border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50/30'} backdrop-blur-xl`}>
            <ImageGallery images={images} selectedId={selectedImageId} onSelect={setSelectedImageId} onClear={() => { setImages([]); setSelectedImageId(null); }} />
          </div>
        </div>
      )}

      <Lightbox image={lightboxImageId ? images.find((img) => img.id === lightboxImageId) || null : null} onClose={() => setLightboxImageId(null)} />
      <SettingsPanel />
    </div>
  );
}

export default App;
