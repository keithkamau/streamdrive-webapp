import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, PasswordInput, Alert } from "../ui";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const { login } = useAuth();
  const [view, setView] = useState("login"); // 'login' | 'forgot' | 'sent'
  const [form, setForm] = useState({ email: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = await login(form);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!resetEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/#reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setView("sent");
    }
    setLoading(false);
  };

  // ── Sent confirmation ───────────────────────────────────────────────────
  if (view === "sent") {
    return (
      <div className='w-full max-w-md mx-auto animate-fade-in'>
        <div className='mb-8 text-center'>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-green-600 mb-2'>
            Check your inbox
          </p>
          <h1 className='font-display text-3xl font-bold text-zinc-900 mb-2'>
            Email sent
          </h1>
          <p className='text-zinc-400 text-sm'>
            A password reset link has been sent to{" "}
            <span className='font-semibold text-zinc-700'>{resetEmail}</span>
          </p>
        </div>
        <div className='bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm flex flex-col gap-4'>
          <div className='flex flex-col items-center gap-3 py-4'>
            <div className='w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center'>
              <svg
                className='w-7 h-7 text-green-600'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
                <polyline points='22,6 12,13 2,6' />
              </svg>
            </div>
            <p className='text-sm text-zinc-500 text-center leading-relaxed'>
              Click the link in the email to reset your password. The link
              expires in 1 hour.
            </p>
          </div>
          <Button
            variant='secondary'
            size='xl'
            onClick={() => {
              setView("login");
              setResetEmail("");
              setError("");
            }}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  // ── Forgot password form ────────────────────────────────────────────────
  if (view === "forgot") {
    return (
      <div className='w-full max-w-md mx-auto animate-fade-in'>
        <div className='mb-8 text-center'>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-green-600 mb-2'>
            Reset password
          </p>
          <h1 className='font-display text-3xl font-bold text-zinc-900 mb-2'>
            Forgot password?
          </h1>
          <p className='text-zinc-400 text-sm'>
            Enter your email and we'll send you a reset link
          </p>
        </div>
        <div className='bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm'>
          {error && (
            <Alert variant='danger' className='mb-5'>
              {error}
            </Alert>
          )}
          <form onSubmit={handleForgotPassword} className='flex flex-col gap-5'>
            <Input
              label='Email address'
              type='email'
              placeholder='you@example.com'
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              autoComplete='email'
              hint='Must match your registered admin email'
            />
            <Button type='submit' size='xl' loading={loading}>
              Send reset link
            </Button>
          </form>
          <button
            onClick={() => {
              setView("login");
              setError("");
            }}
            className='w-full text-center text-sm text-zinc-400 hover:text-zinc-600 transition-colors mt-5'
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ── Login form ──────────────────────────────────────────────────────────
  return (
    <div className='w-full max-w-md mx-auto animate-fade-in'>
      <div className='mb-8 text-center'>
        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-green-600 mb-2'>
          Admin Portal
        </p>
        <h1 className='font-display text-3xl font-bold text-zinc-900 mb-2'>
          Sign in
        </h1>
        <p className='text-zinc-400 text-sm'>
          Access restricted to Stream Drive estate admins
        </p>
      </div>

      <div className='bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm'>
        {error && (
          <Alert variant='danger' className='mb-5'>
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin} className='flex flex-col gap-5'>
          <Input
            label='Email address'
            type='email'
            placeholder='you@example.com'
            value={form.email}
            onChange={set("email")}
            autoComplete='email'
          />
          <div className='flex flex-col gap-1.5'>
            <PasswordInput
              label='Password'
              placeholder='Your password'
              value={form.password}
              onChange={set("password")}
              autoComplete='current-password'
            />
            <button
              type='button'
              onClick={() => {
                setView("forgot");
                setError("");
              }}
              className='self-end text-xs text-zinc-400 hover:text-green-600 transition-colors mt-1'
            >
              Forgot password?
            </button>
          </div>
          <Button type='submit' size='xl' loading={loading} className='mt-2'>
            Sign in
          </Button>
        </form>

        <div className='mt-6 flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5'>
          <svg
            className='w-4 h-4 text-zinc-400 shrink-0'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
            <path d='M7 11V7a5 5 0 0110 0v4' />
          </svg>
          <p className='text-xs text-zinc-400'>
            This portal is restricted to authorised estate administrators only.
            Contact your estate manager if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
