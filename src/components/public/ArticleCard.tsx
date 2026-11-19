import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/Misc';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { formatDate } from '@/lib/format';
import type { ArticleListItem } from '@/types';

export function ArticleCard({
  article,
  priority = false,
}: {
  article: ArticleListItem;
  priority?: boolean;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link href={`/articles/${article.slug}`} className="block aspect-[4/3] overflow-hidden bg-stone/60">
        <ImageWithFallback
          src={article.coverImage}
          alt={`Foto ilustrasi artikel ${article.title}`}
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="transition duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-charcoal/70">
          <Badge tone="sand">{article.category}</Badge>
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden className="h-3.5 w-3.5" />
            {formatDate(article.publishedAt ?? article.updatedAt)}
          </span>
        </div>
        <h3 className="text-lg font-semibold leading-snug">
          <Link href={`/articles/${article.slug}`} className="hover:text-olive">
            {article.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-charcoal/80">{article.excerpt}</p>
        <Link
          href={`/articles/${article.slug}`}
          className="mt-auto text-sm font-semibold text-forest underline decoration-harvest decoration-2 underline-offset-4 hover:text-olive"
        >
          Baca selengkapnya
        </Link>
      </div>
    </article>
  );
}

export default ArticleCard;
