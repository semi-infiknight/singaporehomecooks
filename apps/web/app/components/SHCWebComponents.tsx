'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  Home,
  Leaf,
  Loader2,
  MapPin,
  Package,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Users,
  UtensilsCrossed,
  Wallet,
  CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  getDishImageUrl,
  getOccasionImageUrl,
  BENTO_ACTION_IMAGES,
  PROMO_BANNER_IMAGES,
  DEFAULT_PROMOS,
  getCookAvatarUrl,
  COLLECTION_ORDER_TIMELINE,
  getOrderTimelineIndex,
  getOrderStatusLabel,
  MIND_CUISINE_CATEGORIES,
  getCollectionSlotLabel,
} from '@shc/utils';


type ButtonVariant = 'primary' | 'outline' | 'accent' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export function SHCButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  testID,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  testID?: string;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-bold rounded-lg border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:translate-x-px active:translate-y-px active:shadow-none';
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };
  const variants: Record<ButtonVariant, string> = {
    primary: 'shc-btn-primary',
    outline: 'border-2 border-[var(--shc-border-brutal)] text-primary hover:bg-secondary bg-card',
    accent: 'bg-[var(--shc-accent)] hover:opacity-90 text-[var(--shc-text)]',
    ghost: 'border-transparent shadow-none text-muted-foreground hover:bg-secondary',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testID}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
}

export function SHCCard({
  children,
  className = '',
  hover = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={`bg-card border-2 border-[var(--shc-border-brutal)] rounded-xl p-5 shadow-[var(--shc-shadow)] ${
        hover ? 'transition-shadow hover:shadow-[var(--shc-shadow-lg)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SHCBadge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'heritage';
}) {
  const styles: Record<string, string> = {
    default: 'bg-secondary text-foreground',
    success: 'bg-[var(--shc-bento-mint)] text-[var(--shc-success)]',
    warning: 'bg-[var(--shc-bento-yellow)] text-[var(--shc-warning)]',
    error: 'bg-red-50 text-[var(--shc-error)]',
    heritage: 'bg-[var(--shc-bento-peach)] text-[var(--shc-heritage)]',
  };
  return (
    <span
      className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border-2 border-[var(--shc-border-brutal)] ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export function SHCSectionTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mt-8 mb-3">
      <h2 className="text-lg font-bold text-foreground">{children}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

export function SHCPageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <a
          href={backHref}
          className="text-sm font-semibold text-muted-foreground hover:text-primary mb-3 inline-block"
        >
          ← {backLabel}
        </a>
      )}
      <h1 className="shc-display text-2xl md:text-3xl tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl text-sm">{subtitle}</p>}
    </div>
  );
}

/* ── Bento quick-actions row ── */

export type WebBentoIconKey =
  | 'cart'
  | 'orders'
  | 'credits'
  | 'request'
  | 'listings'
  | 'earnings'
  | 'compliance';

const WEB_BENTO_ICONS: Record<WebBentoIconKey, LucideIcon> = {
  cart: ShoppingBag,
  orders: Package,
  credits: Wallet,
  request: ChefHat,
  listings: UtensilsCrossed,
  earnings: Banknote,
  compliance: ShieldCheck,
};

type BentoTileProps = {
  href: string;
  label: string;
  iconKey: WebBentoIconKey;
  imageKey?: keyof typeof BENTO_ACTION_IMAGES;
  variant?: 'mint' | 'peach' | 'yellow' | 'default';
  badge?: string | number;
};

const bentoVariants: Record<string, string> = {
  mint: 'shc-bento-mint',
  peach: 'shc-bento-peach',
  yellow: 'shc-bento-yellow',
  default: 'bg-card',
};

export function BentoTile({ href, label, iconKey, imageKey = 'cart', variant = 'default', badge }: BentoTileProps) {
  const bgImage = BENTO_ACTION_IMAGES[imageKey];
  const Icon = WEB_BENTO_ICONS[iconKey];
  return (
    <Link
      href={href}
      className={`${bentoVariants[variant]} border-2 border-[var(--shc-border-brutal)] rounded-xl shadow-[var(--shc-shadow-brutal-sm)] hover:shadow-[var(--shc-shadow-brutal)] transition-shadow relative overflow-hidden h-24 block`}
    >
      <Image src={bgImage} alt="" fill className="object-cover opacity-85" sizes="33vw" />
      <div className="relative z-10 flex flex-col justify-between h-full p-3">
        <div className="flex justify-between items-start">
          <span
            className="w-8 h-8 rounded-full bg-card border-2 border-[var(--shc-border-brutal)] flex items-center justify-center shadow-[var(--shc-shadow-brutal-sm)]"
            aria-hidden
          >
            <Icon className="w-4 h-4 text-primary" />
          </span>
          {badge !== undefined && badge !== 0 && (
            <span className="min-w-[22px] h-[22px] flex items-center justify-center text-[11px] font-black bg-primary text-primary-foreground border-2 border-[var(--shc-border-brutal)] rounded-full px-1">
              {badge}
            </span>
          )}
        </div>
        <span className="font-bold text-sm text-foreground drop-shadow-sm">{label}</span>
      </div>
    </Link>
  );
}

export function BentoGrid({
  tiles,
}: {
  tiles: BentoTileProps[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="bento-quick-actions">
      {tiles.map((tile) => (
        <BentoTile key={tile.href + tile.label} {...tile} />
      ))}
    </div>
  );
}

/* ── Swiggy-style occasion category rail ── */

function CategoryRailItem({
  occasion,
  label,
  active,
  onSelect,
  imageUrl,
}: {
  occasion: string;
  label: string;
  active: boolean;
  onSelect: () => void;
  imageUrl?: string;
}) {
  const src = imageUrl ?? getOccasionImageUrl(occasion);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center w-[72px] shrink-0"
      data-testid={`category-chip-${occasion || 'all'}`}
    >
      <div
        className={`w-16 h-16 rounded-full overflow-hidden border-2 shadow-[var(--shc-shadow-brutal-sm)] ${
          active ? 'border-primary ring-2 ring-primary/30' : 'border-[var(--shc-border-brutal)]'
        }`}
      >
        <Image
          src={src}
          alt={label}
          width={64}
          height={64}
          className="object-cover w-full h-full"
        />
      </div>
      <span
        className={`text-[10px] font-bold mt-1.5 text-center leading-tight ${
          active ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export function PromoRail({
  onPromoClick,
}: {
  onPromoClick?: (id: string) => void;
}) {
  const icons: Record<string, LucideIcon> = {
    'promo-raya': Leaf,
    'promo-credits': Wallet,
    'promo-family': Users,
    'promo-paynow': CreditCard,
  };
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" data-testid="promo-rail">
      {DEFAULT_PROMOS.map((promo, i) => (
        <button
          key={promo.id}
          type="button"
          onClick={() => onPromoClick?.(promo.id)}
          data-testid={`promo-card-${promo.id}`}
          className="shc-promo-enter relative shrink-0 w-[260px] h-[100px] rounded-xl overflow-hidden border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] text-left"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <Image src={PROMO_BANNER_IMAGES[promo.imageKey]} alt="" fill className="object-cover" sizes="260px" />
          <div className="relative z-10 flex flex-col justify-between h-full p-3 bg-[rgba(36,24,18,0.45)]">
            <div className="flex justify-between items-start">
              {icons[promo.id] && (
                <span
                  className="w-7 h-7 rounded-full bg-card border-2 border-[var(--shc-border-brutal)] flex items-center justify-center shadow-[var(--shc-shadow-brutal-sm)]"
                  aria-hidden
                >
                  {(() => {
                    const PromoIcon = icons[promo.id];
                    return <PromoIcon className="w-3.5 h-3.5 text-primary" />;
                  })()}
                </span>
              )}
              {promo.badge && (
                <span className="text-[10px] font-black bg-[var(--shc-accent)] text-foreground px-2 py-0.5 rounded border border-[var(--shc-border-brutal)]">
                  {promo.badge}
                </span>
              )}
            </div>
            <div>
              <div className="font-black text-white text-sm">{promo.title}</div>
              <div className="text-[11px] font-semibold text-white/90 mt-0.5">{promo.subtitle}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

const WEB_FILTER_ICONS: Record<string, LucideIcon> = {
  filters: Settings2,
  halal: Leaf,
  light: Leaf,
  moderate: UtensilsCrossed,
  all: Flame,
  search: Search,
};

export function FilterChipRow({
  chips,
  onChipClick,
}: {
  chips: Array<{
    id: string;
    label: string;
    icon?: string;
    iconKey?: keyof typeof WEB_FILTER_ICONS;
    imageUrl?: string;
    active?: boolean;
    testID?: string;
  }>;
  onChipClick: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" data-testid="filter-chip-row">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onChipClick(chip.id)}
          data-testid={chip.testID ?? `filter-chip-${chip.id}`}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border-2 border-[var(--shc-border-brutal)] text-xs font-bold shadow-[var(--shc-shadow-brutal-sm)] transition-colors ${
            chip.active ? 'bg-[var(--shc-bento-peach)] text-primary' : 'bg-card text-foreground hover:bg-secondary'
          }`}
        >
          {chip.imageUrl ? (
            <Image src={chip.imageUrl} alt="" width={20} height={20} className="rounded-full border border-[var(--shc-border-brutal)] object-cover" />
          ) : chip.iconKey && WEB_FILTER_ICONS[chip.iconKey] ? (
            (() => {
              const ChipIcon = WEB_FILTER_ICONS[chip.iconKey!];
              return <ChipIcon className="w-3.5 h-3.5" aria-hidden />;
            })()
          ) : chip.icon ? (
            <span aria-hidden>{chip.icon}</span>
          ) : null}
          {chip.label}
        </button>
      ))}
    </div>
  );
}

export function ZomatoRatingPill({ rating = 4.8, reviewCount }: { rating?: number; reviewCount?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-[var(--shc-success)] bg-[var(--shc-bento-mint)] px-1.5 py-0.5 rounded border border-[var(--shc-border-brutal)]">
      <Star className="w-3 h-3 fill-[var(--shc-success)]" aria-hidden />
      {rating}
      {reviewCount != null && <span className="font-semibold text-muted-foreground">({reviewCount}+)</span>}
    </span>
  );
}

export function ZomatoOrderRow({
  orderId,
  dishName,
  productId,
  status,
  statusLabel,
  collectionDate,
  collectionSlot,
  total,
  href,
}: {
  orderId: string;
  dishName: string;
  productId?: string;
  status: string;
  statusLabel: string;
  collectionDate?: string;
  collectionSlot?: string;
  total?: number | string;
  href: string;
}) {
  const imgUrl = getDishImageUrl({ id: productId, name: dishName });
  const badgeVariant = status === 'completed' || status === 'collected' ? 'success' : 'default';
  return (
    <Link href={href} data-testid={`order-row-${orderId}`}>
      <SHCCard hover className="p-0 overflow-hidden">
        <div className="flex gap-3 p-3">
          <div className="relative w-[72px] h-[72px] shrink-0 rounded-lg overflow-hidden border-2 border-[var(--shc-border-brutal)]">
            <Image src={imgUrl} alt={dishName} fill className="object-cover" sizes="72px" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between items-start gap-2">
              <div className="font-extrabold text-sm truncate">{dishName}</div>
              <SHCBadge variant={badgeVariant}>{statusLabel}</SHCBadge>
            </div>
            <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">{orderId}</div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {(collectionDate || collectionSlot) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                  <Clock className="w-3 h-3" aria-hidden />
                  {collectionDate} {collectionSlot}
                </span>
              )}
              {total != null && (
                <span className="font-mono font-extrabold text-primary text-sm">S${total}</span>
              )}
            </div>
          </div>
        </div>
      </SHCCard>
    </Link>
  );
}

export function ZomatoAddButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 text-xs font-black text-primary bg-card px-3.5 py-1.5 rounded-lg border-2 border-primary shadow-[var(--shc-shadow-brutal-sm)] hover:shadow-[var(--shc-shadow-brutal)] transition-shadow"
      data-testid="dish-add-btn"
    >
      ADD
    </Link>
  );
}

export function DishRowCard({
  product,
  offerLabel,
  offerText,
}: {
  product: DishCardProduct;
  offerLabel?: string;
  offerText?: string;
}) {
  const imageUrl = getDishImageUrl({ id: product.id, cuisine: product.cuisine, name: product.name });
  const slot = getCollectionSlotLabel(product.id);
  return (
    <Link
      href={`/product/${product.id}`}
      className="shrink-0 w-[300px] flex flex-col border-2 border-[var(--shc-border-brutal)] rounded-xl overflow-hidden bg-card shadow-[var(--shc-shadow-brutal-sm)] hover:shadow-[var(--shc-shadow-brutal)] transition-shadow"
      data-testid={`dish-row-${product.id}`}
    >
      <div className="flex">
        <div className="relative w-[110px] h-[118px] shrink-0">
          <Image src={imageUrl} alt={product.name} fill className="object-cover" sizes="110px" />
          {offerLabel && (
            <span className="absolute top-1.5 left-1.5 text-[9px] font-black bg-[var(--shc-accent)] text-foreground px-1.5 py-0.5 rounded border border-[var(--shc-border-brutal)]">
              {offerLabel}
            </span>
          )}
        </div>
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <div className="font-extrabold text-sm leading-snug line-clamp-2">{product.name}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {product.cuisine || 'Heritage'} · {product.cook_name}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <ZomatoRatingPill reviewCount={42} />
            {product.price !== undefined && (
              <span className="font-mono font-extrabold text-foreground text-sm">S${product.price}</span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-muted-foreground">
            <Clock className="w-3 h-3" aria-hidden />
            {slot}
            <span>·</span>
            <MapPin className="w-3 h-3" aria-hidden />
            HDB collect
          </div>
        </div>
      </div>
      {(offerText || offerLabel) && (
        <div className="border-t border-[var(--shc-border-brutal)] bg-[var(--shc-bento-yellow)] px-3 py-1.5">
          <p className="text-[10px] font-extrabold text-primary truncate">{offerText || `Heritage offer · ${offerLabel}`}</p>
        </div>
      )}
    </Link>
  );
}

export function DishRowRail({
  title = 'Top picks for you',
  products,
}: {
  title?: string;
  products: DishCardProduct[];
}) {
  if (products.length === 0) return null;
  return (
    <div data-testid="dish-row-rail">
      {title ? <h2 className="shc-display text-base font-black mb-3">{title}</h2> : null}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {products.map((p, i) => (
          <DishRowCard
            key={p.id}
            product={p}
            offerLabel={i === 0 ? 'POPULAR' : i === 1 ? '20% OFF' : undefined}
            offerText={i === 0 ? '★ Top rated home cook this week' : i === 1 ? '20% off on orders above S$80' : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Toptal food-app UX: stepper, search+ADD, heritage story ── */

export function CheckoutStepper({
  steps,
  currentStep,
  testID = 'checkout-stepper',
}: {
  steps: Array<{ id: string; label: string; done?: boolean }>;
  currentStep: number;
  testID?: string;
}) {
  return (
    <div className="mb-6" data-testid={testID}>
      <div className="flex items-start gap-1">
        {steps.map((step, i) => {
          const n = i + 1;
          const active = n === currentStep;
          const done = step.done || n < currentStep;
          return (
            <React.Fragment key={step.id}>
              <div className="flex-1 flex flex-col items-center min-w-0">
                <div
                  className={`w-7 h-7 rounded-full border-2 border-[var(--shc-border-brutal)] flex items-center justify-center text-xs font-black shadow-[var(--shc-shadow-brutal-sm)] ${
                    done ? 'bg-primary text-primary-foreground' : active ? 'bg-[var(--shc-bento-peach)] text-primary' : 'bg-card text-muted-foreground'
                  }`}
                >
                  {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
                </div>
                <span className={`text-[9px] font-bold mt-1 text-center truncate w-full ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-[0.35] h-0.5 mt-3.5 rounded ${done ? 'bg-primary' : 'bg-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function SearchResultRow({
  product,
  onAdd,
  href,
}: {
  product: DishCardProduct;
  onAdd?: () => void;
  href: string;
}) {
  const imgUrl = getDishImageUrl({ id: product.id, cuisine: product.cuisine, name: product.name });
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 border-b border-[var(--shc-border-brutal)]/30 last:border-0">
      <Link href={href} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 border-[var(--shc-border-brutal)]">
          <Image src={imgUrl} alt="" fill className="object-cover" sizes="48px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm truncate">{product.name}</div>
          <div className="text-xs text-muted-foreground truncate">{product.cook_name}</div>
          <div className="text-sm font-black font-mono text-primary mt-0.5">S${product.price}</div>
        </div>
      </Link>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 px-3 py-1.5 text-xs font-black text-primary border-2 border-primary rounded-lg bg-card shadow-[var(--shc-shadow-brutal-sm)] hover:bg-secondary"
          data-testid={`search-add-${product.id}`}
        >
          ADD
        </button>
      )}
    </div>
  );
}

export function SearchResultsDropdown({
  query,
  products,
  onAdd,
  onClear,
}: {
  query: string;
  products: DishCardProduct[];
  onAdd?: (productId: string) => void;
  onClear?: () => void;
}) {
  if (!query.trim()) return null;
  return (
    <div
      className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border-2 border-[var(--shc-border-brutal)] rounded-xl shadow-[var(--shc-shadow-brutal)] max-h-80 overflow-y-auto"
      data-testid="search-results-panel"
    >
      <div className="flex justify-between items-center px-3 py-2 bg-[var(--shc-bento-mint)] border-b-2 border-[var(--shc-border-brutal)] text-xs font-bold">
        <span>{products.length} result{products.length !== 1 ? 's' : ''} for “{query.trim()}”</span>
        {onClear && (
          <button type="button" onClick={onClear} className="text-primary font-bold">
            Clear
          </button>
        )}
      </div>
      {products.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground text-center">No dishes match — try another search</p>
      ) : (
        products.slice(0, 8).map((p) => (
          <SearchResultRow key={p.id} product={p} href={`/product/${p.id}`} onAdd={onAdd ? () => onAdd(p.id) : undefined} />
        ))
      )}
    </div>
  );
}

export function HeritageStoryBanner({
  title = 'Home cooks, heritage recipes',
  body = '127+ verified cooks across Singapore HDB kitchens. Collection-only — planned occasions, not delivery.',
  imageKey = 'listings' as keyof typeof BENTO_ACTION_IMAGES,
  href = '/content/trust',
}: {
  title?: string;
  body?: string;
  imageKey?: keyof typeof BENTO_ACTION_IMAGES;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="block relative h-24 overflow-hidden rounded-xl border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] shc-section-gap mb-5"
      data-testid="heritage-story-banner"
    >
      <Image src={BENTO_ACTION_IMAGES[imageKey]} alt="" fill className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-[rgba(36,24,18,0.5)] flex items-end justify-between p-4 gap-3">
        <div>
          <h2 className="text-base font-black text-white">{title}</h2>
          <p className="text-[11px] font-semibold text-white/90 mt-1 max-w-md leading-snug">{body}</p>
        </div>
        <Home className="w-7 h-7 text-white shrink-0" aria-hidden />
      </div>
    </Link>
  );
}

export function RequestDishHomeCTA({ href = '/request' }: { href?: string }) {
  return (
    <Link href={href} className="block group mt-8" data-testid="open-request-page-btn">
      <div className="relative min-h-[180px] overflow-hidden rounded-xl border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] transition-transform group-hover:-translate-y-0.5">
        <Image src={BENTO_ACTION_IMAGES.request} alt="" fill className="object-cover opacity-40 group-hover:opacity-50 transition-opacity" sizes="100vw" />
        <SHCCard className="relative z-10 m-4 bg-card/95 backdrop-blur-sm border-0 shadow-none">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-primary/10 border-2 border-[var(--shc-border-brutal)] flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary" aria-hidden />
            </span>
            <div className="flex-1">
              <span className="font-black text-base block">Request a custom dish</span>
              <span className="text-sm text-muted-foreground font-medium">
                4-step wizard — occasion, inspiration, gathering, review
              </span>
            </div>
            <span className="text-primary font-black text-lg">→</span>
          </div>
        </SHCCard>
      </div>
    </Link>
  );
}

export function ZomatoLocationBar({
  areaLabel,
  areaHint = 'COLLECT FROM',
  avatarName,
  onProfileHref = '/profile',
  onLocationHref = '/location',
}: {
  areaLabel: string;
  areaHint?: string;
  avatarName?: string;
  onProfileHref?: string;
  onLocationHref?: string;
}) {
  const avatarUri = avatarName ? getCookAvatarUrl(undefined, avatarName) : undefined;
  return (
    <div className="flex items-center justify-between gap-3 mb-3" data-testid="zomato-location-bar">
      <Link href={onLocationHref} className="flex-1 min-w-0 group" data-testid="open-location-page-btn">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{areaHint}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
          <span className="font-bold text-foreground truncate group-hover:text-primary transition-colors" data-testid="sticky-header-location">{areaLabel}</span>
          <span className="text-xs text-muted-foreground">▼</span>
        </div>
      </Link>
      <Link
        href={onProfileHref}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] shrink-0"
        data-testid="zomato-profile-avatar"
      >
        {avatarUri ? (
          <Image src={avatarUri} alt="" width={40} height={40} className="object-cover w-full h-full" />
        ) : (
          <span className="flex items-center justify-center w-full h-full bg-primary text-primary-foreground text-lg">👤</span>
        )}
      </Link>
    </div>
  );
}

export function CategoryRail({
  items,
  active,
  onSelect,
  label = "What's on your mind?",
}: {
  items: string[];
  active: string;
  onSelect: (val: string) => void;
  label?: string;
}) {
  return (
    <div data-testid="category-rail">
      <p className="text-base font-black text-foreground mb-2" data-testid="mind-section-title">{label}</p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <CategoryRailItem occasion="" label="All" active={!active} onSelect={() => onSelect('')} />
        {items.map((item) => (
          <CategoryRailItem
            key={item}
            occasion={item}
            label={item.split(' ')[0]}
            active={active === item}
            onSelect={() => onSelect(item)}
          />
        ))}
      </div>
    </div>
  );
}

export function CuisineMindRail({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (val: string) => void;
}) {
  return (
    <div data-testid="cuisine-mind-rail">
      <p className="text-base font-black text-foreground mb-2">Explore cuisines</p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {MIND_CUISINE_CATEGORIES.map((cat) => (
          <CategoryRailItem
            key={cat.id || 'all'}
            occasion={cat.id}
            label={cat.label}
            imageUrl={cat.imageUrl}
            active={active === cat.id}
            onSelect={() => onSelect(cat.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Dish card — Zomato/Swiggy bento tile ── */

export type DishCardProduct = {
  id: string;
  name: string;
  cook_name?: string;
  cook_id?: string;
  price?: number;
  cuisine?: string;
  calories?: number;
  heritage_note?: string;
  halal?: boolean;
  min_qty?: number;
  occasion_tags?: string[];
};

export function DishCard({
  product,
  featured = false,
}: {
  product: DishCardProduct;
  featured?: boolean;
}) {
  const imageUrl = getDishImageUrl({
    id: product.id,
    cuisine: product.cuisine,
    name: product.name,
  });

  return (
    <div className="block" data-testid={`dish-card-${product.id}`}>
      <SHCCard hover className="flex flex-col p-0 overflow-hidden">
        <div className={`relative w-full ${featured ? 'h-48' : 'h-44'}`}>
          <Link href={`/product/${product.id}`} className="block absolute inset-0">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 400px"
              data-testid={`dish-card-${product.id}-image`}
            />
          </Link>
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2">
            <div className="flex justify-between items-start">
              {product.halal ? (
                <span className="text-[9px] font-black bg-[var(--shc-bento-mint)] text-[var(--shc-success)] px-1.5 py-0.5 rounded border border-[var(--shc-border-brutal)]">
                  HALAL
                </span>
              ) : (
                <span />
              )}
              <ZomatoRatingPill />
            </div>
            <div className="flex items-end justify-between gap-2 bg-[rgba(36,24,18,0.42)] -mx-2 -mb-2 p-3 pointer-events-auto">
              <Link href={`/product/${product.id}`} className="flex-1 min-w-0">
                <div
                  className="font-bold text-white text-sm md:text-base leading-snug line-clamp-2"
                  data-testid={`dish-card-${product.id}-name`}
                >
                  {product.name}
                </div>
                {product.price !== undefined && (
                  <span
                    className="inline-block text-[var(--shc-accent)] text-sm font-extrabold font-mono mt-1"
                    data-testid={`dish-card-${product.id}-price`}
                  >
                    S${product.price}
                  </span>
                )}
              </Link>
              <ZomatoAddButton href={`/product/${product.id}`} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          {product.cook_name && (
            <span className="text-[11px] font-semibold text-muted-foreground truncate flex-1">{product.cook_name}</span>
          )}
          {product.cuisine && <SHCBadge variant="heritage">{product.cuisine}</SHCBadge>}
        </div>
      </SHCCard>
    </div>
  );
}

export function DishCardSkeleton() {
  return (
    <div className="shc-brutal-card overflow-hidden" aria-hidden>
      <div className="shc-skeleton h-44 w-full rounded-none" />
    </div>
  );
}

/* ── Bottom sticky CTA bar (cart / checkout / PDP) ── */

export function BottomStickyBar({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-[var(--shc-border-brutal)] shadow-[0_-4px_0_var(--shc-border-brutal)] ${className}`}
      data-testid="bottom-sticky-bar"
    >
      <div className="max-w-6xl mx-auto px-4 py-3">{children}</div>
    </div>
  );
}

export function SHCErrorBanner({ code, message }: { code?: string; message: string }) {
  return (
    <div
      className="flex gap-3 bg-red-50 border-2 border-[var(--shc-border-brutal)] rounded-lg p-4 my-3 shadow-[var(--shc-shadow-brutal-sm)]"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
      <div>
        {code && <div className="font-mono text-xs text-red-700 font-bold">{code}</div>}
        <div className="text-sm text-foreground font-medium">{message}</div>
      </div>
    </div>
  );
}

export function SHCEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <SHCCard className="text-center py-12 shc-bento-peach">
      <p className="font-bold text-foreground text-lg">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </SHCCard>
  );
}

export function SHCSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4" aria-busy="true" aria-label="Loading dishes">
      {Array.from({ length: count }).map((_, i) => (
        <DishCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SHCLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground py-8" role="status">
      <Loader2 className="w-5 h-5 animate-spin text-primary" aria-hidden />
      <span className="font-semibold">{label}</span>
    </div>
  );
}

export function AllergenAckCheckbox({
  checked,
  onChange,
  testID,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  testID?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm cursor-pointer p-4 bg-[var(--shc-surface-alt)] border-2 border-[var(--shc-border-brutal)] rounded-lg shadow-[var(--shc-shadow-brutal-sm)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testID}
        className="mt-0.5 w-4 h-4 accent-primary rounded"
        aria-required="true"
      />
      <span className="text-foreground leading-relaxed font-medium">
        I acknowledge the allergens listed for this dish. I understand this is prepared in a home kitchen and
        cross-contamination is possible.
      </span>
    </label>
  );
}

export function PriceEarningsCalc({ total, compact }: { total: number; compact?: boolean }) {
  const earnings = Math.floor(total * 0.85);
  if (compact) {
    return <span className="text-xs text-muted-foreground font-medium">Cook receives ~S${earnings}</span>;
  }
  return (
    <p className="text-sm text-[var(--shc-success)] font-semibold">
      Your cook receives S${earnings} after platform fee (85% of order total)
    </p>
  );
}

export function CreditBadge({ balance }: { balance: number }) {
  return (
    <span className="text-xs px-2.5 py-1 bg-[var(--shc-bento-mint)] text-[var(--shc-success)] rounded-full font-bold border-2 border-[var(--shc-border-brutal)]">
      {balance} Home Credits · ~S${(balance / 4).toFixed(0)} value
    </span>
  );
}

export function WalletCard({ balance, tier = 'Silver' }: { balance: number; tier?: string }) {
  return (
    <SHCCard className="shc-bento-mint">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-semibold text-muted-foreground">Home Credits</div>
          <div className="text-3xl font-black mt-1 tabular-nums font-mono">{balance}</div>
          <div className="text-xs text-muted-foreground mt-1 font-medium">
            ~S${(balance / 4).toFixed(0)} redeemable at checkout
          </div>
        </div>
        <SHCBadge variant="heritage">{tier} tier</SHCBadge>
      </div>
      <p className="text-xs text-muted-foreground mt-4 pt-3 border-t-2 border-[var(--shc-border-brutal)] font-medium">
        Earn 5% back on every collected order. Credits expire after 12 months.
      </p>
    </SHCCard>
  );
}

export function PayNowPanel({
  amount,
  reference,
  onRefChange,
  onConfirmPay,
  confirmLabel = "I've paid — confirm order",
}: {
  amount: number;
  reference: string;
  onRefChange?: (r: string) => void;
  onConfirmPay?: (ref: string) => void | Promise<void>;
  confirmLabel?: string;
}) {
  const [refValue, setRefValue] = React.useState(reference);
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    setRefValue(reference);
  }, [reference]);
  return (
    <SHCCard className="shc-bento-yellow">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-[var(--shc-border-brutal)] flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="font-bold">Pay with PayNow</div>
          <div className="text-sm text-muted-foreground font-medium">
            Transfer the exact amount, then enter your reference below
          </div>
        </div>
      </div>
      <div className="text-2xl font-black tabular-nums font-mono mb-3">S${amount.toFixed(2)}</div>
      <div className="p-4 bg-card border-2 border-[var(--shc-border-brutal)] rounded-lg font-mono text-sm space-y-1 shadow-[var(--shc-shadow-brutal-sm)]">
        <div>
          <span className="text-muted-foreground">UEN</span> 12345678X
        </div>
        <div>
          <span className="text-muted-foreground">Reference</span> {reference}
        </div>
      </div>
      <label className="block mt-4 text-sm font-bold text-foreground">Payment reference</label>
      <input
        placeholder="Enter the reference from your banking app"
        className="shc-input mt-1.5"
        value={refValue}
        onChange={(e) => {
          setRefValue(e.target.value);
          onRefChange?.(e.target.value);
        }}
        data-testid="paynow-ref-input"
      />
      {onConfirmPay && (
        <SHCButton
          className="mt-4 w-full"
          size="lg"
          disabled={confirming || !refValue.trim()}
          onClick={async () => {
            setConfirming(true);
            try {
              await onConfirmPay(refValue.trim());
            } finally {
              setConfirming(false);
            }
          }}
          data-testid="paynow-confirm"
        >
          {confirming ? 'Confirming…' : confirmLabel}
        </SHCButton>
      )}
      <p className="text-xs text-muted-foreground mt-2 font-medium">
        Your collection address is shared 2 hours before your slot, after payment is confirmed.
      </p>
    </SHCCard>
  );
}

export function CollectionSlotPicker({
  slots,
  selected,
  onSelect,
}: {
  slots: Array<{ date: string; slot: string }>;
  selected: { date: string; slot: string } | null;
  onSelect: (d: string, s: string) => void;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3 font-medium">
        Pick-up from the cook&apos;s HDB — address shared before your slot
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {slots.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2 py-4 text-center bg-secondary rounded-lg border-2 border-[var(--shc-border-brutal)] font-medium">
            No collection slots available right now. Try another dish or check back soon.
          </p>
        )}
        {slots.map((s, i) => {
          const isSelected = selected?.date === s.date && selected?.slot === s.slot;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(s.date, s.slot)}
              className={`text-left p-3 border-2 rounded-lg text-sm font-semibold transition-all ${
                isSelected
                  ? 'border-[var(--shc-border-brutal)] bg-primary text-primary-foreground shadow-[var(--shc-shadow-brutal-sm)]'
                  : 'border-[var(--shc-border-brutal)] hover:bg-secondary bg-card shadow-[var(--shc-shadow-brutal-sm)]'
              }`}
              data-testid={`slot-${i}`}
            >
              <div className="font-bold">{s.date}</div>
              <div className={isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}>{s.slot}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Gourmeat pill cart bar — docked above floating nav */
export function StickyCartBar({
  itemCount,
  countLabel,
  totalLabel,
  previewName,
  href = '/cart',
  testID = 'sticky-cart-bar',
}: {
  itemCount: number;
  countLabel: string;
  totalLabel: string;
  previewName?: string;
  href?: string;
  testID?: string;
}) {
  if (itemCount <= 0) return null;
  const badge = itemCount > 99 ? '99+' : String(itemCount);
  return (
    <Link
      href={href}
      data-testid={testID}
      className="shc-btn-primary flex items-center justify-between gap-3 w-full rounded-xl border-[3px] border-[var(--shc-border-brutal)] px-4 py-3.5 min-h-[58px] shadow-[0_8px_24px_rgba(0,0,0,0.28)] hover:brightness-105 active:translate-x-px active:translate-y-px transition-all"
      aria-label={`View cart, ${countLabel}, ${totalLabel}`}
    >
      <span className="flex items-center gap-3 min-w-0 flex-1">
        <span className="w-10 h-10 shrink-0 rounded-full bg-primary-foreground border-2 border-[var(--shc-border-brutal)] flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-primary" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block font-black text-[15px] leading-tight truncate">{countLabel}</span>
          <span className="block text-xs font-bold opacity-95 truncate">View cart · PayNow →</span>
          {previewName ? (
            <span className="block text-[11px] font-semibold opacity-85 truncate">{previewName}</span>
          ) : null}
        </span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <span className="min-w-[26px] h-[26px] flex items-center justify-center rounded-full bg-[var(--shc-accent)] text-[11px] font-black text-foreground border-2 border-[var(--shc-border-brutal)] px-1.5">
          {badge}
        </span>
        <span className="font-black text-[17px] tabular-nums">{totalLabel}</span>
        <span className="text-xl font-black" aria-hidden>›</span>
      </span>
    </Link>
  );
}

/** @deprecated Use StickyCartBar in mobile bottom chrome */
export function FloatingCartPill(props: {
  itemCount: number;
  totalLabel: string;
  href?: string;
  testID?: string;
}) {
  const countLabel = props.itemCount === 1 ? '1 item' : `${props.itemCount} items`;
  return (
    <StickyCartBar
      itemCount={props.itemCount}
      countLabel={countLabel}
      totalLabel={props.totalLabel}
      href={props.href}
      testID={props.testID}
    />
  );
}

/** Principle 5: browse first, sign in at checkout */
export function GuestBrowseBar({
  onSignInClick,
  testID = 'guest-browse-bar',
}: {
  onSignInClick?: () => void;
  testID?: string;
}) {
  const ctaClass =
    'shc-btn-primary inline-flex items-center justify-center min-w-[96px] px-4 py-2.5 text-sm font-black border-2 border-[var(--shc-border-brutal)] rounded-lg shadow-[var(--shc-shadow-brutal-sm)] hover:shadow-[var(--shc-shadow-brutal)] active:translate-x-px active:translate-y-px transition-all shrink-0';

  return (
    <div
      data-testid={testID}
      className="flex items-center justify-between gap-3 bg-[var(--shc-bento-yellow)] border-2 border-[var(--shc-border-brutal)] rounded-xl px-4 py-4 mb-[var(--shc-section-gap)] min-h-[60px] shadow-[var(--shc-shadow-brutal)]"
    >
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Guest browsing</p>
        <p className="text-sm font-extrabold text-foreground leading-snug mt-0.5">
          Sign in to checkout &amp; track orders
        </p>
      </div>
      {onSignInClick ? (
        <button type="button" onClick={onSignInClick} className={ctaClass}>
          Sign in
        </button>
      ) : (
        <Link href="/login" className={ctaClass}>
          Sign in
        </Link>
      )}
    </div>
  );
}

/** Principle 4: personalized rail titles */
export function PersonalizedSectionHeader({
  title,
  subtitle,
  testID,
}: {
  title: string;
  subtitle?: string;
  testID?: string;
}) {
  return (
    <div data-testid={testID} className="mb-1">
      <h3 className="shc-display text-base font-black text-foreground tracking-tight">{title}</h3>
      {subtitle ? <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">{subtitle}</p> : null}
    </div>
  );
}

export function TrustStrip() {
  const items = [
    { label: '127+ verified cooks', sub: 'Across 28 areas', Icon: Users },
    { label: '4,892 meals', sub: 'Served this month', Icon: UtensilsCrossed },
    { label: 'HDB collection', sub: 'No delivery — planned occasions', Icon: Home },
    { label: 'Allergen disclosure', sub: 'Mandatory before checkout', Icon: ShieldCheck },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="text-center p-3 bg-card border-2 border-[var(--shc-border-brutal)] rounded-xl shadow-[var(--shc-shadow-brutal-sm)]"
        >
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-[var(--shc-bento-mint)] border-2 border-[var(--shc-border-brutal)] flex items-center justify-center shadow-[var(--shc-shadow-brutal-sm)]" aria-hidden>
            <item.Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="font-bold text-foreground text-xs">{item.label}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}

/** dev.to: live order status timeline */
export function OrderTimeline({ status, live = false, testID = 'order-timeline' }: { status: string; live?: boolean; testID?: string }) {
  const current = getOrderTimelineIndex(status);
  const cancelled = status === 'cancelled' || status === 'disputed';
  return (
    <div data-testid={testID} className="space-y-3">
      {live && current >= 0 && !cancelled && (
        <p className="text-[11px] font-extrabold text-[var(--shc-success)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--shc-success)]" /> Live updates
        </p>
      )}
      {COLLECTION_ORDER_TIMELINE.map((step, i) => {
        const done = current > i;
        const active = current === i;
        return (
          <div key={step.id} className="flex gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 border-[var(--shc-border-brutal)] flex items-center justify-center text-[10px] font-black shrink-0 ${
                done ? 'bg-primary text-primary-foreground' : active ? 'bg-[var(--shc-bento-peach)] text-primary' : 'bg-card text-muted-foreground'
              }`}
            >
              {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <div>
              <p className={`text-sm ${active ? 'font-black' : 'font-bold'} text-foreground`}>{step.label}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">{step.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ActiveOrderBanner({
  statusLabel,
  dishName,
  collectionLabel,
  href,
  testID = 'active-order-banner',
}: {
  statusLabel: string;
  dishName?: string;
  collectionLabel?: string;
  href: string;
  testID?: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testID}
      className="flex items-center justify-between gap-3 bg-[var(--shc-bento-mint)] border-2 border-[var(--shc-border-brutal)] rounded-lg px-4 py-3 mb-[var(--shc-section-gap)] shadow-[var(--shc-shadow-brutal-sm)] hover:opacity-95"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold text-[var(--shc-success)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--shc-success)]" /> Order in progress
        </p>
        <p className="text-sm font-black text-foreground mt-1 truncate">{statusLabel}</p>
        {dishName ? (
          <p className="text-[11px] font-semibold text-muted-foreground truncate">
            {dishName}
            {collectionLabel ? ` · ${collectionLabel}` : ''}
          </p>
        ) : null}
      </div>
      <span className="text-xs font-black text-primary shrink-0">Track →</span>
    </Link>
  );
}

export function FavoriteButton({
  active,
  onClick,
  testID = 'favorite-btn',
}: {
  active: boolean;
  onClick: () => void;
  testID?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testID}
      aria-label={active ? 'Remove from saved dishes' : 'Save dish'}
      className={`w-9 h-9 rounded-full border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] text-lg leading-none ${
        active ? 'bg-[var(--shc-bento-peach)] text-primary' : 'bg-card text-muted-foreground'
      }`}
    >
      {active ? '♥' : '♡'}
    </button>
  );
}

export function CalorieBadge({ calories }: { calories: number }) {
  const level = calories < 400 ? 'light' : calories < 550 ? 'moderate' : 'hearty';
  const dotClass =
    level === 'light' ? 'shc-cal-light' : level === 'moderate' ? 'shc-cal-moderate' : 'shc-cal-hearty';
  const label = level === 'light' ? 'Light' : level === 'moderate' ? 'Moderate' : 'Hearty';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border-2 border-[var(--shc-border-brutal)] bg-card">
      <span className={`w-2.5 h-2.5 rounded-full border border-[var(--shc-border-brutal)] ${dotClass}`} aria-hidden />
      {label} · ~{calories} cal
    </span>
  );
}

/* ── Gourmeat (Orbix Studio) web components ── */

export function gourmeatDiscountPercent(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % 100;
  return 10 + (hash % 16);
}

export function GourmeatHomeHeader({
  headline = 'Hungry? Order & Eat.',
  locationLabel = 'Katong, Singapore',
  locationHint = 'Collect from',
  avatarUri,
  profileHref = '/profile',
  locationHref = '/location',
}: {
  headline?: string;
  locationLabel?: string;
  locationHint?: string;
  avatarUri?: string;
  profileHref?: string;
  locationHref?: string;
  onLocationPress?: () => void;
}) {
  return (
    <div className="mb-4" data-testid="gourmeat-home-header">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight flex-1">
          {headline}
        </h1>
        <Link
          href={profileHref}
          className="w-11 h-11 rounded-full overflow-hidden bg-secondary shadow-[var(--shc-shadow-soft)] shrink-0"
          data-testid="gourmeat-profile-avatar"
        >
          {avatarUri ? (
            <Image src={avatarUri} alt="" width={44} height={44} className="object-cover w-full h-full" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-primary font-bold">SG</span>
          )}
        </Link>
      </div>
      <Link
        href={locationHref}
        className="inline-flex items-center gap-1.5 bg-card rounded-full px-3 py-1.5 shadow-[var(--shc-shadow-soft)] hover:ring-2 hover:ring-primary/20 transition-shadow"
        data-testid="gourmeat-location-chip"
      >
        <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden />
        <span className="text-[11px] font-semibold text-muted-foreground">{locationHint}</span>
        <span className="text-xs font-bold text-foreground">{locationLabel}</span>
        <span className="text-[10px] text-muted-foreground">▼</span>
      </Link>
    </div>
  );
}

export function GourmeatCategoryRow({
  items,
  active,
  onSelect,
  testID = 'gourmeat-category-row',
}: {
  items: { id: string; label: string; imageUrl?: string }[];
  active: string;
  onSelect: (id: string) => void;
  testID?: string;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" data-testid={testID}>
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <button
            key={item.id || 'all'}
            type="button"
            onClick={() => onSelect(item.id)}
            data-testid={`gourmeat-cat-${item.id || 'all'}`}
            className="flex flex-col items-center w-[72px] shrink-0"
          >
            <span
              className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shadow-[var(--shc-shadow-soft)] ${
                selected ? 'ring-2 ring-primary bg-secondary' : 'bg-[var(--shc-surface-alt)]'
              }`}
            >
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" width={64} height={64} className="object-cover w-full h-full" />
              ) : (
                <UtensilsCrossed className={`w-6 h-6 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
            </span>
            <span className={`mt-1.5 text-[11px] text-center truncate w-full ${selected ? 'font-bold text-primary' : 'font-medium text-muted-foreground'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function GourmeatDishCard({ product }: { product: DishCardProduct }) {
  const imageUrl = getDishImageUrl({ id: product.id, cuisine: product.cuisine, name: product.name });
  const discount = gourmeatDiscountPercent(product.id);
  return (
    <div className="block" data-testid={`dish-card-${product.id}`}>
      <div className="bg-card rounded-2xl overflow-hidden shadow-[var(--shc-shadow-card)]">
        <div className="relative h-36">
          <Link href={`/product/${product.id}`} className="block absolute inset-0">
            <Image src={imageUrl} alt={product.name} fill className="object-cover" sizes="50vw" data-testid={`dish-card-${product.id}-image`} />
          </Link>
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-1 rounded-md">
            {discount}% OFF
          </span>
        </div>
        <div className="p-3">
          <Link href={`/product/${product.id}`}>
            <div className="font-bold text-sm text-foreground truncate" data-testid={`dish-card-${product.id}-name`}>{product.name}</div>
          </Link>
          {product.cook_name && (
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">{product.cook_name}</div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div>
              {product.price !== undefined && (
                <span className="text-primary font-extrabold text-sm" data-testid={`dish-card-${product.id}-price`}>S${product.price}</span>
              )}
              <div className="flex items-center gap-0.5 mt-0.5">
                <Star className="w-3 h-3 text-accent fill-accent" aria-hidden />
                <span className="text-[10px] font-semibold text-muted-foreground">4.8</span>
              </div>
            </div>
            <Link
              href={`/product/${product.id}`}
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg leading-none hover:opacity-90"
              data-testid={`dish-card-${product.id}-add`}
            >
              +
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GourmeatScreenHeader({
  title,
  subtitle,
  backHref,
  backLabel = '← Back',
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link href={backHref} className="text-sm font-bold text-primary mb-2 inline-block">
          {backLabel}
        </Link>
      )}
      <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm text-muted-foreground mt-1 font-medium">{subtitle}</p> : null}
    </div>
  );
}

export function GourmeatOrderRow({
  orderId,
  dishName,
  productId,
  statusLabel,
  collectionDate,
  collectionSlot,
  total,
  href,
  testID,
}: {
  orderId: string;
  dishName?: string;
  productId?: string;
  statusLabel: string;
  collectionDate?: string;
  collectionSlot?: string;
  total?: number | string;
  href: string;
  testID?: string;
}) {
  const imageUrl = getDishImageUrl({ id: productId, name: dishName });
  return (
    <Link
      href={href}
      data-testid={testID ?? `order-row-${orderId}`}
      className="block bg-card rounded-2xl shadow-[var(--shc-shadow-card)] overflow-hidden hover:opacity-95 transition-opacity"
    >
      <div className="flex gap-3 p-3">
        <div className="relative w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden">
          <Image src={imageUrl} alt={dishName || 'Order'} fill className="object-cover" sizes="72px" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-sm text-foreground truncate">{dishName || 'Order'}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">#{orderId}</div>
          <span className="inline-block mt-1.5 text-[10px] font-bold text-primary bg-secondary px-2 py-0.5 rounded-md">
            {statusLabel}
          </span>
          {(collectionDate || collectionSlot) && (
            <div className="text-[11px] text-muted-foreground mt-1">
              {collectionDate} {collectionSlot}
            </div>
          )}
          {total != null && (
            <div className="text-sm font-extrabold text-primary mt-1 tabular-nums">S${total}</div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function GourmeatPayButton({
  label = 'Pay Now',
  amount,
  onClick,
  disabled,
  loading,
  testID = 'gourmeat-pay-btn',
}: {
  label?: string;
  amount?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testID}
      className="w-full flex items-center justify-center gap-2 bg-[var(--shc-gourmeat-pay)] text-white font-extrabold text-base py-4 rounded-xl shadow-[var(--shc-shadow-soft)] disabled:opacity-50 transition-opacity hover:opacity-90"
    >
      {loading ? 'Processing…' : label}
      {amount && !loading ? <span>{amount}</span> : null}
    </button>
  );
}