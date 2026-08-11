/**
 * Customer area picker — list for nearby kitchens only.
 * Search / GPS → emoji tag → saved list. No map pin (cook kitchen is precise).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { gourmeatColors, shcColors, shcSpacing, shcRadii } from '@shc/ui';
import type { SHCSavedAddress } from '@shc/types';
import {
  reverseGeocodeSingapore,
  searchSingaporeAddresses,
  formatLocationLabel,
  SG_ONLY_LOCATION_MESSAGE,
  isWithinSingapore,
  type AddressSearchResult,
} from '@shc/utils';
import { useCustomerLocation } from '../../hooks/useCustomerLocation';
import { getCurrentGpsCoords, gpsFailureHelp } from '../../lib/gps-location';

const EMOJI_OPTIONS = ['🏠', '🏢', '🏫', '❤️', '⭐', '📍', '🛒', '☕'] as const;

type PendingArea = {
  line1: string;
  line2?: string;
  postal_code?: string;
  lat: number;
  lng: number;
  source: SHCSavedAddress['source'];
  /** When set, confirm updates this id (long-press edit). */
  editId?: string;
};

function addressFullLine(addr: Pick<SHCSavedAddress, 'line1' | 'line2' | 'postal_code'>): string {
  return formatLocationLabel(addr);
}

function isEmojiLabel(label: string): boolean {
  const t = label.trim();
  if (!t) return false;
  // Most single emoji graphemes are short; treat short non-ascii as emoji tag.
  return t.length <= 4 && !/^[a-zA-Z0-9]/.test(t);
}

export default function LocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saved, activeId, saveNew, updateSaved, setActive, removeSaved } = useCustomerLocation();
  const searchRef = useRef<TextInput>(null);
  const openSwipeRef = useRef<Swipeable | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingArea | null>(null);
  const [emoji, setEmoji] = useState<string>('🏠');

  const runSearch = useCallback(async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      setResults(await searchSingaporeAddresses(query.trim()));
    } finally {
      setSearching(false);
    }
  }, [query]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      if (/^\d{6}$/.test(q) || q.length >= 3) void runSearch();
    }, /^\d{6}$/.test(q) ? 100 : 400);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const openEmojiModal = (seed: PendingArea, initialEmoji = '🏠') => {
    setEmoji(initialEmoji);
    setPending(seed);
  };

  const confirmEmoji = async () => {
    if (!pending) return;
    const label = (emoji || '📍').trim().slice(0, 8) || '📍';
    const isEdit = Boolean(pending.editId);
    setBusy(true);
    try {
      if (pending.editId) {
        await updateSaved(pending.editId, { label });
      } else {
        await saveNew({
          label,
          line1: pending.line1,
          line2: pending.line2,
          postal_code: pending.postal_code,
          lat: pending.lat,
          lng: pending.lng,
          source: pending.source,
        });
      }
      setPending(null);
      setQuery('');
      setResults([]);
      if (!isEdit) router.back();
    } catch (e: unknown) {
      Alert.alert('Could not save', (e as Error)?.message ?? 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const onUseGps = async () => {
    setLocating(true);
    try {
      const result = await getCurrentGpsCoords();
      if (result.ok === false) {
        const help = gpsFailureHelp(result.reason);
        Alert.alert(help.title, help.message);
        return;
      }
      if (!isWithinSingapore(result.coords.lat, result.coords.lng)) {
        Alert.alert('Outside Singapore', SG_ONLY_LOCATION_MESSAGE);
        return;
      }
      let line1 =
        result.via === 'emulator_fallback' ? 'Tampines, Singapore' : 'Near me, Singapore';
      let postal_code: string | undefined;
      try {
        const rev = await reverseGeocodeSingapore(result.coords.lat, result.coords.lng);
        if ((rev.line1 || '').trim().length >= 3) line1 = rev.line1.trim();
        if (rev.postal_code && /^\d{6}$/.test(rev.postal_code)) postal_code = rev.postal_code;
      } catch {
        /* coords enough */
      }
      openEmojiModal({
        line1,
        postal_code,
        lat: result.coords.lat,
        lng: result.coords.lng,
        source: 'gps',
      });
    } catch (e: unknown) {
      const help = gpsFailureHelp('failed');
      Alert.alert(help.title, (e as Error)?.message ?? help.message);
    } finally {
      setLocating(false);
    }
  };

  const onSelectResult = (r: AddressSearchResult) => {
    openEmojiModal({
      line1: r.line1,
      postal_code: r.postal_code,
      lat: r.lat,
      lng: r.lng,
      source: 'search',
    });
  };

  const onAddFromSearch = () => {
    const q = query.trim();
    if (q.length < 2) {
      searchRef.current?.focus();
      return;
    }
    void runSearch();
  };

  const showDropdown = query.trim().length >= 2;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="location-screen">
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="location-back" style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title} accessibilityRole="header">
          Enter your area or apartment name
        </Text>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            ref={searchRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Try Tampines, Bishan, 520456…"
            placeholderTextColor={shcColors.textLight}
            style={styles.searchInput}
            testID="location-search-input"
            returnKeyType="search"
            onSubmitEditing={onAddFromSearch}
            autoCorrect={false}
          />
          {searching ? (
            <ActivityIndicator color={gourmeatColors.primary} style={{ marginRight: 8 }} />
          ) : (
            <Pressable
              onPress={onAddFromSearch}
              style={styles.searchAddBtn}
              testID="location-search-add"
              accessibilityLabel="Search and add"
            >
              <Text style={styles.searchAddText}>+</Text>
            </Pressable>
          )}
        </View>

        {showDropdown ? (
          <View style={styles.resultsBox} testID="location-search-results">
            {searching && results.length === 0 ? (
              <Text style={styles.notice}>Searching…</Text>
            ) : results.length === 0 ? (
              <Text style={styles.notice}>No matches</Text>
            ) : (
              results.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => onSelectResult(r)}
                  style={styles.resultRow}
                  testID={`location-result-${r.id}`}
                >
                  <Text style={styles.resultTitle}>{r.title || r.line1}</Text>
                  {r.subtitle ? <Text style={styles.resultSub}>{r.subtitle}</Text> : null}
                </Pressable>
              ))
            )}
          </View>
        ) : null}

        <Pressable
          onPress={() => void onUseGps()}
          disabled={locating}
          style={styles.actionRow}
          testID="location-use-gps"
        >
          <Text style={styles.actionIcon}>➤</Text>
          <Text style={styles.actionLabel}>{locating ? 'Detecting…' : 'Use my current location'}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {saved.length > 0 ? (
          <>
            <View style={styles.divider} />
            {saved.map((addr) => {
              const active = addr.id === activeId;
              const pin = isEmojiLabel(addr.label) ? addr.label.trim() : '📍';
              const full = addressFullLine(addr);
              return (
                <Swipeable
                  key={addr.id}
                  ref={(ref) => {
                    /* track last open for close-on-open-other optional */
                    if (ref) openSwipeRef.current = ref;
                  }}
                  overshootLeft={false}
                  overshootRight={false}
                  renderLeftActions={() => (
                    <View style={styles.swipeDelete}>
                      <Text style={styles.swipeDeleteText}>Delete</Text>
                    </View>
                  )}
                  onSwipeableOpen={(direction) => {
                    if (direction === 'left') {
                      void removeSaved(addr.id);
                    }
                  }}
                  friction={2}
                >
                  <Pressable
                    onPress={async () => {
                      await setActive(addr);
                      router.back();
                    }}
                    onLongPress={() => {
                      openEmojiModal(
                        {
                          editId: addr.id,
                          line1: addr.line1,
                          line2: addr.line2,
                          postal_code: addr.postal_code,
                          lat: addr.lat,
                          lng: addr.lng,
                          source: addr.source,
                        },
                        pin
                      );
                    }}
                    style={[styles.savedRow, active && styles.savedRowActive]}
                    testID={`location-saved-${addr.id}`}
                  >
                    <View style={[styles.savedIconWrap, active && styles.savedIconWrapActive]}>
                      <Text style={styles.savedEmoji}>{pin}</Text>
                    </View>
                    <View style={styles.savedText}>
                      <Text style={styles.savedAddress} numberOfLines={3}>
                        {full}
                      </Text>
                      {active ? (
                        <View style={styles.usingPill}>
                          <Text style={styles.usingPillText}>Selected</Text>
                        </View>
                      ) : null}
                    </View>
                    {active ? <Text style={styles.selectedCheck}>✓</Text> : <Text style={styles.chevron}>›</Text>}
                  </Pressable>
                </Swipeable>
              );
            })}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={Boolean(pending)} transparent animationType="fade" onRequestClose={() => setPending(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} testID="location-tag-modal">
            <Text style={styles.modalTitle}>{pending?.editId ? 'Change emoji' : 'Pick an emoji'}</Text>
            {pending ? (
              <Text style={styles.modalBody} numberOfLines={3}>
                {pending.line1}
              </Text>
            ) : null}
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((e) => {
                const on = emoji === e;
                return (
                  <Pressable
                    key={e}
                    onPress={() => setEmoji(e)}
                    style={[styles.emojiCell, on && styles.emojiCellOn]}
                    testID={`location-emoji-${e}`}
                  >
                    <Text style={styles.emojiCellText}>{e}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => void confirmEmoji()}
              disabled={busy}
              style={[styles.modalCta, busy && { opacity: 0.5 }]}
              testID="location-tag-save"
            >
              <Text style={styles.modalCtaText}>{busy ? 'Saving…' : pending?.editId ? 'Update' : 'Save'}</Text>
            </Pressable>
            <Pressable onPress={() => setPending(null)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    paddingHorizontal: shcSpacing.md,
    paddingVertical: shcSpacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 22, fontWeight: '700', color: shcColors.text },
  content: { paddingHorizontal: shcSpacing.lg },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: shcColors.text,
    letterSpacing: -0.4,
    marginBottom: shcSpacing.lg,
    lineHeight: 28,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(36,24,18,0.12)',
    borderRadius: shcRadii.pill,
    backgroundColor: '#FAFAFA',
    marginBottom: shcSpacing.md,
    minHeight: 48,
    paddingRight: 6,
  },
  searchIcon: {
    fontSize: 18,
    color: shcColors.textLight,
    paddingLeft: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: shcColors.text,
    paddingVertical: 12,
    paddingRight: 8,
  },
  searchAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: gourmeatColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchAddText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
    marginTop: -1,
  },
  resultsBox: {
    marginBottom: shcSpacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(36,24,18,0.08)',
    overflow: 'hidden',
  },
  notice: {
    padding: 12,
    fontSize: 13,
    color: shcColors.textLight,
    fontWeight: '600',
  },
  resultRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(36,24,18,0.08)',
  },
  resultTitle: { fontSize: 15, fontWeight: '700', color: shcColors.text },
  resultSub: { fontSize: 12, color: shcColors.textLight, marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  actionIcon: {
    fontSize: 18,
    color: gourmeatColors.primary,
    width: 24,
    textAlign: 'center',
    fontWeight: '700',
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: gourmeatColors.primary,
  },
  chevron: {
    fontSize: 22,
    color: shcColors.textLight,
    fontWeight: '300',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(36,24,18,0.1)',
    marginBottom: 4,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
    backgroundColor: '#FFF',
  },
  savedRowActive: {
    backgroundColor: '#FFF5F0',
    marginHorizontal: -shcSpacing.lg,
    paddingHorizontal: shcSpacing.lg + 4,
    borderRadius: 14,
  },
  savedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE8DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedIconWrapActive: {
    backgroundColor: gourmeatColors.primary,
  },
  savedEmoji: { fontSize: 20 },
  savedText: { flex: 1, minWidth: 0, gap: 4 },
  savedAddress: {
    fontSize: 15,
    fontWeight: '700',
    color: shcColors.text,
    lineHeight: 21,
  },
  usingPill: {
    alignSelf: 'flex-start',
    backgroundColor: gourmeatColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  usingPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  selectedCheck: {
    fontSize: 18,
    fontWeight: '900',
    color: gourmeatColors.primary,
  },
  swipeDelete: {
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
  },
  swipeDeleteText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: shcSpacing.lg,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: shcColors.text,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: shcColors.textLight,
    fontWeight: '600',
    marginBottom: shcSpacing.md,
    lineHeight: 20,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: shcSpacing.lg,
  },
  emojiCell: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.1)',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellOn: {
    borderColor: gourmeatColors.primary,
    backgroundColor: '#FFF5F0',
  },
  emojiCellText: { fontSize: 24 },
  modalCta: {
    backgroundColor: gourmeatColors.primary,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCtaText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  modalCancel: { alignItems: 'center', paddingVertical: 14 },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: shcColors.textLight },
});
