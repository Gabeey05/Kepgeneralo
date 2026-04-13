import { useState, useEffect } from 'react';
import { Trash2, Globe, Lock, Loader2, Image, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../Toast';

interface MyImage {
  id: string;
  image_path: string;
  prompt: string;
  is_public: boolean;
  created_at: string;
  likes_count: number;
}

interface Props {
  userId: string;
  onDelete?: () => void;
}

export const MyImagesTab = ({ userId, onDelete }: Props) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [images, setImages] = useState<MyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const { data, error } = await supabase
        .from('generated_images')
        .select('id, image_path, prompt, is_public, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error || !data) { setLoading(false); return; }

      const withLikes = await Promise.all(data.map(async (img) => {
        const { count } = await supabase
          .from('image_likes')
          .select('id', { count: 'exact', head: true })
          .eq('image_id', img.id);
        const imagePath = img.image_path as string;
        const resolvedUrl = imagePath.startsWith('http')
          ? imagePath
          : `${supabaseUrl}/storage/v1/object/public/generated-images/${imagePath}`;
        return { ...img, image_path: resolvedUrl, likes_count: count || 0 };
      }));

      setImages(withLikes);
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleDelete = async (img: MyImage) => {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    setDeletingId(img.id);
    try {
      const { error } = await supabase.from('generated_images').delete().eq('id', img.id);
      if (error) throw error;
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      onDelete?.();
      showToast('Image deleted', 'success');
    } catch {
      showToast('Failed to delete image', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleVisibility = async (img: MyImage) => {
    setTogglingId(img.id);
    try {
      const { error } = await supabase
        .from('generated_images')
        .update({ is_public: !img.is_public })
        .eq('id', img.id);
      if (error) throw error;
      setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, is_public: !i.is_public } : i));
      showToast(img.is_public ? 'Image set to private' : 'Image published to community!', 'success');
    } catch {
      showToast('Failed to update visibility', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={`text-center py-20 rounded-2xl border ${isDark ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white/60 border-gray-200'}`}>
        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
          <Image className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
        <p className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No images yet</p>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Generate your first image in the Create tab</p>
      </div>
    );
  }

  return (
    <div>
      <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{images.length} image{images.length !== 1 ? 's' : ''}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className={`group relative rounded-2xl overflow-hidden border ${isDark ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white border-gray-200'} shadow-sm hover:shadow-lg transition-shadow duration-200`}
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={img.image_path}
                alt={img.prompt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs line-clamp-2 mb-2 leading-relaxed">{img.prompt}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleToggleVisibility(img)}
                    disabled={togglingId === img.id}
                    title={img.is_public ? 'Make Private' : 'Make Public'}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-medium transition-colors
                      ${img.is_public ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white' : 'bg-gray-600/80 hover:bg-gray-500 text-white'}`}
                  >
                    {togglingId === img.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : img.is_public ? (
                      <><Globe className="w-3 h-3" /><span>Public</span></>
                    ) : (
                      <><Lock className="w-3 h-3" /><span>Private</span></>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(img)}
                    disabled={deletingId === img.id}
                    title="Delete"
                    className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white transition-colors"
                  >
                    {deletingId === img.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute top-2 right-2 flex gap-1">
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1
                ${img.is_public ? 'bg-emerald-500/80 text-white' : 'bg-gray-700/80 text-gray-300'}`}>
                {img.is_public ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
              </div>
              {img.likes_count > 0 && (
                <div className="px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1 bg-black/50 text-white">
                  <Heart className="w-2.5 h-2.5 fill-current text-red-400" />
                  <span>{img.likes_count}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
