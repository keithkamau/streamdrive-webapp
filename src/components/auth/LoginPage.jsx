import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, PasswordInput, Alert } from "../ui";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = login(form);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

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

        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
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
