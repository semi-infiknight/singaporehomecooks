'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
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
  X,
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
  LAUNCH_PLATFORM_COUNTERS,
  type PlatformCounters,
} from '@shc/utils';
import { formatTrustStripCopy, useShcI18n, getLocalizedPromo, getDiscoverHomeCopy, getRequestDishCopy, getWebLayoutCopy, getCheckoutScreenCopy, getWalletCardCopy, cookListingsWizardMorphOnStepEnter, cookListingsWizardMorphFromTransition, type CookListingsWizardCtaLabels } from '@shc/i18n';
import {
  pushTray,
  popTray,
  currentTray,
  TRAY_HEIGHT_PX,
  computeMorphingLabelSegments,
  morphingLabelTarget,
  shouldReduceMotion,
  registerSharedDishLayout,
  getSharedDishLayout,
  clearSharedDishLayout,
  getSyncHeroTransformForDish,
  HERO_RECT_WEB,
  tabSlideDirection,
  wizardCtaMorphOnStepEnter,
  wizardCtaMorphFromTransition,
  milestoneStorageKey,
  shouldShowMilestone,
  type MorphSegment,
  type TrayFrame,
  type TrayHeight,
  type MilestoneId,
} from '@shc/ui/family-values-core';

export type { TrayFrame, TrayHeight };

type ButtonVariant = 'primary' | 'outline' | 'accent' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export function SHCButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  appearance = 'default',
  testID,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Gourmeat customer skin — soft border, no brutal offset */
  appearance?: 'default' | 'customer';
  testID?: string;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const brutalBase =
    'inline-flex items-center justify-center gap-2 font-bold rounded-lg border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:translate-x-px active:translate-y-px active:shadow-none';
  const customerBase =
    'inline-flex items-center justify-center gap-2 font-extrabold rounded-xl border shadow-[var(--shc-shadow-soft)] transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:brightness-105';
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };
  const brutalVariants: Record<ButtonVariant, string> = {
    primary: 'shc-btn-primary',
    outline: 'border-2 border-[var(--shc-border-brutal)] text-primary hover:bg-secondary bg-card',
    accent: 'bg-[var(--shc-accent)] hover:opacity-90 text-[var(--shc-text)]',
    ghost: 'border-transparent shadow-none text-muted-foreground hover:bg-secondary',
  };
  const customerVariants: Record<ButtonVariant, string> = {
    primary: 'border-transparent bg-primary text-primary-foreground hover:bg-[var(--shc-primary-dark)]',
    outline: 'border-border text-primary hover:bg-secondary bg-card',
    accent: 'border-border bg-[var(--shc-accent)] hover:opacity-90 text-[var(--shc-text)]',
    ghost: 'border-transparent shadow-none text-muted-foreground hover:bg-secondary',
  };
  const base = appearance === 'customer' ? customerBase : brutalBase;
  const variants = appearance === 'customer' ? customerVariants : brutalVariants;
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
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean; variant?: 'default' | 'customer' }) {
  const base =
    variant === 'customer'
      ? `bg-card border border-border rounded-2xl p-5 shadow-[var(--shc-shadow-card)]${
          hover ? ' transition-shadow hover:brightness-[0.99]' : ''
        }`
      : `bg-card border-2 border-[var(--shc-border-brutal)] rounded-xl p-5 shadow-[var(--shc-shadow)]${
          hover ? ' transition-shadow hover:shadow-[var(--shc-shadow-lg)]' : ''
        }`;
  return (
    <div className={`${base} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SHCBadge({
  children,
  variant = 'default',
  soft = false,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'heritage';
  /** Gourmeat customer skin — 1px border */
  soft?: boolean;
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
      className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${
        soft ? 'border border-border' : 'border-2 border-[var(--shc-border-brutal)]'
      } ${styles[variant]}`}
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

/** Gourmeat customer discover chrome — soft elevation per brand.md */
const gourmeatDiscoverBorder = 'border border-border';
const gourmeatDiscoverShadow = 'shadow-[var(--shc-shadow-soft)]';
const gourmeatDiscoverCardShadow = 'shadow-[var(--shc-shadow-card)]';

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
        className={`w-16 h-16 rounded-full overflow-hidden border ${gourmeatDiscoverShadow} ${
          active ? 'border-primary ring-2 ring-primary/30' : 'border-border'
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
  const { locale } = useShcI18n();
  const icons: Record<string, LucideIcon> = {
    'promo-raya': Leaf,
    'promo-credits': Wallet,
    'promo-family': Users,
    'promo-paynow': CreditCard,
  };
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" data-testid="promo-rail">
      {DEFAULT_PROMOS.map((promo, i) => {
        const localized = getLocalizedPromo(locale, promo.id);
        const title = localized?.title ?? promo.title;
        const subtitle = localized?.subtitle ?? promo.subtitle;
        const badge = localized?.badge ?? promo.badge;
        return (
        <button
          key={promo.id}
          type="button"
          onClick={() => onPromoClick?.(promo.id)}
          data-testid={`promo-card-${promo.id}`}
          className={`shc-promo-enter relative shrink-0 w-[260px] h-[100px] rounded-xl overflow-hidden ${gourmeatDiscoverBorder} ${gourmeatDiscoverShadow} text-left`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <Image src={PROMO_BANNER_IMAGES[promo.imageKey]} alt="" fill className="object-cover" sizes="260px" />
          <div className="relative z-10 flex flex-col justify-between h-full p-3 bg-[rgba(36,24,18,0.45)]">
            <div className="flex justify-between items-start">
              {icons[promo.id] && (
                <span
                  className={`w-7 h-7 rounded-full bg-card ${gourmeatDiscoverBorder} flex items-center justify-center ${gourmeatDiscoverShadow}`}
                  aria-hidden
                >
                  {(() => {
                    const PromoIcon = icons[promo.id];
                    return <PromoIcon className="w-3.5 h-3.5 text-primary" />;
                  })()}
                </span>
              )}
              {badge && (
                <span className={`text-[10px] font-black bg-[var(--shc-accent)] text-foreground px-2 py-0.5 rounded ${gourmeatDiscoverBorder}`}>
                  {badge}
                </span>
              )}
            </div>
            <div>
              <div className="font-black text-white text-sm">{title}</div>
              <div className="text-[11px] font-semibold text-white/90 mt-0.5">{subtitle}</div>
            </div>
          </div>
        </button>
      );
      })}
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
  testID = 'filter-chip-row',
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
  testID?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 -mx-1 px-1 scrollbar-hide" data-testid={testID}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onChipClick(chip.id)}
          data-testid={chip.testID ?? `filter-chip-${chip.id}`}
          className={`shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-full border text-xs ${gourmeatDiscoverShadow} transition-colors ${
            chip.active
              ? 'border-primary bg-[var(--shc-bento-peach)] text-primary font-extrabold'
              : 'border-border bg-card text-foreground font-semibold hover:bg-secondary'
          }`}
        >
          {chip.imageUrl ? (
            <Image src={chip.imageUrl} alt="" width={20} height={20} className="rounded-full border border-border object-cover" />
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
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold text-[var(--shc-success)] bg-[var(--shc-bento-mint)] px-1.5 py-0.5 rounded ${gourmeatDiscoverBorder}`}>
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
          <div className="relative w-[72px] h-[72px] shrink-0 rounded-lg overflow-hidden border border-border">
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
  const { locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
  return (
    <Link
      href={href}
      className={`shrink-0 text-xs font-black text-primary bg-card px-3.5 py-1.5 rounded-lg border border-primary ${gourmeatDiscoverShadow} hover:brightness-105 transition-shadow`}
      data-testid="dish-add-btn"
    >
      {homeCopy.dishAdd}
    </Link>
  );
}

export function DishRowCard({
  product,
  offerLabel,
  offerText,
  href,
  onPress,
}: {
  product: DishCardProduct;
  offerLabel?: string;
  offerText?: string;
  href?: string;
  onPress?: () => void;
}) {
  const { locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
  const imageUrl =
    (product as { image_url?: string }).image_url ||
    getDishImageUrl({ id: product.id, cuisine: product.cuisine, name: product.name });
  const slot = getCollectionSlotLabel(product.id);
  const className =
    `shrink-0 w-[300px] flex flex-col ${gourmeatDiscoverBorder} rounded-xl overflow-hidden bg-card ${gourmeatDiscoverCardShadow} hover:brightness-[0.99] transition-shadow text-left`;
  const inner = (
    <>
      <div className="flex">
        <div className="relative w-[110px] h-[118px] shrink-0">
          <Image src={imageUrl} alt={product.name} fill className="object-cover" sizes="110px" />
          {offerLabel && (
            <span className={`absolute top-1.5 left-1.5 text-[9px] font-black bg-[var(--shc-accent)] text-foreground px-1.5 py-0.5 rounded ${gourmeatDiscoverBorder}`}>
              {offerLabel}
            </span>
          )}
        </div>
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <div className="font-extrabold text-sm leading-snug line-clamp-2">{product.name}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {product.cuisine || homeCopy.fallbackCuisine} · {product.cook_name}
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
            {homeCopy.hdbCollect}
          </div>
        </div>
      </div>
      {(offerText || offerLabel) && (
        <div className="border-t border-border bg-[var(--shc-bento-yellow)] px-3 py-1.5">
          <p className="text-[10px] font-extrabold text-primary truncate">{offerText || homeCopy.heritageOffer(offerLabel || '')}</p>
        </div>
      )}
    </>
  );
  const cardTestID = `dish-row-${product.id}`;
  const productHref = href || `/product/${product.id}`;
  if (onPress) {
    return (
      <button
        type="button"
        onClick={(e) => {
          captureSharedDishLayout(product.id, cardTestID, e);
          onPress();
        }}
        className={className}
        data-testid={cardTestID}
      >
        {inner}
      </button>
    );
  }
  return (
    <SharedDishProductLink dishId={product.id} cardTestID={cardTestID} href={productHref} className={className}>
      <div data-testid={cardTestID}>{inner}</div>
    </SharedDishProductLink>
  );
}

export function DishRowRail({
  title,
  products,
  onDishPress,
  testID = 'dish-row-rail',
}: {
  title?: string;
  products: DishCardProduct[];
  onDishPress?: (id: string) => void;
  testID?: string;
}) {
  const { locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
  const railTitle = title ?? homeCopy.topPicks;
  if (products.length === 0) return null;
  return (
    <div data-testid={testID}>
      {railTitle ? <h2 className="text-base font-black text-foreground mb-2">{railTitle}</h2> : null}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {products.map((p, i) => (
          <DishRowCard
            key={p.id}
            product={p}
            href={onDishPress ? undefined : `/product/${p.id}`}
            onPress={onDishPress ? () => onDishPress(p.id) : undefined}
            offerLabel={i === 0 ? homeCopy.dishRowPopular : i === 1 ? '20% OFF' : undefined}
            offerText={i === 0 ? homeCopy.dishRowOfferTop : i === 1 ? homeCopy.dishRowOfferDiscount : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/** Parity alias for mobile SHCZomatoDishRowRail */
export const ZomatoDishRowRail = DishRowRail;

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
  inline = false,
}: {
  query: string;
  products: DishCardProduct[];
  onAdd?: (productId: string) => void;
  onClear?: () => void;
  /** Inline panel below search (discover) vs absolute dropdown (header) */
  inline?: boolean;
}) {
  const { locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
  if (!query.trim()) return null;
  return (
    <div
      className={`bg-card border border-border rounded-xl shadow-[var(--shc-shadow-card)] max-h-80 overflow-y-auto ${
        inline ? 'mt-2 mb-2' : 'absolute left-0 right-0 top-full mt-1 z-50'
      }`}
      data-testid="search-results-panel"
    >
      <div className="flex justify-between items-center px-3 py-2 bg-[var(--shc-bento-mint)] border-b border-border text-xs font-bold">
        <span>{homeCopy.searchResultsHeader(products.length, query.trim())}</span>
        {onClear && (
          <button type="button" onClick={onClear} className="text-primary font-bold">
            {homeCopy.searchClear}
          </button>
        )}
      </div>
      {products.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground text-center">{homeCopy.searchNoMatch}</p>
      ) : (
        products.slice(0, 8).map((p) => (
          <SearchResultRow key={p.id} product={p} href={`/product/${p.id}`} onAdd={onAdd ? () => onAdd(p.id) : undefined} />
        ))
      )}
    </div>
  );
}

/** Discover inline search panel — parity with mobile SHCSearchResultsPanel */
export function SearchResultsPanel({
  query,
  dishes,
  onDishPress,
  onAddPress,
  onClose,
}: {
  query: string;
  dishes: DishCardProduct[];
  onDishPress?: (id: string) => void;
  onAddPress?: (id: string) => void;
  onClose?: () => void;
}) {
  return (
    <SearchResultsDropdown
      query={query}
      products={dishes}
      onAdd={onAddPress}
      onClear={onClose}
      inline
    />
  );
}

export function HeritageStoryBanner({
  title,
  body,
  imageKey = 'listings' as keyof typeof BENTO_ACTION_IMAGES,
  href = '/content/trust',
}: {
  title?: string;
  body?: string;
  imageKey?: keyof typeof BENTO_ACTION_IMAGES;
  href?: string;
}) {
  const { locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
  const bannerTitle = title ?? homeCopy.heritageTitle;
  const bannerBody = body ?? homeCopy.heritageBody;
  return (
    <Link
      href={href}
      className={`block relative h-24 overflow-hidden rounded-xl ${gourmeatDiscoverBorder} ${gourmeatDiscoverShadow} shc-section-gap mb-5`}
      data-testid="heritage-story-banner"
    >
      <Image src={BENTO_ACTION_IMAGES[imageKey]} alt="" fill className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-[rgba(36,24,18,0.5)] flex items-end justify-between p-4 gap-3">
        <div>
          <h2 className="text-base font-black text-white">{bannerTitle}</h2>
          <p className="text-[11px] font-semibold text-white/90 mt-1 max-w-md leading-snug">{bannerBody}</p>
        </div>
        <Home className="w-7 h-7 text-white shrink-0" aria-hidden />
      </div>
    </Link>
  );
}

export function RequestDishHomeCTA({ href = '/request' }: { href?: string }) {
  const { locale } = useShcI18n();
  const requestCopy = getRequestDishCopy(locale);
  return (
    <Link href={href} className="block group mt-8" data-testid="open-request-page-btn">
      <div className={`relative min-h-[180px] overflow-hidden rounded-xl ${gourmeatDiscoverBorder} ${gourmeatDiscoverShadow} transition-transform group-hover:-translate-y-0.5`}>
        <Image src={BENTO_ACTION_IMAGES.request} alt="" fill className="object-cover opacity-40 group-hover:opacity-50 transition-opacity" sizes="100vw" />
        <SHCCard className="relative z-10 m-4 bg-card/95 backdrop-blur-sm border-0 shadow-none">
          <div className="flex items-center gap-3">
            <span className={`w-12 h-12 rounded-full bg-primary/10 ${gourmeatDiscoverBorder} flex items-center justify-center`}>
              <ChefHat className="w-6 h-6 text-primary" aria-hidden />
            </span>
            <div className="flex-1">
              <span className="font-black text-base block">{requestCopy.homeCtaTitle}</span>
              <span className="text-sm text-muted-foreground font-medium">{requestCopy.homeCtaSubtitle}</span>
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
  areaHint,
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
  const { locale } = useShcI18n();
  const layout = getWebLayoutCopy(locale);
  const hint = areaHint ?? layout.collectFromUpper;
  const avatarUri = avatarName ? getCookAvatarUrl(undefined, avatarName) : undefined;
  return (
    <div className="flex items-center justify-between gap-3 mb-3" data-testid="zomato-location-bar">
      <Link href={onLocationHref} className="flex-1 min-w-0 group" data-testid="open-location-page-btn">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{hint}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
          <span className="font-bold text-foreground truncate group-hover:text-primary transition-colors" data-testid="sticky-header-location">{areaLabel}</span>
          <span className="text-xs text-muted-foreground">▼</span>
        </div>
      </Link>
      <Link
        href={onProfileHref}
        className="w-10 h-10 rounded-full overflow-hidden border border-border shadow-[var(--shc-shadow-soft)] shrink-0"
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
  label,
}: {
  items: string[];
  active: string;
  onSelect: (val: string) => void;
  label?: string;
}) {
  const { locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
  const sectionLabel = label ?? homeCopy.whatsOnYourMind;
  return (
    <div data-testid="category-rail">
      <p className="text-base font-black text-foreground mb-2" data-testid="mind-section-title">{sectionLabel}</p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <CategoryRailItem occasion="" label={homeCopy.categoryAll} active={!active} onSelect={() => onSelect('')} />
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
  const { locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
  return (
    <div data-testid="cuisine-mind-rail">
      <p className="text-base font-black text-foreground mb-2">{homeCopy.exploreCuisines}</p>
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
  rating?: number;
  image_url?: string;
};

export function DishCard({
  product,
  featured = false,
}: {
  product: DishCardProduct;
  featured?: boolean;
}) {
  const { locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
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
                <span className={`text-[9px] font-black bg-[var(--shc-bento-mint)] text-[var(--shc-success)] px-1.5 py-0.5 rounded ${gourmeatDiscoverBorder}`}>
                  {homeCopy.halalBadge}
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
  appearance = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  appearance?: 'default' | 'customer';
}) {
  const chrome =
    appearance === 'customer'
      ? 'bg-card border-t border-border shadow-[var(--shc-shadow-soft)]'
      : 'bg-card border-t-2 border-[var(--shc-border-brutal)] shadow-[0_-4px_0_var(--shc-border-brutal)]';
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${chrome} ${className}`} data-testid="bottom-sticky-bar">
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
    <SHCCard className="text-center py-12 shc-bento-peach" variant="customer">
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
  const { locale } = useShcI18n();
  const checkoutCopy = getCheckoutScreenCopy(locale);
  return (
    <label className="flex items-start gap-3 text-sm cursor-pointer p-4 bg-[var(--shc-surface-alt)] border border-border rounded-lg shadow-[var(--shc-shadow-soft)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testID}
        className="mt-0.5 w-4 h-4 accent-primary rounded"
        aria-required="true"
      />
      <span className="text-foreground leading-relaxed font-medium">{checkoutCopy.allergenAckLabel}</span>
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
  const { locale } = useShcI18n();
  const walletCopy = getWalletCardCopy(locale);
  return (
    <span
      className={`text-xs px-2.5 py-1 bg-[var(--shc-bento-mint)] text-[var(--shc-success)] rounded-full font-bold border border-border shadow-[var(--shc-shadow-soft)]`}
      data-testid="credit-badge"
    >
      {walletCopy.creditBadgeLine(balance)}
    </span>
  );
}

export function WalletCard({ balance, tier = 'Silver' }: { balance: number; tier?: string }) {
  const { locale } = useShcI18n();
  const walletCopy = getWalletCardCopy(locale);
  return (
    <SHCCard className="shc-bento-mint" variant="customer" data-testid="wallet-card">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-semibold text-muted-foreground">{walletCopy.homeCredits}</div>
          <div className="text-3xl font-black mt-1 tabular-nums font-mono">{balance}</div>
          <div className="text-xs text-muted-foreground mt-1 font-medium">{walletCopy.redeemableAtCheckout(balance)}</div>
        </div>
        <SHCBadge variant="heritage" soft>
          {walletCopy.tierBadge(tier)}
        </SHCBadge>
      </div>
      <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border font-medium">{walletCopy.earnFootnote}</p>
    </SHCCard>
  );
}

export function PayNowPanel({
  amount,
  reference,
  onRefChange,
  onConfirmPay,
  confirmLabel,
}: {
  amount: number;
  reference: string;
  onRefChange?: (r: string) => void;
  onConfirmPay?: (ref: string) => void | Promise<void>;
  confirmLabel?: string;
}) {
  const { locale } = useShcI18n();
  const checkoutCopy = getCheckoutScreenCopy(locale);
  const [refValue, setRefValue] = React.useState(reference);
  const [confirming, setConfirming] = React.useState(false);
  const confirmCta = confirmLabel ?? checkoutCopy.paynowConfirmPaid;

  React.useEffect(() => {
    setRefValue(reference);
  }, [reference]);
  return (
    <SHCCard className="shc-bento-yellow" variant="customer">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-full bg-primary/10 ${gourmeatDiscoverBorder} flex items-center justify-center`}>
          <CheckCircle2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="font-bold">{checkoutCopy.paynowPanelTitle}</div>
          <div className="text-sm text-muted-foreground font-medium">{checkoutCopy.paynowPanelBody}</div>
        </div>
      </div>
      <div className="text-2xl font-black tabular-nums font-mono mb-3">S${amount.toFixed(2)}</div>
      <div className={`p-4 bg-card ${gourmeatDiscoverBorder} rounded-lg font-mono text-sm space-y-1 ${gourmeatDiscoverShadow}`}>
        <div>
          <span className="text-muted-foreground">{checkoutCopy.paynowUenLabel}</span> 12345678X
        </div>
        <div>
          <span className="text-muted-foreground">{checkoutCopy.paynowReferenceLabel}</span> {reference}
        </div>
      </div>
      <label className="block mt-4 text-sm font-bold text-foreground">{checkoutCopy.paynowRefLabel}</label>
      <input
        placeholder={checkoutCopy.paynowRefPlaceholder}
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
          appearance="customer"
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
          {confirming ? checkoutCopy.paynowConfirming : confirmCta}
        </SHCButton>
      )}
      <p className="text-xs text-muted-foreground mt-2 font-medium">{checkoutCopy.paynowPanelFootnote}</p>
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
  const { locale } = useShcI18n();
  const checkoutCopy = getCheckoutScreenCopy(locale);
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3 font-medium">{checkoutCopy.collectionSlotHint}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {slots.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2 py-4 text-center bg-secondary rounded-lg border border-border font-medium">
            {checkoutCopy.collectionSlotEmpty}
          </p>
        )}
        {slots.map((s, i) => {
          const isSelected = selected?.date === s.date && selected?.slot === s.slot;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(s.date, s.slot)}
              className={`text-left p-3 border rounded-lg text-sm font-semibold transition-all shadow-[var(--shc-shadow-soft)] ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-secondary bg-card'
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
  const { locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
  const ctaClass =
    'shc-btn-primary inline-flex items-center justify-center min-w-[96px] px-4 py-2.5 text-sm font-black border-2 border-[var(--shc-border-brutal)] rounded-lg shadow-[var(--shc-shadow-brutal-sm)] hover:shadow-[var(--shc-shadow-brutal)] active:translate-x-px active:translate-y-px transition-all shrink-0';

  return (
    <div
      data-testid={testID}
      className="flex items-center justify-between gap-3 bg-[var(--shc-bento-yellow)] border-2 border-[var(--shc-border-brutal)] rounded-xl px-4 py-4 mb-[var(--shc-section-gap)] min-h-[60px] shadow-[var(--shc-shadow-brutal)]"
    >
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{homeCopy.guestBrowseTitle}</p>
        <p className="text-sm font-extrabold text-foreground leading-snug mt-0.5">{homeCopy.guestBrowseBody}</p>
      </div>
      {onSignInClick ? (
        <button type="button" onClick={onSignInClick} className={ctaClass}>
          {homeCopy.signInBtn}
        </button>
      ) : (
        <Link href="/login" className={ctaClass}>
          {homeCopy.signInBtn}
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

export function TrustStrip({ counters }: { counters?: PlatformCounters }) {
  const { locale } = useShcI18n();
  const data = counters ?? LAUNCH_PLATFORM_COUNTERS;
  const copy = formatTrustStripCopy(locale, data);
  const items = [
    { label: copy.cooksLabel, sub: copy.cooksSub, Icon: Users, accent: 'bg-[var(--shc-bento-mint)]' },
    { label: copy.mealsLabel, sub: copy.mealsSub, Icon: UtensilsCrossed, accent: 'bg-[var(--shc-bento-peach)]' },
    { label: copy.collectionLabel, sub: copy.collectionSub, Icon: Home, accent: 'bg-[var(--shc-bento-yellow)]' },
    { label: copy.allergenLabel, sub: copy.allergenSub, Icon: ShieldCheck, accent: 'bg-[var(--shc-bento-mint)]' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="text-center p-3 bg-card border-2 border-[var(--shc-border-brutal)] rounded-xl shadow-[var(--shc-shadow-brutal-sm)]"
        >
          <div className={`w-8 h-8 mx-auto mb-2 rounded-full ${item.accent} border-2 border-[var(--shc-border-brutal)] flex items-center justify-center shadow-[var(--shc-shadow-brutal-sm)]`} aria-hidden>
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
export function OrderTimeline({
  status,
  live = false,
  testID = 'order-timeline',
  steps,
  liveLabel = 'Live updates',
  cancelledLabel,
}: {
  status: string;
  live?: boolean;
  testID?: string;
  steps?: Array<{ id: string; label: string; detail: string }>;
  liveLabel?: string;
  cancelledLabel?: string;
}) {
  const current = getOrderTimelineIndex(status);
  const cancelled = status === 'cancelled' || status === 'disputed';
  const timeline = steps ?? COLLECTION_ORDER_TIMELINE;
  return (
    <div data-testid={testID} className="space-y-3">
      {live && current >= 0 && !cancelled && (
        <p className="text-[11px] font-extrabold text-[var(--shc-success)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--shc-success)]" /> {liveLabel}
        </p>
      )}
      {timeline.map((step, i) => {
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
  inProgressLabel = 'Order in progress',
  trackLabel = 'Track →',
}: {
  statusLabel: string;
  dishName?: string;
  collectionLabel?: string;
  href: string;
  testID?: string;
  inProgressLabel?: string;
  trackLabel?: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testID}
      className="flex items-center justify-between gap-3 bg-[var(--shc-bento-mint)] border-2 border-[var(--shc-border-brutal)] rounded-lg px-4 py-3 mb-[var(--shc-section-gap)] shadow-[var(--shc-shadow-brutal-sm)] hover:opacity-95"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold text-[var(--shc-success)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--shc-success)]" /> {inProgressLabel}
        </p>
        <p className="text-sm font-black text-foreground mt-1 truncate">{statusLabel}</p>
        {dishName ? (
          <p className="text-[11px] font-semibold text-muted-foreground truncate">
            {dishName}
            {collectionLabel ? ` · ${collectionLabel}` : ''}
          </p>
        ) : null}
      </div>
      <span className="text-xs font-black text-primary shrink-0">{trackLabel}</span>
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
  const { locale } = useShcI18n();
  const layout = getWebLayoutCopy(locale);
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testID}
      aria-label={active ? layout.removeSavedA11y : layout.saveDishA11y}
      className={`w-9 h-9 rounded-full border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] text-lg leading-none ${
        active ? 'bg-[var(--shc-bento-peach)] text-primary' : 'bg-card text-muted-foreground'
      }`}
    >
      {active ? '♥' : '♡'}
    </button>
  );
}

export function CalorieBadge({ calories }: { calories: number }) {
  const { locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
  const level = calories < 400 ? 'light' : calories < 550 ? 'moderate' : 'hearty';
  const dotClass =
    level === 'light' ? 'shc-cal-light' : level === 'moderate' ? 'shc-cal-moderate' : 'shc-cal-hearty';
  const label =
    level === 'light' ? homeCopy.calorieLight : level === 'moderate' ? homeCopy.calorieModerate : homeCopy.calorieHearty;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border border-border bg-card`}>
      <span className={`w-2.5 h-2.5 rounded-full border border-border ${dotClass}`} aria-hidden />
      {label} · {homeCopy.calorieApprox(calories)}
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
    <div className="mb-3" data-testid="gourmeat-home-header">
      <div className="flex items-start justify-between gap-2 mb-4">
        <h1 className="text-[26px] md:text-3xl font-extrabold text-foreground tracking-[-0.5px] leading-8 flex-1">
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
            <span className="flex items-center justify-center w-full h-full text-primary font-bold text-lg">👤</span>
          )}
        </Link>
      </div>
      <Link
        href={locationHref}
        className="inline-flex items-center gap-1 bg-card rounded-full px-3 py-1.5 shadow-[var(--shc-shadow-soft)]"
        data-testid="gourmeat-location-chip"
      >
        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
        <span className="text-[11px] font-semibold text-muted-foreground">{locationHint}</span>
        <span className="text-xs font-bold text-foreground ml-1 truncate max-w-[200px]">{locationLabel}</span>
        <span className="text-[10px] text-muted-foreground/70 ml-1">▼</span>
      </Link>
    </div>
  );
}

export function GourmeatSearchBar({
  value,
  onChange,
  placeholder,
  onFilterPress,
  testID = 'search-input',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  testID?: string;
}) {
  const { locale } = useShcI18n();
  const homeCopy = getDiscoverHomeCopy(locale);
  const searchPlaceholder = placeholder ?? homeCopy.searchPlaceholder;
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex-1 flex items-center bg-card rounded-full px-4 py-3 shadow-[var(--shc-shadow-soft)] min-w-0">
        <Search className="w-[18px] h-[18px] text-muted-foreground/70 shrink-0" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={searchPlaceholder}
          data-testid={testID}
          className="flex-1 ml-3 text-sm font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/70 min-w-0"
        />
      </div>
      {onFilterPress ? (
        <button
          type="button"
          onClick={onFilterPress}
          className="w-11 h-11 shrink-0 rounded-xl bg-card shadow-[var(--shc-shadow-soft)] flex items-center justify-center"
          data-testid="gourmeat-filter-btn"
          aria-label={homeCopy.filterA11y}
        >
          <Settings2 className="w-5 h-5 text-foreground" />
        </button>
      ) : null}
    </div>
  );
}

export function GourmeatSectionTitle({
  title,
  actionLabel,
  onAction,
  actionHref,
  testID,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  testID?: string;
}) {
  const action =
    actionLabel && actionHref ? (
      <Link href={actionHref} className="text-[13px] font-semibold text-primary">
        {actionLabel}
      </Link>
    ) : actionLabel && onAction ? (
      <button type="button" onClick={onAction} className="text-[13px] font-semibold text-primary">
        {actionLabel}
      </button>
    ) : null;

  return (
    <div className="flex items-center justify-between mb-2 mt-4" data-testid={testID}>
      <h2 className="text-lg font-extrabold text-foreground tracking-[-0.3px]">{title}</h2>
      {action}
    </div>
  );
}

export function GourmeatAddButton({
  onClick,
  testID,
}: {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  testID?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testID}
      className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold leading-5 hover:bg-[var(--shc-primary-dark)] active:scale-95 transition-transform"
    >
      +
    </button>
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
                selected ? 'border-2 border-primary bg-secondary' : 'bg-[var(--shc-surface-alt)]'
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

function captureSharedDishLayout(dishId: string, cardTestID: string, e: React.MouseEvent<HTMLElement>) {
  const card = (e.currentTarget as HTMLElement).closest(`[data-testid="${cardTestID}"]`);
  const img =
    card?.querySelector(`[data-testid="${cardTestID}-image"]`) ??
    card?.querySelector('img[data-testid$="-image"]') ??
    card?.querySelector('img');
  if (img) {
    const r = img.getBoundingClientRect();
    registerSharedDishLayout(dishId, { x: r.left, y: r.top, w: r.width, h: r.height });
  }
}

export function SharedDishProductLink({
  dishId,
  cardTestID,
  href,
  children,
  className,
}: {
  dishId: string;
  cardTestID: string;
  href: string;
  children: Parameters<typeof Link>[0]['children'];
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => captureSharedDishLayout(dishId, cardTestID, e)}
    >
      {children}
    </Link>
  );
}

export function GourmeatDishCard({
  product,
  onAddPress,
  isFavorite,
  onFavoritePress,
  rating,
}: {
  product: DishCardProduct;
  onAddPress?: () => void;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
  rating?: number;
}) {
  const imageUrl = getDishImageUrl({ id: product.id, cuisine: product.cuisine, name: product.name });
  const discount = gourmeatDiscountPercent(product.id);
  const displayRating = rating ?? (product.rating != null ? Number(product.rating) : 4.8);
  const cardTestID = `dish-card-${product.id}`;
  const productHref = `/product/${product.id}`;
  const handleAddClick = (e: React.MouseEvent<HTMLElement>) => {
    captureSharedDishLayout(product.id, cardTestID, e);
    onAddPress?.();
  };

  return (
    <div className="flex flex-col min-w-0" data-testid={cardTestID}>
      <div className="bg-card rounded-2xl overflow-hidden shadow-[var(--shc-shadow-card)] flex-1 flex flex-col relative">
        <SharedDishProductLink dishId={product.id} cardTestID={cardTestID} href={productHref} className="block flex-1">
          <div className="relative">
            <div className="relative h-[140px] w-full">
              <SHCSharedDishImageWeb
                dishId={product.id}
                src={imageUrl}
                alt={product.name}
                className="absolute inset-0"
                testID={`${cardTestID}-image`}
              />
            </div>
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
              <span className="bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-1 rounded-lg pointer-events-auto" data-testid={`${cardTestID}-discount`}>
                {discount}% OFF
              </span>
              {onFavoritePress ? (
                <div
                  className="bg-white/90 rounded-2xl pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <FavoriteButton
                    active={!!isFavorite}
                    onClick={onFavoritePress}
                    testID={`${cardTestID}-favorite`}
                  />
                </div>
              ) : null}
            </div>
          </div>
          <div className="p-3 pb-3 pr-12">
            <div className="font-bold text-sm text-foreground truncate mb-0.5" data-testid={`${cardTestID}-name`}>
              {product.name}
            </div>
            {product.cook_name ? (
              <div className="text-[11px] text-muted-foreground truncate mb-1" data-testid={`${cardTestID}-cook`}>
                {product.cook_name}
              </div>
            ) : null}
            {product.price !== undefined && (
              <div className="text-[15px] font-extrabold text-primary" data-testid={`${cardTestID}-price`}>
                S${product.price}
              </div>
            )}
            <div className="flex items-center gap-0.5 mt-0.5">
              <span className="text-[10px] text-accent" aria-hidden>
                ★
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">{displayRating.toFixed(1)}</span>
            </div>
          </div>
        </SharedDishProductLink>
        <div className="absolute bottom-3 right-3 z-10">
          <GourmeatAddButton onClick={handleAddClick} testID={`${cardTestID}-add`} />
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
  onPress,
  actions,
  testID,
}: {
  orderId: string;
  dishName?: string;
  productId?: string;
  statusLabel: string;
  collectionDate?: string;
  collectionSlot?: string;
  total?: number | string;
  href?: string;
  onPress?: () => void;
  actions?: React.ReactNode;
  testID?: string;
}) {
  const imageUrl = getDishImageUrl({ id: productId, name: dishName });
  const card = (
    <div className="bg-card rounded-2xl shadow-[var(--shc-shadow-card)] overflow-hidden">
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
    </div>
  );

  const row = (
    <div data-testid={testID ?? `order-row-${orderId}`} className="mb-2">
      {href ? (
        <Link href={href} className="block hover:opacity-95 transition-opacity">
          {card}
        </Link>
      ) : onPress ? (
        <button type="button" onClick={onPress} className="block w-full text-left hover:opacity-95 transition-opacity">
          {card}
        </button>
      ) : (
        card
      )}
      {actions ? <div className="px-3 pb-3 -mt-1 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );

  return row;
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

/* ── Cook app (Gourmeat) web parity ── */

export function GourmeatCookHeader({
  title,
  subtitle,
  badges,
  testID,
}: {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  testID?: string;
}) {
  return (
    <div className="mb-4" data-testid={testID}>
      <h1 className="text-[28px] font-extrabold text-foreground tracking-[-0.5px]">{title}</h1>
      {subtitle ? <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p> : null}
      {badges ? <div className="flex flex-wrap gap-2 mt-3">{badges}</div> : null}
    </div>
  );
}

export function GourmeatPrimaryButton({
  label,
  onClick,
  disabled,
  loading,
  variant = 'primary',
  testID,
  className = '',
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  testID?: string;
  className?: string;
}) {
  const outline = variant === 'outline';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testID}
      className={`inline-flex items-center justify-center px-3 py-2 rounded-xl text-sm font-extrabold transition-opacity disabled:opacity-50 ${
        outline
          ? 'bg-card border border-border text-foreground'
          : 'bg-primary text-primary-foreground hover:bg-[var(--shc-primary-dark)]'
      } ${className}`}
    >
      {loading ? '…' : label}
    </button>
  );
}

export function GourmeatCard({
  children,
  className = '',
  testID,
}: {
  children: React.ReactNode;
  className?: string;
  testID?: string;
}) {
  return (
    <div
      data-testid={testID}
      className={`bg-card rounded-2xl p-4 shadow-[var(--shc-shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

export function GourmeatEmptyState({
  title,
  body,
  ctaLabel,
  onCta,
  testID,
}: {
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
  testID?: string;
}) {
  return (
    <div className="text-center py-6" data-testid={testID}>
      <p className="font-extrabold text-foreground">{title}</p>
      {body ? <p className="text-sm text-muted-foreground mt-1">{body}</p> : null}
      {ctaLabel && onCta ? (
        <GourmeatPrimaryButton label={ctaLabel} onClick={onCta} className="mt-4" />
      ) : null}
    </div>
  );
}

export function VisualBentoTile({
  imageUrl,
  label,
  badge,
  href,
  onClick,
  variant = 'default',
  testID,
}: {
  imageUrl: string;
  label: string;
  badge?: string | number;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'bento-mint' | 'bento-peach' | 'bento-yellow';
  testID?: string;
}) {
  const bg =
    variant === 'bento-mint'
      ? 'bg-[var(--shc-bento-mint)]'
      : variant === 'bento-peach'
        ? 'bg-[var(--shc-bento-peach)]'
        : variant === 'bento-yellow'
          ? 'bg-[var(--shc-bento-yellow)]'
          : 'bg-card';
  const inner = (
    <div className={`relative h-28 rounded-2xl overflow-hidden border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] ${bg}`}>
      <Image src={imageUrl} alt="" fill className="object-cover opacity-80" sizes="50vw" />
      <div className="absolute inset-0 bg-[rgba(36,24,18,0.35)] flex flex-col justify-end p-3">
        {badge != null && (
          <span className="self-start text-[10px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded mb-1">
            {badge}
          </span>
        )}
        <span className="text-sm font-extrabold text-white">{label}</span>
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} data-testid={testID} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} data-testid={testID} className="block w-full text-left">
      {inner}
    </button>
  );
}

/* ── Family Values web tray — canonical module at lib/shc-tray-web.tsx ── */
export {
  SHCTrayProviderWeb,
  SHCTrayWeb,
  SHCTrayActionWeb,
  useSHCTrayWeb,
  type TrayContentInputWeb,
} from '../../lib/shc-tray-web';

/** Wizard step pane with enter transition (web parity with SHCWizardPane). */
export function SHCWizardPaneWeb({
  stepKey,
  children,
}: {
  stepKey: string | number;
  children: React.ReactNode;
}) {
  const reduce = shouldReduceMotion();
  if (reduce) {
    return <div data-step={stepKey}>{children}</div>;
  }
  return (
    <div
      key={String(stepKey)}
      className="shc-wizard-pane"
      data-step={stepKey}
      style={{ animation: 'shcWizardEnter 280ms cubic-bezier(0.33, 1, 0.68, 1) both' }}
    >
      {children}
    </div>
  );
}

export function SHCWizardProgressWeb({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div className="flex gap-1.5 mb-4" data-testid="wizard-progress" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-primary' : 'bg-border'}`}
        />
      ))}
    </div>
  );
}

export function ListingWizardMorphCtaWeb({
  step,
  total = 4,
  editing = false,
  onPress,
  disabled,
  testID,
  showChevron = true,
  ctaLabels,
}: {
  step: number;
  total?: number;
  editing?: boolean;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  showChevron?: boolean;
  ctaLabels?: CookListingsWizardCtaLabels;
}) {
  const prevStepRef = React.useRef(step);
  const prevEditingRef = React.useRef(editing);
  const [morph, setMorph] = React.useState(() =>
    ctaLabels
      ? cookListingsWizardMorphOnStepEnter(step, total, editing, ctaLabels)
      : wizardCtaMorphOnStepEnter(step, total, editing)
  );

  React.useEffect(() => {
    if (prevStepRef.current !== step) {
      setMorph(
        ctaLabels
          ? cookListingsWizardMorphFromTransition(prevStepRef.current, step, total, editing, ctaLabels)
          : wizardCtaMorphFromTransition(prevStepRef.current, step, total, editing)
      );
      prevStepRef.current = step;
      prevEditingRef.current = editing;
      return;
    }
    if (step >= total && prevEditingRef.current !== editing) {
      setMorph({
        from: ctaLabels?.review ?? 'Review',
        to: editing ? ctaLabels?.saveChanges ?? 'Save changes' : ctaLabels?.publish ?? 'Publish',
      });
      prevEditingRef.current = editing;
    }
  }, [step, total, editing, ctaLabels]);

  const { from, to } = morph;
  return (
    <SHCButton onClick={onPress} disabled={disabled} testID={testID} className="w-full">
      <span className="inline-flex items-center justify-center gap-1.5">
        <SHCMorphingLabelWeb from={from} to={to} testID={`${testID}-morph`} />
        {showChevron && step < total ? <span className="font-extrabold" aria-hidden>›</span> : null}
      </span>
    </SHCButton>
  );
}

export function useMilestoneCelebrationWeb(id: MilestoneId, userId: string) {
  const [show, setShow] = React.useState(false);
  const key = milestoneStorageKey(id, userId);

  const triggerIfFirst = React.useCallback(async () => {
    if (typeof window === 'undefined' || !userId) return false;
    const alreadySeen = localStorage.getItem(key) === '1';
    if (!shouldShowMilestone(id, userId, alreadySeen ? { [key]: true } : {})) return false;
    localStorage.setItem(key, '1');
    setShow(true);
    return true;
  }, [id, key, userId]);

  const dismiss = React.useCallback(() => setShow(false), []);

  return { show, triggerIfFirst, dismiss };
}

export function PhotoTipsTrayContentWeb({ tips, intro }: { tips: string[]; intro?: string }) {
  return (
    <div className="space-y-3" data-testid="photo-tips-tray">
      {intro ? <p className="text-sm font-medium text-muted-foreground">{intro}</p> : null}
      <ul className="space-y-2 text-sm">
        {tips.map((t, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary font-bold">•</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SHCMorphingLabelWeb({
  from,
  to,
  className = '',
  testID = 'shc-morph-label',
}: {
  from: string;
  to: string;
  className?: string;
  testID?: string;
}) {
  const reduce = shouldReduceMotion();
  const segments = React.useMemo(() => computeMorphingLabelSegments(from, to), [from, to]);
  const morphKey = `${from}→${to}`;

  if (reduce) {
    return (
      <span className={`font-extrabold ${className}`} data-testid={testID}>
        {morphingLabelTarget(segments)}
      </span>
    );
  }

  return (
    <span className={`shc-morph-label text-primary-foreground ${className}`} data-testid={testID} key={morphKey}>
      {segments.map((seg: MorphSegment, i: number) => (
        <span
          key={`${seg.kind}-${seg.text}-${i}`}
          className={seg.kind === 'out' ? 'shc-morph-out' : seg.kind === 'in' ? 'shc-morph-in' : undefined}
        >
          {seg.text}
        </span>
      ))}
    </span>
  );
}

export function SHCCelebrationWeb({
  visible,
  message,
  onDone,
  testID = 'shc-celebration',
}: {
  visible: boolean;
  message: string;
  onDone?: () => void;
  testID?: string;
}) {
  const reduce = shouldReduceMotion();
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    if (!visible) {
      setExiting(false);
      return;
    }
    const holdMs = reduce ? 1200 : 2200;
    const fadeMs = reduce ? 0 : 400;
    const t = window.setTimeout(() => {
      if (reduce) {
        onDone?.();
        return;
      }
      setExiting(true);
      window.setTimeout(() => onDone?.(), fadeMs);
    }, holdMs);
    return () => window.clearTimeout(t);
  }, [visible, onDone, reduce]);

  if (!visible) return null;

  return (
    <div
      className={`fixed left-4 right-4 top-[30%] z-[300] pointer-events-none flex flex-col items-center bg-card/95 backdrop-blur-sm border-2 border-[var(--shc-border-brutal)] rounded-2xl p-6 shadow-[var(--shc-shadow-brutal)] ${
        exiting ? 'shc-celebration-exit' : reduce ? '' : 'shc-celebration-enter'
      }`}
      data-testid={testID}
      role="status"
      aria-live="polite"
    >
      <span className="text-4xl mb-2" aria-hidden>
        🎉
      </span>
      <p className="text-[17px] font-extrabold text-center text-foreground">{message}</p>
    </div>
  );
}

type TabDirectionWebContextValue = {
  tabIndex: number;
  prevIndex: number;
  notifyTabChange: (routeKey: string) => void;
};

const TabDirectionWebContext = React.createContext<TabDirectionWebContextValue | null>(null);

export function TabDirectionProviderWeb({
  children,
  routeOrder,
}: {
  children: React.ReactNode;
  routeOrder: string[];
}) {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [prevIndex, setPrevIndex] = React.useState(0);

  const notifyTabChange = React.useCallback(
    (routeKey: string) => {
      const next = routeOrder.indexOf(routeKey);
      if (next < 0) return;
      setTabIndex((current) => {
        setPrevIndex(current);
        return next;
      });
    },
    [routeOrder]
  );

  const value = React.useMemo(
    () => ({ tabIndex, prevIndex, notifyTabChange }),
    [tabIndex, prevIndex, notifyTabChange]
  );

  return <TabDirectionWebContext.Provider value={value}>{children}</TabDirectionWebContext.Provider>;
}

export function useTabDirectionWeb(): TabDirectionWebContextValue {
  const ctx = React.useContext(TabDirectionWebContext);
  if (!ctx) {
    return { tabIndex: 0, prevIndex: 0, notifyTabChange: () => {} };
  }
  return ctx;
}

export function SHCDirectionalTabSceneWeb({
  tabIndex,
  prevIndex,
  children,
  testID,
}: {
  tabIndex: number;
  prevIndex: number;
  children: React.ReactNode;
  testID?: string;
}) {
  const reduce = shouldReduceMotion();
  const direction = tabSlideDirection(prevIndex, tabIndex);
  const animClass =
    reduce || direction === 'none'
      ? ''
      : direction === 'left'
        ? 'shc-tab-slide-from-right'
        : 'shc-tab-slide-from-left';

  return (
    <div className={`shc-tab-scene flex-1 min-h-0 ${animClass}`} key={tabIndex} data-testid={testID}>
      {children}
    </div>
  );
}

export function SHCSharedDishImageWeb({
  dishId,
  src,
  alt = '',
  hero = false,
  className = '',
  testID,
}: {
  dishId: string;
  src: string;
  alt?: string;
  hero?: boolean;
  className?: string;
  testID?: string;
}) {
  const reduce = shouldReduceMotion();
  const [morphStyle, setMorphStyle] = React.useState<React.CSSProperties>({});
  const heroWrapRef = React.useRef<HTMLDivElement>(null);
  const morphStarted = React.useRef(false);
  const [heroRect, setHeroRect] = React.useState(HERO_RECT_WEB);

  React.useLayoutEffect(() => {
    if (!hero) return;
    const el = heroWrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      setHeroRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    }
  }, [hero]);

  React.useEffect(() => {
    if (!hero || reduce) return;
    morphStarted.current = false;
    let cancelled = false;
    const tryMorph = (attempt: number) => {
      if (cancelled || morphStarted.current) return;
      const sync = getSyncHeroTransformForDish(dishId, heroRect);
      if (!sync.hasOrigin) {
        if (attempt < 12) requestAnimationFrame(() => tryMorph(attempt + 1));
        return;
      }
      morphStarted.current = true;
      setMorphStyle({
        transform: `translate(${sync.translateX}px, ${sync.translateY}px) scale(${sync.initialScale})`,
        transition: 'none',
      });
      requestAnimationFrame(() => {
        if (cancelled) return;
        setMorphStyle({
          transform: 'translate(0px, 0px) scale(1)',
          transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
        });
        clearSharedDishLayout(dishId);
      });
    };
    tryMorph(0);
    return () => {
      cancelled = true;
    };
  }, [dishId, hero, heroRect, reduce]);

  const cacheCardLayout = (el: HTMLImageElement) => {
    if (hero) return;
    const r = el.getBoundingClientRect();
    registerSharedDishLayout(dishId, { x: r.left, y: r.top, w: r.width, h: r.height });
  };

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-testid={testID || `shared-dish-${dishId}`}
      style={hero ? morphStyle : undefined}
      onLoad={(e) => cacheCardLayout(e.currentTarget)}
      className={`object-cover w-full h-full ${hero && !morphStyle.transform ? 'shc-hero-image-scale' : ''} ${className}`}
    />
  );

  if (hero) {
    return (
      <div ref={heroWrapRef} className={`absolute inset-0 ${className}`}>
        {img}
      </div>
    );
  }

  return img;
}