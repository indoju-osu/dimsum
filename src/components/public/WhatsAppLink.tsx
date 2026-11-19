import { MessageCircle } from 'lucide-react';
import { buttonStyles, type ButtonSize, type ButtonVariant } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * Tautan WhatsApp Click-to-Chat.
 *
 * Tautan HANYA dibuka setelah pengguna mengklik tombol ini (tidak pernah
 * otomatis). Bila nomor WhatsApp belum diatur pemilik toko, komponen ini
 * mengembalikan null sehingga tidak ada nomor yang dikarang.
 */
export function WhatsAppLink({
  url,
  children = 'Chat via WhatsApp',
  variant = 'whatsapp',
  size = 'md',
  className,
  showIcon = true,
  ariaLabel,
}: {
  url: string | null;
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  showIcon?: boolean;
  ariaLabel?: string;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={cn(buttonStyles({ variant, size }), className)}
    >
      {showIcon ? <MessageCircle aria-hidden className="h-4 w-4" /> : null}
      {children}
    </a>
  );
}

export default WhatsAppLink;
