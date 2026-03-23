import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout/Layout";
import { getAccessToken, getStoredUser } from "../../utils/authStorage";
import { getUserIdFromToken } from "../../utils/jwt";
import { apiFetch, apiUrl } from "../../utils/apiClient";
import { USERS, MEMBERSHIP_RANKS } from "../../constants/apiEndpoints";
import {
  Award,
  TrendingUp,
  Star,
  Target,
  Crown,
  Gem,
  Shield,
  Zap,
  ChevronRight
} from "lucide-react";

const fmt = (n) => Number(n ?? 0).toLocaleString("vi-VN");

export default function MembershipStatus() {
  const [ranks, setRanks] = useState([]);
  const [rankName, setRankName] = useState("");
  const [totalSpending, setTotalSpending] = useState(() => {
    const stored = getStoredUser();
    return Number(stored?.totalSpending ?? stored?.total_spending ?? 0);
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rr = await apiFetch(MEMBERSHIP_RANKS.LIST);
        const rj = await rr.json().catch(() => null);
        if (!cancelled && rr.ok && Array.isArray(rj?.data)) {
          setRanks(
            [...rj.data].sort((a, b) => Number(a.minSpending ?? 0) - Number(b.minSpending ?? 0))
          );
        }
      } catch {
        /* ignore */
      }

      const stored = getStoredUser();
      if (stored?.totalSpending != null) {
        setTotalSpending(Number(stored.totalSpending ?? 0));
      }

      const token = getAccessToken();
      const userId = token ? getUserIdFromToken(token) : null;
      if (!userId) return;

      try {
        const res = await fetch(apiUrl(USERS.BY_ID(userId)), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => null);
        if (!cancelled && res.ok && json?.data) {
          setTotalSpending(Number(json.data.totalSpending ?? 0));
          setRankName(json.data.rankName || "");
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const progress = useMemo(() => {
    if (!ranks.length) {
      return { pct: 0, next: null, label: rankName || "—" };
    }
    const spend = Number(totalSpending || 0);
    let idx = -1;
    for (let i = 0; i < ranks.length; i++) {
      const m = Number(ranks[i].minSpending ?? 0);
      if (spend >= m) idx = i;
    }
    const current = idx >= 0 ? ranks[idx] : null;
    const next = idx < ranks.length - 1 ? ranks[idx + 1] : null;
    const label = rankName || current?.rankName || "—";
    if (!next) {
      return { pct: 100, next: null, label };
    }
    const curMin = Number(current?.minSpending ?? 0);
    const nextMin = Number(next.minSpending ?? 0);
    const pct =
      nextMin > curMin
        ? Math.min(100, Math.max(0, ((spend - curMin) / (nextMin - curMin)) * 100))
        : 0;
    return { pct, next, label };
  }, [ranks, totalSpending, rankName]);

  return (
    <Layout>
      <div className="min-h-screen bg-zinc-950 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Award size={16} />
              Hạng thành viên
            </p>
            <h1 className="text-4xl font-bold text-white">
              TRANG THAI <span className="text-rose-500">MEMBERSHIP</span>
            </h1>
          </div>

          {/* Current Status */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Crown className="text-rose-500" />
                    Hạng hiện tại
                  </h3>
                  <div className="text-2xl font-bold text-amber-400">
                    {progress.label}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Tổng chi tiêu</span>
                    <span className="text-white font-bold">{fmt(totalSpending)}đ</span>
                  </div>
                  
                  {progress.next && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Cần thêm để lên {progress.next.rankName}</span>
                          <span className="text-amber-400 font-bold">
                            {fmt(Math.max(0, progress.next.minSpending - totalSpending))}đ
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-500"
                            style={{ width: `${progress.pct}%` }}
                          />
                        </div>
                        <div className="text-center text-xs text-zinc-500">
                          {progress.pct.toFixed(1)}% hoàn thành
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-rose-600/20 to-amber-500/20 border border-rose-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-rose-500 to-amber-500 rounded-2xl flex items-center justify-center text-white">
                    <Star size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Quyền lợi</h4>
                  <p className="text-sm text-zinc-300">
                    Tích lũy điểm thưởng và nhận các ưu đãi độc quyền
                  </p>
                </div>
              </div>
            </div>
          </div>
              {/* All Ranks */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Target className="text-rose-500" />
              Tất cả các hạng
            </h3>
            
            {ranks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500 font-medium">
                  Chưa có danh sách hạng (admin chưa cấu hình membership ranks)
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ranks.map((r) => {
                  const isCurrent = r.rankName === progress.label;
                  return (
                    <div 
                      key={r.id} 
                      className={`bg-zinc-900/50 border rounded-2xl p-6 backdrop-blur-sm transition-all ${
                        isCurrent 
                          ? 'border-amber-500/50 shadow-lg shadow-amber-500/20' 
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                          isCurrent ? 'bg-gradient-to-br from-amber-500 to-rose-500' : 'bg-zinc-800'
                        }`}>
                          {isCurrent ? <Crown size={20} /> : <Award size={20} />}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold text-lg mb-2 ${
                            isCurrent ? 'text-amber-400' : 'text-white'
                          }`}>
                            {r.rankName}
                            {isCurrent && <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">Hiện tại</span>}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400">Chi tiêu tối thiểu</span>
                              <span className="text-white font-medium">{fmt(r.minSpending)}đ</span>
                            </div>
                            {r.discountPercent != null && (
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-400">Ưu đãi</span>
                                <span className="text-emerald-400 font-medium">{r.discountPercent}%</span>
                              </div>
                            )}
                            {r.bonusPoint != null && (
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-400">Điểm thưởng</span>
                                <span className="text-amber-400 font-medium">+{r.bonusPoint}</span>
                              </div>
                            )}
                          </div>
                          {r.description && (
                            <p className="text-xs text-zinc-500 mt-3">{r.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}

