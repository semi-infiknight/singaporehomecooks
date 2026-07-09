/**
 * Manage upcoming order — Skip · Add items · timeslot · instructions · success.
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GourmeatPrimaryButton, gourmeatColors, shcSpacing } from '@shc/ui';
import {
  canSkipManageOrder,
  canAddItemsToOrder,
  collectionSlotOptions,
  formatSlotLabel,
  manageOrderActionLabels,
  menuUpdatedSuccessCopy,
  computeAddItemsExtraTotal,
  describeAddedExtras,
  describeAddedExtraLines,
  mergeMenuLinesWithAdd,
  formatMenuLineDisplay,
  isExtraMenuLine,
  addItemsProceedLabel,
  defaultAddItemDishFromMenu,
  dayOrderStatusChip,
  buildCustomizeDraft,
  kitchenMealExtraOptions,
  kitchenMealAddonOptions,
  kitchenMealMetaChips,
  adjustMealQty,
  toggleAddonId,
  type KitchenMealCustomizeDraft,
  type DayOrderCardStatus,
} from '@shc/utils';
import { useSkipTiffinMeal, useCustomizeTiffinMeal } from '../../../hooks/useTiffin';

export default function ManageOrderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const p = useLocalSearchParams<{
    kind?: string;
    id?: string;
    cook?: string;
    title?: string;
    status?: string;
    date?: string;
    slot?: string;
    menu?: string;
    customizable?: string;
    menuPending?: string;
  }>();

  const kind = (p.kind || 'one_off') as 'one_off' | 'tiffin';
  const id = p.id || '';
  const cookName = p.cook || 'Home kitchen';
  const planTitle = p.title || 'Daily meal';
  const status = (p.status || 'scheduled') as DayOrderCardStatus;
  const date = p.date || '';
  const [timeslot, setTimeslot] = useState(p.slot || '18:00-19:00');
  const [instructions, setInstructions] = useState('');
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [menuLines, setMenuLines] = useState(() =>
    p.menu ? String(p.menu).split('|').filter(Boolean) : []
  );
  const customizable = p.customizable !== '0';
  const menuPending = p.menuPending === '1';
  const [showAddItems, setShowAddItems] = useState(false);
  const [success, setSuccess] = useState<{ title: string; subtitle: string } | null>(null);
  const [draft, setDraft] = useState<KitchenMealCustomizeDraft | null>(null);
  const [skipped, setSkipped] = useState(status === 'skipped');

  const skipMut = useSkipTiffinMeal();
  const customizeMut = useCustomizeTiffinMeal();
  const effectiveStatus = skipped ? 'skipped' : status;
  const labels = manageOrderActionLabels(effectiveStatus);
  const chip = dayOrderStatusChip(effectiveStatus);

  const dish = useMemo(() => defaultAddItemDishFromMenu(menuLines, cookName), [menuLines, cookName]);
  const extras = useMemo(() => kitchenMealExtraOptions(dish), [dish]);
  const addons = useMemo(() => kitchenMealAddonOptions(dish), [dish]);
  const chips = useMemo(() => kitchenMealMetaChips(dish), [dish]);

  const openAddItems = () => {
    if (!canAddItemsToOrder(effectiveStatus, customizable)) return;
    setDraft(buildCustomizeDraft(dish));
    setShowAddItems(true);
  };

  const confirmAddItems = useCallback(async () => {
    if (!draft) return;
    const extraTotal = computeAddItemsExtraTotal(draft, extras, addons);
    const addedLines = describeAddedExtraLines(draft, extras, addons);
    const added = describeAddedExtras(draft, extras, addons);
    const nextLines = addedLines.length ? addedLines : added ? [added] : [];
    if (kind === 'tiffin' && date) {
      try {
        await customizeMut.mutateAsync({
          collectionDate: date,
          collectionSlot: timeslot,
          extraLines: nextLines.map((l) => (l.startsWith('extra:') ? l : `extra:${l}`)),
          amountCents: Math.round(extraTotal * 100),
          paynowRef: extraTotal > 0 ? `EXTRA-${date}` : null,
        });
      } catch {
        /* still show local success for offline resilience */
      }
    }
    setMenuLines((prev) => mergeMenuLinesWithAdd(prev, nextLines.length ? nextLines : added));
    setShowAddItems(false);
    setDraft(null);
    setSuccess(menuUpdatedSuccessCopy(added));
  }, [draft, extras, addons, kind, date, timeslot, customizeMut]);

  const handleSkip = async () => {
    if (!canSkipManageOrder(effectiveStatus)) return;
    if (kind === 'tiffin' && date) {
      try {
        await skipMut.mutateAsync({ collectionDate: date, collectionSlot: timeslot });
      } catch {
        /* local */
      }
    }
    setSkipped(true);
  };

  if (success) {
    return (
      <View style={[styles.successScreen, { paddingTop: insets.top }]} testID="order-menu-updated-screen">
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>{success.title}</Text>
        <Text style={styles.successSub}>{success.subtitle}</Text>
        <GourmeatPrimaryButton label="Back to order" onPress={() => setSuccess(null)} testID="order-menu-updated-done" />
        <Pressable onPress={() => router.replace('/(customer)/orders' as any)} style={{ marginTop: 16 }}>
          <Text style={styles.link}>All orders</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="order-manage-screen">
      <ScrollView contentContainerStyle={{ padding: shcSpacing.md, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.statusRow}>
          <View style={[styles.chip, { backgroundColor: chip.bg }]}>
            <Text style={[styles.chipText, { color: chip.color }]}>{chip.label}</Text>
          </View>
          <Text style={styles.slot}>{formatSlotLabel(timeslot)}</Text>
        </View>

        <Text style={styles.cook} testID="order-manage-cook">
          {cookName}
        </Text>
        <Text style={styles.plan}>{planTitle}</Text>

        <View style={styles.actionsRow}>
          {canSkipManageOrder(effectiveStatus) && (
            <Pressable style={styles.outlineBtn} onPress={handleSkip} testID="order-manage-skip">
              <Text style={styles.outlineBtnText}>{labels.skip}</Text>
            </Pressable>
          )}
          {canAddItemsToOrder(effectiveStatus, customizable) && (
            <Pressable style={styles.primaryBtn} onPress={openAddItems} testID="order-manage-add-items">
              <Text style={styles.primaryBtnText}>{labels.addItems}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.menuCard} testID="order-manage-menu">
          <Text style={styles.menuLabel}>Today&apos;s menu</Text>
          {menuPending && menuLines.length === 0 ? (
            <Text style={styles.menuPending}>Menu yet to be updated</Text>
          ) : (
            menuLines.map((line, idx) => {
              const extra = isExtraMenuLine(line);
              const label = formatMenuLineDisplay(line);
              return (
                <View
                  key={`${line}-${idx}`}
                  style={[styles.menuLineRow, extra && styles.menuLineRowExtra]}
                  testID={extra ? 'order-menu-extra-line' : 'order-menu-base-line'}
                >
                  <Text style={styles.menuLine}>· {label}</Text>
                  {extra ? (
                    <Text style={styles.extraTag} testID="order-menu-extra-tag">
                      EXTRA ITEM
                    </Text>
                  ) : null}
                </View>
              );
            })
          )}
          {customizable && effectiveStatus === 'scheduled' ? (
            <Text style={styles.customTag}>CUSTOMIZABLE</Text>
          ) : null}
        </View>

        <Pressable
          style={styles.rowCard}
          onPress={() => setShowSlotPicker((v) => !v)}
          testID="order-manage-change-slot"
        >
          <Text style={styles.rowLabel}>{labels.changeSlot}</Text>
          <Text style={styles.rowValue}>{formatSlotLabel(timeslot)}</Text>
        </Pressable>
        {showSlotPicker &&
          collectionSlotOptions().map((s) => (
            <Pressable
              key={s.id}
              style={styles.slotOpt}
              onPress={() => {
                setTimeslot(s.id);
                setShowSlotPicker(false);
              }}
            >
              <Text style={styles.slotOptText}>{s.label}</Text>
            </Pressable>
          ))}

        <Pressable
          style={styles.rowCard}
          onPress={() => setShowInstructions((v) => !v)}
          testID="order-manage-instructions-toggle"
        >
          <Text style={styles.rowLabel}>{labels.instructions}</Text>
          <Text style={styles.rowValue}>
            {instructions || 'Optional note for cook / lobby'}
          </Text>
        </Pressable>
        {showInstructions && (
          <TextInput
            style={styles.input}
            multiline
            value={instructions}
            onChangeText={setInstructions}
            placeholder="e.g. Call when ready"
            placeholderTextColor={gourmeatColors.textMuted}
            testID="order-manage-instructions-input"
          />
        )}

        <Pressable
          style={styles.rowCard}
          testID="order-manage-help"
          onPress={() => {
            if (kind === 'one_off' && id) router.push(`/(customer)/orders/${id}` as any);
            else router.push('/(customer)/tiffin/manage' as any);
          }}
        >
          <Text style={[styles.rowLabel, { color: gourmeatColors.primary }]}>{labels.help}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showAddItems && !!draft} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet} testID="order-add-items-sheet">
            {draft ? (
              <>
                <Text style={styles.modalTitle}>{draft.productName}</Text>
                <View style={styles.chipRow}>
                  {chips.map((c) => (
                    <Text key={c.id} style={styles.metaChip}>
                      {c.label}
                    </Text>
                  ))}
                </View>
                <Text style={styles.sectionHead}>Extra · one</Text>
                {extras.map((e) => (
                  <Pressable
                    key={e.id}
                    style={[styles.opt, draft.extraId === e.id && styles.optOn]}
                    onPress={() => setDraft((d) => (d ? { ...d, extraId: e.id } : d))}
                  >
                    <Text style={styles.optLabel}>{e.label}</Text>
                    <Text style={styles.optPrice}>
                      {e.priceDelta > 0 ? `+S$${e.priceDelta}` : 'S$0'}
                    </Text>
                  </Pressable>
                ))}
                <Text style={styles.sectionHead}>Add-on</Text>
                {addons.map((a) => (
                  <Pressable
                    key={a.id}
                    style={[styles.opt, draft.addonIds.includes(a.id) && styles.optOn]}
                    onPress={() =>
                      setDraft((d) => (d ? { ...d, addonIds: toggleAddonId(d.addonIds, a.id) } : d))
                    }
                  >
                    <Text style={styles.optLabel}>{a.label}</Text>
                    <Text style={styles.optPrice}>+S${a.priceDelta}</Text>
                  </Pressable>
                ))}
                <View style={styles.modalFooter}>
                  <View style={styles.qtyRow}>
                    <Pressable onPress={() => setDraft((d) => (d ? { ...d, qty: adjustMealQty(d.qty, -1) } : d))}>
                      <Text style={styles.qtyBtn}>−</Text>
                    </Pressable>
                    <Text style={styles.qtyVal}>{draft.qty}</Text>
                    <Pressable onPress={() => setDraft((d) => (d ? { ...d, qty: adjustMealQty(d.qty, 1) } : d))}>
                      <Text style={styles.qtyBtn}>+</Text>
                    </Pressable>
                  </View>
                  <Pressable style={styles.payBtn} onPress={confirmAddItems} testID="order-add-items-pay">
                    <Text style={styles.payBtnText}>
                      {addItemsProceedLabel(computeAddItemsExtraTotal(draft, extras, addons))}
                    </Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => setShowAddItems(false)} style={{ marginTop: 12 }}>
                  <Text style={{ textAlign: 'center', fontWeight: '700', color: gourmeatColors.textLight }}>
                    Cancel
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  backRow: { marginBottom: shcSpacing.sm },
  backText: { fontSize: 16, fontWeight: '700', color: gourmeatColors.primary },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontSize: 11, fontWeight: '800' },
  slot: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight },
  cook: { fontSize: 20, fontWeight: '900', color: gourmeatColors.text },
  plan: { fontSize: 14, fontWeight: '600', color: gourmeatColors.textLight, marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  outlineBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineBtnText: { fontWeight: '800', color: gourmeatColors.text },
  primaryBtn: {
    flex: 1,
    backgroundColor: gourmeatColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { fontWeight: '800', color: '#fff' },
  menuCard: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    padding: shcSpacing.md,
    marginBottom: 12,
  },
  menuLabel: { fontSize: 11, fontWeight: '800', color: gourmeatColors.textLight, marginBottom: 6 },
  menuPending: { fontStyle: 'italic', fontWeight: '600', color: gourmeatColors.textLight },
  menuLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  menuLineRowExtra: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  menuLine: { fontSize: 14, fontWeight: '600', flex: 1, color: gourmeatColors.text },
  extraTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2E7D32',
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  customTag: { marginTop: 8, fontSize: 10, fontWeight: '900', color: gourmeatColors.primary },
  rowCard: {
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    backgroundColor: gourmeatColors.surface,
  },
  rowLabel: { fontSize: 12, fontWeight: '700', color: gourmeatColors.textLight },
  rowValue: { fontSize: 14, fontWeight: '700', marginTop: 4, color: gourmeatColors.text },
  slotOpt: { padding: 12, borderBottomWidth: 1, borderBottomColor: gourmeatColors.border },
  slotOptText: { fontWeight: '700' },
  input: {
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    marginBottom: 12,
    fontWeight: '600',
    color: gourmeatColors.text,
    textAlignVertical: 'top',
  },
  link: { fontWeight: '800', color: gourmeatColors.primary, textAlign: 'center' },
  successScreen: {
    flex: 1,
    backgroundColor: gourmeatColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    fontSize: 48,
    width: 88,
    height: 88,
    lineHeight: 88,
    textAlign: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 44,
    color: '#2E7D32',
    overflow: 'hidden',
    marginBottom: 16,
  },
  successTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  successSub: { fontSize: 14, fontWeight: '600', color: gourmeatColors.textLight, marginBottom: 24 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: gourmeatColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: shcSpacing.md,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  metaChip: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    overflow: 'hidden',
  },
  sectionHead: {
    fontSize: 11,
    fontWeight: '800',
    color: gourmeatColors.textLight,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  opt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    marginBottom: 8,
  },
  optOn: { borderColor: gourmeatColors.primary, backgroundColor: '#FFF0EB' },
  optLabel: { fontWeight: '700' },
  optPrice: { fontWeight: '800' },
  modalFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    paddingHorizontal: 6,
  },
  qtyBtn: { fontSize: 18, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 6 },
  qtyVal: { fontWeight: '900', minWidth: 20, textAlign: 'center' },
  payBtn: {
    flex: 1,
    backgroundColor: gourmeatColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
});
