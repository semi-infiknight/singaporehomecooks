/**
 * DM Sans + DM Mono — mobile font bootstrap (brand.md parity with web next/font).
 */
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans';
import { DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { useEffect } from 'react';
import { StyleSheet, Text, TextInput, type TextStyle } from 'react-native';
import { shcFontFamilies, shcFontFamilyForWeight } from './theme';

export { shcFontFamilies, shcFontFamilyForWeight };

/** Load DM Sans / DM Mono — call once in app root layout. */
export function useSHCFonts(): boolean {
  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    DMMono_500Medium,
  });

  useEffect(() => {
    if (!loaded) return;
    const patch = (Component: typeof Text | typeof TextInput) => {
      const anyComp = Component as typeof Text & { __shcFontPatched?: boolean; render?: Function };
      if (anyComp.__shcFontPatched || !anyComp.render) return;
      const original = anyComp.render.bind(anyComp);
      anyComp.render = function patchedRender(props: { style?: unknown }, ref: unknown) {
        const flat = StyleSheet.flatten(props.style) as TextStyle | undefined;
        const fontFamily = shcFontFamilyForWeight(flat?.fontWeight);
        return original({ ...props, style: [{ fontFamily }, props.style] }, ref);
      };
      anyComp.__shcFontPatched = true;
    };
    patch(Text);
    patch(TextInput);
  }, [loaded]);

  return loaded;
}
