import { useState } from 'react';
import { Loader2, Download, Sparkles, Share2, Dice5 } from 'lucide-react';
import { ImageGallery } from './components/ImageGallery';
import { AdvancedOptions } from './components/AdvancedOptions';
import { Lightbox } from './components/Lightbox';

const SURPRISE_PROMPTS = [
  'A stunning aurora borealis over a frozen landscape with crystalline ice formations, ultra detailed, 8k',
  'An enchanted forest with bioluminescent mushrooms and ethereal creatures, magical atmosphere, detailed',
  'A futuristic cyberpunk cityscape at night with neon signs and flying vehicles, 8k, cinematic',
  'An underwater temple with ancient ruins and mysterious glowing artifacts, detailed, atmospheric',
  'A steampunk airship flying through cotton candy clouds, detailed mechanical parts, vibrant colors',
  'A medieval fantasy tavern with adventurers and warm candlelight, detailed, atmospheric, high quality',
  'A cosmic nebula with swirling galaxies and floating asteroids, space art, detailed, 8k',
  'An ethereal dragon made of clouds and light, graceful, majestic, fantasy art, detailed',
  'A hidden oasis in a vast desert with palm trees and crystalline water, peaceful, detailed',
  'An elegant ball room with a grand chandelier and dancing figures in period clothing, baroque style',
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

  const selectedImage = images.find((img) => img.id === selectedImageId);

  const handleSurpriseMe = () => {
    const randomPrompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    setPrompt(randomPrompt);
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      let finalPrompt = prompt;
      if (style && STYLE_KEYWORDS[style]) {
        finalPrompt += STYLE_KEYWORDS[style];
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspectRatio,
          safetyTolerance,
          ...(seed !== undefined && { seed }),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      const newImage: GalleryImage = {
        id: crypto.randomUUID(),
        url: data.imageUrl,
        prompt,
        timestamp: Date.now(),
      };

      setImages((prev) => [newImage, ...prev]);
      setSelectedImageId(newImage.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate image'
      );
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
    if (!selectedImage) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Image',
          text: selectedImage.prompt,
          url: selectedImage.url,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && prompt.trim()) {
      generateImage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="flex flex-col lg:flex-row h-screen">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-12 max-w-3xl h-full flex flex-col">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="relative">
                    <Sparkles className="w-10 h-10 text-cyan-400" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    AI Studio
                  </h1>
                </div>
                <p className="text-gray-400 text-sm">
                  Professional image generation powered by FLUX 1.1 Pro
                </p>
              </div>

              <div className="space-y-6 flex-1 flex flex-col">
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-700/50">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Describe your perfect image... (e.g., A cyberpunk cat in neon city, ultra detailed, 8k)"
                            className="w-full px-6 py-4 bg-gray-950/80 border border-gray-600/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none h-24"
                            disabled={isLoading}
                          />
                        </div>
                        <button
                          onClick={handleSurpriseMe}
                          disabled={isLoading}
                          className="self-center px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                          title="Fill with a random creative prompt"
                        >
                          <Dice5 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <AdvancedOptions
                      aspectRatio={aspectRatio}
                      onAspectRatioChange={setAspectRatio}
                      safetyTolerance={safetyTolerance}
                      onSafetyToleranceChange={setSafetyTolerance}
                      style={style}
                      onStyleChange={setStyle}
                      seed={seed}
                      onSeedChange={setSeed}
                    />

                    <button
                      onClick={generateImage}
                      disabled={isLoading || !prompt.trim()}
                      className="w-full relative overflow-hidden py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
                    >
                      {isLoading && (
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 animate-pulse" />
                      )}
                      <span className="relative flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>
                              Generating (may take 10-15 seconds)...
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Generate Image
                          </>
                        )}
                      </span>
                    </button>

                    {error && (
                      <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-xl">
                        <p className="text-sm text-red-200">{error}</p>
                      </div>
                    )}
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex-1 bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-700/50 animate-fadeIn overflow-hidden flex flex-col">
                    <div className="flex-1 flex items-center justify-center mb-4">
                      <div className={`w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl animate-pulse`} />
                    </div>
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-700 rounded animate-pulse" />
                      <div className="h-6 bg-gray-700 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                ) : selectedImage ? (
                  <div className="flex-1 bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-700/50 animate-fadeIn overflow-hidden flex flex-col">
                    <div className="flex-1 flex items-center justify-center mb-4 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightboxImageId(selectedImage.id)}>
                      <img
                        src={selectedImage.url}
                        alt={selectedImage.prompt}
                        className="max-w-full max-h-full rounded-xl shadow-2xl"
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {selectedImage.prompt}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDownload}
                          className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        {navigator.share && (
                          <button
                            onClick={handleShare}
                            className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                          >
                            <Share2 className="w-4 h-4" />
                            Share
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-gray-700/50 bg-gray-900/30 backdrop-blur-xl flex">
          <ImageGallery
            images={images}
            selectedId={selectedImageId}
            onSelect={setSelectedImageId}
            onClear={() => {
              setImages([]);
              setSelectedImageId(null);
            }}
          />
        </div>
      </div>

      <Lightbox
        image={lightboxImageId ? images.find((img) => img.id === lightboxImageId) || null : null}
        onClose={() => setLightboxImageId(null)}
      />
    </div>
  );
}

export default App;
