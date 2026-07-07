import { t, type MessageKey, type ShcLocale } from './messages';

export type TrustLayerKey = 'kitchen' | 'tasting' | 'receipts' | 'guarantee' | 'collection';

const TRUST_LAYERS: TrustLayerKey[] = ['kitchen', 'tasting', 'receipts', 'guarantee', 'collection'];

export function getTrustPageLayers(locale: ShcLocale) {
  return TRUST_LAYERS.map((key) => ({
    key,
    title: t(locale, `trust.layer.${key}.title` as MessageKey),
    desc: t(locale, `trust.layer.${key}.desc` as MessageKey),
  }));
}
