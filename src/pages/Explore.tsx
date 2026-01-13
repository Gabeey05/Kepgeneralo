import { useState, useEffect } from 'react';
import { Heart, Loader2, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageWithLikes {
  id: string;
  url: string;
  prompt: string;
  likes_count: number;
  user_liked: boolean;
}

export const Explore = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [images, setImages] = useState<ImageWithLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    loadPublicImages();
  }, [user]);

  const loadPublicImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('generated_images').select('id, url, prompt').eq('is_public', true).order('created_at', { ascending: false });
      if (error) throw error;
      const imagesWithLikes = await Promise.all((data || []).map(async (img) => {
        const { count } = await supabase.from('image_likes').select('id', { count: 'exact', head: true }).eq('image_id', img.id);
        let userLiked = false;
        if (user) {
          const { data: likeData } = await supabase.from('image_likes').select('id').eq('image_id', img.id).eq('user_id', user.id).maybeSingle();
          userLiked = !!likeData;
        }
        return { ...img, likes_count: count || 0, user_liked: userLiked };
      }));
      setImages(imagesWithLikes);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (imageId: string) => {
    if (!user) return;
    const image = images.find((img) => img.id === imageId);
    if (!image) return;
    try {
      if (image.user_liked) {
        await supabase.from('image_likes').delete().eq('image_id', imageId).eq('user_id', user.id);
        setImages(images.map((img) => img.id === imageId ? { ...img, user_liked: false, likes_count: img.likes_count - 1 } : img));
      } else {
        await supabase.from('image_likes').insert({ image_id: imageId, user_id: user.id });
        setImages(images.map((img) => img.id === imageId ? { ...img, user_liked: true, likes_count: img.likes_count + 1 } : img));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className={`text-4xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('communityFeed')}</h1>
        {images.length === 0 ? (
          <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-100 border-gray-300'} border`}>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t('noImages')}</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
            {images.map((img) => (
              <div key={img.id} className={`mb-4 break-inside-avoid rounded-lg overflow-hidden ${isDark ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white border-gray-200'} border shadow-lg hover:shadow-xl transition-all group`}>
                <img src={img.url} alt={img.prompt} className="w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="p-4">
                  <p className={`text-xs line-clamp-2 mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{img.prompt}</p>
                  <div className="flex gap-2">
                    {user && (
                      <button onClick={() => toggleLike(img.id)} className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium ${img.user_liked ? (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-600') : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                        <Heart className={`w-4 h-4 ${img.user_liked ? 'fill-current' : ''}`} />{img.likes_count}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
