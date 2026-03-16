import { useState, useRef } from "react";
import Layout from "../../components/layout/Layout";
import { Container, Row, Col } from "react-bootstrap";

/* ── Mock user data (based on Users ERD) ── */
const MOCK_USER = {
  user_id: 101,
  username: "nguyenvana",
  fullname: "Nguyễn Văn An",
  email: "nguyenvana@gmail.com",
  phone: "0912 345 678",
  birthday: "1998-07-15",
  avatar: null,
  status: "active",
  points: 760,
  total_spending: 1850000,
  rank: { rank_id: 2, rank_name: "Thành Viên Vàng", discount_percent: 5, min_spending: 1000000, Bonus_point: 1.5 },
};

const RANKS = [
  { rank_id: 1, rank_name: "Thành Viên",       min_spending: 0,       color: "#9e9e9e", icon: "🥈", discount_percent: 0,  Bonus_point: 1   },
  { rank_id: 2, rank_name: "Thành Viên Vàng",  min_spending: 1000000, color: "#d4e219", icon: "🥇", discount_percent: 5,  Bonus_point: 1.5 },
  { rank_id: 3, rank_name: "Thành Viên Bạch Kim", min_spending: 5000000, color: "#e91e8c", icon: "💎", discount_percent: 10, Bonus_point: 2   },
  { rank_id: 4, rank_name: "VIP",               min_spending: 10000000, color: "#7b1fa2", icon: "👑", discount_percent: 15, Bonus_point: 3   },
];

const RECENT_ACTIVITY = [
  { icon: "🎫", label: "Mua vé DUNE 2",       date: "10/03/2025", pts: "+270", pts_color: "#81c784" },
  { icon: "🍿", label: "Combo Đôi Bạn",        date: "18/03/2025", pts: "+125", pts_color: "#81c784" },
  { icon: "⭐", label: "Đổi voucher SAVE20PCT", date: "08/03/2025", pts: "-500", pts_color: "#e57373" },
  { icon: "🎫", label: "Mua vé AVENGERS",       date: "15/01/2025", pts: "+150", pts_color: "#81c784" },
];

const fmt = (n) => n.toLocaleString("vi-VN") + "đ";
const fmtBirthday = (d) => {
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}/${dt.getFullYear()}`;
};

/* ── Avatar initials ── */
function Avatar({ name, size = 96 }) {
  const initials = name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #7b1fa2, #e91e8c)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.35,
      color: "#fff", letterSpacing: 2, flexShrink: 0,
      boxShadow: "0 0 28px rgba(233,30,140,0.35)",
    }}>
      {initials}
    </div>
  );
}

/* ── Input field ── */
function Field({ label, value, name, type = "text", onChange, disabled, error }) {
  return (
    <div className="pf-field">
      <label className="pf-label">{label}</label>
      <input
        className={`pf-input${error ? " err" : ""}${disabled ? " disabled" : ""}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {error && <p className="pf-field-err">{error}</p>}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN
══════════════════════════════════════ */
export default function UserProfile() {
  const [user, setUser]         = useState(MOCK_USER);
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState({});
  const [errors, setErrors]     = useState({});
  const [toast, setToast]       = useState(null);
  const [pwModal, setPwModal]   = useState(false);
  const [pwData, setPwData]     = useState({ current: "", newPw: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [showPw, setShowPw]     = useState({ current: false, newPw: false, confirm: false });
  const [activeTab, setActiveTab] = useState("info");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  /* next rank progress */
  const currentRankIdx = RANKS.findIndex(r => r.rank_id === user.rank.rank_id);
  const nextRank = RANKS[currentRankIdx + 1];
  const progressPct = nextRank
    ? Math.min(100, ((user.total_spending - user.rank.min_spending) / (nextRank.min_spending - user.rank.min_spending)) * 100)
    : 100;

  /* edit handlers */
  const startEdit = () => { setDraft({ ...user }); setEditing(true); setErrors({}); };
  const cancelEdit = () => { setEditing(false); setErrors({}); };
  const handleChange = (e) => {
    setDraft(d => ({ ...d, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: "" }));
  };
  const validateEdit = () => {
    const e = {};
    if (!draft.fullname?.trim()) e.fullname = "Họ tên không được để trống";
    if (!draft.phone?.trim())    e.phone    = "Số điện thoại không được để trống";
    else if (!/^[0-9\s]{9,12}$/.test(draft.phone.replace(/\s/g, ""))) e.phone = "Số điện thoại không hợp lệ";
    return e;
  };
  const saveEdit = () => {
    const e = validateEdit();
    if (Object.keys(e).length) { setErrors(e); return; }
    setUser(u => ({ ...u, ...draft }));
    setEditing(false);
    showToast("Cập nhật thông tin thành công!");
  };

  /* password */
  const handlePwChange = (e) => { setPwData(d => ({ ...d, [e.target.name]: e.target.value })); setPwErrors({}); };
  const validatePw = () => {
    const e = {};
    if (!pwData.current) e.current = "Nhập mật khẩu hiện tại";
    if (!pwData.newPw || pwData.newPw.length < 8) e.newPw = "Mật khẩu mới tối thiểu 8 ký tự";
    if (pwData.newPw !== pwData.confirm) e.confirm = "Mật khẩu xác nhận không khớp";
    return e;
  };
  const savePw = () => {
    const e = validatePw();
    if (Object.keys(e).length) { setPwErrors(e); return; }
    setPwModal(false);
    setPwData({ current: "", newPw: "", confirm: "" });
    showToast("Đổi mật khẩu thành công!");
  };

  const EyeBtn = ({ field }) => (
    <button className="pf-eye" type="button" onClick={() => setShowPw(s => ({ ...s, [field]: !s[field] }))}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {showPw[field]
          ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
          : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        }
      </svg>
    </button>
  );

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');
        :root {
          --navy:   #2d3151;
          --purple: #7b1fa2;
          --pink:   #e91e8c;
          --yellow: #d4e219;
          --dark:   #0f102a;
          --card:   rgba(20,22,50,0.92);
        }

        .pf-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 65% 50% at 15% 20%, rgba(123,31,162,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 80%, rgba(233,30,140,0.13) 0%, transparent 60%),
            #0f102a;
          font-family: 'Syne', sans-serif;
          padding: 32px 0 80px;
        }

        /* ── HERO CARD ── */
        .pf-hero {
          background: var(--card);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 28px 32px;
          display: flex;
          align-items: center;
          gap: 24px;
          position: relative;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .pf-hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow));
          background-size: 300%;
          animation: gradMove 5s linear infinite;
        }
        @keyframes gradMove { 0%{background-position:0%} 100%{background-position:300%} }
        .pf-hero-right { flex: 1; min-width: 0; }
        .pf-username {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .pf-fullname {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(26px, 4vw, 40px);
          letter-spacing: 3px;
          color: #fff;
          line-height: 1;
          margin-bottom: 10px;
        }
        .pf-rank-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 100px;
          padding: 5px 14px;
          border: 1px solid;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }

        /* rank progress */
        .pf-progress-wrap { max-width: 380px; }
        .pf-progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          margin-bottom: 6px;
        }
        .pf-progress-bar {
          height: 6px;
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
          overflow: hidden;
        }
        .pf-progress-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, var(--purple), var(--pink));
          transition: width 0.6s ease;
        }

        /* hero stats */
        .pf-hero-stats {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: center;
          flex-shrink: 0;
        }
        .pf-hs {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 12px 20px;
          min-width: 110px;
        }
        .pf-hs-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 24px;
          letter-spacing: 1px;
          color: var(--yellow);
          line-height: 1;
        }
        .pf-hs-lbl {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 3px;
        }

        /* ── TABS ── */
        .pf-tabs {
          display: flex;
          gap: 4px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 20px;
          width: fit-content;
        }
        .pf-tab {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 9px 20px;
          border-radius: 9px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.2s;
        }
        .pf-tab.active {
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          box-shadow: 0 0 14px rgba(233,30,140,0.3);
        }
        .pf-tab:hover:not(.active) { color: rgba(255,255,255,0.7); }

        /* ── CARD ── */
        .pf-card {
          background: var(--card);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 24px;
          height: 100%;
        }
        .pf-card-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 3px;
          color: #fff;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pf-card-title span { color: var(--yellow); }

        /* ── FORM FIELDS ── */
        .pf-field { margin-bottom: 16px; }
        .pf-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 7px;
        }
        .pf-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 11px 16px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .pf-input:focus { border-color: var(--yellow); background: rgba(212,226,25,0.03); }
        .pf-input.disabled {
          color: rgba(255,255,255,0.35);
          cursor: default;
          background: rgba(255,255,255,0.02);
        }
        .pf-input.err { border-color: var(--pink); }
        .pf-field-err { font-size: 11.5px; font-weight: 700; color: var(--pink); margin-top: 4px; }

        /* ── BUTTONS ── */
        .pf-btn-primary {
          background: linear-gradient(135deg, var(--purple), var(--pink));
          border: none; color: #fff;
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 13px; letter-spacing: 0.5px;
          border-radius: 10px; padding: 11px 24px;
          cursor: pointer; transition: box-shadow 0.2s, transform 0.2s;
          box-shadow: 0 0 16px rgba(233,30,140,0.25);
        }
        .pf-btn-primary:hover { box-shadow: 0 0 28px rgba(233,30,140,0.5); transform: translateY(-1px); }

        .pf-btn-ghost {
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.5);
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 13px; letter-spacing: 0.3px;
          border-radius: 10px; padding: 11px 20px;
          cursor: pointer; transition: all 0.2s;
        }
        .pf-btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: #fff; }

        .pf-btn-yellow {
          background: var(--yellow); border: none;
          color: #0f102a;
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 13px; letter-spacing: 0.5px;
          border-radius: 10px; padding: 11px 24px;
          cursor: pointer; transition: box-shadow 0.2s, transform 0.2s;
          box-shadow: 0 0 16px rgba(212,226,25,0.2);
        }
        .pf-btn-yellow:hover { box-shadow: 0 0 28px rgba(212,226,25,0.45); transform: translateY(-1px); }

        /* ── RANK CARDS ── */
        .pf-rank-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: border-color 0.2s;
          margin-bottom: 10px;
        }
        .pf-rank-card.current {
          border-color: rgba(212,226,25,0.35);
          background: rgba(212,226,25,0.04);
        }
        .pf-rank-icon { font-size: 28px; flex-shrink: 0; }
        .pf-rank-info { flex: 1; }
        .pf-rank-name { font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 2px; }
        .pf-rank-req  { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.3); margin-top: 2px; }
        .pf-rank-perks {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: right;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }
        .pf-current-tag {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          background: var(--yellow);
          color: #0f102a;
          padding: 2px 8px;
          border-radius: 4px;
        }

        /* ── ACTIVITY ── */
        .pf-activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .pf-activity-item:last-child { border-bottom: none; }
        .pf-act-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .pf-act-info { flex: 1; min-width: 0; }
        .pf-act-label { font-size: 13px; font-weight: 700; color: #fff; }
        .pf-act-date  { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.3); }
        .pf-act-pts   { font-family: 'Bebas Neue', sans-serif; font-size: 17px; letter-spacing: 1px; flex-shrink: 0; }

        /* ── PASSWORD MODAL ── */
        .pf-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(5px);
          z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .pf-modal {
          background: #0d0e28;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 100%; max-width: 420px;
          padding: 28px;
          position: relative;
          animation: pfPop 0.3s ease;
        }
        @keyframes pfPop {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        .pf-modal-close {
          position: absolute; top: 14px; right: 16px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px; color: rgba(255,255,255,0.4);
          width: 30px; height: 30px; font-size: 17px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .pf-modal-close:hover { color: #fff; }
        .pf-modal-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px; letter-spacing: 3px; color: #fff; margin-bottom: 20px;
        }
        .pf-modal-title span { color: var(--yellow); }
        .pf-pw-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .pf-pw-wrap .pf-input { padding-right: 44px; }
        .pf-eye {
          position: absolute; right: 12px;
          background: none; border: none;
          color: rgba(255,255,255,0.25);
          cursor: pointer; padding: 0;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .pf-eye:hover { color: var(--yellow); }

        /* ── TOAST ── */
        .pf-toast {
          position: fixed; bottom: 32px; left: 50%;
          transform: translateX(-50%);
          border-radius: 12px;
          padding: 13px 24px;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 13px; letter-spacing: 0.4px;
          z-index: 9999; white-space: nowrap;
          animation: pfToast 0.3s ease;
          display: flex; align-items: center; gap: 8px;
        }
        .pf-toast.success { background: #0d0e28; border: 1.5px solid #81c784; color: #81c784; }
        .pf-toast.error   { background: #0d0e28; border: 1.5px solid var(--pink); color: var(--pink); }
        @keyframes pfToast {
          from { opacity: 0; transform: translateX(-50%) translateY(14px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* ── INFO ROW (read mode) ── */
        .pf-info-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 13px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .pf-info-row:last-child { border-bottom: none; }
        .pf-info-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .pf-info-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px; }
        .pf-info-value { font-size: 14px; font-weight: 700; color: #fff; }

        @media (max-width: 767px) {
          .pf-hero { flex-direction: column; align-items: flex-start; }
          .pf-hero-stats { flex-direction: row; }
        }
      `}</style>

      {/* PASSWORD MODAL */}
      {pwModal && (
        <div className="pf-modal-overlay" onClick={() => setPwModal(false)}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <button className="pf-modal-close" onClick={() => setPwModal(false)}>×</button>
            <div className="pf-modal-title">ĐỔI <span>MẬT KHẨU</span></div>

            {[
              { name: "current", label: "Mật khẩu hiện tại" },
              { name: "newPw",   label: "Mật khẩu mới" },
              { name: "confirm", label: "Xác nhận mật khẩu mới" },
            ].map(({ name, label }) => (
              <div key={name} className="pf-field">
                <label className="pf-label">{label}</label>
                <div className="pf-pw-wrap">
                  <input
                    className={`pf-input${pwErrors[name] ? " err" : ""}`}
                    type={showPw[name] ? "text" : "password"}
                    name={name}
                    value={pwData[name]}
                    onChange={handlePwChange}
                    style={{ width: "100%" }}
                  />
                  <EyeBtn field={name} />
                </div>
                {pwErrors[name] && <p className="pf-field-err">{pwErrors[name]}</p>}
              </div>
            ))}

            <div className="d-flex gap-2 mt-3">
              <button className="pf-btn-ghost" onClick={() => setPwModal(false)}>Hủy</button>
              <button className="pf-btn-primary" style={{ flex: 1 }} onClick={savePw}>Lưu mật khẩu</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`pf-toast ${toast.type}`}>
          {toast.type === "success" ? "✓" : "⚠"} {toast.msg}
        </div>
      )}

      <div className="pf-page mt-4">
        <Container fluid="xl">

          {/* ── HERO ── */}
          <div className="pf-hero">
            <Avatar name={user.fullname} size={90} />

            <div className="pf-hero-right">
              <div className="pf-username">@{user.username}</div>
              <div className="pf-fullname">{user.fullname}</div>

              <div
                className="pf-rank-badge"
                style={{ color: user.rank.rank_name.includes("Vàng") ? "#d4e219" : "#9e9e9e", borderColor: "currentColor", background: "rgba(255,255,255,0.04)" }}
              >
                {RANKS.find(r => r.rank_id === user.rank.rank_id)?.icon} {user.rank.rank_name}
                <span style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 7px", fontSize: 10 }}>
                  -{user.rank.discount_percent}% · ×{user.rank.Bonus_point} pts
                </span>
              </div>

              {nextRank && (
                <div className="pf-progress-wrap">
                  <div className="pf-progress-label">
                    <span>{fmt(user.total_spending)} đã chi</span>
                    <span>Còn {fmt(nextRank.min_spending - user.total_spending)} → {nextRank.rank_name}</span>
                  </div>
                  <div className="pf-progress-bar">
                    <div className="pf-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="pf-hero-stats">
              <div className="pf-hs">
                <div className="pf-hs-num">{user.points}</div>
                <div className="pf-hs-lbl">Điểm ⭐</div>
              </div>
              <div className="pf-hs">
                <div className="pf-hs-num" style={{ fontSize: 18 }}>{(user.total_spending / 1000).toFixed(0)}K</div>
                <div className="pf-hs-lbl">Tổng chi</div>
              </div>
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="pf-tabs">
            {[
              { key: "info",  label: "Thông tin" },
              { key: "rank",  label: "Hạng thành viên" },
              { key: "activity", label: "Hoạt động" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`pf-tab${activeTab === key ? " active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ══ TAB: INFO ══ */}
          {activeTab === "info" && (
            <Row className="g-3">
              {/* Left: info / edit form */}
              <Col xs={12} lg={7}>
                <div className="pf-card">
                  <div className="pf-card-title">
                    <span>👤</span> THÔNG TIN <span>CÁ NHÂN</span>
                    {!editing && (
                      <button className="pf-btn-yellow ms-auto" style={{ fontSize: 11, padding: "6px 16px" }} onClick={startEdit}>
                        ✏️ Chỉnh sửa
                      </button>
                    )}
                  </div>

                  {editing ? (
                    <>
                      <Field label="Họ và tên" name="fullname" value={draft.fullname} onChange={handleChange} error={errors.fullname} />
                      <Field label="Email"     name="email"    value={draft.email}    onChange={handleChange} disabled />
                      <Field label="Số điện thoại" name="phone" value={draft.phone} onChange={handleChange} error={errors.phone} />
                      <Field label="Ngày sinh" name="birthday" type="date" value={draft.birthday} onChange={handleChange} />
                      <div className="d-flex gap-2 mt-2">
                        <button className="pf-btn-ghost" onClick={cancelEdit}>Hủy</button>
                        <button className="pf-btn-primary" onClick={saveEdit}>Lưu thay đổi</button>
                      </div>
                    </>
                  ) : (
                    <>
                      {[
                        { icon: "👤", label: "Họ và tên",        value: user.fullname },
                        { icon: "✉️", label: "Email",             value: user.email },
                        { icon: "📱", label: "Số điện thoại",     value: user.phone },
                        { icon: "🎂", label: "Ngày sinh",          value: fmtBirthday(user.birthday) },
                        { icon: "🔑", label: "Tên đăng nhập",      value: "@" + user.username },
                      ].map(({ icon, label, value }) => (
                        <div key={label} className="pf-info-row">
                          <span className="pf-info-icon">{icon}</span>
                          <div>
                            <div className="pf-info-label">{label}</div>
                            <div className="pf-info-value">{value}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </Col>

              {/* Right: security */}
              <Col xs={12} lg={5}>
                <div className="pf-card">
                  <div className="pf-card-title"><span>🔐</span> BẢO <span>MẬT</span></div>

                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px", marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Mật khẩu</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginBottom: 12 }}>
                      Bảo vệ tài khoản bằng mật khẩu mạnh
                    </div>
                    <button className="pf-btn-primary" style={{ fontSize: 12, padding: "9px 18px" }} onClick={() => setPwModal(true)}>
                      🔑 Đổi mật khẩu
                    </button>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Trạng thái tài khoản</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#81c784", boxShadow: "0 0 8px #81c784", display: "inline-block" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#81c784" }}>Đang hoạt động</span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, marginTop: 6 }}>
                      Tài khoản đã được xác minh email
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          )}

          {/* ══ TAB: RANK ══ */}
          {activeTab === "rank" && (
            <Row className="g-3">
              <Col xs={12} lg={7}>
                <div className="pf-card">
                  <div className="pf-card-title"><span>🏆</span> CÁC HẠNG <span>THÀNH VIÊN</span></div>
                  {RANKS.map(rank => (
                    <div key={rank.rank_id} className={`pf-rank-card${rank.rank_id === user.rank.rank_id ? " current" : ""}`}>
                      <span className="pf-rank-icon">{rank.icon}</span>
                      <div className="pf-rank-info">
                        <div className="pf-rank-name" style={{ color: rank.color }}>{rank.rank_name}</div>
                        <div className="pf-rank-req">
                          {rank.min_spending === 0 ? "Mặc định" : `Chi từ ${fmt(rank.min_spending)}`}
                        </div>
                      </div>
                      <div className="pf-rank-perks">
                        {rank.discount_percent > 0 && (
                          <span style={{ color: rank.color }}>-{rank.discount_percent}% vé</span>
                        )}
                        <span>×{rank.Bonus_point} điểm</span>
                        {rank.rank_id === user.rank.rank_id && (
                          <span className="pf-current-tag">Của bạn</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Col>

              <Col xs={12} lg={5}>
                <div className="pf-card">
                  <div className="pf-card-title"><span>📈</span> TIẾN ĐỘ <span>HẠNG</span></div>

                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>
                      {RANKS.find(r => r.rank_id === user.rank.rank_id)?.icon}
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 3, color: "var(--yellow)" }}>
                      {user.rank.rank_name}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 600, marginTop: 4 }}>
                      Tổng chi tiêu: <span style={{ color: "#fff" }}>{fmt(user.total_spending)}</span>
                    </div>
                  </div>

                  {nextRank && (
                    <>
                      <div className="pf-progress-label" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
                        <span>{user.rank.rank_name}</span>
                        <span>{nextRank.rank_name}</span>
                      </div>
                      <div className="pf-progress-bar" style={{ marginBottom: 8 }}>
                        <div className="pf-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
                        Còn <span style={{ color: "var(--yellow)" }}>{fmt(nextRank.min_spending - user.total_spending)}</span> để lên hạng {nextRank.icon}
                      </div>
                    </>
                  )}

                  <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(212,226,25,0.06)", border: "1px solid rgba(212,226,25,0.15)", borderRadius: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,226,25,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                      Quyền lợi hiện tại
                    </div>
                    {[
                      user.rank.discount_percent > 0 && `Giảm ${user.rank.discount_percent}% giá vé`,
                      `Nhân ×${user.rank.Bonus_point} điểm tích lũy`,
                      "Ưu tiên đặt vé sự kiện đặc biệt",
                    ].filter(Boolean).map((perk, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
                        <span style={{ color: "var(--yellow)" }}>✓</span> {perk}
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            </Row>
          )}

          {/* ══ TAB: ACTIVITY ══ */}
          {activeTab === "activity" && (
            <Row className="g-3">
              <Col xs={12} lg={7}>
                <div className="pf-card">
                  <div className="pf-card-title"><span>⚡</span> HOẠT ĐỘNG <span>GẦN ĐÂY</span></div>
                  {RECENT_ACTIVITY.map((act, i) => (
                    <div key={i} className="pf-activity-item">
                      <div className="pf-act-icon">{act.icon}</div>
                      <div className="pf-act-info">
                        <div className="pf-act-label">{act.label}</div>
                        <div className="pf-act-date">{act.date}</div>
                      </div>
                      <div className="pf-act-pts" style={{ color: act.pts_color }}>
                        {act.pts} pts
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, textAlign: "center" }}>
                    <a href="/transactions" style={{ fontSize: 12, fontWeight: 700, color: "var(--yellow)", textDecoration: "none", letterSpacing: 0.5 }}>
                      Xem toàn bộ lịch sử giao dịch →
                    </a>
                  </div>
                </div>
              </Col>

              <Col xs={12} lg={5}>
                <div className="pf-card">
                  <div className="pf-card-title"><span>⭐</span> ĐIỂM <span>TÍCH LŨY</span></div>

                  <div style={{ textAlign: "center", padding: "20px 0 24px" }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 64, letterSpacing: 3, color: "var(--yellow)", lineHeight: 1 }}>
                      {user.points.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>
                      điểm hiện có
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                    {[
                      { label: "Đã nhận",  value: "+1,260", color: "#81c784" },
                      { label: "Đã dùng",  value: "-500",   color: "#e57373" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1, color }}>{value}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <a href="/voucher" style={{ display: "block", textAlign: "center", padding: "12px", background: "linear-gradient(135deg, var(--purple), var(--pink))", borderRadius: 12, color: "#fff", fontFamily: "'Syne'", fontWeight: 800, fontSize: 13, textDecoration: "none", letterSpacing: 0.5, boxShadow: "0 0 20px rgba(233,30,140,0.25)" }}>
                    🎟 Đổi điểm lấy voucher
                  </a>
                </div>
              </Col>
            </Row>
          )}

        </Container>
      </div>
    </Layout>
  );
}