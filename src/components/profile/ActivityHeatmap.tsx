import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  userId: string;
}

const WEEKS = 53;
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const ActivityHeatmap = ({ userId }: Props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activityMap, setActivityMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);

      const { data } = await supabase
        .from('generated_images')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', yearAgo.toISOString());

      const map = new Map<string, number>();
      if (data) {
        for (const row of data) {
          const day = (row.created_at as string).split('T')[0];
          map.set(day, (map.get(day) || 0) + 1);
        }
      }
      setActivityMap(map);
      setLoading(false);
    };
    load();
  }, [userId]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - (WEEKS * 7 - 1) - dayOfWeek);

  const weeks: Date[][] = [];
  const cursor = new Date(startDate);
  for (let w = 0; w < WEEKS; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = week[0].getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTHS[m], weekIndex: wi });
      lastMonth = m;
    }
  });

  const totalThisYear = Array.from(activityMap.values()).reduce((a, b) => a + b, 0);

  const intensityColors = isDark
    ? ['bg-gray-800', 'bg-cyan-900', 'bg-cyan-700', 'bg-cyan-500', 'bg-cyan-300']
    : ['bg-gray-100', 'bg-cyan-100', 'bg-cyan-300', 'bg-cyan-500', 'bg-cyan-700'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-6 ${isDark ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white/80 border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Generation Activity</h3>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {totalThisYear} image{totalThisYear !== 1 ? 's' : ''} in the last year
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          <div className="flex flex-col justify-around pt-5 pr-1">
            {DAYS_OF_WEEK.map((d, i) => (
              <span key={d} className={`text-[9px] leading-none h-[11px] flex items-center ${i % 2 !== 0 ? (isDark ? 'text-gray-500' : 'text-gray-400') : 'invisible'}`}>{d}</span>
            ))}
          </div>

          <div className="flex flex-col">
            <div className="flex gap-1 mb-1 h-5">
              {monthLabels.map((ml) => (
                <div
                  key={`${ml.label}-${ml.weekIndex}`}
                  style={{ marginLeft: ml.weekIndex === 0 ? 0 : undefined, gridColumn: `${ml.weekIndex + 1}` }}
                  className="absolute"
                >
                </div>
              ))}
              <div className="flex gap-1 relative">
                {weeks.map((week, wi) => {
                  const monthLabel = monthLabels.find((ml) => ml.weekIndex === wi);
                  return (
                    <div key={wi} className="relative w-[11px]">
                      {monthLabel && (
                        <span className={`absolute -top-0 left-0 text-[9px] whitespace-nowrap ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {monthLabel.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day) => {
                    const dateStr = formatDate(day);
                    const count = activityMap.get(dateStr) || 0;
                    const intensity = getIntensity(count);
                    const isFuture = day > today;
                    return (
                      <div
                        key={dateStr}
                        className={`w-[11px] h-[11px] rounded-sm transition-transform duration-100 hover:scale-125 cursor-pointer
                          ${isFuture ? 'opacity-0' : intensityColors[intensity]}`}
                        onMouseEnter={(e) => {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setTooltip({ date: dateStr, count, x: rect.left, y: rect.top });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 justify-end">
        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Less</span>
        {intensityColors.map((c, i) => (
          <div key={i} className={`w-[11px] h-[11px] rounded-sm ${c}`} />
        ))}
        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>More</span>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x + 16, top: tooltip.y - 36 }}
        >
          <div className={`px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-xl border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            {tooltip.count > 0 ? `${tooltip.count} image${tooltip.count !== 1 ? 's' : ''}` : 'No images'} on {tooltip.date}
          </div>
        </div>
      )}
    </div>
  );
};
