'use client';



import React, { useState } from 'react';

import Link from 'next/link';

import { ShoppingBag, Menu, X, Search } from 'lucide-react';

import { useAuth } from '../../lib/useAuth';

import { useCustomerLocation } from '../../lib/useCustomerLocation';

import { useCart, useProducts, useAddToCart } from '../../lib/useProducts';

import { useDiscoverSearch } from '../providers';

import { useShcI18n, getWebLayoutCopy } from '@shc/i18n';

import { ZomatoLocationBar, SearchResultsDropdown, type DishCardProduct } from './SHCWebComponents';

import { getCookAvatarUrl } from '@shc/utils';



const navLinks = [

  { href: '/#discover', labelKey: 'nav.discover' as const },

  { href: '/content/trust', labelKey: 'nav.trust_safety' as const },

];



export function AppHeader() {

  const { t, locale } = useShcI18n();

  const layout = getWebLayoutCopy(locale);

  const { user } = useAuth();

  const { locationLabel, active: collectionLocation } = useCustomerLocation();

  const { data: cart } = useCart();

  const { query, setQuery } = useDiscoverSearch();

  const { data: searchHits = [] } = useProducts(query);

  const addMut = useAddToCart();

  const [mobileOpen, setMobileOpen] = useState(false);

  const itemCount = (cart?.items || []).reduce((s: number, i: { qty: number }) => s + i.qty, 0);



  return (

    <header className="border-b border-border bg-card sticky top-0 z-40 shadow-[var(--shc-shadow-soft)]">

      <div className="max-w-6xl mx-auto px-4">

        <div className="flex items-center justify-between h-14 gap-3">

          <Link href="/" className="flex items-center gap-2 shrink-0">

            <span className="w-9 h-9 rounded-lg bg-primary border border-border flex items-center justify-center text-primary-foreground text-sm font-black shadow-[var(--shc-shadow-soft)]">

              SG

            </span>

            <div className="hidden sm:block">

              <span className="shc-display text-base leading-tight block">{layout.brandName}</span>

              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">

                {layout.brandTagline}

              </span>

            </div>

          </Link>



          <div className="hidden md:flex flex-1 max-w-md mx-4">

            <div className="relative w-full">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" aria-hidden />

              <input

                type="search"

                value={query}

                onChange={(e) => setQuery(e.target.value)}

                placeholder={t('nav.search_placeholder')}

                className="shc-input pl-10 py-2 text-sm"

                data-testid="search-input-web"

                aria-label={layout.searchA11y}

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



          <nav className="hidden lg:flex items-center gap-1" aria-label={layout.mainNavA11y}>

            {navLinks.map((link) => (

              <Link

                key={link.href}

                href={link.href}

                className="px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"

              >

                {t(link.labelKey)}

              </Link>

            ))}

          </nav>



          <div className="flex items-center gap-1 sm:gap-2">

            <Link

              href={user ? '/profile' : '/login'}

              className="inline-flex items-center px-3 py-2 sm:px-4 text-xs sm:text-sm font-extrabold rounded-lg bg-primary text-primary-foreground shadow-[var(--shc-shadow-soft)] hover:brightness-105 transition-all shrink-0"

            >

              {user ? layout.account : layout.signIn}

            </Link>



            <Link

              href="/cart"

              className="relative p-2 border border-border rounded-lg bg-card shadow-[var(--shc-shadow-soft)] hover:brightness-[0.98] transition-shadow"

              aria-label={itemCount > 0 ? layout.cartA11yWithCount(itemCount) : layout.cartA11y}

            >

              <ShoppingBag className="w-5 h-5 text-foreground" aria-hidden />

              {itemCount > 0 && (

                <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] flex items-center justify-center text-[10px] font-black bg-primary text-primary-foreground border border-border rounded-full px-1">

                  {itemCount}

                </span>

              )}

            </Link>



            <button

              type="button"

              className="lg:hidden p-2 border border-border rounded-lg shadow-[var(--shc-shadow-soft)]"

              onClick={() => setMobileOpen(!mobileOpen)}

              aria-expanded={mobileOpen}

              aria-label={layout.menuA11y}

            >

              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}

            </button>

          </div>

        </div>



        <div className="pb-2">

          <ZomatoLocationBar

            areaLabel={collectionLocation ? locationLabel : layout.setLocation}

            areaHint={layout.collectFromUpper}

            avatarName={user?.name}

            onProfileHref={user ? '/profile' : '/login'}

            onLocationHref="/location"

          />

        </div>



        <div className="md:hidden pb-3">

          <div className="relative w-full">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />

            <input

              type="search"

              value={query}

              onChange={(e) => setQuery(e.target.value)}

              placeholder={t('nav.search_placeholder_mobile')}

              className="shc-input pl-10 py-2.5 text-sm w-full"

              aria-label={layout.searchA11y}

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

            className="lg:hidden pb-4 border-t border-border pt-3 flex flex-col gap-1"

            aria-label={layout.mobileNavA11y}

          >

            {navLinks.map((link) => (

              <Link

                key={link.href}

                href={link.href}

                onClick={() => setMobileOpen(false)}

                className="px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary rounded-lg"

              >

                {t(link.labelKey)}

              </Link>

            ))}

            <Link

              href="/orders"

              onClick={() => setMobileOpen(false)}

              className="px-3 py-2.5 text-sm font-semibold hover:bg-secondary rounded-lg"

            >

              {layout.orders}

            </Link>

            <Link

              href="/profile"

              onClick={() => setMobileOpen(false)}

              className="px-3 py-2.5 text-sm font-semibold hover:bg-secondary rounded-lg"

            >

              {layout.accountCredits}

            </Link>

            <Link

              href="/login"

              onClick={() => setMobileOpen(false)}

              className="px-3 py-2.5 text-sm font-semibold hover:bg-secondary rounded-lg"

            >

              {user ? layout.account : layout.signIn}

            </Link>

          </nav>

        )}

      </div>

    </header>

  );

}

