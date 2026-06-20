'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';
import { useCart, useProducts, useAddToCart } from '../../lib/useProducts';
import { useDiscoverSearch } from '../providers';
import { ZomatoLocationBar, SearchResultsDropdown, type DishCardProduct } from './SHCWebComponents';
import { getCookAvatarUrl } from '@shc/utils';

const navLinks = [
  { href: '/#discover', label: 'Discover' },
  { href: '/content/trust', label: 'Trust & Safety' },
];

export function AppHeader() {
  const { user } = useAuth();
  const { data: cart } = useCart();
  const { query, setQuery } = useDiscoverSearch();
  const { data: searchHits = [] } = useProducts(query);
  const addMut = useAddToCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = (cart?.items || []).reduce((s: number, i: { qty: number }) => s + i.qty, 0);

  return (
    <header className="border-b-2 border-[var(--shc-border-brutal)] bg-card sticky top-0 z-40 shadow-[var(--shc-shadow-brutal-sm)]">
      <div className="max-w-6xl mx-auto px-4">
        {/* Row 1: logo + actions */}
        <div className="flex items-center justify-between h-14 gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="w-9 h-9 rounded-lg bg-primary border-2 border-[var(--shc-border-brutal)] flex items-center justify-center text-primary-foreground text-sm font-black shadow-[var(--shc-shadow-brutal-sm)]">
              SG
            </span>
            <div className="hidden sm:block">
              <span className="shc-display text-base leading-tight block">Home Cooks</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Heritage · HDB kitchens
              </span>
            </div>
          </Link>

          {/* Desktop search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try nasi lemak, buah keluak, Hari Raya…"
                className="shc-input pl-10 py-2 text-sm"
                data-testid="search-input-web"
                aria-label="Search heritage dishes and cooks"
              />
              <SearchResultsDropdown
                query={query}
                products={searchHits as DishCardProduct[]}
                onAdd={(id) => {
                  if (!user) {
                    window.location.href = '/login';
                    return;
                  }
                  addMut.mutate({ productId: id, qty: 1 });
                }}
                onClear={() => setQuery('')}
              />
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href={user ? '/profile' : '/login'}
              className="hidden sm:inline-flex px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              {user ? 'Account' : 'Sign in to order'}
            </Link>

            <Link
              href="/cart"
              className="relative p-2 border-2 border-[var(--shc-border-brutal)] rounded-lg bg-card shadow-[var(--shc-shadow-brutal-sm)] hover:shadow-[var(--shc-shadow-brutal)] transition-shadow"
              aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
            >
              <ShoppingBag className="w-5 h-5 text-foreground" aria-hidden />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] flex items-center justify-center text-[10px] font-black bg-primary text-primary-foreground border-2 border-[var(--shc-border-brutal)] rounded-full px-1">
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              className="lg:hidden p-2 border-2 border-[var(--shc-border-brutal)] rounded-lg shadow-[var(--shc-shadow-brutal-sm)]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Zomato-style location bar (mobile + desktop discover context) */}
        <div className="pb-2">
          <ZomatoLocationBar
            areaLabel={user?.name ? `Hi, ${user.name.split(' ')[0]} · SG` : 'Katong, Singapore'}
            avatarName={user?.name}
            onProfileHref={user ? '/profile' : '/login'}
          />
        </div>

        {/* Row 2: mobile full-width search */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, cooks, occasions…"
              className="shc-input pl-10 py-2.5 text-sm w-full"
              aria-label="Search heritage dishes and cooks"
            />
            <SearchResultsDropdown
              query={query}
              products={searchHits as DishCardProduct[]}
              onAdd={(id) => {
                if (!user) {
                  window.location.href = '/login';
                  return;
                }
                addMut.mutate({ productId: id, qty: 1 });
              }}
              onClear={() => setQuery('')}
            />
          </div>
        </div>

        {mobileOpen && (
          <nav
            className="lg:hidden pb-4 border-t-2 border-[var(--shc-border-brutal)] pt-3 flex flex-col gap-1"
            aria-label="Mobile"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary rounded-lg"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/orders"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 text-sm font-semibold hover:bg-secondary rounded-lg"
            >
              Orders
            </Link>
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 text-sm font-semibold hover:bg-secondary rounded-lg"
            >
              Account & credits
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 text-sm font-semibold hover:bg-secondary rounded-lg"
            >
              {user ? 'Account' : 'Sign in'}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}