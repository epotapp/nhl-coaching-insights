import { useState } from "react";
import "./auth-onboarding.css";
import { imageBase } from "./assets";

/* ── Proper 21×21 QR code (Version 1 structure) ── */
function QRCode() {
  const N = 21;
  const m: number[][] = Array.from({ length: N }, () => Array(N).fill(-1));
  function finder(r: number, c: number) {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const outer = i === 0 || i === 6 || j === 0 || j === 6;
      const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      m[r + i][c + j] = outer || inner ? 1 : 0;
    }
  }
  finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
  const sep = (r: number, c: number, dr: number, dc: number, len: number) => {
    for (let k = 0; k < len; k++) { const rr = r+dr*k, cc = c+dc*k; if (rr>=0&&rr<N&&cc>=0&&cc<N) m[rr][cc]=0; }
  };
  sep(7,0,0,1,8); sep(0,7,1,0,8); sep(7,N-8,0,1,8); sep(0,N-8,1,0,8); sep(N-8,0,0,1,8); sep(N-7,7,1,0,7);
  for (let k = 8; k <= 12; k++) { m[6][k] = k%2===0?1:0; m[k][6] = k%2===0?1:0; }
  m[8][13] = 1;
  let seed = 0x4e484c;
  const rand = () => { seed=(seed*1664525+1013904223)&0xffffffff; return (seed>>>0)%2; };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (m[r][c]===-1) m[r][c]=rand();
  const px = 156/N;
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
    if (m[r][c]===1) rects.push(<rect key={`${r}-${c}`} x={c*px} y={r*px} width={px} height={px} fill="#000"/>);
  return <svg width="156" height="156" viewBox="0 0 156 156">{rects}</svg>;
}


/* ── NHL logo image ── */
function NHLLogo() {
  return (
    <img
      src={`${imageBase}nhl-logo.png`}
      alt="NHL"
      className="hd-nhl-logo"
      style={{ width: 92, height: 92, objectFit: "contain", marginLeft: -10 }}
    />
  );
}

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [showPw, setShowPw]   = useState(false);
  const [remember, setRemember] = useState(true);
  const [pwValue, setPwValue]  = useState("secret1234");

  return (
    <div className="hd-login-root">
      {/* ── left column ── */}
      <div className="hd-login-left">
        <NHLLogo />

        <div className="hd-login-heading">Log In to Coaching Insights</div>
        <div className="hd-login-subheading">Sign in to access your team's data</div>

        <div className="hd-login-form">
          {/* email */}
          <div className="hd-field-group">
            <label className="hd-field-label">Email address</label>
            <input
              type="email"
              className="hd-field-input"
              defaultValue="brent.coach@nhl.com"
              autoComplete="email"
            />
          </div>

          {/* password */}
          <div className="hd-field-group">
            <label className="hd-field-label">Password</label>
            <div className="hd-pw-wrap">
              <input
                type="text"
                className="hd-field-input"
                value={showPw ? pwValue : '●'.repeat(pwValue.length)}
                onChange={e => { if (showPw) setPwValue(e.target.value); }}
                autoComplete="current-password"
                style={!showPw ? { letterSpacing: '0.18em' } : undefined}
              />
              <button
                type="button"
                className="hd-pw-eye"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* remember / forgot */}
          <div className="hd-remember-row">
            <label className="hd-remember-label">
              <input
                type="checkbox"
                className="hd-remember-cb"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <button type="button" className="hd-forgot-btn">Forgot password?</button>
          </div>

          {/* submit */}
          <button type="button" className="hd-login-btn" onClick={onLogin}>
            Log In
          </button>
        </div>
      </div>
      {/* ── right column ── */}
      <div className="hd-login-right">
        <div className="hd-qr-box">
          <QRCode />
        </div>
        <div className="hd-qr-heading">Scan to Login</div>
        <div className="hd-qr-sub">
          Scan this with the authenticator mobile app to log in instantly
        </div>
      </div>
    </div>
  );
}
