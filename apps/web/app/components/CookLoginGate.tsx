'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { COOK_ONBOARDING_DEMO_OTP, validateShcPassword } from '@shc/utils';
import { useCookAuth } from '../../lib/useCookAuth';
import { hasSeenCookOnboarding, clearCookOnboardingSeen } from '../../lib/onboarding';
import { sendCookRegisterEmailOtp } from '../../lib/cook-api-client';
import { GourmeatCookHeader, GourmeatPrimaryButton, GourmeatCard } from './SHCWebComponents';
import { showDevTools } from '../../lib/dev';

type RegisterStep = 'email' | 'verify';

/**
 * Cook PWA auth + first-run kitchen onboarding.
 * After sign-in or sign-up, unseen cooks → `/cook-portal/onboarding` (not dashboard).
 */
export function CookLoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading, login, register } = useCookAuth();
  const pathname = usePathname() || '';
  const router = useRouter();
  const [email, setEmail] = useState(showDevTools ? 'rose@shc.local' : '');
  const [password, setPassword] = useState(showDevTools ? 'cooksecret' : '');
  const [emailOtp, setEmailOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('email');
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
    setRegisterStep('email');
    setEmailOtp('');
    setOtpHint('');
    setError('');
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    resetRegister();
  };

  const sendEmailOtp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Enter your email to receive a verification code.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await sendCookRegisterEmailOtp(trimmedEmail);
      setOtpHint(res.hint || `Enter code ${COOK_ONBOARDING_DEMO_OTP}`);
      setRegisterStep('verify');
    } catch (e) {
      setError((e as Error).message || 'Could not send verification code');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    const trimmedEmail = email.trim();

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

    if (registerStep === 'email') {
      await sendEmailOtp();
      return;
    }

    if (!emailOtp.trim()) {
      setError('Enter the verification code from your email.');
      setBusy(false);
      return;
    }
    const policy = validateShcPassword(password);
    if (!policy.ok) {
      setError(policy.message);
      setBusy(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setBusy(false);
      return;
    }
    try {
      await register(trimmedEmail, password, emailOtp.trim());
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
              : registerStep === 'email'
                ? 'Create a fresh kitchen account — we verify your email before setup.'
                : 'Enter the code we sent and choose a password.'}
          </p>
        </div>

        <GourmeatCard>
          <div className="space-y-3">
            <input
              className={`w-full rounded-xl border border-border px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)] ${
                isRegisterVerify ? 'bg-muted text-muted-foreground' : 'bg-card'
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              readOnly={isRegisterVerify}
              data-testid="cook-login-email"
            />
            {isRegisterVerify ? (
              <>
                <input
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  placeholder="6-digit verification code"
                  inputMode="numeric"
                  data-testid="cook-login-otp"
                />
                {otpHint ? <p className="text-sm font-bold text-primary">{otpHint}</p> : null}
                <button
                  type="button"
                  className="text-sm font-bold text-primary"
                  data-testid="cook-login-resend-otp"
                  disabled={busy}
                  onClick={() => void sendEmailOtp()}
                >
                  Resend code
                </button>
              </>
            ) : null}
            {(mode === 'login' || isRegisterVerify) && (
              <input
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)]"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Password (8+ chars, letter + number in prod)' : 'Password'}
                data-testid="cook-login-password"
              />
            )}
            {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}
            <GourmeatPrimaryButton
              label={
                busy
                  ? 'Please wait…'
                  : mode === 'login'
                    ? 'Sign in as cook'
                    : registerStep === 'email'
                      ? 'Send verification code'
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
                data-testid="cook-login-change-email"
                onClick={resetRegister}
              >
                Use a different email
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
