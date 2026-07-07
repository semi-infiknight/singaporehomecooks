export const en = {
  'nav.discover': 'Discover',
  'nav.cart': 'Cart',
  'nav.profile': 'Profile',
  'nav.search_placeholder': 'Try nasi lemak, buah keluak, Hari Raya…',
  'checkout.title': 'Checkout',
  'checkout.minimum_order':
    'Minimum order is S$50. Please add more portions or select a different listing.',
  'checkout.place_order': 'Place order',
  'checkout.placing': 'Placing order…',
  'push.title': 'Browser notifications',
  'push.description': 'Get order updates in your browser when the app is installed or open in the background.',
  'push.enable': 'Enable notifications',
  'push.enabling': 'Enabling…',
  'push.enabled': 'Notifications enabled for this browser.',
  'push.denied': 'Permission denied. Enable notifications in browser settings.',
  'push.not_configured': 'Push is not configured on this environment yet.',
  'push.prompt_banner': 'Turn on notifications so you never miss collection reminders.',
  'language.label': 'Language',
  'language.en': 'English',
  'language.zh': '中文',
  'trust.cooks': 'home cooks',
  'trust.meals': 'meals this month',
  'trust.areas': 'HDB areas',
} as const;

export type MessageKey = keyof typeof en;
