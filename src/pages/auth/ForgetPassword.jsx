import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";

/* ── helpers ── */
const maskEmail = (email) => {
  const [user, domain] = email.split("@");
  return user.slice(0, 2) + "****" + user.slice(-1) + "@" + domain;
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

/* ══════════════════════════════════════════
   STEP 1 – Nhập tài khoản
══════════════════════════════════════════ */
function Step1() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) { setError("Tài khoản không được để trống"); return; }
    setError("Quên mật khẩu cần API backend — chưa tích hợp.");
  };

  return (
    <div className="fp-body">
      <p className="fp-desc">Vui lòng nhập tài khoản cần tìm lại mật khẩu</p>
      <div className={`fp-input-wrap ${error ? "has-error" : ""}`}>
        <input
          className="fp-input"
          placeholder="Tên Người Dùng/Email"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>
      {error && <p className="fp-error">{error}</p>}
      <button
        className={`fp-btn${!value.trim() ? " disabled" : ""}`}
        onClick={handleSubmit}
      >
        Tiếp Tục
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 2 – Xác minh OTP
══════════════════════════════════════════ */
function Step2({ email }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    startCountdown();
    return () => clearInterval(timerRef.current);
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSubmit = () => {
    if (!otp.trim()) { setError("Vui lòng nhập mã xác nhận"); return; }
    setError("Xác minh OTP cần API backend — chưa tích hợp.");
  };

  return (
    <div className="fp-body">
      <div className="fp-icon-wrap">
        <div className="fp-icon-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="3" fill="var(--purple)" opacity="0.25"/>
            <path d="M2 7l10 7 10-7" stroke="var(--yellow)" strokeWidth="2" strokeLinecap="round"/>
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="var(--pink)" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
      </div>
      <p className="fp-desc" style={{ textAlign: "center" }}>
        Vui lòng nhập mã xác nhận email để xác minh danh tính
      </p>
      <p style={{ textAlign: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, color: "var(--yellow)", marginBottom: 20 }}>
        {email ? maskEmail(email) : "—"}
      </p>
      <div className={`fp-input-wrap otp-wrap ${error ? "has-error" : ""}`}>
        <input
          className="fp-input"
          placeholder="Mã Xác Nhận"
          value={otp}
          maxLength={6}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button
          className={`fp-resend-btn${canResend ? " active" : ""}`}
          onClick={() => { if (canResend) startCountdown(); }}
          disabled={!canResend}
        >
          {canResend ? "Gửi Lại" : `Gửi Lại (${countdown}s)`}
        </button>
      </div>
      {error && <p className="fp-error">{error}</p>}
      <button
        className={`fp-btn${!otp.trim() ? " disabled" : ""}`}
        onClick={handleSubmit}
      >
        Tiếp Tục
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 3 – Thiết lập mật khẩu
══════════════════════════════════════════ */
function Step3({ onDone }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [errors, setErrors] = useState({});

  const rule1 = pw.length >= 8 && pw.length <= 30;
  const rule2 = /[a-zA-Z]/.test(pw) && /[0-9\W]/.test(pw);
  const rule3 = pw && pw === pw2;

  const validate = () => {
    const e = {};
    if (!rule1 || !rule2) e.pw = "Mật khẩu chưa đáp ứng yêu cầu";
    if (!rule3) e.pw2 = "Hai lần nhập mật khẩu không giống nhau";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onDone();
  };

  const canSubmit = rule1 && rule2 && rule3;

  const EyeIcon = ({ show }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {show
        ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
        : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
      }
    </svg>
  );

  const RuleRow = ({ pass, text }) => (
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

  return (
    <div className="fp-body">
      <div className="fp-icon-wrap">
        <div className="fp-icon-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" fill="var(--purple)" opacity="0.25" stroke="var(--pink)" strokeWidth="1.5"/>
            <path d="M8 11V7a4 4 0 118 0v4" stroke="var(--yellow)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1.5" fill="var(--yellow)"/>
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
          onChange={(e) => { setPw(e.target.value); setErrors({}); }}
        />
        <button className="fp-eye-btn" onClick={() => setShowPw(!showPw)}>
          <EyeIcon show={showPw} />
        </button>
      </div>

      <div className={`fp-input-wrap pw-wrap ${errors.pw2 ? "has-error" : ""}`} style={{ marginTop: 12 }}>
        <input
          className="fp-input"
          type={showPw2 ? "text" : "password"}
          placeholder="Vui lòng nhập lại mật khẩu"
          value={pw2}
          onChange={(e) => { setPw2(e.target.value); setErrors({}); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button className="fp-eye-btn" onClick={() => setShowPw2(!showPw2)}>
          <EyeIcon show={showPw2} />
        </button>
      </div>
      {errors.pw2 && <p className="fp-error">{errors.pw2}</p>}

      <div className="fp-rules">
        <RuleRow pass={rule1} text="Mật khẩu bao gồm 8-30 số, chữ cái hoặc ký tự" />
        <RuleRow pass={rule2} text="Tối thiểu gồm 2 loại ký tự" />
        <RuleRow pass={rule3} text="Đảm bảo hai lần nhập mật khẩu giống nhau" />
      </div>

      <button
        className={`fp-btn${!canSubmit ? " disabled" : ""}`}
        onClick={handleSubmit}
      >
        Hoàn Thành
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   SUCCESS
══════════════════════════════════════════ */
function SuccessView() {
  const navigate = useNavigate();
  return (
    <div className="fp-body" style={{ textAlign: "center", paddingTop: 20 }}>
      <div className="fp-icon-wrap">
        <div className="fp-icon-circle" style={{ background: "rgba(76,175,80,0.15)", border: "1px solid rgba(76,175,80,0.4)" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#81c784" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>
      <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: "#fff", marginBottom: 8 }}>
        ĐỔI MẬT KHẨU THÀNH CÔNG!
      </h3>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600, marginBottom: 28 }}>
        Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.
      </p>
      <button className="fp-btn" onClick={() => navigate("/login")}>
        Đăng Nhập Ngay
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({});
  const [done, setDone] = useState(false);

  return (
    <Layout>
      <style>{`
        :root {
          --navy:   #2d3151;
          --purple: #7b1fa2;
          --pink:   #e91e8c;
          --yellow: #d4e219;
          --dark:   #0f102a;
        }

        .fp-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 70% 50% at 15% 20%, rgba(123,31,162,0.2) 0%, transparent 60%),
            radial-gradient(ellipse 55% 40% at 85% 80%, rgba(233,30,140,0.15) 0%, transparent 60%),
            #0f102a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 16px;
          font-family: var(--font-ui), system-ui, sans-serif;
        }

        /* ── CARD ── */
        .fp-card {
          background: rgba(18,19,58,0.95);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          width: 100%;
          max-width: 480px;
          padding: 36px 40px 40px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
          animation: fpFadeIn 0.35s ease;
        }
        @keyframes fpFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── TITLE ── */
        .fp-card-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          letter-spacing: 4px;
          color: #fff;
          text-align: center;
          margin-bottom: 28px;
        }
        .fp-card-title span { color: var(--yellow); }

        /* ── STEPS ── */
        .fp-steps {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 0;
          margin-bottom: 32px;
          position: relative;
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
          border: 2px solid rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px;
          color: rgba(255,255,255,0.3);
          background: transparent;
          z-index: 1;
          transition: all 0.3s ease;
          position: relative;
        }
        .fp-step-circle.active {
          border-color: var(--purple);
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          box-shadow: 0 0 18px rgba(233,30,140,0.4);
        }
        .fp-step-circle.done {
          border-color: var(--yellow);
          background: rgba(212,226,25,0.12);
          color: var(--yellow);
        }
        .fp-step-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: rgba(255,255,255,0.25);
          margin-top: 6px;
          text-align: center;
          white-space: nowrap;
        }
        .fp-step-label.active-lbl { color: var(--pink); }
        .fp-step-label.done-lbl   { color: var(--yellow); }

        /* connecting line */
        .fp-step-line {
          position: absolute;
          top: 17px;
          left: calc(50% + 17px);
          right: calc(-50% + 17px);
          height: 2px;
          background: rgba(255,255,255,0.1);
          transition: background 0.3s ease;
        }
        .fp-step-line.filled { background: linear-gradient(90deg, var(--purple), var(--pink)); }

        /* ── BODY ── */
        .fp-body { display: flex; flex-direction: column; }

        .fp-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          font-weight: 600;
          margin-bottom: 18px;
          line-height: 1.6;
        }

        /* ── INPUT ── */
        .fp-input-wrap {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          transition: border-color 0.2s;
          margin-bottom: 6px;
        }
        .fp-input-wrap:focus-within { border-color: var(--yellow); background: rgba(212,226,25,0.03); }
        .fp-input-wrap.has-error { border-color: var(--pink); }

        .fp-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-family: var(--font-ui), system-ui, sans-serif;
          font-size: 14px;
          font-weight: 600;
          padding: 14px 0;
        }
        .fp-input::placeholder { color: rgba(255,255,255,0.25); font-weight: 600; }

        .fp-error {
          font-size: 12px;
          color: var(--pink);
          font-weight: 700;
          margin: 2px 0 12px;
          letter-spacing: 0.3px;
        }

        /* OTP resend */
        .otp-wrap { padding-right: 0; }
        .fp-resend-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.2);
          font-family: var(--font-ui), system-ui, sans-serif;
          font-weight: 700;
          font-size: 12px;
          padding: 0 16px;
          cursor: default;
          white-space: nowrap;
          border-left: 1px solid rgba(255,255,255,0.08);
          height: 100%;
          transition: color 0.2s;
        }
        .fp-resend-btn.active { color: var(--yellow); cursor: pointer; }
        .fp-resend-btn.active:hover { color: #fff; }

        /* eye toggle */
        .pw-wrap { padding-right: 0; }
        .fp-eye-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.25);
          padding: 0 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          height: 100%;
        }
        .fp-eye-btn:hover { color: var(--yellow); }

        /* ── RULES ── */
        .fp-rules { margin: 12px 0 24px; display: flex; flex-direction: column; gap: 6px; }
        .fp-rule {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.25);
          transition: color 0.2s;
        }
        .fp-rule.pass { color: #81c784; }
        .fp-rule svg { flex-shrink: 0; }

        /* ── ICON ── */
        .fp-icon-wrap { display: flex; justify-content: center; margin-bottom: 16px; }
        .fp-icon-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(123,31,162,0.15);
          border: 1px solid rgba(233,30,140,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 28px rgba(233,30,140,0.15);
        }

        /* ── MAIN BUTTON ── */
        .fp-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--purple), var(--pink));
          color: #fff;
          font-family: var(--font-ui), system-ui, sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 1px;
          cursor: pointer;
          box-shadow: 0 0 24px rgba(233,30,140,0.3);
          transition: box-shadow 0.25s, transform 0.2s, opacity 0.2s;
          margin-top: 8px;
        }
        .fp-btn:hover { box-shadow: 0 0 36px rgba(233,30,140,0.55); transform: translateY(-1px); }
        .fp-btn.disabled {
          background: rgba(255,255,255,0.08) !important;
          box-shadow: none !important;
          color: rgba(255,255,255,0.2) !important;
          cursor: not-allowed !important;
          transform: none !important;
        }

        /* ── BACK LINK ── */
        .fp-back {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          font-weight: 600;
        }
        .fp-back a { color: var(--yellow); text-decoration: none; }
        .fp-back a:hover { text-decoration: underline; }

        @media (max-width: 540px) {
          .fp-card { padding: 28px 20px 32px; }
          .fp-step-label { font-size: 9px; }
        }
      `}</style>

      <div className="fp-page auth-public-page">
        <div className="fp-card">
          <h2 className="fp-card-title">
            QUÊN <span>MẬT KHẨU</span>
          </h2>

          {!done && <StepIndicator current={step} />}

          {done ? (
            <SuccessView />
          ) : step === 1 ? (
            <Step1 />
          ) : step === 2 ? (
            <Step2 email={data.email} />
          ) : (
            <Step3 onDone={() => setDone(true)} />
          )}

          {!done && (
            <p className="fp-back">
              Nhớ mật khẩu rồi? <Link to="/login">Đăng nhập</Link>
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}