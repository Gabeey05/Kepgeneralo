import { useState, useRef, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useLanguage } from './contexts/LanguageContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Explore } from './pages/Explore';
import { Profile } from './pages/Profile';
import { SettingsPanel } from './components/SettingsPanel';
import { Loader2, Download, Sparkles, Share2, Dice5, Globe, Lock, LogOut, User, ChevronDown } from 'lucide-react';
import { ImageGallery } from './components/ImageGallery';
import { AdvancedOptions } from './components/AdvancedOptions';
import { Lightbox } from './components/Lightbox';
import { ImageUpload } from './components/ImageUpload';
import { useToast } from './components/Toast';
import { ShareModal } from './components/ShareModal';
import { supabase } from './lib/supabase';
import { fetchImageBlobViaProxy } from './lib/imageUtils';


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
  dbId?: string;
  url: string;
  prompt: string;
  timestamp: number;
  isPublic?: boolean;
}

function App() {
  const { session, loading: authLoading, user, signOut } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | null>(null);
  const [activeView, setActiveView] = useState<'create' | 'explore' | 'profile'>('explore');
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);
  const [shareModalImage, setShareModalImage] = useState<GalleryImage | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';
  const selectedImage = images.find((img) => img.id === selectedImageId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedImageId) {
      setImageVisible(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setImageVisible(true)));
    }
  }, [selectedImageId]);

  useEffect(() => {
    if (!user || imagesLoaded) return;
    const loadUserImages = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const { data, error } = await supabase
        .from('generated_images')
        .select('id, image_path, prompt, is_public, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error || !data) return;
      const loaded: GalleryImage[] = data.map((row) => {
        const imagePath = row.image_path as string;
        const url = imagePath.startsWith('http')
          ? imagePath
          : `${supabaseUrl}/storage/v1/object/public/generated-images/${imagePath}`;
        return {
          id: crypto.randomUUID(),
          dbId: row.id,
          url,
          prompt: row.prompt,
          timestamp: new Date(row.created_at).getTime(),
          isPublic: row.is_public,
        };
      });
      setImages(loaded);
      if (loaded.length > 0) setSelectedImageId(loaded[0].id);
      setImagesLoaded(true);
    };
    loadUserImages();
  }, [user, imagesLoaded]);

  useEffect(() => {
    if (!user) {
      setImages([]);
      setSelectedImageId(null);
      setImagesLoaded(false);
    }
  }, [user]);

  const handleModeChange = (newMode: 'create' | 'edit') => {
    setMode(newMode);
    if (newMode === 'create') setReferenceImageUrl('');
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center`}>
        <Sparkles className={`w-8 h-8 animate-spin ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
      </div>
    );
  }

  if (!session && authScreen !== null) {
    return (
      <>
        {authScreen === 'signup' ? (
          <Signup onSwitchToLogin={() => setAuthScreen('login')} />
        ) : (
          <Login onSwitchToSignup={() => setAuthScreen('signup')} onClose={() => setAuthScreen(null)} />
        )}
        <SettingsPanel />
      </>
    );
  }

  const handleSurpriseMe = () => {
    setPrompt(SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)]);
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    if (!session) {
      setAuthScreen('login');
      return;
    }
    if (mode === 'edit' && !referenceImageUrl) {
      setError(t('uploadReferenceRequired'));
      return;
    }
    setIsLoading(true);
    setError('');
    showToast('Generating your image...', 'info');
    try {
      let finalPrompt = prompt;
      if (mode === 'create' && style && STYLE_KEYWORDS[style]) finalPrompt += STYLE_KEYWORDS[style];

      const requestBody: Record<string, unknown> = {
        prompt: finalPrompt,
        safetyTolerance,
        mode,
        ...(seed !== undefined && { seed }),
        ...(user && { userId: user.id }),
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
      const newImage: GalleryImage = { id: crypto.randomUUID(), url: data.imageUrl, prompt: finalPrompt, timestamp: Date.now(), isPublic: publicToggle };
      if (user) {
        const { data: inserted } = await supabase.from('generated_images').insert({
          user_id: user.id,
          image_path: data.storagePath || data.imageUrl,
          prompt: finalPrompt,
          is_public: publicToggle,
        }).select('id').maybeSingle();
        if (inserted?.id) newImage.dbId = inserted.id;
      }
      setImages((prev) => [newImage, ...prev]);
      setSelectedImageId(newImage.id);
      showToast('Image generated successfully!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('generationError');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedImage) return;
    try {
      const blob = await fetchImageBlobViaProxy(selectedImage.url);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${selectedImage.timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('Image downloaded!', 'success');
    } catch (err) {
      console.error('Download failed:', err);
      showToast('Download failed', 'error');
    }
  };

  const handleShare = () => {
    if (!selectedImage) return;
    setShareModalImage(selectedImage);
  };

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await signOut();
    showToast('Signed out successfully', 'info');
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? 'U';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <nav className={`sticky top-0 z-50 ${isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200'} border-b backdrop-blur-md transition-all duration-200`}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-900/40' : 'bg-cyan-50'}`}>
                <Sparkles className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              </div>
              <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('appName')}</h1>
            </div>

            <div className={`flex gap-1 ${isDark ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100 border-gray-300'} border rounded-xl p-1`}>
              <button
                onClick={() => {
                  if (!session) { setAuthScreen('login'); return; }
                  setActiveView('create');
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeView === 'create' ? (isDark ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-white text-cyan-700 shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800')}`}
              >
                {t('navCreate')}
              </button>
              <button
                onClick={() => setActiveView('explore')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeView === 'explore' ? (isDark ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-white text-cyan-700 shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800')}`}
              >
                {t('navExplore')}
              </button>
            </div>

            <div className="relative" ref={profileMenuRef}>
              {session ? (
                <>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]
                      ${isDark ? 'hover:bg-gray-700/60 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {userInitial}
                    </div>
                    <span className={`text-sm font-medium max-w-[100px] truncate hidden sm:block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {user?.email?.split('@')[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>

                  {profileMenuOpen && (
                    <div className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-2xl overflow-hidden animate-slideUp z-50
                      ${isDark ? 'bg-gray-800/95 border-gray-700/60 backdrop-blur-xl' : 'bg-white border-gray-200 shadow-xl'}`}>
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Signed in as</p>
                        <p className={`text-sm font-semibold truncate mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.email}</p>
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={() => { setProfileMenuOpen(false); setActiveView('profile'); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
                            ${isDark ? 'text-gray-300 hover:bg-gray-700/60 hover:text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button
                          onClick={handleSignOut}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
                            ${isDark ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300' : 'text-red-600 hover:bg-red-50'}`}
                        >
                          <LogOut className="w-4 h-4" />
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setAuthScreen('login')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]
                      ${isDark ? 'text-gray-300 hover:bg-gray-700/60' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setAuthScreen('signup')}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-md"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {activeView === 'explore' && <Explore />}

      {activeView === 'profile' && session && <Profile onImagesChanged={() => setImagesLoaded(false)} />}

      {activeView === 'create' && session && (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="container mx-auto px-4 py-8 max-w-3xl h-full flex flex-col">
                <div className="space-y-5 flex-1 flex flex-col">
                  <div className={`${isDark ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border-gray-700/50' : 'bg-white/60 border-gray-200'} backdrop-blur-xl rounded-2xl p-6 shadow-xl border animate-fadeIn`}>
                    <div className="space-y-4">
                      <div className={`flex gap-1.5 p-1 ${isDark ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100 border-gray-200'} border rounded-xl mb-4`}>
                        <button
                          onClick={() => handleModeChange('create')}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${mode === 'create' ? (isDark ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20' : 'bg-white text-cyan-700 shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800')}`}
                        >
                          {t('modeCreate')}
                        </button>
                        <button
                          onClick={() => handleModeChange('edit')}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${mode === 'edit' ? (isDark ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20' : 'bg-white text-cyan-700 shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800')}`}
                        >
                          {t('modeEdit')}
                        </button>
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} -mt-1`}>
                        <span className="font-semibold">{t('modelUsing')}:</span> {mode === 'create' ? 'FLUX 1.1 Pro' : 'FLUX Kontext Pro'}
                      </div>
                      <div className="flex gap-2">
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isLoading && prompt.trim()) { e.preventDefault(); generateImage(); } }}
                          placeholder={mode === 'create' ? t('promptPlaceholder') : t('promptPlaceholderEdit')}
                          className={`flex-1 px-5 py-4 ${isDark ? 'bg-gray-950/80 border-gray-600/50 text-white placeholder-gray-600 focus:border-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none h-24 transition-all duration-150`}
                          disabled={isLoading}
                        />
                        {mode === 'create' && (
                          <button
                            onClick={handleSurpriseMe}
                            disabled={isLoading}
                            className={`px-4 py-3 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} shadow-md`}
                            title="Surprise me!"
                          >
                            <Dice5 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {mode === 'edit' && (
                        <ImageUpload onImageSelect={setReferenceImageUrl} onImageClear={() => setReferenceImageUrl('')} previewUrl={referenceImageUrl} />
                      )}
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
                        <button
                          onClick={() => setPublicToggle(!publicToggle)}
                          className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all duration-150 active:scale-[0.98]
                            ${publicToggle ? (isDark ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') : (isDark ? 'bg-gray-700/60 text-gray-300 border border-gray-600/40' : 'bg-gray-100 text-gray-600 border border-gray-200')}`}
                        >
                          {publicToggle ? <><Globe className="w-4 h-4" />{t('makePublic')}</> : <><Lock className="w-4 h-4" />{t('makePrivate')}</>}
                        </button>
                        <button
                          onClick={generateImage}
                          disabled={isLoading || !prompt.trim() || (mode === 'edit' && !referenceImageUrl)}
                          className="flex-1 py-2.5 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold text-white transition-all duration-150 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] disabled:cursor-not-allowed btn-ripple"
                        >
                          {isLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />{t('generating')}</>
                          ) : (
                            <><Sparkles className="w-4 h-4 inline mr-2" />{t('generateImage')}</>
                          )}
                        </button>
                      </div>
                      {error && (
                        <div className={`p-4 rounded-xl border animate-slideUp ${isDark ? 'bg-red-900/30 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
                          <p className="text-sm">{error}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedImage && !isLoading && (
                    <div className={`flex-1 ${isDark ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/40 border-gray-700/50' : 'bg-white/60 border-gray-200'} backdrop-blur-xl rounded-2xl p-6 shadow-xl border flex flex-col`}>
                      <div
                        className="flex-1 flex items-center justify-center mb-4 cursor-pointer group"
                        onClick={() => setLightboxImageId(selectedImage.id)}
                      >
                        <div className="relative">
                          <img
                            key={selectedImage.id}
                            src={selectedImage.url}
                            alt={selectedImage.prompt}
                            className={`max-w-full max-h-full rounded-xl shadow-2xl transition-all duration-500 group-hover:shadow-cyan-500/10 group-hover:scale-[1.01] ${imageVisible ? 'animate-fadeInScale' : 'opacity-0'}`}
                          />
                          <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg font-medium">
                              Click to enlarge
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selectedImage.prompt}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleDownload}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] btn-ripple ${isDark ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600' : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500'} text-white shadow-lg hover:shadow-cyan-500/20`}
                          >
                            <Download className="w-4 h-4" />{t('download')}
                          </button>
                          <button
                            onClick={handleShare}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                          >
                            <Share2 className="w-4 h-4" />{t('share')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`w-full lg:w-72 ${isDark ? 'border-t lg:border-t-0 lg:border-l border-gray-700/50' : 'border-t lg:border-t-0 lg:border-l border-gray-200'} backdrop-blur-xl`}>
            <ImageGallery
              images={images}
              selectedId={selectedImageId}
              onSelect={setSelectedImageId}
              onClear={() => { setImages([]); setSelectedImageId(null); }}
              onShare={(img) => setShareModalImage(img)}
            />
          </div>
        </div>
      )}

      <Lightbox
        image={lightboxImageId ? images.find((img) => img.id === lightboxImageId) || null : null}
        images={images}
        onClose={() => setLightboxImageId(null)}
        onNavigate={(id) => setLightboxImageId(id)}
      />
      {shareModalImage && user && (
        <ShareModal
          imageId={shareModalImage.dbId || ''}
          imageUrl={shareModalImage.url}
          prompt={shareModalImage.prompt}
          isPublic={shareModalImage.isPublic ?? false}
          userId={user.id}
          onClose={() => setShareModalImage(null)}
          onPublished={() => {
            setImages((prev) => prev.map((img) => img.id === shareModalImage.id ? { ...img, isPublic: true } : img));
            showToast('Image published to community feed!', 'success');
          }}
        />
      )}
      <SettingsPanel />
    </div>
  );
}

export default App;
