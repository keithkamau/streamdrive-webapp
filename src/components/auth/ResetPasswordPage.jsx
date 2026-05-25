import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Button, PasswordInput, Alert, Spinner } from "../ui/index";

// ─── States the page can be in ───────────────────────────────────────────────
// "loading"  — checking Supabase session from the magic link
// "form"     — session confirmed, show new-password form
// "saving"   — submitting new password
// "success"  — password updated
// "invalid"  — session missing or expired link

export default function ResetPasswordPage() {
  const [pageState, setPageState] = useState("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);

  // ── On mount: Supabase fires an AUTH_STATE_CHANGE with type PASSWORD_RECOVERY
  // when the user lands via the reset link. We listen for it. ─────────────────
  useEffect(() => {
    // If Supabase already has a session (user clicked the link and it was
    // consumed) getSession() returns it immediately.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState("form");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPageState("form");
      }
    });

    // If after 6 s we still haven't got a session the link is invalid/expired
    const timer = setTimeout(() => {
      setPageState((prev) => (prev === "loading" ? "invalid" : prev));
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // ── Submit new password ───────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setPageState("saving");
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setPageState("success");
    } catch (err) {
      setError(err.message);
      setPageState("form");
    }
  };

  // ── Go to login ───────────────────────────────────────────────────────────

  const goToLogin = () => {
    window.location.hash = "#login";
    // Force a full reload so App.jsx re-evaluates the hash and shows LoginPage
    window.location.reload();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className='min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4'>
      <div className='w-full max-w-sm animate-fade-in'>
        {/* Logo / wordmark */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-600 text-white text-xl mb-4 shadow-lg'>
            🏡
          </div>
          <h1 className='text-2xl font-display font-bold text-zinc-900 dark:text-zinc-100'>
            Stream Drive Estate
          </h1>
          <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
            Admin Portal
          </p>
        </div>

        <div className='bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8'>
          {/* ── Loading ── */}
          {pageState === "loading" && (
            <div className='flex flex-col items-center gap-4 py-4'>
              <Spinner />
              <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                Verifying reset link…
              </p>
            </div>
          )}

          {/* ── Invalid / expired ── */}
          {pageState === "invalid" && (
            <div className='space-y-4 text-center'>
              <div className='text-4xl'>🔗</div>
              <h2 className='font-display font-semibold text-zinc-900 dark:text-zinc-100'>
                Link expired
              </h2>
              <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                This password reset link is invalid or has already been used.
                Please request a new one from the login page.
              </p>
              <Button variant='primary' onClick={goToLogin} className='w-full'>
                Back to Login
              </Button>
            </div>
          )}

          {/* ── Form ── */}
          {(pageState === "form" || pageState === "saving") && (
            <form onSubmit={handleSubmit} className='space-y-5'>
              <div>
                <h2 className='font-display font-semibold text-zinc-900 dark:text-zinc-100 text-lg'>
                  Set new password
                </h2>
                <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
                  Choose a strong password for your admin account.
                </p>
              </div>

              {error && <Alert variant='error'>{error}</Alert>}

              <PasswordInput
                label='New Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='At least 8 characters'
                autoComplete='new-password'
                required
              />

              <PasswordInput
                label='Confirm Password'
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder='Repeat your new password'
                autoComplete='new-password'
                required
              />

              <Button
                type='submit'
                variant='primary'
                className='w-full'
                disabled={pageState === "saving"}
              >
                {pageState === "saving" ? (
                  <span className='flex items-center justify-center gap-2'>
                    <Spinner size='sm' />
                    Updating…
                  </span>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          )}

          {/* ── Success ── */}
          {pageState === "success" && (
            <div className='space-y-4 text-center'>
              <div className='text-4xl'>✅</div>
              <h2 className='font-display font-semibold text-zinc-900 dark:text-zinc-100'>
                Password updated!
              </h2>
              <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                Your password has been changed successfully. You can now sign in
                with your new credentials.
              </p>
              <Button variant='primary' onClick={goToLogin} className='w-full'>
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
