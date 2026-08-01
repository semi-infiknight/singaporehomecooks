'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { validateShcPassword } from '@shc/utils';
import { useCookAuth } from '../../lib/useCookAuth';
import { hasSeenCookOnboarding, clearCookOnboardingSeen } from '../../lib/onboarding';
import {
  getCookRegisterWhatsappVerifyStatus,
  sendCookRegisterWhatsappOtp,
} from '../../lib/cook-api-client';
import { GourmeatCookHeader, GourmeatPrimaryButton, GourmeatCard } from './SHCWebComponents';
import { showDevTools } from '../../lib/dev';

type RegisterStep = 'details' | 'verify';

/**
 * Cook PWA auth + first-run kitchen onboarding.
 * After sign-in or sign-up, unseen cooks → `/cook-portal/onboarding` (not dashboard).
 */
export function CookLoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading, login, register } = useCookAuth();
  const pathname = usePathname() || '';
  const router = useRouter();
  const [email, setEmail] = useState(showDevTools ? 'rose@shc.local' : '');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState(showDevTools ? 'cooksecret' : '');
  const [whatsappOtp, setWhatsappOtp] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [otpReady, setOtpReady] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>('details');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const isOnboardingPath = pathname.startsWith('/cook-portal/onboarding');

  useEffect(() => {
    if (loading || !user) {
      setOnboardingReady(false);
      return;
    }
    const seen = hasSeenCookOnboarding();
    setNeedsOnboarding(!seen);
    setOnboardingReady(true);
    if (!seen && !isOnboardingPath) {
      router.replace('/cook-portal/onboarding');
    }
  }, [loading, user, isOnboardingPath, router]);

  const resetRegister = () => {
    setRegisterStep('details');
    setWhatsappOtp('');
    setWhatsappUrl('');
    setOtpHint('');
    setOtpReady(false);
    setError('');
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    resetRegister();
  };

  const prepareWhatsappVerify = async () => {
    const trimmedMobile = mobile.trim();
    const trimmedEmail = email.trim();
    if (!trimmedMobile || trimmedMobile.replace(/\D/g, '').length < 8) {
      setError('Enter your Singapore WhatsApp number (e.g. 9123 4567).');
      return;
    }
    if (!trimmedEmail) {
      setError('Enter your email address.');
      return;
    }
    const policy = validateShcPassword(password);
    if (!policy.ok) {
      setError(policy.message);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await sendCookRegisterWhatsappOtp(trimmedMobile);
      setWhatsappUrl(res.whatsapp_url || '');
      setOtpHint(res.hint || 'Message us on WhatsApp — we will reply with your code.');
      if (res.demo_code) {
        setWhatsappOtp(res.demo_code);
        setOtpReady(true);
      } else {
        setOtpReady(Boolean(res.otp_ready));
      }
      setRegisterStep('verify');
    } catch (e) {
      setError((e as Error).message || 'Could not start WhatsApp verification');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (mode !== 'register' || registerStep !== 'verify' || otpReady) return;
    const trimmedMobile = mobile.trim();
    if (!trimmedMobile) return;

    const timer = setInterval(() => {
      void getCookRegisterWhatsappVerifyStatus(trimmedMobile)
        .then((res) => {
          if (res.otp_ready) setOtpReady(true);
        })
        .catch(() => null);
    }, 3000);

    return () => clearInterval(timer);
  }, [mode, registerStep, mobile, otpReady]);

  const submit = async () => {
    setBusy(true);
    setError('');
    const trimmedEmail = email.trim();
    const trimmedMobile = mobile.trim();

    if (mode === 'login') {
      const policy = validateShcPassword(password);
      if (!policy.ok) {
        setError(policy.message);
        setBusy(false);
        return;
      }
      try {
        await login(trimmedEmail, password);
      } catch (e) {
        setError((e as Error).message || 'Cook login failed');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (registerStep === 'details') {
      setBusy(false);
      await prepareWhatsappVerify();
      return;
    }

    if (!whatsappOtp.trim()) {
      setError('Message us on WhatsApp first, then enter the code we reply with.');
      setBusy(false);
      return;
    }
    try {
      await register(trimmedEmail, password, trimmedMobile, whatsappOtp.trim());
      clearCookOnboardingSeen();
    } catch (e) {
      setError((e as Error).message || 'Sign up failed');
    } finally {
      setBusy(false);
    }
  };

  const isRegisterVerify = mode === 'register' && registerStep === 'verify';

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Loading cook session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8" data-testid="cook-login-screen">
        <GourmeatCookHeader
          title={mode === 'login' ? 'Cook sign in' : 'Create cook account'}
          subtitle="HDB kitchen · collection-only orders"
          testID="cook-login-hero"
        />

        <div
          className="rounded-2xl p-4 mb-4 text-white shadow-[var(--shc-shadow-brutal-sm)]"
          style={{ background: 'var(--shc-gourmeat-primary, #F87048)' }}
        >
          <p className="font-black text-lg">{mode === 'login' ? 'Welcome back' : 'New home cook?'}</p>
          <p className="text-sm font-semibold opacity-95 mt-1">
            {mode === 'login'
              ? 'Sign in to manage listings, orders, and earnings.'
              : registerStep === 'details'
                ? 'We verify you on WhatsApp — tap the button, send us a message, we reply with your code (free).'
                : 'Tap Message us to verify — WhatsApp opens with a ready-to-send message. Enter the code we reply with below.'}
          </p>
        </div>

        <GourmeatCard>
          <div className="space-y-3">
            {mode === 'login' && (
              <>
                <input
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  data-testid="cook-login-email"
                />
                <input
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  data-testid="cook-login-password"
                />
              </>
            )}

            {mode === 'register' && registerStep === 'details' && (
              <>
                <input
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  data-testid="cook-login-email"
                />
                <input
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (8+ chars, letter + number in prod)"
                  data-testid="cook-login-password"
                />
                <input
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="WhatsApp mobile (e.g. 9123 4567)"
                  type="tel"
                  data-testid="cook-login-mobile"
                />
              </>
            )}

            {isRegisterVerify && (
              <>
                <input
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm font-medium"
                  value={mobile}
                  readOnly
                  data-testid="cook-login-mobile"
                />
                {whatsappUrl ? (
                  <>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full rounded-xl bg-[#25D366] text-white text-center font-bold py-3 border border-[#128C7E]"
                      data-testid="cook-login-whatsapp-verify"
                    >
                      Message us to verify
                    </a>
                    <p className="text-sm text-muted-foreground">
                      Opens WhatsApp with a message ready to send. Hit send — we reply with your 6-digit code.
                    </p>
                  </>
                ) : null}
                <input
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
                  value={whatsappOtp}
                  onChange={(e) => setWhatsappOtp(e.target.value)}
                  placeholder="6-digit code from WhatsApp"
                  inputMode="numeric"
                  data-testid="cook-login-otp"
                />
                {otpHint ? <p className="text-sm font-bold text-primary">{otpHint}</p> : null}
                {!otpReady ? (
                  <p className="text-sm text-muted-foreground">Waiting for your WhatsApp message…</p>
                ) : (
                  <p className="text-sm font-bold text-primary">Code received — enter it above.</p>
                )}
                <button
                  type="button"
                  className="text-sm font-bold text-primary"
                  data-testid="cook-login-resend-otp"
                  disabled={busy}
                  onClick={() => void prepareWhatsappVerify()}
                >
                  Get a new verify link
                </button>
              </>
            )}

            {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}
            <GourmeatPrimaryButton
              label={
                busy
                  ? 'Please wait…'
                  : mode === 'login'
                    ? 'Sign in as cook'
                    : registerStep === 'details'
                      ? 'Continue'
                      : 'Create cook account'
              }
              disabled={busy}
              onClick={submit}
              testID="cook-login-submit"
            />
            {isRegisterVerify ? (
              <button
                type="button"
                className="w-full text-center text-sm font-bold text-primary py-2"
                data-testid="cook-login-change-mobile"
                onClick={resetRegister}
              >
                Start over
              </button>
            ) : null}
            <button
              type="button"
              className="w-full text-center text-sm font-bold text-primary py-2"
              data-testid="cook-auth-mode-toggle"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'New home cook? Create an account' : 'Have an account? Sign in'}
            </button>
            {showDevTools && mode === 'login' && (
              <p className="text-xs text-muted-foreground text-center">
                Staging demo: rose@shc.local / cooksecret (docs only — not for production sign-up)
              </p>
            )}
          </div>
        </GourmeatCard>
      </div>
    );
  }

  if (!onboardingReady || (needsOnboarding && !isOnboardingPath)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Preparing kitchen setup…
      </div>
    );
  }

  return <>{children}</>;
}
