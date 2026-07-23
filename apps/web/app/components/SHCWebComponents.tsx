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
  Receipt,
  Search,
  Settings2,
  User,
  Bell,
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
  getCookKitchenHeroUrl,
  COLLECTION_ORDER_TIMELINE,
  getOrderTimelineIndex,
  getOrderStatusLabel,
  MIND_CUISINE_CATEGORIES,
  getCollectionSlotLabel,
  VIRTUAL_DISH_LIST_ROW_HEIGHT,
} from '@shc/utils';
import { ContainedVirtualRowList } from './ContainedVirtualList';
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
import { tiffinMealStatusChip, type TiffinOrderCardStatus } from '@shc/ui';

export type { TiffinOrderCardStatus };

export type { TrayFrame, TrayHeight };

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
    <div className="shc-title-block">
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
    <div className="shc-header-gap">
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
  | 'request'
  | 'listings'
  | 'earnings'
  | 'compliance';

const WEB_BENTO_ICONS: Record<WebBentoIconKey, LucideIcon> = {
  cart: ShoppingBag,
  orders: Package,
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
        className={`text-[10px] font-bold mt-2 text-center leading-[14px] ${
          active ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export type PromoRailItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  badge?: string;
  iconKey?: 'discover' | 'orders' | 'cart' | 'profile' | 'people' | 'home';
};

const PROMO_RAIL_ICONS: Record<string, LucideIcon> = {
  'promo-tiffin': Home,
  'promo-raya': Leaf,
  'promo-request': ChefHat,
  'promo-family': Users,
  'promo-paynow': CreditCard,
  discover: Home,
  people: Users,
  home: Home,
};

export function PromoRail({
  promos,
  onPromoClick,
  onPromoPress,
  testID = 'promo-rail',
}: {
  promos?: PromoRailItem[];
  onPromoClick?: (id: string) => void;
  onPromoPress?: (id: string) => void;
  testID?: string;
}) {
  const handlePress = onPromoPress ?? onPromoClick;
  const items: PromoRailItem[] =
    promos ??
    DEFAULT_PROMOS.map((promo) => ({
      id: promo.id,
      title: promo.title,
      subtitle: promo.subtitle,
      imageUrl: PROMO_BANNER_IMAGES[promo.imageKey],
      badge: promo.badge,
    }));
  return (
    <div className="shc-section-stack flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" data-testid={testID}>
      {items.map((promo, i) => (
        <button
          key={promo.id}
          type="button"
          onClick={() => handlePress?.(promo.id)}
          data-testid={`promo-card-${promo.id}`}
          className="shc-promo-enter relative shrink-0 w-[260px] h-[100px] rounded-xl overflow-hidden border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] text-left"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <Image src={promo.imageUrl} alt="" fill className="object-cover" sizes="260px" />
          <div className="relative z-10 flex flex-col justify-between h-full p-3 bg-[rgba(36,24,18,0.45)]">
            <div className="flex justify-between items-start">
              {(PROMO_RAIL_ICONS[promo.id] || (promo.iconKey && PROMO_RAIL_ICONS[promo.iconKey])) && (
                <span
                  className="w-7 h-7 rounded-full bg-card border-2 border-[var(--shc-border-brutal)] flex items-center justify-center shadow-[var(--shc-shadow-brutal-sm)]"
                  aria-hidden
                >
                  {(() => {
                    const PromoIcon = PROMO_RAIL_ICONS[promo.id] || PROMO_RAIL_ICONS[promo.iconKey!];
                    return PromoIcon ? <PromoIcon className="w-3.5 h-3.5 text-primary" /> : null;
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

export function MindSectionTitle({
  children,
  testID = 'mind-section-title',
}: {
  children: React.ReactNode;
  testID?: string;
}) {
  return (
    <h2 className="text-base font-black text-foreground shc-title-block" data-testid={testID}>
      {children}
    </h2>
  );
}

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
          className={`shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-full border-2 text-xs shadow-[var(--shc-shadow-brutal-sm)] transition-colors ${
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
  href,
  onPress,
}: {
  product: DishCardProduct;
  offerLabel?: string;
  offerText?: string;
  href?: string;
  onPress?: () => void;
}) {
  const imageUrl =
    (product as { image_url?: string }).image_url ||
    getDishImageUrl({ id: product.id, cuisine: product.cuisine, name: product.name });
  const slot = getCollectionSlotLabel(product.id);
  const className =
    'shrink-0 w-[300px] flex flex-col border-2 border-[var(--shc-border-brutal)] rounded-xl overflow-hidden bg-card shadow-[var(--shc-shadow-brutal-sm)] hover:shadow-[var(--shc-shadow-brutal)] transition-shadow text-left';
  const inner = (
    <>
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
  title = 'Top picks for you',
  products,
  onDishPress,
  testID = 'dish-row-rail',
}: {
  title?: string;
  products: DishCardProduct[];
  onDishPress?: (id: string) => void;
  testID?: string;
}) {
  if (products.length === 0) return null;
  return (
    <div data-testid={testID}>
      {title ? <h2 className="text-base font-black text-foreground mb-2">{title}</h2> : null}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {products.map((p, i) => (
          <DishRowCard
            key={p.id}
            product={p}
            href={onDishPress ? undefined : `/product/${p.id}`}
            onPress={onDishPress ? () => onDishPress(p.id) : undefined}
            offerLabel={undefined}
            offerText={undefined}
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
    <div className="shc-section-stack" data-testid={testID}>
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
  if (!query.trim()) return null;
  return (
    <div
      className={`bg-card border-2 border-[var(--shc-border-brutal)] rounded-xl shadow-[var(--shc-shadow-brutal)] overflow-hidden ${
        inline ? 'mt-2 mb-2' : 'absolute left-0 right-0 top-full mt-1 z-50'
      }`}
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
        <p className="p-4 text-sm text-muted-foreground text-center">No dishes match — try another occasion or filter</p>
      ) : (
        <ContainedVirtualRowList
          items={products}
          getKey={(p) => p.id}
          rowHeight={VIRTUAL_DISH_LIST_ROW_HEIGHT}
          maxHeightClassName="max-h-72 overflow-y-auto"
          testID="search-results-virtual-list"
          renderItem={(p) => (
            <SearchResultRow product={p} href={`/product/${p.id}`} onAdd={onAdd ? () => onAdd(p.id) : undefined} />
          )}
        />
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


export function RequestDishHomeCTA({ href = '/request' }: { href?: string }) {
  return (
    <Link href={href} className="block group shc-section-stack" data-testid="open-request-page-btn">
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
    <div className="rounded-2xl overflow-hidden bg-card shadow-sm border border-border/40" aria-hidden data-testid="skeleton-dish-card">
      <div className="shc-skeleton h-[140px] w-full rounded-none" />
      <div className="p-2 space-y-2">
        <div className="shc-skeleton h-3.5 w-[78%]" />
        <div className="shc-skeleton h-2.5 w-[55%]" />
        <div className="shc-skeleton h-3.5 w-[36%] mt-1" />
      </div>
    </div>
  );
}

export function SHCSkeletonCookingSoonCard() {
  return (
    <div
      className="shrink-0 w-[260px] rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card p-4 space-y-2"
      aria-hidden
      data-testid="skeleton-cooking-soon-card"
    >
      <div className="shc-skeleton h-2.5 w-[42%]" />
      <div className="shc-skeleton h-4 w-[88%]" />
      <div className="shc-skeleton h-3 w-[70%]" />
      <div className="shc-skeleton h-3.5 w-[32%] mt-1" />
      <div className="shc-skeleton h-2.5 w-[55%]" />
    </div>
  );
}

export function SHCSkeletonCookingSoonRail({ count = 3 }: { count?: number }) {
  return (
    <div
      className="mt-3 flex gap-3 overflow-x-auto pb-1"
      aria-busy="true"
      aria-label="Loading batches"
      data-testid="skeleton-cooking-soon-rail"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SHCSkeletonCookingSoonCard key={i} />
      ))}
    </div>
  );
}

export function SHCSkeletonKitchenRow() {
  return (
    <div
      className="flex gap-4 p-4 mb-2 rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card"
      aria-hidden
      data-testid="skeleton-kitchen-row"
    >
      <div className="shc-skeleton h-16 w-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="shc-skeleton h-3.5 w-[70%]" />
        <div className="shc-skeleton h-2.5 w-[45%]" />
        <div className="shc-skeleton h-2.5 w-[55%]" />
      </div>
    </div>
  );
}

export function SHCSkeletonKitchenList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-1" aria-busy="true" aria-label="Loading kitchens" data-testid="skeleton-kitchen-list">
      {Array.from({ length: count }).map((_, i) => (
        <SHCSkeletonKitchenRow key={i} />
      ))}
    </div>
  );
}

export function SHCSkeletonOrderCard() {
  return (
    <div
      className="rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card p-4 space-y-2.5 shadow-[var(--shc-shadow-brutal-sm)]"
      aria-hidden
      data-testid="skeleton-order-card"
    >
      <div className="flex items-center justify-between">
        <div className="shc-skeleton h-5 w-[72px] rounded-md" />
        <div className="shc-skeleton h-3 w-16" />
      </div>
      <div className="shc-skeleton h-4 w-[55%]" />
      <div className="shc-skeleton h-3 w-[40%]" />
      <div className="shc-skeleton h-2.5 w-[80%]" />
      <div className="shc-skeleton h-2.5 w-[65%]" />
      <div className="flex gap-2 mt-1">
        <div className="shc-skeleton h-9 w-24 rounded-xl" />
        <div className="shc-skeleton h-9 w-16 rounded-xl" />
      </div>
    </div>
  );
}

export function SHCSkeletonOrderRow() {
  return (
    <div
      className="flex gap-3 p-2 mb-2 rounded-2xl bg-card shadow-sm"
      aria-hidden
      data-testid="skeleton-order-row"
    >
      <div className="shc-skeleton h-[72px] w-[72px] rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="shc-skeleton h-3.5 w-[70%]" />
        <div className="shc-skeleton h-2.5 w-[40%]" />
        <div className="shc-skeleton h-5 w-[72px] rounded-md" />
        <div className="shc-skeleton h-2.5 w-[55%]" />
      </div>
    </div>
  );
}

export function SHCSkeletonOrderList({
  count = 3,
  variant = 'card',
}: {
  count?: number;
  variant?: 'card' | 'row';
}) {
  const Item = variant === 'row' ? SHCSkeletonOrderRow : SHCSkeletonOrderCard;
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading orders" data-testid="skeleton-order-list">
      {Array.from({ length: count }).map((_, i) => (
        <Item key={i} />
      ))}
    </div>
  );
}

export function SHCSkeletonOrdersDayScreen() {
  return (
    <div aria-busy="true" aria-label="Loading orders" data-testid="skeleton-orders-day-screen">
      <div className="flex gap-2 overflow-x-hidden pb-3 mb-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="shc-skeleton shrink-0 w-12 h-16 rounded-xl" />
        ))}
      </div>
      <div className="shc-skeleton h-4 w-14 rounded-md mb-3" />
      <SHCSkeletonOrderList count={3} variant="card" />
    </div>
  );
}

export function SHCSkeletonAccountScreen() {
  return (
    <div aria-busy="true" aria-label="Loading account" data-testid="skeleton-account-screen">
      <div className="shc-skeleton h-7 w-[48%] rounded-lg mb-2" />
      <div className="shc-skeleton h-3.5 w-[62%] rounded-md mb-6" />
      <div className="shc-skeleton h-28 w-full rounded-2xl mb-4" />
      <SHCSkeletonList count={4} rowHeight={52} />
    </div>
  );
}

export function AuthSessionGate({
  loading,
  user,
  guest,
  children,
  skeleton,
  testID,
}: {
  loading: boolean;
  user: unknown;
  guest: React.ReactNode;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  testID?: string;
}) {
  if (loading) {
    return (
      <div data-testid={testID ?? 'auth-session-loading'} aria-busy="true" aria-label="Loading">
        {skeleton ?? <SHCSkeletonAccountScreen />}
      </div>
    );
  }
  if (!user) {
    return <div data-testid={testID ?? 'auth-session-guest'}>{guest}</div>;
  }
  return <>{children}</>;
}

export function SHCSkeletonList({ count = 4, rowHeight = 56 }: { count?: number; rowHeight?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading" data-testid="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shc-skeleton w-full rounded-xl" style={{ height: rowHeight }} />
      ))}
    </div>
  );
}

/* ── Bottom sticky CTA bar (cart / checkout / PDP) ── */

export function BottomStickyBar({
  children,
  className = '',
  offsetTabBar = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** When false, bar sits flush above safe area (checkout / PDP — tab bar hidden). */
  offsetTabBar?: boolean;
}) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[70] bg-card border-t-2 border-[var(--shc-border-brutal)] shadow-[0_-4px_0_var(--shc-border-brutal)] pb-[max(env(safe-area-inset-bottom),8px)] ${className}`}
      data-testid="bottom-sticky-bar"
    >
      <div className={`max-w-6xl mx-auto px-4 py-3 md:mb-0 ${offsetTabBar ? 'mb-14' : ''}`}>{children}</div>
    </div>
  );
}

export function SHCErrorBanner({ code, message }: { code?: string; message: string }) {
  return (
    <div
      className="flex gap-3 bg-red-50 border-2 border-[var(--shc-border-brutal)] rounded-lg p-4 shc-inset-stack shadow-[var(--shc-shadow-brutal-sm)]"
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

/** Wireframe Account menu list */
export function AccountMenuList({
  items,
}: {
  items: Array<{ id: string; label: string; href: string; testID: string }>;
}) {
  return (
    <ul
      className="rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card overflow-hidden shadow-[var(--shc-shadow-brutal-sm)] divide-y-2 divide-[var(--shc-border-brutal)]"
      data-testid="account-menu-list"
    >
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={item.href}
            data-testid={item.testID}
            className="flex items-center justify-between px-4 py-3.5 text-sm font-bold hover:bg-secondary/60 transition-colors"
          >
            <span>{item.label}</span>
            <span className="text-muted-foreground font-light text-lg" aria-hidden>
              ›
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Subscribe funnel trust chips (one kitchen · collection · allergens · flex) */
export function SubscribeTrustList({
  chips,
  compact = false,
}: {
  chips: Array<{ id: string; label: string; detail: string }>;
  compact?: boolean;
}) {
  return (
    <ul
      className={compact ? 'space-y-2' : 'space-y-2.5'}
      data-testid="subscribe-trust-list"
    >
      {chips.map((c) => (
        <li
          key={c.id}
          className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2.5"
          data-testid={`subscribe-trust-${c.id}`}
        >
          <p className="text-sm font-extrabold flex items-center gap-2">
            <span className="text-primary" aria-hidden>
              ✓
            </span>
            {c.label}
          </p>
          {!compact ? (
            <p className="text-xs font-semibold text-muted-foreground mt-0.5 leading-snug pl-5">
              {c.detail}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Wireframe kitchen trust certs — Licenses · Food safety · Hygiene */
export function KitchenTrustCertsList({
  certs,
}: {
  certs: Array<{ id: string; label: string; detail: string; status: string }>;
}) {
  return (
    <div className="space-y-2" data-testid="kitchen-trust-certs">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
        Licenses & safety
      </p>
      {certs.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2.5"
          data-testid={`kitchen-trust-${c.id}`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-extrabold">{c.label}</p>
            <span
              className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md ${
                c.status === 'verified'
                  ? 'bg-[var(--shc-bento-mint)] text-[var(--shc-success)]'
                  : c.status === 'pending'
                    ? 'bg-[var(--shc-bento-yellow)] text-[var(--shc-warning)]'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              {c.status}
            </span>
          </div>
          <p className="text-xs font-semibold text-muted-foreground mt-1 leading-snug">{c.detail}</p>
        </div>
      ))}
    </div>
  );
}

/** HomelyEats empty screens — plate (orders) / open box (subscriptions) */
export function IllustratedEmptyState({
  kind,
  title,
  description,
  action,
  testID,
}: {
  kind: 'no_orders' | 'no_active_sub' | 'no_past_sub';
  title: string;
  description?: string;
  action?: React.ReactNode;
  testID?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-16 min-h-[320px]"
      data-testid={testID || `empty-${kind}`}
    >
      {kind === 'no_orders' ? <WebEmptyOrdersPlate /> : <WebEmptySubscriptionBox />}
      <p className="mt-6 text-[15px] font-semibold text-muted-foreground max-w-[260px] leading-snug">
        {title}
      </p>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground/80 max-w-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function WebEmptyOrdersPlate() {
  return (
    <div
      className="flex items-center justify-center gap-3 h-20"
      aria-hidden
      data-testid="empty-illust-no-orders"
    >
      {/* Fork */}
      <div className="flex flex-col items-center h-16 w-3.5">
        <div className="flex gap-0.5 h-7 items-end">
          <span className="w-[3px] h-full rounded-sm bg-[#F5C842]" />
          <span className="w-[3px] h-full rounded-sm bg-[#F5C842]" />
          <span className="w-[3px] h-full rounded-sm bg-[#F5C842]" />
        </div>
        <span className="w-1.5 flex-1 mt-0.5 rounded-sm bg-[#F5C842]" />
      </div>
      {/* Plate */}
      <div className="w-16 h-16 rounded-full border-[3px] border-[#E8A317] bg-[#F0EDE6] flex items-center justify-center shadow-sm">
        <div className="w-11 h-11 rounded-full border-2 border-[#F5C842]/60" />
      </div>
      {/* Knife */}
      <div className="flex flex-col items-center h-16 w-3">
        <span className="w-2 h-8 rounded-t-md rounded-b-sm bg-[#F5C842]" />
        <span className="w-1.5 flex-1 mt-0.5 rounded-sm bg-[#E8A317]" />
      </div>
    </div>
  );
}

function WebEmptySubscriptionBox() {
  return (
    <div className="relative w-28 h-28 flex flex-col items-center justify-end" aria-hidden data-testid="empty-illust-no-sub">
      <div className="flex items-end gap-2.5 mb-1 h-9">
        <span className="w-3.5 h-3.5 rounded-full bg-[#E85D4C]/90 -rotate-[18deg] scale-90" />
        <span className="w-4.5 h-4.5 rounded-full bg-[#E85D4C] mb-1.5" />
        <span className="w-3.5 h-3.5 rounded-full bg-[#E85D4C]/90 rotate-[18deg] scale-90" />
      </div>
      <div className="relative w-20 h-12 rounded-lg border-2 border-[#E8A317] bg-[#F5A623] overflow-visible">
        <span className="absolute -top-2.5 left-1 w-[42%] h-3.5 bg-[#F5C842] rounded-t-md -rotate-[8deg]" />
        <span className="absolute -top-2.5 right-1 w-[42%] h-3.5 bg-[#F5C842] rounded-t-md rotate-[8deg]" />
        <div className="m-2.5 h-6 rounded bg-white/35" />
      </div>
    </div>
  );
}

export function SHCSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:gap-4"
      aria-busy="true"
      aria-label="Loading dishes"
      data-testid="skeleton-dish-grid"
    >
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


/** HitPay-only PayNow — QR + auto confirm via webhook (no "I've paid"). */
export function PayNowPanel({
  amount,
  reference,
  session,
  loadingSession,
  onRetry,
  waitingForPayment,
}: {
  amount: number;
  reference: string;
  session?: {
    provider?: string;
    display_name?: string;
    amount?: number;
    reference?: string;
    qr_image_data_url?: string | null;
    checkout_url?: string | null;
    error?: string;
  } | null;
  loadingSession?: boolean;
  onRetry?: () => void;
  waitingForPayment?: boolean;
}) {
  const displayAmount = session?.amount != null ? Number(session.amount) : amount;
  const displayName = session?.display_name || 'Singapore Home Cooks';
  const hasQr = Boolean(session?.qr_image_data_url || session?.checkout_url);
  const qrUri = session?.qr_image_data_url;
  const qrKey = (session as { payment_request_id?: string })?.payment_request_id || session?.reference || reference;
  const showInitialLoading = Boolean(loadingSession && !qrUri);
  const err =
    session?.error ||
    (session?.provider === 'hitpay_error' ? 'Could not create PayNow QR' : null) ||
    (!loadingSession && session && session.provider !== 'hitpay' && session.provider !== 'already_paid' && !hasQr
      ? 'PayNow unavailable — try again'
      : null);

  if (session?.provider === 'already_paid') {
    return (
      <SHCCard className="shc-bento-yellow" data-testid="paynow-panel">
        <div className="font-bold text-primary">Payment received</div>
        <p className="text-sm font-semibold text-muted-foreground mt-1">This order is already paid.</p>
      </SHCCard>
    );
  }

  return (
    <SHCCard className="shc-bento-yellow" data-testid="paynow-panel">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-[var(--shc-border-brutal)] flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="font-bold">Pay with PayNow</div>
          <div className="text-sm text-muted-foreground font-medium">Scan the QR with your banking app</div>
        </div>
      </div>
      <div className="text-2xl font-black tabular-nums font-mono mb-1">
        S${Number(displayAmount || 0).toFixed(2)}
      </div>
      <p className="text-sm font-semibold text-muted-foreground mb-3">
        {displayName} · Order {session?.reference || reference || '—'}
      </p>

      {showInitialLoading ? (
        <p className="text-sm font-semibold text-muted-foreground" data-testid="paynow-qr-loading">
          Creating PayNow QR…
        </p>
      ) : null}

      {qrUri ? (
        <div className="mt-2 flex flex-col items-center" data-testid="paynow-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={qrKey}
            src={qrUri}
            alt="PayNow QR"
            width={220}
            height={220}
            className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-white p-2"
          />
          <p className="text-xs font-semibold text-muted-foreground mt-2">Scan with DBS / OCBC / UOB / etc.</p>
        </div>
      ) : null}

      {session?.checkout_url && !session?.qr_image_data_url ? (
        <a
          href={session.checkout_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm font-bold text-primary underline"
          data-testid="paynow-open-checkout"
        >
          Open HitPay checkout →
        </a>
      ) : null}

      {err ? (
        <p className="text-sm font-bold text-red-600 mt-3" role="alert" data-testid="paynow-error">
          {err}
        </p>
      ) : null}

      {onRetry && !loadingSession ? (
        <SHCButton className="mt-3 w-full" onClick={onRetry} testID="paynow-retry-qr">
          {hasQr ? 'Refresh QR' : 'Retry PayNow QR'}
        </SHCButton>
      ) : null}

      {hasQr || waitingForPayment ? (
        <p className="text-xs font-semibold text-primary mt-4 text-center" data-testid="paynow-waiting">
          {waitingForPayment ? 'Waiting for payment… ' : ''}
          We confirm automatically when HitPay notifies us. Address unlocks after paid.
        </p>
      ) : null}
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
export type GourmeatBottomTab = {
  key: string;
  href: string;
  label: string;
  iconKey: 'discover' | 'orders' | 'cart' | 'profile';
  testID: string;
  badge?: string;
  ordersLiveCue?: 'cooking';
  needsAuth?: boolean;
};

const GOURMEAT_TAB_ICONS: Record<GourmeatBottomTab['iconKey'], LucideIcon> = {
  discover: Home,
  orders: Receipt,
  cart: ShoppingBag,
  profile: User,
};

/** Floating dark nav — pixel parity with @shc/ui GourmeatFloatingTabBar */
export function GourmeatFloatingTabBar({
  tabs,
  activeKey,
  onTabPress,
  testID = 'bottom-tab-bar',
}: {
  tabs: GourmeatBottomTab[];
  activeKey: string;
  onTabPress: (key: string) => void;
  testID?: string;
}) {
  return (
    <nav
      className="rounded-[28px] bg-[var(--shc-gourmeat-nav)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] px-1 py-2"
      data-testid={testID}
      aria-label="Main"
    >
      <div className="flex items-stretch min-h-[52px]">
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          const Icon = GOURMEAT_TAB_ICONS[tab.iconKey];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabPress(tab.key)}
              data-testid={tab.testID}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 relative"
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative mb-0.5">
                {tab.iconKey === 'orders' && tab.ordersLiveCue === 'cooking' ? (
                  <OrdersTabCookingIcon Icon={Icon} active={active} />
                ) : (
                  <Icon
                    className={`w-[22px] h-[22px] ${active ? 'text-primary' : 'text-white/55'}`}
                    strokeWidth={active ? 2.5 : 2}
                    aria-hidden
                  />
                )}
                {tab.badge ? (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 flex items-center justify-center text-[8px] font-black bg-primary text-primary-foreground rounded-full px-0.5">
                    {tab.badge}
                  </span>
                ) : null}
              </span>
              <span
                className={`text-[10px] leading-none ${
                  active ? 'font-bold text-primary' : 'font-medium text-white/55'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** HomelyEats homepage promo — matches SHCTiffinHeroBanner */
export function TiffinHeroBanner({
  title = 'No time to cook?',
  highlight = 'Explore tiffin plans',
  bullets = [
    'Nutritious home-cooked meals from HDB kitchens',
    'Heritage cuisines — Peranakan, Malay, Indian & more',
    'Flexible 2 · 3 · 4 meals per week',
  ],
  testID = 'tiffin-hero-banner',
  className = '',
}: {
  title?: string;
  highlight?: string;
  bullets?: string[];
  testID?: string;
  className?: string;
}) {
  return (
    <div
      data-testid={testID}
      className={`shc-section-stack rounded-2xl p-6 text-white shadow-[var(--shc-shadow-soft)] bg-primary ${className}`}
    >
      <p className="text-xl font-extrabold">{title}</p>
      <p className="text-lg font-extrabold text-[var(--shc-hero-cream)] mt-1 mb-2">{highlight}</p>
      <ul className="text-[13px] font-semibold space-y-0.5 text-white/92">
        {bullets.map((b) => (
          <li key={b}>· {b}</li>
        ))}
      </ul>
    </div>
  );
}

/** Gourmeat order-mode chips — matches SHCTiffinFilterChips */
export function TiffinFilterChips({
  chips,
  activeId,
  onSelect,
  testID = 'tiffin-filter-chips',
}: {
  chips: { id: string; label: string }[];
  activeId?: string;
  onSelect: (id: string) => void;
  testID?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" data-testid={testID}>
      {chips.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            data-testid={`tiffin-filter-${c.id}`}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold border transition-colors ${
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-[var(--shc-border)]'
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

/** HomelyEats kitchen list card — matches SHCTiffinKitchenCard */
export function TiffinKitchenCard({
  cookId,
  cookName,
  area,
  tagline,
  coverUri,
  rating = 4.8,
  reviewCount,
  subscriberCount,
  priceFrom,
  priceTo,
  isOpen = true,
  closesAt = 'HDB collection',
  onPress,
  testID,
}: {
  cookId: string;
  cookName: string;
  area?: string;
  tagline?: string;
  coverUri?: string;
  rating?: number;
  reviewCount?: number;
  subscriberCount?: number;
  priceFrom?: number;
  priceTo?: number;
  isOpen?: boolean;
  closesAt?: string;
  onPress: () => void;
  testID?: string;
}) {
  const cover = coverUri || getCookKitchenHeroUrl(cookId);
  const priceLabel =
    priceFrom != null && priceTo != null
      ? `S$${priceFrom}–${priceTo}/meal`
      : priceFrom != null
        ? `from S$${priceFrom}/meal`
        : null;
  return (
    <button
      type="button"
      onClick={onPress}
      data-testid={testID || `tiffin-kitchen-${cookId}`}
      className="w-full text-left rounded-2xl bg-card overflow-hidden shadow-[var(--shc-shadow-soft)] mb-[var(--shc-stack-gap)] hover:opacity-95 transition-opacity"
    >
      <div className="relative h-40 w-full bg-muted">
        <Image src={cover} alt="" fill className="object-cover" sizes="640px" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-extrabold text-[17px] text-foreground truncate flex-1">{cookName}</p>
          <span className="text-xs font-bold shrink-0 flex items-center gap-0.5">
            <span className="shc-text-rating">★</span>
            {rating.toFixed(1)}
            {reviewCount != null ? ` (${reviewCount})` : ''}
          </span>
        </div>
        {(tagline || area) && (
          <p className="text-[13px] text-muted-foreground font-semibold line-clamp-1 mt-1">
            {[tagline, area].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="text-[13px] font-extrabold mt-1.5">
          <span className={isOpen ? 'text-[var(--shc-gourmeat-success)]' : 'text-destructive'}>{isOpen ? 'Open' : 'Closed'}</span>
          {closesAt ? <span className="text-muted-foreground font-semibold"> · {closesAt}</span> : null}
        </p>
        <div className="flex justify-between items-center mt-2.5 gap-3">
          {priceLabel ? <p className="text-[13px] font-extrabold text-foreground">{priceLabel}</p> : null}
          {subscriberCount != null ? (
            <p className="text-xs font-semibold text-muted-foreground ml-auto">👤 {subscriberCount} subscribers</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

/** HomelyEats category circles — matches SHCTiffinCategoryRow */
export function TiffinCategoryRow({
  categories,
  activeId,
  onSelect,
  testID = 'tiffin-category-row',
}: {
  categories: { id: string; label: string; emoji?: string }[];
  activeId?: string;
  onSelect: (id: string) => void;
  testID?: string;
}) {
  return (
    <div style={{ marginTop: 'var(--shc-category-stack-gap)', marginBottom: 'var(--shc-category-stack-gap)' }}>
      <p
        className="text-xs font-bold text-muted-foreground text-center"
        style={{ marginBottom: 'var(--shc-category-stack-gap)', lineHeight: '12px' }}
      >
        Explore by categories
      </p>
      <div className="flex gap-3.5 overflow-x-auto scrollbar-hide" data-testid={testID}>
        {categories.map((c) => {
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              data-testid={`tiffin-cat-${c.id}`}
              className="shrink-0 w-[72px] flex flex-col items-center"
            >
              <span
                className={`w-16 h-16 rounded-full flex items-center justify-center text-[28px] border bg-card shadow-[var(--shc-shadow-soft)] ${
                  active ? 'border-primary border-2' : 'border-[var(--shc-border)]'
                }`}
              >
                {c.emoji || '🍲'}
              </span>
              <span
                className={`text-[11px] leading-[14px] font-semibold text-center ${
                  active ? 'text-primary font-extrabold' : 'text-muted-foreground'
                }`}
                style={{ marginTop: 'var(--shc-category-stack-gap)' }}
              >
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** HomelyEats empty state — matches SHCTiffinEmptyState */
export function TiffinEmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  testID = 'tiffin-empty-state',
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}) {
  return (
    <div
      data-testid={testID}
      className="flex flex-col items-center justify-center py-12 px-6 min-h-[280px] gap-4 text-center"
    >
      <span className="text-4xl" aria-hidden>
        🍱
      </span>
      <p className="text-[15px] font-semibold text-muted-foreground leading-snug max-w-[260px]">{title}</p>
      {subtitle ? <p className="text-[13px] text-muted-foreground leading-relaxed">{subtitle}</p> : null}
      {actionLabel && onAction ? (
        <SHCButton size="sm" variant="outline" onClick={onAction} testID="tiffin-empty-action">
          {actionLabel}
        </SHCButton>
      ) : null}
    </div>
  );
}

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
      className="flex items-center justify-between gap-3 bg-[var(--shc-bento-yellow)] border-2 border-[var(--shc-border-brutal)] rounded-xl px-4 py-4 mt-[var(--shc-stack-gap)] mb-[var(--shc-section-gap)] min-h-[60px] shadow-[var(--shc-shadow-brutal)]"
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
    { label: 'Home cooks', sub: 'Across Singapore HDB', Icon: Users },
    { label: 'Heritage meals', sub: 'Collection at pickup', Icon: UtensilsCrossed },
    { label: 'HDB collection', sub: 'No delivery — planned occasions', Icon: Home },
    { label: 'Allergen disclosure', sub: 'Mandatory before checkout', Icon: ShieldCheck },
  ];
  return (
    <div className="shc-section-stack grid grid-cols-2 md:grid-cols-4 gap-3">
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
    <div data-testid={testID} className="shc-inset-stack space-y-3">
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

export function OrdersCalendarStrip({
  days,
  selectedDate,
  todayDate,
  onSelect,
  testID = 'orders-calendar-strip',
}: {
  days: Array<{ date: string; label: string; dayNum: string; hasOrder?: boolean }>;
  selectedDate: string;
  todayDate?: string;
  onSelect: (date: string) => void;
  testID?: string;
}) {
  const stripRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!todayDate || !stripRef.current) return;
    const el = stripRef.current.querySelector(`[data-cal-date="${todayDate}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [todayDate, days]);

  return (
    <div
      ref={stripRef}
      className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide"
      data-testid={testID}
    >
      {days.map((d) => {
        const active = d.date === selectedDate;
        const isToday = todayDate != null && d.date === todayDate;
        return (
          <button
            key={d.date}
            type="button"
            data-cal-date={d.date}
            data-testid={isToday ? `orders-cal-day-${d.date}-today` : `orders-cal-day-${d.date}`}
            onClick={() => onSelect(d.date)}
            className={`shrink-0 w-12 min-w-[3rem] rounded-xl border-2 py-2 text-center cursor-pointer touch-manipulation relative z-10 ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : isToday
                  ? 'border-[var(--shc-success)] bg-[var(--shc-bento-mint)] hover:border-[var(--shc-success)]'
                  : d.hasOrder
                    ? 'border-primary/40 bg-card hover:border-primary'
                    : 'border-[var(--shc-border-brutal)] bg-card hover:border-primary/50'
            }`}
          >
            <div
              className={`text-[10px] font-bold ${
                active ? 'opacity-90' : isToday ? 'text-[var(--shc-success)] font-extrabold' : 'opacity-80'
              }`}
            >
              {isToday ? 'Today' : d.label}
            </div>
            <div className="text-base font-black tabular-nums">{d.dayNum}</div>
            {d.hasOrder ? (
              <div
                className={`w-1 h-1 rounded-full mx-auto mt-1 ${
                  active ? 'bg-primary-foreground' : isToday ? 'bg-[var(--shc-success)]' : 'bg-primary'
                }`}
              />
            ) : isToday && !active ? (
              <div className="w-[5px] h-[5px] rounded-full bg-[var(--shc-success)] mx-auto mt-1" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function OrdersTabCookingIcon({
  Icon,
  active,
  testID = 'orders-tab-cooking',
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>;
  active: boolean;
  testID?: string;
}) {
  return (
    <span
      className="relative inline-flex items-end justify-center w-[32px] h-[36px]"
      data-testid={testID}
    >
      <span className="absolute top-0 left-[5px] w-1 h-1 rounded-full bg-[var(--shc-success)] shc-steam-wisp shc-steam-wisp-1" />
      <span className="absolute top-0 left-[13px] w-1 h-1 rounded-full bg-[var(--shc-success)] shc-steam-wisp shc-steam-wisp-2" />
      <span className="absolute top-0 left-[21px] w-1 h-1 rounded-full bg-[var(--shc-success)] shc-steam-wisp shc-steam-wisp-3" />
      <span className="inline-flex items-center justify-center rounded-lg px-0.5 py-0.5 bg-[var(--shc-bento-mint)] border-[1.5px] border-[var(--shc-border-brutal)] shc-cooking-pulse">
        <Icon className={`w-[22px] h-[22px] ${active ? 'text-primary' : ''}`} strokeWidth={active ? 2.5 : 2} aria-hidden />
      </span>
      <span className="absolute top-0 right-0 w-[7px] h-[7px] rounded-full bg-[var(--shc-success)] border-[1.5px] border-[var(--shc-gourmeat-nav)]" />
    </span>
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
      className="flex items-center justify-between gap-3 bg-[var(--shc-bento-mint)] border-2 border-[var(--shc-border-brutal)] rounded-lg px-4 py-3 mt-[var(--shc-stack-gap)] mb-[var(--shc-section-gap)] shadow-[var(--shc-shadow-brutal-sm)] hover:opacity-95"
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
  notificationHref = '/profile',
}: {
  headline?: string;
  locationLabel?: string;
  locationHint?: string;
  avatarUri?: string;
  profileHref?: string;
  locationHref?: string;
  notificationHref?: string;
  onLocationPress?: () => void;
}) {
  return (
    <div className="mb-3" data-testid="gourmeat-home-header">
      <div className="flex items-start justify-between gap-2 mb-4">
        <h1 className="text-[26px] md:text-3xl font-extrabold text-foreground tracking-[-0.5px] leading-8 flex-1">
          {headline}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={notificationHref}
            className="w-10 h-10 rounded-full bg-card shadow-[var(--shc-shadow-soft)] flex items-center justify-center"
            data-testid="gourmeat-notifications"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-foreground" aria-hidden />
          </Link>
          <Link
            href={profileHref}
            className="w-11 h-11 rounded-full overflow-hidden bg-secondary shadow-[var(--shc-shadow-soft)]"
            data-testid="gourmeat-profile-avatar"
          >
            {avatarUri ? (
              <Image src={avatarUri} alt="" width={44} height={44} className="object-cover w-full h-full" />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-primary">
                <User className="w-[22px] h-[22px]" strokeWidth={2.5} aria-hidden />
              </span>
            )}
          </Link>
        </div>
      </div>
      <Link
        href={locationHref}
        className="inline-flex items-center gap-1 bg-card rounded-full px-3 py-1.5 shadow-[var(--shc-shadow-soft)]"
        data-testid="gourmeat-location-chip"
      >
        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
        <span className="text-[11px] font-semibold text-muted-foreground">{locationHint}</span>
        <span className="text-xs font-bold text-foreground ml-1 truncate max-w-[200px]">{locationLabel}</span>
        <span className="text-[10px] text-muted-foreground ml-1">▼</span>
      </Link>
    </div>
  );
}

export function GourmeatSearchBar({
  value,
  onChange,
  placeholder = 'Search dishes, cooks, occasions…',
  onFilterPress,
  testID = 'search-input',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  testID?: string;
}) {
  return (
    <div className="flex items-center gap-2 shc-header-gap">
      <div className="flex-1 flex items-center bg-card rounded-full px-4 py-3 shadow-[var(--shc-shadow-soft)] min-w-0">
        <Search className="shc-icon-md text-muted-foreground shrink-0" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid={testID}
          className="flex-1 ml-3 text-sm font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
        />
      </div>
      {onFilterPress ? (
        <button
          type="button"
          onClick={onFilterPress}
          className="w-11 h-11 shrink-0 rounded-xl bg-card shadow-[var(--shc-shadow-soft)] flex items-center justify-center"
          data-testid="gourmeat-filter-btn"
          aria-label="Advanced search"
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
    <div className="flex items-center justify-between shc-title-block" data-testid={testID}>
      <h2 className="shc-type-section text-foreground tracking-[-0.3px]">{title}</h2>
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

export function GourmeatDiscountBadge({ percent, testID }: { percent: number; testID?: string }) {
  return (
    <span
      data-testid={testID}
      className="bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-1 rounded-lg"
    >
      {percent}% OFF
    </span>
  );
}

/** PDP sticky qty + add — parity with GourmeatProductStickyBar */
export function GourmeatProductStickyBar({
  qty,
  minQty,
  lineTotal,
  onDecrement,
  onIncrement,
  onAdd,
  disabled,
  loading,
  testID = 'pdp-sticky-bar',
}: {
  qty: number;
  minQty: number;
  lineTotal: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onAdd: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  return (
    <div
      data-testid={testID}
      className="flex items-center gap-2 bg-card border-t border-[var(--shc-border)] px-4 py-2 shadow-[var(--shc-shadow-soft)]"
    >
      <div className="flex items-center rounded-full bg-[var(--shc-surface-alt)]">
        <button type="button" onClick={onDecrement} className="px-3 py-2 text-lg font-bold" aria-label="Decrease quantity">
          −
        </button>
        <span className="text-[15px] font-extrabold min-w-6 text-center tabular-nums">{qty}</span>
        <button type="button" onClick={onIncrement} className="px-3 py-2 text-lg font-bold" aria-label="Increase quantity">
          +
        </button>
      </div>
      <div className="flex-1 text-right">
        <p className="text-[11px] text-muted-foreground">min {minQty}</p>
        <p className="text-base font-extrabold tabular-nums">S${lineTotal.toFixed(0)}</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled || loading}
        data-testid="add-to-cart-btn"
        className="shrink-0 min-w-[72px] rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-extrabold disabled:opacity-60 hover:bg-[var(--shc-primary-dark)]"
      >
        {loading ? 'Adding…' : 'Add'}
      </button>
    </div>
  );
}

/** dev.to ordering info block — parity with SHCDishOrderingInfo */
export function DishOrderingInfo({
  tier1 = [],
  tier2 = [],
  tier3 = [],
  ingredients = [],
  calories,
  caloriesConfidence,
  testID = 'dish-ordering-info',
}: {
  tier1?: string[];
  tier2?: string[];
  tier3?: string[];
  ingredients?: Array<{ name?: string; qty?: string; quantity?: string; unit?: string } | string>;
  calories?: number;
  caloriesConfidence?: 'full' | 'category';
  testID?: string;
}) {
  return (
    <div data-testid={testID} className="space-y-2 text-sm">
      <p className="text-sm font-black text-foreground">Ingredients &amp; allergens</p>
      {tier1.length > 0 && (
        <p className="text-xs font-bold text-[var(--shc-error)]">Contains: {tier1.join(', ')}</p>
      )}
      {tier2.length > 0 && (
        <p className="text-xs font-semibold text-muted-foreground">May contain: {tier2.join(', ')}</p>
      )}
      {tier3.length > 0 && (
        <p className="text-xs font-semibold text-muted-foreground">Trace: {tier3.join(', ')}</p>
      )}
      {ingredients.length > 0 && (
        <div className="pt-2 mt-2 border-t border-[var(--shc-border)]">
          <p className="text-[11px] font-extrabold text-muted-foreground mb-1">INGREDIENTS</p>
          <ul className="space-y-0.5">
            {ingredients.slice(0, 8).map((ing, i) => {
              const label =
                typeof ing === 'string'
                  ? ing
                  : `${ing.name || ''}${ing.qty || ing.quantity ? ` — ${ing.qty || ing.quantity}${ing.unit ? ` ${ing.unit}` : ''}` : ''}`;
              return (
                <li key={i} className="text-xs font-semibold text-foreground">
                  · {label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {calories != null && (
        <p className="text-[11px] font-bold text-muted-foreground">
          ~{calories} cal per portion
          {caloriesConfidence === 'category' ? ' (category estimate)' : ''}
        </p>
      )}
    </div>
  );
}

export function GourmeatCartLineItem({
  name,
  qty,
  price,
  imageUri,
  testID,
}: {
  name: string;
  qty: number;
  price: number;
  imageUri?: string;
  testID?: string;
}) {
  const uri = imageUri || getDishImageUrl({ name });
  return (
    <li
      data-testid={testID}
      className="py-3 px-4 flex items-center gap-3 border-b border-[var(--shc-border)] last:border-b-0"
    >
      <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden">
        <Image src={uri} alt={name} fill className="object-cover" sizes="56px" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate text-sm">{name}</p>
        <p className="text-xs text-muted-foreground font-medium tabular-nums">
          {qty} × S${price.toFixed(2)}
        </p>
      </div>
      <p className="font-extrabold text-primary tabular-nums shrink-0 text-sm">S${(qty * price).toFixed(2)}</p>
    </li>
  );
}

/** HomelyEats order day card — parity with SHCTiffinOrderStatusCard */
export function TiffinOrderStatusCard({
  cookName,
  planTitle,
  status,
  timeslot,
  menuLines,
  customizable,
  menuPending,
  onSkip,
  onManage,
  manageLabel = 'Manage',
  testID,
}: {
  cookName: string;
  planTitle?: string;
  status: TiffinOrderCardStatus;
  timeslot?: string;
  menuLines?: string[];
  customizable?: boolean;
  menuPending?: boolean;
  onSkip?: () => void;
  onManage?: () => void;
  manageLabel?: string;
  testID?: string;
}) {
  const chip = tiffinMealStatusChip(status);

  return (
    <div
      data-testid={testID || `tiffin-order-card-${status}`}
      className="rounded-2xl bg-card p-4 shadow-[var(--shc-shadow-soft)]"
    >
      <div className="flex items-center flex-wrap gap-2 mb-2">
        <span
          className="text-[11px] font-extrabold px-2 py-1 rounded-lg"
          style={{ background: chip.bg, color: chip.color }}
        >
          {chip.text}
        </span>
        {timeslot ? <span className="text-xs font-semibold text-muted-foreground">{timeslot}</span> : null}
        {customizable ? (
          <span className="text-[10px] font-black text-primary uppercase tracking-wide" data-testid="tiffin-customizable-tag">
            CUSTOMIZABLE
          </span>
        ) : null}
      </div>
      <p className="font-extrabold text-base text-foreground">{cookName}</p>
      {planTitle ? <p className="text-[13px] text-muted-foreground mt-0.5">{planTitle}</p> : null}
      {menuPending ? (
        <p className="text-xs italic text-muted-foreground mt-2">Menu yet to be updated</p>
      ) : (
        (menuLines || []).map((line) => (
          <p key={line} className="text-[13px] text-foreground mt-1">
            · {line}
          </p>
        ))
      )}
      <div className="flex flex-wrap gap-2 mt-4">
        {onManage ? (
          <GourmeatPrimaryButton label={manageLabel} variant="outline" size="sm" onClick={onManage} testID="tiffin-order-manage-btn" />
        ) : null}
        {onSkip && status === 'scheduled' ? (
          <GourmeatPrimaryButton label="Skip day" variant="outline" size="sm" onClick={onSkip} testID="tiffin-order-skip-btn" />
        ) : null}
      </div>
    </div>
  );
}

export function GourmeatCategoryRow({
  items,
  active,
  onSelect,
  title,
  testID = 'gourmeat-category-row',
}: {
  items: { id: string; label: string; imageUrl?: string }[];
  active: string;
  onSelect: (id: string) => void;
  /** Centered eyebrow — equal gap above/below to circles */
  title?: string;
  testID?: string;
}) {
  const gap = 'var(--shc-category-stack-gap)';
  const row = (
    <div className="flex gap-4 overflow-x-auto -mx-1 px-1 scrollbar-hide" data-testid={testID}>
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
            <span
              className={`text-[11px] leading-[14px] text-center truncate w-full ${selected ? 'font-bold text-primary' : 'font-medium text-muted-foreground'}`}
              style={{ marginTop: gap }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (!title) return row;

  return (
    <div
      data-testid={testID ? `${testID}-section` : 'gourmeat-category-section'}
      className="shc-section-stack"
    >
      <p
        className="text-xs font-bold text-muted-foreground text-center"
        style={{ marginBottom: gap, lineHeight: '12px' }}
      >
        {title}
      </p>
      {row}
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
    <div className="shc-header-gap">
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
      {actions ? (
        <div className="px-3 pb-3 mt-1 flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
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
    <div className="shc-header-gap" data-testid={testID}>
      <h1 className="shc-type-screen-title text-foreground">{title}</h1>
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
  size = 'md',
  fullWidth,
  testID,
  className = '',
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  size?: 'md' | 'sm';
  fullWidth?: boolean;
  testID?: string;
  className?: string;
}) {
  const outline = variant === 'outline';
  const isSm = size === 'sm';
  const stretch = fullWidth ?? !isSm;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testID}
      className={`inline-flex items-center justify-center rounded-xl font-extrabold transition-opacity disabled:opacity-50 ${
        isSm ? 'h-9 min-h-[36px] px-3.5 py-0 text-[13px] leading-none' : 'min-h-12 px-4 py-3 text-sm'
      } ${stretch ? 'w-full' : 'w-auto shrink-0'} ${
        outline
          ? 'bg-card border border-border text-foreground'
          : 'bg-primary text-primary-foreground hover:bg-[var(--shc-primary-dark)]'
      } ${className}`}
    >
      {loading ? '…' : label}
    </button>
  );
}

/** Equal-height action strip under order cards */
export function GourmeatActionRow({
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
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {children}
    </div>
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
}: {
  step: number;
  total?: number;
  editing?: boolean;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  showChevron?: boolean;
}) {
  const prevStepRef = React.useRef(step);
  const prevEditingRef = React.useRef(editing);
  const [morph, setMorph] = React.useState(() => wizardCtaMorphOnStepEnter(step, total, editing));

  React.useEffect(() => {
    if (prevStepRef.current !== step) {
      setMorph(wizardCtaMorphFromTransition(prevStepRef.current, step, total, editing));
      prevStepRef.current = step;
      prevEditingRef.current = editing;
      return;
    }
    if (step >= total && prevEditingRef.current !== editing) {
      setMorph({ from: 'Review', to: editing ? 'Save changes' : 'Publish' });
      prevEditingRef.current = editing;
    }
  }, [step, total, editing]);

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

export function PhotoTipsTrayContentWeb({ tips }: { tips: string[] }) {
  return (
    <div className="space-y-3" data-testid="photo-tips-tray">
      <p className="text-sm font-medium text-muted-foreground">3 SG-specific tips for better dish photos:</p>
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