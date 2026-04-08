import { useState } from 'react';
import { Download, Images, Trash2, Share2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { fetchImageBlobViaProxy } from '../lib/imageUtils';

interface GalleryImage {
  id: string;
  dbId?: string;
  url: string;
  prompt: string;
  timestamp: number;
  isPublic?: boolean;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  onShare?: (image: GalleryImage) => void;
}

export const ImageGallery = ({ images, selectedId, onSelect, onClear, onShare }: ImageGalleryProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());

  const handleDownload = async (e: React.MouseEvent, image: GalleryImage) => {
    e.stopPropagation();
    try {
      const blob = await fetchImageBlobViaProxy(image.url);
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

  const handleShare = (e: React.MouseEvent, image: GalleryImage) => {
    e.stopPropagation();
    if (onShare) onShare(image);
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-900/40' : 'bg-gray-50/60'} backdrop-blur-sm`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Images className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Gallery
          </h3>
          {images.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isDark ? 'bg-cyan-900/60 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}`}>
              {images.length}
            </span>
          )}
        </div>
        {images.length > 0 && (
          <button
            onClick={onClear}
            className={`p-1.5 rounded-lg transition-all duration-150 group ${isDark ? 'hover:bg-red-900/40 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
            title="Clear all"
          >
            <Trash2 className="w-3.5 h-3.5 transition-transform duration-150 group-hover:scale-110" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gray-800/80' : 'bg-gray-200/80'} animate-bounce-subtle`}>
              <Images className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <div className="text-center space-y-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No images yet</p>
              <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Your creations will appear here</p>
            </div>
          </div>
        ) : (
          <div className="columns-2 gap-2">
            {images.map((img, index) => (
              <div
                key={img.id}
                onClick={() => onSelect(img.id)}
                style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                className={`relative group cursor-pointer rounded-xl overflow-hidden mb-2 break-inside-avoid stagger-item image-hover-zoom
                  transition-shadow duration-200
                  ${selectedId === img.id
                    ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20'
                    : `ring-1 ${isDark ? 'ring-gray-700/60 hover:ring-gray-500/60' : 'ring-gray-200 hover:ring-gray-300'}`
                  }`}
              >
                {!loadedIds.has(img.id) && (
                  <div className={`${isDark ? 'skeleton' : 'skeleton-light'} rounded-xl`} style={{ minHeight: '80px', aspectRatio: '1' }} />
                )}
                <img
                  src={img.url}
                  alt={img.prompt}
                  onLoad={() => setLoadedIds((prev) => new Set(prev).add(img.id))}
                  className={`w-full object-cover rounded-xl transition-opacity duration-300 ${loadedIds.has(img.id) ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-end p-2">
                  <p className="text-xs text-white/90 line-clamp-2 mb-1.5 leading-tight">{img.prompt}</p>
                  <div className="flex gap-1 self-end">
                    <button
                      onClick={(e) => handleShare(e, img)}
                      className="p-1.5 bg-gray-700/80 hover:bg-gray-600 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95 shadow-lg"
                      title="Share"
                    >
                      <Share2 className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={(e) => handleDownload(e, img)}
                      className="p-1.5 bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95 shadow-lg"
                      title="Download"
                    >
                      <Download className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
                {selectedId === img.id && (
                  <div className="absolute top-1.5 left-1.5 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/60 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
