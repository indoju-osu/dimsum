import { Badge, StarRating } from '@/components/ui/Misc';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { initials } from '@/lib/utils';
import type { TestimonialView } from '@/types';

/**
 * Kartu testimoni. Testimoni contoh (dari data seed) diberi label jelas
 * supaya tidak dianggap sebagai ulasan pelanggan nyata.
 */
export function TestimonialCard({ testimonial }: { testimonial: TestimonialView }) {
  return (
    <figure className="flex h-full flex-col gap-4 rounded-3xl border border-stone bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        {testimonial.photo ? (
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-stone">
            <ImageWithFallback
              src={testimonial.photo}
              alt={`Foto ${testimonial.name}`}
              sizes="48px"
            />
          </span>
        ) : (
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-olive/20 text-sm font-semibold text-forest"
          >
            {initials(testimonial.name)}
          </span>
        )}
        <div>
          <figcaption className="text-sm font-semibold text-forest">{testimonial.name}</figcaption>
          {testimonial.role ? (
            <p className="text-xs text-charcoal/70">{testimonial.role}</p>
          ) : null}
        </div>
      </div>
      <StarRating rating={testimonial.rating} />
      <blockquote className="text-sm leading-relaxed text-charcoal/90">
        “{testimonial.content}”
      </blockquote>
      {testimonial.isDemoData ? (
        <div className="mt-auto">
          <Badge tone="neutral">Testimoni contoh (data demo)</Badge>
        </div>
      ) : null}
    </figure>
  );
}

export default TestimonialCard;
