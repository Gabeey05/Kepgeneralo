import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';

interface LikedImage {
  id: string;
  image_path: string;
  prompt: string;
  likes_count: number;
}

interface Props {
  userId: string;
}

export const LikedImagesTab = ({ userId }: Props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [images, setImages] = useState<LikedImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

      const { data, error } = await supabase
        .from('image_likes')
        .select('image_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) { setLoading(false); return; }

      const imageIds = data.map((r) => r.image_id);
      if (imageIds.length === 0) { setLoading(false); return; }

      const { data: imgs } = await supabase
        .from('generated_images')
        .select('id, image_path, prompt')
        .in('id', imageIds);

      if (!imgs) { setLoading(false); return; }

      const withLikes = await Promise.all(imgs.map(async (img) => {
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

      const orderedIds = new Map(data.map((r, i) => [r.image_id, i]));
      withLikes.sort((a, b) => (orderedIds.get(a.id) ?? 999) - (orderedIds.get(b.id) ?? 999));

      setImages(withLikes);
      setLoading(false);
    };
    load();
  }, [userId]);

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
          <Heart className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
        <p className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No liked images yet</p>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Explore the community feed and like images you enjoy</p>
      </div>
    );
  }

  return (
    <div>
      <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{images.length} liked image{images.length !== 1 ? 's' : ''}</p>
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs line-clamp-2 leading-relaxed">{img.prompt}</p>
              </div>
            </div>
            <div className="absolute top-2 right-2">
              <div className="px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1 bg-black/50 text-white">
                <Heart className="w-2.5 h-2.5 fill-current text-red-400" />
                <span>{img.likes_count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
