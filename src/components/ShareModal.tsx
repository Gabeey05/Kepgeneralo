import { useState } from 'react';
import { X, Copy, Globe, Check, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

interface ShareModalProps {
  imageId: string;
  imageUrl: string;
  prompt: string;
  isPublic: boolean;
  userId: string;
  onClose: () => void;
  onPublished: () => void;
}

export const ShareModal = ({ imageId, imageUrl, prompt, isPublic, userId, onClose, onPublished }: ShareModalProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(isPublic);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePublish = async () => {
    if (published) return;
    setPublishing(true);
    try {
      const { error } = await supabase
        .from('generated_images')
        .update({ is_public: true })
        .eq('id', imageId)
        .eq('user_id', userId);
      if (!error) {
        setPublished(true);
        onPublished();
      }
    } catch {
      // ignore
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm rounded-2xl border shadow-2xl animate-fadeInScale overflow-hidden
          ${isDark ? 'bg-gray-900 border-gray-700/60' : 'bg-white border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
          <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Share Image</h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95 ${isDark ? 'hover:bg-gray-700/60 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <img src={imageUrl} alt={prompt} className="w-full h-40 object-cover" />
          </div>
          <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{prompt}</p>

          <button
            onClick={handleCopy}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 active:scale-[0.98]
              ${copied
                ? (isDark ? 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                : (isDark ? 'bg-gray-800/60 border-gray-700/50 text-gray-200 hover:bg-gray-700/60 hover:border-gray-600' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100')
              }`}
          >
            {copied ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
            <div className="text-left">
              <p className="text-sm font-medium">{copied ? 'Copied!' : 'Copy link'}</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Copy the image URL to clipboard</p>
            </div>
          </button>

          <button
            onClick={handlePublish}
            disabled={published || publishing}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 active:scale-[0.98] disabled:cursor-default
              ${published
                ? (isDark ? 'bg-cyan-900/30 border-cyan-700/40 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700')
                : (isDark ? 'bg-gray-800/60 border-gray-700/50 text-gray-200 hover:bg-gray-700/60 hover:border-gray-600' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100')
              }`}
          >
            {publishing ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : published ? <Check className="w-4 h-4 shrink-0" /> : <Globe className="w-4 h-4 shrink-0" />}
            <div className="text-left">
              <p className="text-sm font-medium">{published ? 'Published to community!' : 'Post to community feed'}</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {published ? 'Visible to everyone on Explore' : 'Share permanently on the Explore page'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
