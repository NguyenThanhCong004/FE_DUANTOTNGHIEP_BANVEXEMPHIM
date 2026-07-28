import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import CustomerPageShell from "../../components/common/CustomerPageShell";
import { apiJson } from "../../utils/apiClient";
import { AUTH } from "../../constants/apiEndpoints";
import { STRONG_PASSWORD_REGEX, PASSWORD_RULE_MESSAGE } from "../../utils/passwordValidation";

/* ── helpers ── */
const maskEmail = (email) => {
  const [user, domain] = email.split("@");
  return user.slice(0, 2) + "****" + user.slice(-1) + "@" + domain;
};

/** Hiển thị bước 2: email đã che từ BE hoặc che số điện thoại cục bộ. */
const maskIdentifier = (raw) => {
  if (!raw || !raw.trim()) return "—";
  const s = raw.trim();
  if (s.includes("@")) return maskEmail(s);
  if (s.length <= 2) return "**";
  return s.slice(0, 2) + "****" + s.slice(-1);
};

const firstApiErrorMessage = (apiRes) => {
  if (apiRes?.message) return apiRes.message;
  const d = apiRes?.data;
  if (d && typeof d === "object" && !Array.isArray(d)) {
    const first = Object.values(d)[0];
    if (typeof first === "string") return first;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
};

/* ══════════════════════════════════════════
   STEP INDICATOR
══════════════════════════════════════════ */
function StepIndicator({ current }) {
  const steps = [
    { num: 1, label: "Nhập tài khoản" },
    { num: 2, label: "Xác Minh Bảo Mật" },
    { num: 3, label: "Thiết lập mật khẩu" },
  ];
  return (
    <div className="fp-steps">
      {steps.map((s, i) => {
        const done = s.num < current;
        const active = s.num === current;
        return (
          <div key={s.num} className="fp-step-item">
            <div className={`fp-step-circle ${done ? "done" : active ? "active" : ""}`}>
              {done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : s.num}
            </div>
            <span className={`fp-step-label ${active ? "active-lbl" : done ? "done-lbl" : ""}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`fp-step-line ${done || (active && s.num === 1) ? "filled" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EyeIcon({ show }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {show
        ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
        : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
      }
    </svg>
  );
}

function RuleRow({ pass, text }) {
  return (
    <div className={`fp-rule ${pass ? "pass" : ""}`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {pass
          ? <polyline points="20 6 9 17 4 12"/>
          : <circle cx="12" cy="12" r="10" strokeOpacity="0.4"/>
        }
      </svg>
      {text}
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 1 – Nhập tài khoản
══════════════════════════════════════════ */
function Step1({ mode, onContinue }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isStaff = mode === "staff";
  const helperText = isStaff
    ? "Vui lòng nhập email hoặc số điện thoại nhân viên"
    : "Vui lòng nhập email hoặc số điện thoại đã đăng ký";
  const placeholder = "Email / Số điện thoại";

  const handleSubmit = async () => {
    if (!value.trim()) { setError("Tài khoản không được để trống"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await apiJson(AUTH.FORGOT_PASSWORD, {
        method: "POST",
        body: JSON.stringify({ account: value.trim() }),
      });
      if (!res.ok) {
        setError(firstApiErrorMessage(res));
        return;
      }
      const d = res.data || {};
      onContinue({
        identifier: value.trim(),
        resetSessionToken: d.resetSessionToken,
        maskedEmail: d.maskedEmail || null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-body">
      <p className="fp-desc">{helperText}</p>
      <div className={`fp-input-wrap ${error ? "has-error" : ""}`}>
        <input
          className="fp-input"
          placeholder={placeholder}
          value={value}
          disabled={loading}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
        />
      </div>
      {error && <p className="fp-error">{error}</p>}
      <button
        className={`fp-btn${!value.trim() || loading ? " disabled" : ""}`}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Đang gửi…" : "Tiếp Tục"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 2 – Xác minh OTP
══════════════════════════════════════════ */
function Step2({ displayTarget, resetSessionToken, onVerified, busy, onBusy }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  const startCountdown = useCallback(() => {
    setCountdown(60);
    setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => startCountdown(), 0);
    return () => { clearTimeout(t); clearInterval(timerRef.current); };
  }, [startCountdown]);

  const handleResend = async () => {
    if (!canResend || busy || !resetSessionToken) return;
    setError("");
    onBusy(true);
    const res = await apiJson(AUTH.FORGOT_PASSWORD_RESEND_OTP, {
      method: "POST",
      body: JSON.stringify({ resetSessionToken }),
    });
    onBusy(false);
    if (!res.ok) {
      setError(firstApiErrorMessage(res));
      return;
    }
    startCountdown();
  };

  const handleSubmit = async () => {
    if (!otp.trim()) { setError("Vui lòng nhập mã xác nhận"); return; }
    if (otp.length !== 6) { setError("Mã gồm 6 chữ số"); return; }
    setError("");
    onBusy(true);
    const res = await apiJson(AUTH.FORGOT_PASSWORD_VERIFY_OTP, {
      method: "POST",
      body: JSON.stringify({ resetSessionToken, otp: otp.trim() }),
    });
    onBusy(false);
    if (!res.ok) {
      setError(firstApiErrorMessage(res));
      return;
    }
    onVerified();
  };

  return (
    <div className="fp-body">
      <div className="fp-icon-wrap">
        <div className="fp-icon-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="3" fill="#8b00ff" opacity="0.25"/>
            <path d="M2 7l10 7 10-7" stroke="#d4ff00" strokeWidth="2" strokeLinecap="round"/>
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="#ff2d78" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
      </div>
      <p className="fp-desc" style={{ textAlign: "center" }}>
        Vui lòng nhập mã xác nhận email để xác minh danh tính
      </p>
      <p className="fp-masked-email">
        {displayTarget || "—"}
      </p>
      <div className={`fp-input-wrap otp-wrap ${error ? "has-error" : ""}`}>
        <input
          className="fp-input"
          placeholder="Mã Xác Nhận"
          value={otp}
          maxLength={6}
          disabled={busy}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && !busy && handleSubmit()}
        />
        <button
          type="button"
          className={`fp-resend-btn${canResend && !busy ? " active" : ""}`}
          onClick={handleResend}
          disabled={!canResend || busy}
        >
          {canResend ? "Gửi Lại" : `Gửi Lại (${countdown}s)`}
        </button>
      </div>
      {error && <p className="fp-error">{error}</p>}
      <button
        className={`fp-btn${!otp.trim() || otp.length !== 6 || busy ? " disabled" : ""}`}
        onClick={handleSubmit}
        disabled={busy}
      >
        {busy ? "Đang xác minh…" : "Tiếp Tục"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 3 – Thiết lập mật khẩu
══════════════════════════════════════════ */
function Step3({ resetSessionToken, onDone, busy, onBusy }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const rule1 = pw.length >= 8;
  const rule2 = /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  const rule3 = pw && pw === pw2;

  const validate = () => {
    const e = {};
    if (!rule1 || !rule2) e.pw = PASSWORD_RULE_MESSAGE;
    if (!rule3) e.pw2 = "Hai lần nhập mật khẩu không giống nhau";
    return e;
  };

  const handleSubmit = async () => {
    setApiError("");
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (!resetSessionToken) {
      setApiError("Phiên đặt lại mật khẩu không hợp lệ. Vui lòng thử lại từ đầu.");
      return;
    }
    onBusy(true);
    const res = await apiJson(AUTH.RESET_PASSWORD, {
      method: "POST",
      body: JSON.stringify({ token: resetSessionToken, newPassword: pw }),
    });
    onBusy(false);
    if (!res.ok) {
      setApiError(firstApiErrorMessage(res));
      return;
    }
    onDone();
  };

  const canSubmit = rule1 && rule2 && rule3;

  return (
    <div className="fp-body">
      <div className="fp-icon-wrap">
        <div className="fp-icon-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" fill="#8b00ff" opacity="0.25" stroke="#ff2d78" strokeWidth="1.5"/>
            <path d="M8 11V7a4 4 0 118 0v4" stroke="#d4ff00" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1.5" fill="#d4ff00"/>
          </svg>
        </div>
      </div>
      <p className="fp-desc" style={{ textAlign: "center" }}>Vui lòng thiết lập mật khẩu tương đối mạnh</p>

      <div className={`fp-input-wrap pw-wrap ${errors.pw ? "has-error" : ""}`}>
        <input
          className="fp-input"
          type={showPw ? "text" : "password"}
          placeholder="Vui lòng nhập mật khẩu"
          value={pw}
          disabled={busy}
          onChange={(e) => { setPw(e.target.value); setErrors({}); setApiError(""); }}
        />
        <button type="button" className="fp-eye-btn" onClick={() => setShowPw(!showPw)}>
          <EyeIcon show={showPw} />
        </button>
      </div>

      <div className={`fp-input-wrap pw-wrap ${errors.pw2 ? "has-error" : ""}`} style={{ marginTop: 12 }}>
        <input
          className="fp-input"
          type={showPw2 ? "text" : "password"}
          placeholder="Vui lòng nhập lại mật khẩu"
          value={pw2}
          disabled={busy}
          onChange={(e) => { setPw2(e.target.value); setErrors({}); setApiError(""); }}
          onKeyDown={(e) => e.key === "Enter" && !busy && handleSubmit()}
        />
        <button type="button" className="fp-eye-btn" onClick={() => setShowPw2(!showPw2)}>
          <EyeIcon show={showPw2} />
        </button>
      </div>
      {errors.pw2 && <p className="fp-error">{errors.pw2}</p>}
      {apiError && <p className="fp-error">{apiError}</p>}

      <div className="fp-rules">
        <RuleRow pass={rule1} text="Ít nhất 8 ký tự" />
        <RuleRow pass={rule2} text="Có chữ thường, chữ hoa và ký tự đặc biệt" />
        <RuleRow pass={rule3} text="Hai lần nhập mật khẩu giống nhau" />
      </div>

      <button
        className={`fp-btn${!canSubmit || busy ? " disabled" : ""}`}
        onClick={handleSubmit}
        disabled={busy}
      >
        {busy ? "Đang cập nhật…" : "Hoàn Thành"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   SUCCESS
══════════════════════════════════════════ */
function SuccessView({ loginPath }) {
  const navigate = useNavigate();
  return (
    <div className="fp-body" style={{ textAlign: "center", paddingTop: 20 }}>
      <div className="fp-icon-wrap">
        <div className="fp-icon-circle" style={{
          background: "rgba(212,255,0,0.08)",
          border: "1px solid rgba(212,255,0,0.35)",
          boxShadow: "0 0 28px rgba(212,255,0,0.12)"
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d4ff00" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>
      <h3 className="fp-success-title">ĐỔI MẬT KHẨU THÀNH CÔNG!</h3>
      <p className="fp-success-desc">Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.</p>
      <button className="fp-btn" onClick={() => navigate(loginPath)}>
        Đăng Nhập Ngay
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function ForgotPassword({ mode = "customer" }) {
  const loginPath = mode === "staff" ? "/staff/login" : "/login";
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fp, setFp] = useState({
    identifier: "",
    resetSessionToken: "",
    maskedEmail: null,
  });

  const displayTarget = fp.maskedEmail || maskIdentifier(fp.identifier);

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

        /* ── DESIGN TOKENS (đồng bộ navbar) ── */
        .fp-page {
          --navy:      #0d0d2b;
          --purple:    #8b00ff;
          --pink:      #ff2d78;
          --yellow:    #d4ff00;
          --off-white: #f0f0ff;
          --glass:     rgba(13,13,43,0.92);
        }

        .fp-page {
          min-height: 100vh;
          background: var(--navy);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 16px;
        }

        /* ── CARD ── */
        .fp-card {
          width: 100%;
          max-width: 480px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(212,255,0,0.15);
          border-radius: 20px;
          padding: 36px 40px 40px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 0 60px rgba(139,0,255,0.15), 0 0 0 1px rgba(255,45,120,0.06);
          animation: fpFadeIn 0.35s ease;
        }
        @keyframes fpFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── ACCENT STRIP ── */
        .fp-strip {
          height: 3px;
          width: 60px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow));
          border-radius: 2px;
          margin: 0 auto 24px;
        }

        /* ── TITLE ── */
        .fp-card-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 34px;
          letter-spacing: 4px;
          color: var(--off-white);
          text-align: center;
          margin: 0 0 28px;
          line-height: 1;
        }
        .fp-card-title span { color: var(--yellow); }

        /* ── STEPS ── */
        .fp-steps {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 0;
          margin-bottom: 32px;
        }
        .fp-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
        }
        .fp-step-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2px solid rgba(212,255,0,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px;
          color: rgba(240,240,255,0.2);
          background: transparent;
          z-index: 1;
          transition: all 0.3s ease;
        }
        .fp-step-circle.active {
          border-color: var(--pink);
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          box-shadow: 0 0 20px rgba(255,45,120,0.45);
        }
        .fp-step-circle.done {
          border-color: rgba(212,255,0,0.4);
          background: rgba(212,255,0,0.07);
          color: var(--yellow);
        }
        .fp-step-label {
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: rgba(240,240,255,0.2);
          margin-top: 6px;
          text-align: center;
          white-space: nowrap;
          text-transform: uppercase;
        }
        .fp-step-label.active-lbl { color: var(--pink); }
        .fp-step-label.done-lbl   { color: var(--yellow); }

        .fp-step-line {
          position: absolute;
          top: 17px;
          left: calc(50% + 17px);
          right: calc(-50% + 17px);
          height: 2px;
          background: rgba(212,255,0,0.08);
          transition: background 0.3s ease;
        }
        .fp-step-line.filled {
          background: linear-gradient(90deg, var(--purple), var(--pink));
        }

        /* ── BODY ── */
        .fp-body { display: flex; flex-direction: column; }

        .fp-desc {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(240,240,255,0.45);
          margin-bottom: 18px;
          line-height: 1.6;
        }

        .fp-masked-email {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 2px;
          color: var(--yellow);
          text-align: center;
          margin-bottom: 20px;
        }

        /* ── INPUT ── */
        .fp-input-wrap {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          transition: border-color 0.3s, box-shadow 0.3s;
          margin-bottom: 6px;
        }
        .fp-input-wrap:focus-within {
          border-color: var(--yellow);
          box-shadow: 0 0 18px rgba(212,255,0,0.12);
          background: rgba(212,255,0,0.03);
        }
        .fp-input-wrap.has-error { border-color: rgba(255,45,120,0.55); }

        .fp-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--off-white);
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          padding: 13px 0;
        }
        .fp-input::placeholder {
          color: rgba(240,240,255,0.25);
          font-weight: 600;
        }

        .fp-error {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: var(--pink);
          margin: 4px 0 10px;
          letter-spacing: 0.3px;
        }

        /* OTP resend */
        .otp-wrap { padding-right: 0; }
        .fp-resend-btn {
          background: none;
          border: none;
          border-left: 1px solid rgba(255,255,255,0.08);
          color: rgba(240,240,255,0.2);
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 12px;
          padding: 0 16px;
          cursor: default;
          white-space: nowrap;
          height: 100%;
          transition: color 0.2s;
        }
        .fp-resend-btn.active { color: var(--yellow); cursor: pointer; }
        .fp-resend-btn.active:hover { color: var(--off-white); }

        /* eye toggle */
        .pw-wrap { padding-right: 0; }
        .fp-eye-btn {
          background: none;
          border: none;
          color: rgba(240,240,255,0.25);
          padding: 0 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          height: 100%;
          transition: color 0.2s;
        }
        .fp-eye-btn:hover { color: var(--yellow); }

        /* ── RULES ── */
        .fp-rules { margin: 12px 0 24px; display: flex; flex-direction: column; gap: 7px; }
        .fp-rule {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: rgba(240,240,255,0.25);
          transition: color 0.2s;
        }
        .fp-rule.pass { color: var(--yellow); }
        .fp-rule svg { flex-shrink: 0; }

        /* ── ICON ── */
        .fp-icon-wrap { display: flex; justify-content: center; margin-bottom: 16px; }
        .fp-icon-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(139,0,255,0.1);
          border: 1px solid rgba(255,45,120,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 28px rgba(139,0,255,0.15);
        }

        /* ── MAIN BUTTON ── */
        .fp-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 2px;
          cursor: pointer;
          box-shadow: 0 0 24px rgba(255,45,120,0.3);
          transition: box-shadow 0.25s, transform 0.2s;
          margin-top: 8px;
        }
        .fp-btn:hover {
          box-shadow: 0 0 40px rgba(255,45,120,0.55);
          transform: translateY(-1px);
        }
        .fp-btn.disabled {
          background: rgba(255,255,255,0.07) !important;
          box-shadow: none !important;
          color: rgba(240,240,255,0.2) !important;
          cursor: not-allowed !important;
          transform: none !important;
        }

        /* ── SUCCESS ── */
        .fp-success-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 3px;
          color: var(--yellow);
          margin-bottom: 8px;
        }
        .fp-success-desc {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(240,240,255,0.4);
          margin-bottom: 28px;
        }

        /* ── BACK LINK ── */
        .fp-back {
          font-family: 'Syne', sans-serif;
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(240,240,255,0.35);
        }
        .fp-back a {
          color: var(--yellow);
          font-weight: 800;
          text-decoration: none;
          transition: color 0.2s;
        }
        .fp-back a:hover { color: var(--pink); }

        @media (max-width: 540px) {
          .fp-card { padding: 28px 20px 32px; }
          .fp-step-label { font-size: 9px; }
        }
      `}</style>

      <CustomerPageShell variant="full" className="fp-page auth-public-page">
        <div className="fp-card">
          <div className="fp-strip" />
          <h2 className="fp-card-title">
            QUÊN <span>MẬT KHẨU</span>
          </h2>
          {mode === "staff" && (
            <p className="fp-desc" style={{ textAlign: "center", marginTop: -16 }}>Dành cho tài khoản nhân viên</p>
          )}

          {!done && <StepIndicator current={step} />}

          {done ? (
            <SuccessView loginPath={loginPath} />
          ) : step === 1 ? (
            <Step1
              mode={mode}
              onContinue={(payload) => {
                setFp((s) => ({ ...s, ...payload }));
                setStep(2);
              }}
            />
          ) : step === 2 ? (
            <Step2
              displayTarget={displayTarget}
              resetSessionToken={fp.resetSessionToken}
              busy={busy}
              onBusy={setBusy}
              onVerified={() => setStep(3)}
            />
          ) : (
            <Step3
              resetSessionToken={fp.resetSessionToken}
              busy={busy}
              onBusy={setBusy}
              onDone={() => setDone(true)}
            />
          )}

          {!done && (
            <p className="fp-back">
              Nhớ mật khẩu rồi? <Link to={loginPath}>Đăng nhập</Link>
            </p>
          )}
        </div>
      </CustomerPageShell>
    </Layout>
  );
}
