import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Loader2, Globe, Sparkles } from 'lucide-react';
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

const PAGE_SIZE = 12;

const ExploreCardSkeleton = ({ isDark }: { isDark: boolean }) => (
  <div className={`mb-4 break-inside-avoid rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800/60' : 'bg-white'} border ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
    <div className={`w-full h-48 ${isDark ? 'skeleton' : 'skeleton-light'}`} />
    <div className="p-4 space-y-2">
      <div className={`h-3 rounded-full w-full ${isDark ? 'skeleton' : 'skeleton-light'}`} />
      <div className={`h-3 rounded-full w-2/3 ${isDark ? 'skeleton' : 'skeleton-light'}`} />
      <div className={`h-8 rounded-lg w-full mt-3 ${isDark ? 'skeleton' : 'skeleton-light'}`} />
    </div>
  </div>
);

export const Explore = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [images, setImages] = useState<ImageWithLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const offsetRef = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const fetchImages = useCallback(async (offset: number, append = false) => {
    try {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      const { data, error } = await supabase
        .from('generated_images')
        .select('id, url, prompt')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const batch = data || [];
      if (batch.length < PAGE_SIZE) setHasMore(false);

      const withLikes = await Promise.all(batch.map(async (img) => {
        const { count } = await supabase.from('image_likes').select('id', { count: 'exact', head: true }).eq('image_id', img.id);
        let user_liked = false;
        if (user) {
          const { data: likeData } = await supabase.from('image_likes').select('id').eq('image_id', img.id).eq('user_id', user.id).maybeSingle();
          user_liked = !!likeData;
        }
        return { ...img, likes_count: count || 0, user_liked };
      }));

      setImages((prev) => append ? [...prev, ...withLikes] : withLikes);
      offsetRef.current = offset + batch.length;
    } catch (err) {
      console.error('Failed to load images:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user]);

  useEffect(() => {
    offsetRef.current = 0;
    setHasMore(true);
    setImages([]);
    fetchImages(0, false);
  }, [user]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchImages(offsetRef.current, true);
        }
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, fetchImages]);

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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-10 animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-cyan-900/40' : 'bg-cyan-50'}`}>
              <Globe className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('communityFeed')}</h1>
          </div>
          <p className={`ml-14 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Explore AI-generated images from the community
          </p>
        </div>

        {loading ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ExploreCardSkeleton key={i} isDark={isDark} />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl ${isDark ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white/60 border-gray-200'} border animate-fadeIn`}>
            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} animate-bounce-subtle`}>
              <Sparkles className={`w-10 h-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <p className={`text-lg font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No public images yet</p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Be the first to share your creation!</p>
          </div>
        ) : (
          <>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  style={{ animationDelay: `${Math.min((index % 12) * 0.06, 0.6)}s` }}
                  className={`mb-4 break-inside-avoid rounded-2xl overflow-hidden stagger-item card-hover
                    ${isDark ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white border-gray-200'}
                    border shadow-md group`}
                >
                  <div className="image-hover-zoom">
                    {!loadedIds.has(img.id) && (
                      <div className={`w-full h-48 ${isDark ? 'skeleton' : 'skeleton-light'}`} />
                    )}
                    <img
                      src={img.url}
                      alt={img.prompt}
                      onLoad={() => setLoadedIds((prev) => new Set(prev).add(img.id))}
                      className={`w-full object-cover transition-opacity duration-500 ${loadedIds.has(img.id) ? 'opacity-100' : 'opacity-0 h-0'}`}
                    />
                  </div>
                  <div className="p-4">
                    <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{img.prompt}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleLike(img.id)}
                        disabled={!user}
                        className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium
                          transition-all duration-150 active:scale-95 btn-ripple
                          ${!user ? 'opacity-50 cursor-not-allowed' : ''}
                          ${img.user_liked
                            ? (isDark ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' : 'bg-red-50 text-red-600 hover:bg-red-100')
                            : (isDark ? 'bg-gray-700/70 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                          }`}
                      >
                        <Heart className={`w-4 h-4 transition-transform duration-150 ${img.user_liked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
                        <span>{img.likes_count}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
              {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />}
              {!hasMore && images.length > 0 && (
                <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>All images loaded</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
