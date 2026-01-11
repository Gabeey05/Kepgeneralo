import { Download } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}

export const ImageGallery = ({
  images,
  selectedId,
  onSelect,
  onClear,
}: ImageGalleryProps) => {
  const handleDownload = async (e: React.MouseEvent, image: GalleryImage) => {
    e.stopPropagation();
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
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-800/40 to-gray-900/40 backdrop-blur-sm border-l border-gray-700/50">
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-300">Gallery</h3>
        {images.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs px-2 py-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {images.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            Generated images will appear here
          </p>
        ) : (
          <div className="columns-2 gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => onSelect(img.id)}
                className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all mb-2 break-inside-avoid hover:scale-105 ${
                  selectedId === img.id
                    ? 'ring-2 ring-cyan-400'
                    : 'ring-1 ring-gray-600/50'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="w-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-between p-2 opacity-0 group-hover:opacity-100">
                  <span className="text-xs text-white text-center line-clamp-2">
                    {img.prompt}
                  </span>
                  <button
                    onClick={(e) => handleDownload(e, img)}
                    className="mt-auto p-1.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-all"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
