import { Redirect, useLocalSearchParams } from 'expo-router';

// [slug]/index.tsx ensures the full cook/[slug]/* tree exists per 10-mobile.md listed routes.
// Redirects to the sibling [slug].tsx which has the full profile + listings + heritage.
export default function CookSlugIndex() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <Redirect href={`/(customer)/cook/${slug}` as any} />;
}
