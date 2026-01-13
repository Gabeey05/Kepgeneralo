import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageUploadProps {
  onImageSelect: (url: string) => void;
  onImageClear: () => void;
  previewUrl?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, onImageClear, previewUrl }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const isDark = theme === 'dark';

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onImageSelect(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (previewUrl) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${isDark ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100 border-gray-300'} border`}>
        <img src={previewUrl} alt="Reference" className="w-full h-48 object-cover" />
        <button onClick={onImageClear} className={`absolute top-2 right-2 p-1.5 rounded-lg ${isDark ? 'bg-red-900/50 hover:bg-red-800/50' : 'bg-red-100 hover:bg-red-200'}`}>
          <X className="w-4 h-4 text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} className={`relative rounded-lg border-2 border-dashed p-6 text-center cursor-pointer ${isDragging ? (isDark ? 'border-cyan-400 bg-cyan-400/10' : 'border-cyan-600 bg-cyan-50') : (isDark ? 'border-gray-600/50 hover:border-cyan-400/50 bg-gray-900/50' : 'border-gray-300 hover:border-cyan-400 bg-gray-50')}`}>
      <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} className="hidden" id="image-upload" />
      <label htmlFor="image-upload" className="cursor-pointer block">
        <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('dragDropImage')}</p>
      </label>
    </div>
  );
};
