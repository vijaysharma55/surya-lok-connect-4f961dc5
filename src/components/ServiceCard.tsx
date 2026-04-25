import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  to: string;
  image: string;
  imageAlt: string;
}

export const ServiceCard = ({
  icon: Icon,
  title,
  description,
  benefits,
  to,
  image,
  imageAlt,
}: Props) => (
  <article className="group flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-card hover:shadow-warm transition-all duration-300 hover:-translate-y-1">
    <div className="relative aspect-[16/10] overflow-hidden">
      <img
        src={image}
        alt={imageAlt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute top-3 left-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-warm">
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <div className="flex flex-col flex-1 p-6">
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {description}
      </p>
      <ul className="space-y-1.5 mb-5 text-sm">
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
            <span className="text-foreground">{b}</span>
          </li>
        ))}
      </ul>
      <Link
        to={to}
        className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:gap-2 transition-all"
      >
        Learn more <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </article>
);
