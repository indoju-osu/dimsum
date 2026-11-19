'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/FormControls';
import { useToast } from '@/components/ui/Toast';

/**
 * Form login admin (mode demonstrasi: admin / admin).
 * Password dikirim ke Route Handler /api/auth/login dan sesi disimpan pada
 * cookie HttpOnly bertanda tangan HMAC — tidak ada token di localStorage.
 */
export function LoginForm({ brandName }: { brandName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextPath = searchParams.get('next') || '/admin';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: { username?: string; password?: string } = {};
    if (username.trim().length < 3) nextErrors.username = 'Username minimal 3 karakter.';
    if (!password) nextErrors.password = 'Password wajib diisi.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const payload: { error?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(payload.error ?? 'Login gagal. Silakan coba lagi.');
        return;
      }

      toast.success('Login berhasil', 'Selamat datang di dashboard admin.');
      router.replace(nextPath.startsWith('/admin') ? nextPath : '/admin');
      router.refresh();
    } catch {
      setFormError('Tidak dapat menghubungi server. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-1">
        <p className="eyebrow">Area Terbatas</p>
        <h1 className="font-display text-2xl">Masuk sebagai Admin {brandName}</h1>
        <p className="text-sm text-charcoal/80">
          Gunakan akun admin toko untuk mengelola produk, pesanan, dan konten.
        </p>
      </div>

      {formError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {formError}
        </p>
      ) : null}

      <Field label="Username" htmlFor="username" required error={errors.username}>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          invalid={Boolean(errors.username)}
          placeholder="admin"
        />
      </Field>

      <Field label="Password" htmlFor="password" required error={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          invalid={Boolean(errors.password)}
          placeholder="••••••"
        />
      </Field>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        <LogIn aria-hidden className="h-5 w-5" />
        {loading ? 'Memproses…' : 'Masuk'}
      </Button>

      <p className="rounded-xl border border-sand/70 bg-white px-4 py-3 text-xs text-charcoal/80">
        <strong className="font-semibold text-forest">Mode demonstrasi.</strong> Kredensial bawaan:{' '}
        <code className="rounded bg-stone/70 px-1 py-0.5">admin</code> /{' '}
        <code className="rounded bg-stone/70 px-1 py-0.5">admin</code>. Ganti password sebelum
        digunakan untuk toko sungguhan.
      </p>
    </form>
  );
}

export default LoginForm;
