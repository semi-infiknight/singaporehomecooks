import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'http://localhost:3001';
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/cook/auntie-rose-tampines`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/cook/auntie-doris-katong`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/product/dish_nasi_lemak_prawn_001`, lastModified: new Date() },
    { url: `${base}/product/dish_ayam_buah_keluak_002`, lastModified: new Date() },
    { url: `${base}/product/dish_devils_curry_003`, lastModified: new Date() },
    { url: `${base}/cook-portal`, lastModified: new Date(), changeFrequency: 'daily' },
    { url: `${base}/cart`, lastModified: new Date() },
  ];
}
