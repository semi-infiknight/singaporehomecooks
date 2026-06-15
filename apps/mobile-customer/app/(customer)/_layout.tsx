import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Discover' }} />
      <Stack.Screen name="search" options={{ title: 'Search + Filters' }} />
      <Stack.Screen name="cook/[slug]" options={{ title: 'Cook Profile' }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Dish' }} />
      <Stack.Screen name="cart" options={{ title: 'Cart' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout (PayNow)' }} />
      <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'Your Order' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
    </Stack>
  );
}
