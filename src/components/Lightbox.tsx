import { X, Download } from 'lucide-react';

interface LightboxProps {
  image: {
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
  } | null;
  onClose: () => void;
}

export const Lightbox = ({ image, onClose }: LightboxProps) => {
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
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-300 line-clamp-1 flex-1">{image.prompt}</p>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center mb-4 bg-gray-900/50 rounded-xl overflow-hidden">
          <img
            src={image.url}
            alt={image.prompt}
            className="max-w-full max-h-[calc(90vh-120px)] object-contain"
          />
        </div>

        <button
          onClick={handleDownload}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
    </div>
  );
};
