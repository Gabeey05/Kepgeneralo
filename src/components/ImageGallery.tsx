import { X } from 'lucide-react';

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

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {images.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            Generated images will appear here
          </p>
        ) : (
          images.map((img) => (
            <div
              key={img.id}
              onClick={() => onSelect(img.id)}
              className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all ${
                selectedId === img.id
                  ? 'ring-2 ring-cyan-400 scale-105'
                  : 'hover:scale-105 ring-1 ring-gray-600/50'
              }`}
            >
              <img
                src={img.url}
                alt={img.prompt}
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="text-xs text-white/0 group-hover:text-white/80 text-center px-2 transition-colors truncate">
                  {img.prompt}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
