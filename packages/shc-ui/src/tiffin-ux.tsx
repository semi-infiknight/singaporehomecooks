// Tiffin subscription UX — kitchen browse, meals/week picker, weekly planner grid.
// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, ScrollView, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gourmeatColors, gourmeatRadii, gourmeatShadows, shcColors, shcSpacing, shcSectionStack } from './theme';
import { SHCFoodImage } from './visuals';
import { GourmeatPrimaryButton } from './gourmeat';
import { getDishImageUrl, getCookKitchenHeroUrl } from '@shc/utils';
import { EmptyIllustration } from './empty-illustrations';

export const TIFFIN_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export type TiffinDishOption = {
  id: string;
  name: string;
  price?: number;
  cuisine?: string;
  cook_name?: string;
  image_url?: string | null;
};

export type TiffinPlanSlotDraft = {
  day_of_week: number;
  product_id: string;
  collection_slot?: string;
};

/** Volume pricing — more meals/week → lower per-serving (Mobbin ref). */
export function tiffinPricePerServing(mealsPerWeek: number): number {
  if (mealsPerWeek >= 4) return 10;
  if (mealsPerWeek >= 3) return 11;
  return 12;
}

export function tiffinWeeklySubtotal(mealsPerWeek: number, servings = 1): number {
  return mealsPerWeek * servings * tiffinPricePerServing(mealsPerWeek);
}

/** HomelyEats homepage ref — promo banner “No time to cook? Explore subscriptions” */
export function SHCTiffinHeroBanner({
  title = 'No time to cook?',
  highlight = 'Explore tiffin plans',
  bullets = [
    'Nutritious home-cooked meals from HDB kitchens',
    'Heritage cuisines — Peranakan, Malay, Indian & more',
    'Flexible 2 · 3 · 4 meals per week',
  ],
  testID = 'tiffin-hero-banner',
}: {
  title?: string;
  highlight?: string;
  bullets?: string[];
  testID?: string;
}) {
  return (
    <View testID={testID} style={[styles.heroBanner, shcSectionStack]}>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroHighlight}>{highlight}</Text>
      {bullets.map((b) => (
        <Text key={b} style={styles.heroBullet}>
          · {b}
        </Text>
      ))}
    </View>
  );
}

/** HomelyEats filter chips — Sort / nearest / cuisine */
export function SHCTiffinFilterChips({
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      contentContainerStyle={styles.filterRow}
    >
      {chips.map((c) => {
        const active = c.id === activeId;
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c.id)}
            testID={`tiffin-filter-${c.id}`}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** HomelyEats category circles — Explore by categories */
export function SHCTiffinCategoryRow({
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
  const gap = shcSpacing.categoryStackGap;
  return (
    <View testID={testID} style={shcSectionStack}>
      <Text style={[styles.sectionEyebrow, { marginBottom: gap }]}>Explore by categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        {categories.map((c) => {
          const active = c.id === activeId;
          return (
            <Pressable
              key={c.id}
              onPress={() => onSelect(c.id)}
              testID={`tiffin-cat-${c.id}`}
              style={styles.catItem}
            >
              <View style={[styles.catCircle, active && styles.catCircleActive]}>
                <Text style={styles.catEmoji}>{c.emoji || '🍲'}</Text>
              </View>
              <Text style={[styles.catLabel, { marginTop: gap }, active && styles.catLabelActive]} numberOfLines={1}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** HomelyEats kitchen list card — cover, rating, open, price, subscribers */
export function SHCTiffinKitchenCard({
  cookName,
  area,
  tagline,
  mealsOptions,
  dishCount,
  cookId,
  coverUri,
  rating = 4.8,
  reviewCount,
  subscriberCount,
  priceFrom,
  priceTo,
  isOpen = true,
  closesAt = 'Collection evening',
  onPress,
  onFavorite,
  favorited,
  testID,
}: {
  cookName: string;
  area?: string;
  tagline?: string;
  mealsOptions?: number[];
  dishCount?: number;
  cookId: string;
  coverUri?: string;
  rating?: number;
  reviewCount?: number;
  subscriberCount?: number;
  priceFrom?: number;
  priceTo?: number;
  isOpen?: boolean;
  closesAt?: string;
  onPress: () => void;
  onFavorite?: () => void;
  favorited?: boolean;
  testID?: string;
}) {
  const cover = coverUri || getCookKitchenHeroUrl(cookId);
  const priceLabel =
    priceFrom != null && priceTo != null
      ? `S$${priceFrom}–${priceTo}/meal`
      : priceFrom != null
        ? `from S$${priceFrom}/meal`
        : `${(mealsOptions || [2, 3, 4]).join(' · ')} meals/wk`;
  return (
    <Pressable onPress={onPress} testID={testID || `tiffin-kitchen-${cookId}`} accessibilityRole="button">
      {({ pressed }) => (
        <View style={[styles.kitchenCardFeatured, pressed && { opacity: 0.94 }]}>
          <View style={styles.kitchenCoverWrap}>
            <Image source={{ uri: cover }} style={styles.kitchenCover} resizeMode="cover" />
            {onFavorite ? (
              <Pressable
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onFavorite();
                }}
                style={styles.favBtn}
                testID={`tiffin-kitchen-fav-${cookId}`}
                hitSlop={8}
              >
                <Text style={styles.favIcon}>{favorited ? '♥' : '♡'}</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.kitchenBodyPad}>
            <View style={styles.kitchenTitleRow}>
              <Text style={styles.kitchenName} numberOfLines={1}>
                {cookName}
              </Text>
              <View style={styles.ratingPill}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingText}>
                  {rating.toFixed(1)}
                  {reviewCount != null ? ` (${reviewCount})` : ''}
                </Text>
              </View>
            </View>
            {tagline || area ? (
              <Text style={styles.kitchenTagline} numberOfLines={1}>
                {[tagline, area].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            <View style={styles.openRow}>
              <Text style={[styles.openDot, { color: isOpen ? '#2E7D32' : '#C62828' }]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
              {closesAt ? <Text style={styles.closesAt}> · {closesAt}</Text> : null}
            </View>
            <View style={styles.kitchenMetaRow}>
              <Text style={styles.kitchenMetaPrice}>{priceLabel}</Text>
              {subscriberCount != null ? (
                <Text style={styles.kitchenMetaSubs}>👤 {subscriberCount} subscribers</Text>
              ) : dishCount != null ? (
                <Text style={styles.kitchenMetaSubs}>{dishCount} dishes</Text>
              ) : null}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Kitchen page hero (HomelyEats / Jakob’s Law restaurant page).
 * Full-bleed photo + name + rating + open status + story/tags.
 */
export function SHCTiffinKitchenHero({
  cookName,
  cookId,
  tagline,
  imageUri,
  rating,
  reviewCount,
  isOpen = true,
  openDetail = 'HDB collection evenings',
  tags,
  story,
  testID = 'kitchen-page-hero',
}: {
  cookName: string;
  cookId?: string;
  tagline?: string;
  imageUri?: string;
  rating?: number;
  reviewCount?: number;
  isOpen?: boolean;
  openDetail?: string;
  tags?: string[];
  story?: string;
  testID?: string;
}) {
  const uri = imageUri || getCookKitchenHeroUrl(cookId || cookName);
  const ratingText =
    rating != null
      ? reviewCount != null
        ? `${rating.toFixed(1)} (${reviewCount})`
        : rating.toFixed(1)
      : null;
  return (
    <View testID={testID} style={styles.kitchenHero}>
      <Image source={{ uri }} style={styles.kitchenHeroImage} resizeMode="cover" accessibilityIgnoresInvertColors />
      <View style={styles.kitchenHeroBody}>
        <View style={styles.kitchenHeroTitleRow}>
          <Text style={styles.kitchenHeroTitle} numberOfLines={2}>
            {cookName}
          </Text>
          {ratingText ? (
            <View style={styles.kitchenHeroRating} testID="kitchen-rating-pill">
              <Text style={styles.kitchenHeroRatingText}>★ {ratingText}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.kitchenHeroSubtitle}>
          {tagline || 'Home-cooked tiffin — collection from one HDB kitchen each week.'}
        </Text>
        <Text style={[styles.kitchenHeroOpen, { color: isOpen ? '#2E7D32' : '#C62828' }]} testID="kitchen-open-status">
          {isOpen ? 'Open' : 'Closed'}
          <Text style={styles.kitchenHeroOpenDetail}> · {openDetail}</Text>
        </Text>
        {tags && tags.length > 0 ? (
          <View style={styles.kitchenHeroTags} testID="kitchen-tags">
            {tags.map((t) => (
              <View key={t} style={styles.kitchenHeroTag}>
                <Text style={styles.kitchenHeroTagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {story ? (
          <Text style={styles.kitchenHeroNote} numberOfLines={3} testID="kitchen-story">
            {story}
          </Text>
        ) : (
          <Text style={styles.kitchenHeroNote}>
            Adjust your weekly order anytime from the full menu after you subscribe.
          </Text>
        )}
      </View>
    </View>
  );
}

export function SHCTiffinMealsPicker({
  options,
  selected,
  onSelect,
  testID = 'tiffin-meals-picker',
}: {
  options: number[];
  selected: number;
  onSelect: (n: number) => void;
  testID?: string;
}) {
  return (
    <View testID={testID}>
      <Text style={styles.sectionQuestion}>How many meals would you like each week?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mealsPickerRow}>
        {options.map((n) => {
          const active = n === selected;
          const price = tiffinPricePerServing(n);
          return (
            <Pressable
              key={n}
              onPress={() => onSelect(n)}
              testID={`tiffin-meals-${n}`}
              style={[styles.mealsPill, active && styles.mealsPillActive]}
            >
              <Text style={[styles.mealsPillNum, active && styles.mealsPillNumActive]}>{n} meals</Text>
              <Text style={[styles.mealsPillPrice, active && styles.mealsPillPriceActive]}>
                S${price.toFixed(2)}/meal
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function SHCTiffinOrderSummary({
  mealsPerWeek,
  servings = 1,
  testID = 'tiffin-order-summary',
}: {
  mealsPerWeek: number;
  servings?: number;
  testID?: string;
}) {
  const perServing = tiffinPricePerServing(mealsPerWeek);
  const subtotal = tiffinWeeklySubtotal(mealsPerWeek, servings);
  return (
    <View testID={testID} style={styles.orderSummary}>
      <Text style={styles.orderSummaryTitle}>Order Summary</Text>
      <View style={styles.orderSummaryRow}>
        <Text style={styles.orderSummaryLabel}>Price per meal</Text>
        <Text style={styles.orderSummaryValue}>S${perServing.toFixed(2)}</Text>
      </View>
      <View style={styles.orderSummaryRow}>
        <Text style={styles.orderSummaryLabel}>Meals per week</Text>
        <Text style={styles.orderSummaryValue}>{mealsPerWeek}</Text>
      </View>
      <View style={[styles.orderSummaryRow, styles.orderSummaryTotal]}>
        <Text style={styles.orderSummaryTotalLabel}>Weekly subtotal</Text>
        <Text style={styles.orderSummaryTotalValue}>S${subtotal.toFixed(2)}</Text>
      </View>
      <Text style={styles.orderSummaryNote}>PayNow charged each week when orders generate.</Text>
    </View>
  );
}

export function SHCTiffinConfirmBanner({
  title = 'Your first collection is scheduled!',
  subtitle,
  testID = 'tiffin-confirm-banner',
}: {
  title?: string;
  subtitle?: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={styles.confirmBanner}>
      <Text style={styles.confirmTitle}>{title}</Text>
      <Text style={styles.confirmSubtitle}>
        {subtitle || 'You can change meals until midnight before each collection day.'}
      </Text>
    </View>
  );
}

export function SHCTiffinUpcomingWeeks({
  weeks,
  onSelectWeek,
  selectedWeek,
  testID = 'tiffin-upcoming-weeks',
}: {
  weeks: { week_start: string; label: string }[];
  onSelectWeek?: (weekStart: string) => void;
  selectedWeek?: string;
  testID?: string;
}) {
  return (
    <View testID={testID}>
      <Text style={styles.upcomingTitle}>Your upcoming collections</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upcomingRow}>
        {weeks.map((w) => {
          const active = w.week_start === selectedWeek;
          return (
            <Pressable
              key={w.week_start}
              onPress={() => onSelectWeek?.(w.week_start)}
              testID={`tiffin-week-card-${w.week_start}`}
              style={[styles.upcomingCard, active && styles.upcomingCardActive]}
            >
              <Text style={styles.upcomingCardLabel}>{w.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function SHCTiffinWeekTabBar({
  tabs,
  activeIndex,
  onSelect,
  testID = 'tiffin-week-tabs',
}: {
  tabs: { key: string; label: string; sublabel?: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
  testID?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      contentContainerStyle={styles.weekTabRow}
    >
      {tabs.map((tab, i) => {
        const active = i === activeIndex;
        return (
          <Pressable key={tab.key} onPress={() => onSelect(i)} testID={`tiffin-week-tab-${tab.key}`}>
            <View style={styles.weekTabItem}>
              <Text style={[styles.weekTabLabel, active && styles.weekTabLabelActive]}>{tab.label}</Text>
              {active ? <View style={styles.weekTabUnderline} /> : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SHCTiffinOrderLineItem({
  dish,
  dayLabel,
  price,
  onEdit,
  onRemove,
  testID,
}: {
  dish: TiffinDishOption;
  dayLabel?: string;
  price?: number;
  onEdit?: () => void;
  onRemove?: () => void;
  testID?: string;
}) {
  const imageUrl = getDishImageUrl({ id: dish.id, name: dish.name, cuisine: dish.cuisine, image_url: dish.image_url });
  const unit = price ?? dish.price ?? tiffinPricePerServing(3);
  return (
    <View testID={testID || `tiffin-order-line-${dish.id}`} style={styles.orderLine}>
      <SHCFoodImage uri={imageUrl} style={styles.orderLineImage} />
      <View style={styles.orderLineBody}>
        {dayLabel ? <Text style={styles.orderLineDay}>{dayLabel}</Text> : null}
        <Text style={styles.orderLineName}>{dish.name}</Text>
        <Text style={styles.orderLinePrice}>
          1 serving · <Text style={styles.orderLinePriceStrike}>S${(unit + 1).toFixed(2)}</Text>{' '}
          <Text style={styles.orderLinePriceSale}>S${Number(unit).toFixed(2)}</Text>
        </Text>
        <View style={styles.orderLineActions}>
          {onEdit ? (
            <Pressable onPress={onEdit} testID={`tiffin-edit-${dish.id}`}>
              <Text style={styles.orderLineAction}>Edit</Text>
            </Pressable>
          ) : null}
          {onRemove ? (
            <Pressable onPress={onRemove} testID={`tiffin-remove-${dish.id}`}>
              <Text style={styles.orderLineAction}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function SHCTiffinMenuListItem({
  dish,
  subtitle,
  onPress,
  testID,
}: {
  dish: TiffinDishOption;
  subtitle?: string;
  onPress: () => void;
  testID?: string;
}) {
  const imageUrl = getDishImageUrl({ id: dish.id, name: dish.name, cuisine: dish.cuisine, image_url: dish.image_url });
  return (
    <Pressable onPress={onPress} testID={testID || `tiffin-menu-item-${dish.id}`}>
      <View style={styles.menuListItem}>
        <SHCFoodImage uri={imageUrl} style={styles.menuListImage} />
        <View style={styles.menuListBody}>
          <Text style={styles.menuListName}>{dish.name}</Text>
          {subtitle ? <Text style={styles.menuListSubtitle} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function SHCTiffinManageSettings({
  cookName,
  mealsPerWeek,
  mealsOptions,
  collectionDayLabel,
  weeklyTotal,
  onChangeMeals,
  onManage,
  onCancel,
  testID = 'tiffin-manage-settings',
}: {
  cookName: string;
  mealsPerWeek: number;
  mealsOptions: number[];
  collectionDayLabel: string;
  weeklyTotal: string;
  onChangeMeals: (n: number) => void;
  onManage: () => void;
  onCancel: () => void;
  testID?: string;
}) {
  return (
    <View testID={testID} style={styles.manageSettings}>
      <Text style={styles.manageSettingsTitle}>Meals</Text>
      <Text style={styles.manageSettingsNote}>
        Changes apply to collections on or after your next cycle. Your default plan repeats weekly unless you change next week.
      </Text>
      <Text style={styles.manageSettingsLabel}>KITCHEN</Text>
      <Text style={styles.manageSettingsValue}>{cookName}</Text>
      <Text style={styles.manageSettingsLabel}>MEALS PER WEEK</Text>
      <View style={styles.manageMealsRow}>
        {mealsOptions.map((n) => (
          <Pressable
            key={n}
            onPress={() => onChangeMeals(n)}
            testID={`tiffin-manage-meals-${n}`}
            style={[styles.manageMealsChip, n === mealsPerWeek && styles.manageMealsChipActive]}
          >
            <Text style={[styles.manageMealsChipText, n === mealsPerWeek && styles.manageMealsChipTextActive]}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.manageSettingsLabel}>WEEKLY TOTAL</Text>
      <Text style={styles.manageSettingsValue}>{weeklyTotal}</Text>
      <Text style={styles.manageSettingsLabel}>COLLECTION DAYS</Text>
      <Text style={styles.manageSettingsValue}>{collectionDayLabel}</Text>
      <Pressable onPress={onManage} testID="tiffin-manage-plan-link">
        <Text style={styles.manageLink}>MANAGE WEEKLY PLAN</Text>
      </Pressable>
      <Pressable onPress={onCancel} testID="tiffin-cancel-sub-btn">
        <Text style={styles.manageCancelLink}>Pause / Cancel subscription</Text>
      </Pressable>
    </View>
  );
}

export function SHCTiffinDishChip({
  dish,
  selected,
  onPress,
  testID,
}: {
  dish: TiffinDishOption;
  selected?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const imageUrl = getDishImageUrl({ id: dish.id, name: dish.name, cuisine: dish.cuisine, image_url: dish.image_url });
  return (
    <Pressable onPress={onPress} testID={testID || `tiffin-dish-${dish.id}`}>
      {({ pressed }) => (
        <View style={[styles.dishChip, selected && styles.dishChipSelected, pressed && { opacity: 0.9 }]}>
          <SHCFoodImage uri={imageUrl} style={styles.dishChipImage} />
          <Text style={styles.dishChipName} numberOfLines={2}>{dish.name}</Text>
          {dish.price != null ? (
            <Text style={styles.dishChipPrice}>S${Number(dish.price).toFixed(2)}</Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

export function SHCTiffinWeeklyDayRow({
  dayOfWeek,
  dish,
  allowed,
  onPickDay,
  onPickDish,
  testID,
}: {
  dayOfWeek: number;
  dish?: TiffinDishOption | null;
  allowed: boolean;
  onPickDay: () => void;
  onPickDish: () => void;
  testID?: string;
}) {
  const label = TIFFIN_DAY_LABELS[dayOfWeek];
  return (
    <View
      testID={testID || `tiffin-day-row-${dayOfWeek}`}
      style={[styles.dayRow, !allowed && styles.dayRowDisabled]}
    >
      <Pressable
        onPress={allowed ? onPickDay : undefined}
        style={[styles.dayBadge, dish && styles.dayBadgeActive]}
        testID={`tiffin-day-badge-${dayOfWeek}`}
      >
        <Text style={[styles.dayBadgeText, dish && styles.dayBadgeTextActive]}>{label}</Text>
      </Pressable>
      <Pressable
        onPress={allowed ? onPickDish : undefined}
        style={styles.dayDishArea}
        testID={`tiffin-day-dish-${dayOfWeek}`}
      >
        {dish ? (
          <>
            <Text style={styles.dayDishName} numberOfLines={1}>{dish.name}</Text>
            <Text style={styles.dayDishHint}>Tap to change</Text>
          </>
        ) : (
          <Text style={styles.dayDishEmpty}>{allowed ? 'Choose a meal' : 'Not available'}</Text>
        )}
      </Pressable>
    </View>
  );
}

export function SHCTiffinDishPickerSheet({
  dishes,
  selectedId,
  onSelect,
  onClose,
  testID = 'tiffin-dish-picker',
}: {
  dishes: TiffinDishOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  testID?: string;
}) {
  return (
    <View testID={testID} style={styles.pickerSheet}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>Pick a dish</Text>
        <Pressable onPress={onClose} testID="tiffin-dish-picker-close">
          <Text style={styles.pickerClose}>Done</Text>
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={styles.pickerScroll}>
        {dishes.map((d) => (
          <SHCTiffinMenuListItem
            key={d.id}
            dish={d}
            subtitle={d.cuisine ? `${d.cuisine} · S$${Number(d.price || 0).toFixed(2)}` : undefined}
            onPress={() => onSelect(d.id)}
            testID={d.id === selectedId ? `tiffin-dish-selected-${d.id}` : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export function SHCTiffinPlannerScreen({
  title,
  subtitle,
  weekLabel,
  mealsPerWeek,
  collectionDays,
  slots,
  dishes,
  editingDay,
  onSelectDay,
  onSelectDish,
  onClosePicker,
  onSave,
  saveLabel = 'Save weekly plan',
  saveTestID = 'tiffin-save-plan-btn',
  saving,
  mode = 'template',
  testID = 'tiffin-planner-screen',
}: {
  title: string;
  subtitle?: string;
  weekLabel?: string;
  mealsPerWeek: number;
  collectionDays: number[];
  slots: TiffinPlanSlotDraft[];
  dishes: TiffinDishOption[];
  editingDay: number | null;
  onSelectDay: (day: number) => void;
  onSelectDish: (day: number, productId: string) => void;
  onClosePicker: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveTestID?: string;
  saving?: boolean;
  mode?: 'template' | 'next-week';
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  const filled = slots.length;
  const dishMap = Object.fromEntries(dishes.map((d) => [d.id, d]));
  const sortedSlots = [...slots].sort((a, b) => a.day_of_week - b.day_of_week);
  const weekTotal = sortedSlots.reduce((s, slot) => s + (dishMap[slot.product_id]?.price ?? tiffinPricePerServing(mealsPerWeek)), 0);

  return (
    <View testID={testID} style={styles.plannerScreen}>
      <ScrollView contentContainerStyle={[styles.plannerScroll, { paddingBottom: 120 + insets.bottom }]}>
        <Text style={styles.plannerScheduled}>{mode === 'next-week' ? 'NEXT WEEK' : 'SCHEDULED'}</Text>
        <Text style={styles.plannerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.plannerSubtitle}>{subtitle}</Text> : null}
        {weekLabel ? <Text style={styles.plannerWeek}>{weekLabel}</Text> : null}
        <Text style={styles.plannerProgress}>
          My Order · {filled} of {mealsPerWeek} meals
          {mode === 'template' ? ' · repeats weekly' : ''}
        </Text>

        {sortedSlots.map((slot) => {
          const dish = dishMap[slot.product_id];
          if (!dish) return null;
          return (
            <SHCTiffinOrderLineItem
              key={slot.day_of_week}
              dish={dish}
              dayLabel={TIFFIN_DAY_LABELS[slot.day_of_week]}
              price={dish.price}
              onEdit={() => onSelectDay(slot.day_of_week)}
              onRemove={() => onSelectDay(slot.day_of_week)}
            />
          );
        })}

        {filled < mealsPerWeek ? (
          <Pressable onPress={() => {
            const openDay = collectionDays.find((d) => !slots.find((s) => s.day_of_week === d));
            if (openDay != null) onSelectDay(openDay);
          }} testID="tiffin-add-meal-slot">
            <View style={styles.addMealRow}>
              <Text style={styles.addMealPlus}>+</Text>
              <Text style={styles.addMealText}>Add a meal · pick from kitchen menu</Text>
            </View>
          </Pressable>
        ) : null}

        {TIFFIN_DAY_LABELS.map((_, dayOfWeek) => {
          if (!collectionDays.includes(dayOfWeek) || slots.find((s) => s.day_of_week === dayOfWeek)) return null;
          return (
            <SHCTiffinWeeklyDayRow
              key={dayOfWeek}
              dayOfWeek={dayOfWeek}
              dish={null}
              allowed
              onPickDay={() => onSelectDay(dayOfWeek)}
              onPickDish={() => onSelectDay(dayOfWeek)}
            />
          );
        })}
      </ScrollView>

      {editingDay != null ? (
        <SHCTiffinDishPickerSheet
          dishes={dishes}
          selectedId={slots.find((s) => s.day_of_week === editingDay)?.product_id}
          onSelect={(id) => onSelectDish(editingDay, id)}
          onClose={onClosePicker}
        />
      ) : null}

      <View style={[styles.plannerFooter, { paddingBottom: insets.bottom + shcSpacing.md }]}>
        <GourmeatPrimaryButton
          label={filled === mealsPerWeek ? `${saveLabel}${weekTotal > 0 ? ` · S$${weekTotal.toFixed(2)}` : ''}` : saveLabel}
          onPress={onSave}
          disabled={filled !== mealsPerWeek || saving}
          loading={saving}
          testID={saveTestID}
        />
      </View>
    </View>
  );
}

export function SHCTiffinManageCard({
  cookName,
  mealsPerWeek,
  status,
  currentWeekLabel,
  nextWeekLabel,
  onEditPlan,
  onEditNextWeek,
  onCancel,
  testID = 'tiffin-manage-card',
}: {
  cookName: string;
  mealsPerWeek: number;
  status: string;
  currentWeekLabel?: string;
  nextWeekLabel?: string;
  onEditPlan: () => void;
  onEditNextWeek: () => void;
  onCancel: () => void;
  testID?: string;
}) {
  return (
    <View testID={testID} style={styles.manageCard}>
      <Text style={styles.manageTitle}>{cookName}</Text>
      <Text style={styles.manageMeta}>{mealsPerWeek} meals/week · {status}</Text>
      {currentWeekLabel ? <Text style={styles.manageWeek}>This week: {currentWeekLabel}</Text> : null}
      {nextWeekLabel ? <Text style={styles.manageWeek}>Next week: {nextWeekLabel}</Text> : null}
      <View style={styles.manageActions}>
        <GourmeatPrimaryButton label="Edit weekly plan" onPress={onEditPlan} testID="tiffin-edit-plan-btn" />
        <GourmeatPrimaryButton
          label="Change next week"
          variant="outline"
          onPress={onEditNextWeek}
          testID="tiffin-edit-next-week-btn"
          style={{ marginTop: shcSpacing.sm }}
        />
        <Pressable onPress={onCancel} testID="tiffin-cancel-sub-btn" style={styles.cancelLink}>
          <Text style={styles.cancelText}>Cancel subscription</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SHCTiffinCookDishToggle({
  dish,
  enabled,
  onToggle,
  testID,
}: {
  dish: TiffinDishOption;
  enabled: boolean;
  onToggle: () => void;
  testID?: string;
}) {
  const imageUrl = getDishImageUrl({ id: dish.id, name: dish.name, cuisine: dish.cuisine, image_url: dish.image_url });
  return (
    <Pressable onPress={onToggle} testID={testID || `tiffin-cook-dish-${dish.id}`}>
      <View style={[styles.cookDishRow, enabled && styles.cookDishRowOn]}>
        <SHCFoodImage uri={imageUrl} style={styles.cookDishThumb} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cookDishName}>{dish.name}</Text>
          {dish.price != null ? <Text style={styles.cookDishPrice}>S${Number(dish.price).toFixed(2)}</Text> : null}
        </View>
        <View style={[styles.cookToggle, enabled && styles.cookToggleOn]}>
          <Text style={styles.cookToggleText}>{enabled ? '✓' : ''}</Text>
        </View>
      </View>
    </Pressable>
  );
}

/** HomelyEats ref 25 — horizontal day calendar strip */
export function SHCTiffinCalendarStrip({
  days,
  selectedDate,
  todayDate,
  onSelect,
  testID = 'tiffin-calendar-strip',
}: {
  days: { date: string; label: string; hasMeal?: boolean }[];
  selectedDate: string;
  /** ISO date for "today" — mint ring + scroll-into-view on mount */
  todayDate?: string;
  onSelect: (date: string) => void;
  testID?: string;
}) {
  const scrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    if (!todayDate) return;
    const idx = days.findIndex((d) => d.date === todayDate);
    if (idx < 0) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: Math.max(0, idx * 60 - 48), animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [todayDate, days]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      contentContainerStyle={styles.calStrip}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {days.map((d) => {
        const active = d.date === selectedDate;
        const isToday = todayDate != null && d.date === todayDate;
        return (
          <Pressable
            key={d.date}
            onPress={() => onSelect(d.date)}
            testID={isToday ? `tiffin-cal-day-${d.date}-today` : `tiffin-cal-day-${d.date}`}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={isToday ? `Today ${d.date.slice(8, 10)}` : `${d.label} ${d.date.slice(8, 10)}`}
            style={[
              styles.calDay,
              d.hasMeal && styles.calDayHasMeal,
              isToday && !active && styles.calDayToday,
              active && styles.calDayActive,
            ]}
          >
            <Text
              style={[
                styles.calDayLabel,
                isToday && !active && styles.calDayLabelToday,
                active && styles.calDayLabelActive,
              ]}
            >
              {isToday ? 'Today' : d.label}
            </Text>
            <Text style={[styles.calDayNum, active && styles.calDayLabelActive]}>{d.date.slice(8, 10)}</Text>
            {d.hasMeal ? (
              <View
                style={[
                  styles.calMealDot,
                  active ? styles.calMealDotActive : isToday ? styles.calMealDotToday : styles.calMealDotDefault,
                ]}
              />
            ) : isToday && !active ? (
              <View style={styles.calTodayDot} />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export type TiffinOrderCardStatus =
  | 'indeterminate'
  | 'scheduled'
  | 'delivered'
  | 'skipped'
  | 'canceled_by_kitchen';

/** HomelyEats ref 25 — order card status variants */
export function SHCTiffinOrderStatusCard({
  cookName,
  planTitle,
  status,
  timeslot,
  menuLines,
  customizable,
  menuPending,
  onSkip,
  onManage,
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
  testID?: string;
}) {
  const chip =
    status === 'delivered'
      ? { bg: '#E8F5E9', text: 'Delivered', color: '#2E7D32' }
      : status === 'skipped'
        ? { bg: '#FFF3E0', text: 'Skipped', color: '#E65100' }
        : status === 'canceled_by_kitchen'
          ? { bg: '#FFEBEE', text: 'Canceled by kitchen', color: '#C62828' }
          : status === 'indeterminate'
            ? { bg: '#F5F5F5', text: 'Upcoming', color: '#616161' }
            : { bg: '#E3F2FD', text: 'Scheduled', color: '#1565C0' };
  return (
    <View testID={testID || `tiffin-order-card-${status}`} style={styles.orderStatusCard}>
      <View style={styles.orderStatusHeader}>
        <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
          <Text style={[styles.statusChipText, { color: chip.color }]}>{chip.text}</Text>
        </View>
        {timeslot ? <Text style={styles.orderTimeslot}>{timeslot}</Text> : null}
        {customizable ? (
          <Text style={styles.customizableTag} testID="tiffin-customizable-tag">
            CUSTOMIZABLE
          </Text>
        ) : null}
      </View>
      <Text style={styles.orderCookName}>{cookName}</Text>
      {planTitle ? <Text style={styles.orderPlanTitle}>{planTitle}</Text> : null}
      {menuPending ? (
        <Text style={styles.menuPending}>Menu yet to be updated</Text>
      ) : (
        (menuLines || []).map((line) => (
          <Text key={line} style={styles.menuLine}>
            · {line}
          </Text>
        ))
      )}
      <View style={styles.orderCardActions}>
        {onManage ? (
          <GourmeatPrimaryButton label="Manage" variant="outline" onPress={onManage} testID="tiffin-order-manage-btn" />
        ) : null}
        {onSkip && status === 'scheduled' ? (
          <GourmeatPrimaryButton label="Skip day" variant="outline" onPress={onSkip} testID="tiffin-order-skip-btn" />
        ) : null}
      </View>
    </View>
  );
}

/** HomelyEats ref 29 — plan metrics row */
export function SHCTiffinPlanMetrics({
  deliveriesLeft,
  flexLeft,
  flexQuota,
  expiresOn,
  balanceLabel,
  testID = 'tiffin-plan-metrics',
}: {
  deliveriesLeft?: number | string;
  flexLeft?: number;
  flexQuota?: number;
  expiresOn?: string | null;
  balanceLabel?: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={styles.metricsRow}>
      {balanceLabel != null ? (
        <View style={styles.metricCell}>
          <Text style={styles.metricValue}>{balanceLabel}</Text>
          <Text style={styles.metricLabel}>Plan</Text>
        </View>
      ) : null}
      <View style={styles.metricCell}>
        <Text style={styles.metricValue}>{deliveriesLeft ?? '—'}</Text>
        <Text style={styles.metricLabel}>Deliveries left</Text>
      </View>
      <View style={styles.metricCell}>
        <Text style={styles.metricValue}>
          {flexLeft != null ? `${flexLeft}${flexQuota != null ? `/${flexQuota}` : ''}` : '—'}
        </Text>
        <Text style={styles.metricLabel}>Flex days</Text>
      </View>
      <View style={styles.metricCell}>
        <Text style={styles.metricValue}>{expiresOn ? expiresOn.slice(5) : '—'}</Text>
        <Text style={styles.metricLabel}>Expires</Text>
      </View>
    </View>
  );
}

/** HomelyEats ref 34 — empty state (+ optional plate/box illustration) */
export function SHCTiffinEmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  testID = 'tiffin-empty-state',
  illustration,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
  illustration?: import('@shc/utils').EmptyIllustrationKind;
}) {
  return (
    <View testID={testID} style={styles.emptyState}>
      {illustration ? (
        <EmptyIllustration kind={illustration} size={120} />
      ) : (
        <Text style={styles.emptyEmoji}>🍱</Text>
      )}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <GourmeatPrimaryButton
          label={actionLabel}
          onPress={onAction}
          testID="tiffin-empty-action"
          style={{ marginTop: shcSpacing.md }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  calStrip: { gap: 8, paddingVertical: shcSpacing.sm },
  calDay: {
    width: 52,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: gourmeatColors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: gourmeatColors.border,
  },
  calDayToday: {
    backgroundColor: shcColors.bentoMint,
    borderWidth: 2,
    borderColor: shcColors.success,
  },
  calDayActive: { backgroundColor: gourmeatColors.primary, borderColor: gourmeatColors.primary },
  calDayHasMeal: { borderColor: gourmeatColors.primary },
  calDayLabel: { fontSize: 10, fontWeight: '700', color: gourmeatColors.textLight },
  calDayLabelToday: { color: shcColors.success, fontWeight: '800' },
  calDayLabelActive: { color: '#fff' },
  calDayNum: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text, marginTop: 2 },
  calMealDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  calMealDotDefault: { backgroundColor: gourmeatColors.primary },
  calMealDotToday: { backgroundColor: shcColors.success },
  calMealDotActive: { backgroundColor: '#fff' },
  calTodayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
    backgroundColor: shcColors.success,
  },
  orderStatusCard: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.lg,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.sm,
    ...gourmeatShadows.soft,
  },
  orderStatusHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  statusChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusChipText: { fontSize: 11, fontWeight: '800' },
  orderTimeslot: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight },
  customizableTag: { fontSize: 10, fontWeight: '800', color: gourmeatColors.primary },
  orderCookName: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text },
  orderPlanTitle: { fontSize: 13, color: gourmeatColors.textLight, marginTop: 2 },
  menuPending: { fontSize: 12, fontStyle: 'italic', color: gourmeatColors.textLight, marginTop: 8 },
  menuLine: { fontSize: 13, color: gourmeatColors.text, marginTop: 4 },
  orderCardActions: { flexDirection: 'row', gap: 8, marginTop: shcSpacing.md },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.lg,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.md,
    ...gourmeatShadows.soft,
  },
  metricCell: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 15, fontWeight: '800', color: gourmeatColors.primary },
  metricLabel: { fontSize: 10, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 2, textAlign: 'center' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: shcSpacing.xl * 1.5,
    paddingHorizontal: shcSpacing.lg,
    minHeight: 280,
    gap: shcSpacing.md,
  },
  emptyEmoji: { fontSize: 40, marginBottom: shcSpacing.sm },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  emptySubtitle: { fontSize: 13, color: gourmeatColors.textLight, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  heroBanner: {
    backgroundColor: gourmeatColors.primary,
    borderRadius: gourmeatRadii.lg,
    padding: shcSpacing.lg,
    ...gourmeatShadows.soft,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroHighlight: { fontSize: 18, fontWeight: '800', color: '#FFF8F0', marginTop: 4, marginBottom: 8 },
  heroBullet: { fontSize: 13, color: 'rgba(255,255,255,0.92)', lineHeight: 20, marginTop: 2 },
  heroSubtitle: { fontSize: 13, color: gourmeatColors.textLight, marginTop: 6, lineHeight: 18 },
  filterRow: { gap: 8, paddingBottom: shcSpacing.sm },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: gourmeatColors.surface,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
  },
  filterChipActive: { backgroundColor: gourmeatColors.primary, borderColor: gourmeatColors.primary },
  filterChipText: { fontSize: 13, fontWeight: '700', color: gourmeatColors.text },
  filterChipTextActive: { color: '#fff' },
  sectionEyebrow: {
    fontSize: 12,
    lineHeight: 12,
    fontWeight: '700',
    color: gourmeatColors.textLight,
    textAlign: 'center',
  },
  catRow: { gap: 14 },
  catItem: { alignItems: 'center', width: 72 },
  catCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: gourmeatColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    ...gourmeatShadows.soft,
  },
  catCircleActive: { borderColor: gourmeatColors.primary, borderWidth: 2 },
  catEmoji: { fontSize: 28 },
  catLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    textAlign: 'center',
  },
  catLabelActive: { color: gourmeatColors.primary, fontWeight: '800' },
  kitchenCardFeatured: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.lg,
    marginBottom: shcSpacing.stack,
    overflow: 'hidden',
    ...gourmeatShadows.soft,
  },
  kitchenCoverWrap: { position: 'relative' },
  kitchenCover: { width: '100%', height: 160, backgroundColor: gourmeatColors.border },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favIcon: { fontSize: 18, color: gourmeatColors.primary },
  kitchenBodyPad: { padding: shcSpacing.md },
  kitchenTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kitchenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.lg,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.sm,
    ...gourmeatShadows.soft,
  },
  kitchenAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: shcSpacing.md },
  kitchenBody: { flex: 1 },
  kitchenName: { fontSize: 17, fontWeight: '800', color: gourmeatColors.text, flex: 1 },
  kitchenArea: { fontSize: 12, color: gourmeatColors.textLight, marginTop: 2 },
  kitchenTagline: { fontSize: 13, color: gourmeatColors.textLight, marginTop: 4 },
  openRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  openDot: { fontSize: 13, fontWeight: '800' },
  closesAt: { fontSize: 12, color: gourmeatColors.textLight, fontWeight: '600' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingStar: { color: '#F5A623', fontSize: 13, fontWeight: '800' },
  ratingText: { fontSize: 12, fontWeight: '700', color: gourmeatColors.text },
  kitchenMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: shcSpacing.md,
  },
  kitchenMetaPrice: { fontSize: 13, fontWeight: '800', color: gourmeatColors.text },
  kitchenMetaSubs: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight },
  kitchenMeta: { fontSize: 11, fontWeight: '600', color: gourmeatColors.primary },
  kitchenChevron: { fontSize: 22, color: gourmeatColors.textMuted, marginLeft: shcSpacing.sm },
  sectionQuestion: { fontSize: 18, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.sm },
  kitchenHero: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.lg,
    overflow: 'hidden',
    marginBottom: shcSpacing.md,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    ...gourmeatShadows.soft,
  },
  kitchenHeroImage: { width: '100%', height: 168 },
  kitchenHeroBody: { padding: shcSpacing.md },
  kitchenHeroTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  kitchenHeroTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: gourmeatColors.text },
  kitchenHeroRating: {
    backgroundColor: '#1C1C1C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  kitchenHeroRatingText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  kitchenHeroSubtitle: { fontSize: 13, color: gourmeatColors.textLight, marginTop: 4, lineHeight: 18 },
  kitchenHeroOpen: { fontSize: 13, fontWeight: '800', marginTop: 8 },
  kitchenHeroOpenDetail: { fontWeight: '600', color: gourmeatColors.textLight },
  kitchenHeroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  kitchenHeroTag: {
    backgroundColor: '#FFF0EB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
  },
  kitchenHeroTagText: { fontSize: 11, fontWeight: '700', color: gourmeatColors.text },
  kitchenHeroNote: { fontSize: 12, color: gourmeatColors.textMuted, marginTop: shcSpacing.sm, lineHeight: 17 },
  mealsPickerRow: { flexDirection: 'row', gap: shcSpacing.sm, paddingVertical: shcSpacing.sm },
  mealsPill: {
    minWidth: 108,
    paddingVertical: shcSpacing.md,
    paddingHorizontal: shcSpacing.md,
    borderRadius: gourmeatRadii.md,
    backgroundColor: gourmeatColors.surface,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    marginRight: shcSpacing.sm,
  },
  mealsPillActive: { borderColor: gourmeatColors.primary, backgroundColor: gourmeatColors.primaryLight },
  mealsPillNum: { fontSize: 15, fontWeight: '800', color: gourmeatColors.text },
  mealsPillNumActive: { color: gourmeatColors.primary },
  mealsPillPrice: { fontSize: 11, color: gourmeatColors.textLight, marginTop: 4 },
  mealsPillPriceActive: { color: gourmeatColors.primary, fontWeight: '600' },
  orderSummary: {
    backgroundColor: gourmeatColors.surfaceAlt,
    borderRadius: gourmeatRadii.md,
    padding: shcSpacing.md,
    marginTop: shcSpacing.md,
  },
  orderSummaryTitle: { fontSize: 14, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.sm },
  orderSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderSummaryLabel: { fontSize: 13, color: gourmeatColors.textLight },
  orderSummaryValue: { fontSize: 13, fontWeight: '600', color: gourmeatColors.text },
  orderSummaryTotal: { marginTop: shcSpacing.sm, paddingTop: shcSpacing.sm, borderTopWidth: 1, borderTopColor: gourmeatColors.border },
  orderSummaryTotalLabel: { fontSize: 14, fontWeight: '800', color: gourmeatColors.text },
  orderSummaryTotalValue: { fontSize: 14, fontWeight: '800', color: gourmeatColors.primary },
  orderSummaryNote: { fontSize: 11, color: gourmeatColors.textMuted, marginTop: shcSpacing.sm },
  confirmBanner: { alignItems: 'center', paddingVertical: shcSpacing.lg },
  confirmTitle: { fontSize: 22, fontWeight: '800', color: gourmeatColors.primary, textAlign: 'center' },
  confirmSubtitle: { fontSize: 13, color: gourmeatColors.textLight, textAlign: 'center', marginTop: shcSpacing.sm, lineHeight: 18 },
  upcomingTitle: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.sm },
  upcomingRow: { gap: shcSpacing.sm, paddingBottom: shcSpacing.sm },
  upcomingCard: {
    minWidth: 120,
    padding: shcSpacing.md,
    borderRadius: gourmeatRadii.md,
    backgroundColor: gourmeatColors.surfaceAlt,
    alignItems: 'center',
    marginRight: shcSpacing.sm,
  },
  upcomingCardActive: { backgroundColor: gourmeatColors.primaryLight, borderWidth: 2, borderColor: gourmeatColors.primary },
  upcomingCardLabel: { fontSize: 12, fontWeight: '700', color: gourmeatColors.text, textAlign: 'center' },
  weekTabRow: { paddingVertical: shcSpacing.sm, gap: shcSpacing.lg, paddingHorizontal: shcSpacing.xs },
  weekTabItem: { alignItems: 'center', minWidth: 56 },
  weekTabLabel: { fontSize: 12, fontWeight: '700', color: gourmeatColors.textMuted },
  weekTabLabelActive: { color: gourmeatColors.primary },
  weekTabUnderline: { height: 3, width: '100%', backgroundColor: gourmeatColors.primary, borderRadius: 2, marginTop: 4 },
  orderLine: {
    flexDirection: 'row',
    paddingVertical: shcSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: gourmeatColors.border,
  },
  orderLineImage: { width: 72, height: 72, borderRadius: gourmeatRadii.sm, marginRight: shcSpacing.md },
  orderLineBody: { flex: 1 },
  orderLineDay: { fontSize: 11, fontWeight: '700', color: gourmeatColors.primary, marginBottom: 2 },
  orderLineName: { fontSize: 15, fontWeight: '800', color: gourmeatColors.text },
  orderLinePrice: { fontSize: 12, color: gourmeatColors.textLight, marginTop: 4 },
  orderLinePriceStrike: { textDecorationLine: 'line-through' },
  orderLinePriceSale: { color: gourmeatColors.primary, fontWeight: '700' },
  orderLineActions: { flexDirection: 'row', gap: shcSpacing.md, marginTop: shcSpacing.sm },
  orderLineAction: { fontSize: 13, fontWeight: '700', color: gourmeatColors.primary },
  menuListItem: {
    flexDirection: 'row',
    paddingVertical: shcSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: gourmeatColors.border,
  },
  menuListImage: { width: 88, height: 88, borderRadius: gourmeatRadii.sm, marginRight: shcSpacing.md },
  menuListBody: { flex: 1, justifyContent: 'center' },
  menuListName: { fontSize: 16, fontWeight: '800', color: gourmeatColors.primary },
  menuListSubtitle: { fontSize: 13, color: gourmeatColors.textLight, marginTop: 4 },
  manageSettings: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.lg,
    padding: shcSpacing.lg,
    ...gourmeatShadows.soft,
  },
  manageSettingsTitle: { fontSize: 20, fontWeight: '800', color: gourmeatColors.text },
  manageSettingsNote: { fontSize: 12, color: gourmeatColors.textLight, marginTop: shcSpacing.sm, lineHeight: 18 },
  manageSettingsLabel: { fontSize: 11, fontWeight: '800', color: gourmeatColors.textMuted, marginTop: shcSpacing.md, letterSpacing: 0.5 },
  manageSettingsValue: { fontSize: 15, fontWeight: '600', color: gourmeatColors.text, marginTop: 4 },
  manageMealsRow: { flexDirection: 'row', gap: shcSpacing.sm, marginTop: shcSpacing.sm },
  manageMealsChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageMealsChipActive: { borderColor: gourmeatColors.primary, backgroundColor: gourmeatColors.primaryLight },
  manageMealsChipText: { fontSize: 15, fontWeight: '800', color: gourmeatColors.text },
  manageMealsChipTextActive: { color: gourmeatColors.primary },
  manageLink: { fontSize: 13, fontWeight: '800', color: gourmeatColors.primary, marginTop: shcSpacing.lg, letterSpacing: 0.3 },
  manageCancelLink: { fontSize: 13, fontWeight: '700', color: '#c0392b', marginTop: shcSpacing.md },
  dishChip: {
    width: 120,
    marginRight: shcSpacing.sm,
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.md,
    padding: shcSpacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...gourmeatShadows.soft,
  },
  dishChipSelected: { borderColor: gourmeatColors.primary },
  dishChipImage: { width: '100%', height: 72, borderRadius: gourmeatRadii.sm },
  dishChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: gourmeatColors.text,
    marginTop: shcSpacing.categoryStackGap,
    lineHeight: 14,
  },
  dishChipPrice: { fontSize: 11, color: gourmeatColors.primary, fontWeight: '700', marginTop: 2 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.md,
    padding: shcSpacing.sm,
    marginBottom: shcSpacing.sm,
    ...gourmeatShadows.soft,
  },
  dayRowDisabled: { opacity: 0.45 },
  dayBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: gourmeatColors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: shcSpacing.sm,
  },
  dayBadgeActive: { backgroundColor: gourmeatColors.primary },
  dayBadgeText: { fontSize: 12, fontWeight: '800', color: gourmeatColors.textLight },
  dayBadgeTextActive: { color: gourmeatColors.onPrimary },
  dayDishArea: { flex: 1 },
  dayDishName: { fontSize: 14, fontWeight: '700', color: gourmeatColors.text },
  dayDishHint: { fontSize: 11, color: gourmeatColors.textLight, marginTop: 2 },
  dayDishEmpty: { fontSize: 13, color: gourmeatColors.textMuted, fontWeight: '600' },
  pickerSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 88,
    backgroundColor: gourmeatColors.surface,
    borderTopLeftRadius: gourmeatRadii.lg,
    borderTopRightRadius: gourmeatRadii.lg,
    paddingVertical: shcSpacing.md,
    ...gourmeatShadows.lift,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: shcSpacing.md,
    marginBottom: shcSpacing.sm,
  },
  pickerTitle: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text },
  pickerClose: { fontSize: 14, fontWeight: '700', color: gourmeatColors.primary },
  pickerScroll: { paddingHorizontal: shcSpacing.md },
  plannerScreen: { flex: 1, backgroundColor: gourmeatColors.background },
  plannerScroll: { padding: shcSpacing.md },
  plannerScheduled: { fontSize: 11, fontWeight: '800', color: '#2d8a4e', letterSpacing: 0.5 },
  plannerTitle: { fontSize: 26, fontWeight: '800', color: gourmeatColors.text },
  addMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: shcSpacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: gourmeatColors.border,
    borderRadius: gourmeatRadii.md,
    marginTop: shcSpacing.sm,
  },
  addMealPlus: { fontSize: 22, fontWeight: '700', color: gourmeatColors.primary, marginRight: shcSpacing.sm },
  addMealText: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight },
  plannerSubtitle: { fontSize: 13, color: gourmeatColors.textLight, marginTop: 4 },
  plannerWeek: { fontSize: 12, fontWeight: '700', color: gourmeatColors.primary, marginTop: shcSpacing.sm },
  plannerProgress: { fontSize: 12, color: gourmeatColors.textLight, marginVertical: shcSpacing.md },
  plannerFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: shcSpacing.md,
    paddingTop: shcSpacing.md,
    backgroundColor: gourmeatColors.surface,
    borderTopWidth: 1,
    borderTopColor: gourmeatColors.border,
  },
  manageCard: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.lg,
    padding: shcSpacing.lg,
    ...gourmeatShadows.soft,
  },
  manageTitle: { fontSize: 20, fontWeight: '800', color: gourmeatColors.text },
  manageMeta: { fontSize: 13, color: gourmeatColors.textLight, marginTop: 4 },
  manageWeek: { fontSize: 12, color: gourmeatColors.text, marginTop: shcSpacing.sm },
  manageActions: { marginTop: shcSpacing.lg },
  cancelLink: { alignItems: 'center', marginTop: shcSpacing.md, padding: shcSpacing.sm },
  cancelText: { fontSize: 13, fontWeight: '700', color: '#c0392b' },
  cookDishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.md,
    padding: shcSpacing.sm,
    marginBottom: shcSpacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cookDishRowOn: { borderColor: gourmeatColors.primary, backgroundColor: gourmeatColors.primaryLight },
  cookDishThumb: { width: 48, height: 48, borderRadius: gourmeatRadii.sm, marginRight: shcSpacing.sm },
  cookDishName: { fontSize: 14, fontWeight: '700', color: gourmeatColors.text },
  cookDishPrice: { fontSize: 12, color: gourmeatColors.primary, fontWeight: '600' },
  cookToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookToggleOn: { backgroundColor: gourmeatColors.primary, borderColor: gourmeatColors.primary },
  cookToggleText: { color: gourmeatColors.onPrimary, fontWeight: '800', fontSize: 14 },
});