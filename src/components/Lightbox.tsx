import { useEffect, useCallback } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

interface LightboxProps {
  image: LightboxImage | null;
  images?: LightboxImage[];
  onClose: () => void;
  onNavigate?: (id: string) => void;
}

export const Lightbox = ({ image, images = [], onClose, onNavigate }: LightboxProps) => {
  const currentIndex = images.findIndex((img) => img.id === image?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && onNavigate) onNavigate(images[currentIndex - 1].id);
  }, [hasPrev, currentIndex, images, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext && onNavigate) onNavigate(images[currentIndex + 1].id);
  }, [hasNext, currentIndex, images, onNavigate]);

  useEffect(() => {
    if (!image) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [image, onClose, handlePrev, handleNext]);

  if (!image) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${image.timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/92 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-sm text-gray-300 line-clamp-1 flex-1 mr-4">{image.prompt}</p>
          {images.length > 1 && (
            <span className="text-xs text-gray-500 mr-3 shrink-0">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          <button
            onClick={onClose}
            className="shrink-0 p-2 hover:bg-white/10 rounded-xl transition-all duration-150 hover:scale-110 active:scale-95 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="relative flex-1 flex items-center justify-center bg-black/30 rounded-2xl overflow-hidden border border-white/5">
          <img
            src={image.url}
            alt={image.prompt}
            className="max-w-full max-h-[calc(92vh-140px)] object-contain animate-fadeInScale"
            key={image.id}
          />

          {images.length > 1 && hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-xl border border-white/10 transition-all duration-150 hover:scale-105 active:scale-95 group"
            >
              <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
            </button>
          )}

          {images.length > 1 && hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-xl border border-white/10 transition-all duration-150 hover:scale-105 active:scale-95 group"
            >
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => onNavigate?.(img.id)}
                className={`transition-all duration-200 rounded-full ${
                  i === currentIndex
                    ? 'w-5 h-1.5 bg-cyan-400'
                    : 'w-1.5 h-1.5 bg-gray-600 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleDownload}
          className="mt-3 w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 rounded-xl font-medium text-white transition-all duration-150 flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] btn-ripple"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
    </div>
  );
};
