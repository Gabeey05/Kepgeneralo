import { useState, useEffect } from 'react';
import { Image, Globe, Heart, Lock, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';

interface Stats {
  total: number;
  publicCount: number;
  privateCount: number;
  totalLikesReceived: number;
  mostLikedPrompt: string | null;
  mostLikedCount: number;
}

interface Props {
  userId: string;
}

export const StatsCards = ({ userId }: Props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: images } = await supabase
        .from('generated_images')
        .select('id, prompt, is_public')
        .eq('user_id', userId);

      if (!images) { setLoading(false); return; }

      const total = images.length;
      const publicCount = images.filter((i) => i.is_public).length;
      const privateCount = total - publicCount;

      let totalLikesReceived = 0;
      let mostLikedPrompt: string | null = null;
      let mostLikedCount = 0;

      if (images.length > 0) {
        const likeResults = await Promise.all(
          images.map(async (img) => {
            const { count } = await supabase
              .from('image_likes')
              .select('id', { count: 'exact', head: true })
              .eq('image_id', img.id);
            return { prompt: img.prompt, count: count || 0 };
          })
        );
        totalLikesReceived = likeResults.reduce((sum, r) => sum + r.count, 0);
        const best = likeResults.reduce((a, b) => (a.count >= b.count ? a : b), { prompt: null, count: 0 });
        if (best.count > 0) {
          mostLikedPrompt = best.prompt;
          mostLikedCount = best.count;
        }
      }

      setStats({ total, publicCount, privateCount, totalLikesReceived, mostLikedPrompt, mostLikedCount });
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

  if (!stats) return null;

  const cards = [
    {
      label: 'Total Generated',
      value: stats.total,
      icon: <Image className="w-5 h-5" />,
      color: isDark ? 'from-cyan-900/40 to-blue-900/30 border-cyan-700/30' : 'from-cyan-50 to-blue-50 border-cyan-200',
      iconColor: isDark ? 'text-cyan-400' : 'text-cyan-600',
    },
    {
      label: 'Public Images',
      value: stats.publicCount,
      icon: <Globe className="w-5 h-5" />,
      color: isDark ? 'from-emerald-900/40 to-teal-900/30 border-emerald-700/30' : 'from-emerald-50 to-teal-50 border-emerald-200',
      iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
    },
    {
      label: 'Private Images',
      value: stats.privateCount,
      icon: <Lock className="w-5 h-5" />,
      color: isDark ? 'from-gray-800/60 to-gray-900/40 border-gray-700/50' : 'from-gray-50 to-gray-100 border-gray-200',
      iconColor: isDark ? 'text-gray-400' : 'text-gray-500',
    },
    {
      label: 'Total Likes Received',
      value: stats.totalLikesReceived,
      icon: <Heart className="w-5 h-5" />,
      color: isDark ? 'from-red-900/30 to-rose-900/20 border-red-700/30' : 'from-red-50 to-rose-50 border-red-200',
      iconColor: isDark ? 'text-red-400' : 'text-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border bg-gradient-to-br p-5 ${card.color} transition-transform duration-200 hover:scale-[1.02]`}
          >
            <div className={`mb-3 ${card.iconColor}`}>{card.icon}</div>
            <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.value}</div>
            <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</div>
          </div>
        ))}
      </div>

      {stats.mostLikedPrompt && (
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-gradient-to-br from-amber-900/20 to-orange-900/10 border-amber-700/30' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <h3 className={`text-sm font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Most Liked Image</h3>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
              {stats.mostLikedCount} like{stats.mostLikedCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className={`text-sm leading-relaxed line-clamp-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            "{stats.mostLikedPrompt}"
          </p>
        </div>
      )}

      {stats.total === 0 && (
        <div className={`text-center py-8 rounded-2xl border ${isDark ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white/60 border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Generate some images to see your stats!</p>
        </div>
      )}
    </div>
  );
};
