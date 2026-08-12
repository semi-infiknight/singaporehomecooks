import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { shcColors, shcSpacing, SHCIcon } from '@shc/ui';
import {
  formatLocationLabel,
  nearestSgAreaName,
  searchSingaporeAddresses,
  type AddressSearchResult,
} from '@shc/utils';

type Props = {
  kitchenAddress: string;
  onConfirm: (patch: { kitchen_address: string; area?: string }) => void;
  testID?: string;
};

/** Type-to-search Singapore addresses — OneMap results in a dropdown, tap to pin the exact block. */
export function CookKitchenAddressPicker({
  kitchenAddress,
  onConfirm,
  testID = 'cook-kitchen-address-picker',
}: Props) {
  const [query, setQuery] = useState(kitchenAddress);
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await searchSingaporeAddresses(q.trim()));
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(() => {
      if (/^\d{6}$/.test(q) || q.length >= 3) void runSearch(q);
      else setResults([]);
    }, /^\d{6}$/.test(q) ? 100 : 350);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const select = (r: AddressSearchResult) => {
    const kitchen_address = formatLocationLabel({
      line1: r.line1,
      postal_code: r.postal_code,
    });
    setQuery(kitchen_address);
    setOpen(false);
    setResults([]);
    onConfirm({
      kitchen_address,
      area: nearestSgAreaName(r.lat, r.lng),
    });
  };

  return (
    <View testID={testID} style={styles.wrap}>
      <View style={styles.searchWrap}>
        <View style={styles.searchIcon}>
          <SHCIcon name="search" size={18} color={shcColors.textLight} />
        </View>
        <TextInput
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setOpen(true);
            onConfirm({ kitchen_address: t });
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search block, street, or postal code"
          placeholderTextColor={shcColors.textLight}
          style={styles.searchInput}
          testID="location-search-input"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => {
              setQuery('');
              setResults([]);
              onConfirm({ kitchen_address: '' });
            }}
            hitSlop={8}
            testID="location-search-clear"
            style={styles.clearBtn}
          >
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        ) : null}
      </View>

      {searching ? <ActivityIndicator color={shcColors.primary} style={{ marginVertical: 8 }} /> : null}

      {open && results.length > 0 ? (
        <View style={styles.dropdown} testID={`${testID}-results`}>
          {results.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => select(r)}
              testID={`location-result-${r.id}`}
              style={styles.resultRow}
            >
              <View style={styles.resultIcon}>
                <SHCIcon name="location" size={16} color={shcColors.textLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>{r.title}</Text>
                <Text style={styles.resultSub}>{r.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: shcSpacing.sm, zIndex: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: shcColors.text,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 56,
  },
  searchIcon: { paddingLeft: shcSpacing.md },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: '600',
    color: shcColors.text,
  },
  clearBtn: { paddingRight: shcSpacing.md },
  clearText: { fontSize: 22, fontWeight: '700', color: shcColors.textLight },
  dropdown: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(36,24,18,0.12)',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: shcSpacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(36,24,18,0.08)',
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: { fontWeight: '800', fontSize: 14, color: shcColors.text },
  resultSub: { fontSize: 12, color: shcColors.textLight, marginTop: 2, lineHeight: 17 },
});
