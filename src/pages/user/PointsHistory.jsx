import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { getAccessToken, getStoredUser } from "../../utils/authStorage";
import { getUserIdFromToken } from "../../utils/jwt";
import { apiFetch, apiUrl } from "../../utils/apiClient";
import { USERS, ME } from "../../constants/apiEndpoints";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Award,
  Target,
  Zap,
  History,
  AlertCircle,
  XCircle,
  CheckCircle,
  Filter,
  Search,
  ChevronRight
} from "lucide-react";

const fmt = (n) => Number(n ?? 0).toLocaleString("vi-VN");

function computeInitialPoints() {
  // Không hiển thị dữ liệu mẫu; để mặc định 0 cho đến khi tải từ BE
  return 0;
}

export default function PointsHistory() {
  const navigate = useNavigate();
  const [points, setPoints] = useState(computeInitialPoints());
  const [pointRows, setPointRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setPointRows([]);
      return;
    }
    const userId = getUserIdFromToken(token);
    if (!userId) {
      setLoading(false);
      return;
    }

    let c = false;
    (async () => {
      setLoading(true);
      try {
        const [ur, pr] = await Promise.all([
          fetch(apiUrl(USERS.BY_ID(userId)), { headers: { Authorization: `Bearer ${token}` } }),
          apiFetch(ME.POINTS_HISTORY),
        ]);
        const uj = await ur.json().catch(() => null);
        const pj = await pr.json().catch(() => null);
        if (c) return;
        if (ur.ok && uj?.data) setPoints(Number(uj.data.points ?? 0));
        if (pr.status === 401) {
          navigate("/login", { state: { from: "/pointsHistory" } });
          return;
        }
        if (pr.ok && Array.isArray(pj?.data)) {
          setPointRows(
            pj.data.map((r) => ({
              id: r.pointHistoryId,
              date: r.date
                ? new Date(
                    Array.isArray(r.date) ? `${r.date[0]}-${String(r.date[1]).padStart(2, "0")}-${String(r.date[2]).padStart(2, "0")}` : r.date
                  ).toLocaleDateString("vi-VN")
                : "—",
              label: r.description || "—",
              delta: Number(r.points ?? 0),
            }))
          );
        } else {
          setPointRows([]);
        }
      } catch {
        if (!c) setPointRows([]);
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [navigate]);

  const POINT_EVENTS = pointRows;

  const currentBalanceLabel = useMemo(() => {
    return `${fmt(points)} điểm`;
  }, [points]);

  return (
    <Layout>
      <div className="min-h-screen bg-zinc-950 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Star className="text-rose-500" size={16} />
              Lịch sử điểm
            </p>
            <h1 className="text-4xl font-bold text-white">
              LỊCH SỬ <span className="text-rose-500">ĐIỂM</span>
            </h1>
          </div>

          {/* Current Balance Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-rose-500 rounded-2xl flex items-center justify-center text-white">
                  <Star size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-amber-400">{fmt(points)}</h2>
                  <p className="text-zinc-400 text-sm uppercase tracking-wider">Điểm hiện có</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-zinc-500 mb-1">Cập nhật mới nhất</div>
                <div className="text-white font-medium">
                  {POINT_EVENTS.length > 0 ? POINT_EVENTS[0].date : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-zinc-400 text-sm">Đang tải lịch sử điểm…</p>
            </div>
          )}

          {/* Auth Error */}
          {!loading && !getAccessToken() && (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-6 text-center">
              <AlertCircle className="text-amber-400 mx-auto mb-2" size={24} />
              <p className="text-amber-400 font-medium">Đăng nhập để xem lịch sử điểm.</p>
            </div>
          )}

          {/* Points History List */}
          {!loading && getAccessToken() && (
            <>
              {POINT_EVENTS.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800/50 rounded-xl flex items-center justify-center text-zinc-600">
                    <Star size={32} />
                  </div>
                  <p className="text-zinc-500 font-medium mb-2">Chưa có lịch sử điểm</p>
                  <p className="text-zinc-600 text-sm">Bạn chưa có giao dịch điểm nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {POINT_EVENTS.map((event) => (
                    <div
                      key={event.id}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 backdrop-blur-sm hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            event.delta > 0 
                              ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" 
                              : "bg-red-500/20 border border-red-500/30 text-red-400"
                          }`}>
                            {event.delta > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                          </div>
                          <div>
                            <div className="text-white font-medium mb-1">{event.label}</div>
                            <div className="text-zinc-500 text-sm flex items-center gap-1">
                              <Calendar size={12} />
                              {event.date}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            event.delta > 0 ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {event.delta > 0 ? "+" : ""}{fmt(event.delta)}
                          </div>
                          <div className="text-xs text-zinc-500">điểm</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </Layout>
  );
}

