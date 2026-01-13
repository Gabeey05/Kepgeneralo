import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ImageUploadProps {
  onImageSelect: (url: string) => void;
  onImageClear: () => void;
  previewUrl?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, onImageClear, previewUrl }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDark = theme === 'dark';

  const handleFile = async (file: File) => {
    if (!user) {
      setError('Please log in to upload images');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('reference-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('reference-images')
        .getPublicUrl(data.path);

      onImageSelect(publicUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
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

  if (isUploading) {
    return (
      <div className={`relative rounded-lg border-2 border-dashed p-6 text-center ${isDark ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-cyan-600 bg-cyan-50'}`}>
        <Loader2 className={`w-8 h-8 mx-auto mb-2 animate-spin ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Uploading...</p>
      </div>
    );
  }

  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} className={`relative rounded-lg border-2 border-dashed p-6 text-center cursor-pointer ${isDragging ? (isDark ? 'border-cyan-400 bg-cyan-400/10' : 'border-cyan-600 bg-cyan-50') : (isDark ? 'border-gray-600/50 hover:border-cyan-400/50 bg-gray-900/50' : 'border-gray-300 hover:border-cyan-400 bg-gray-50')}`}>
        <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} className="hidden" id="image-upload" disabled={isUploading} />
        <label htmlFor="image-upload" className="cursor-pointer block">
          <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('dragDropImage')}</p>
        </label>
      </div>
      {error && (
        <div className={`mt-2 p-2 rounded-lg text-sm ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}
    </div>
  );
};
