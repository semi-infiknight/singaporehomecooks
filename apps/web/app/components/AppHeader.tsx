'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, ClipboardList, ChefHat, Menu, X } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';
import { useCart } from '../../lib/useProducts';

const navLinks = [
  { href: '/#discover', label: 'Discover' },
  { href: '/content/trust', label: 'Trust & Safety' },
];

export function AppHeader() {
  const { user } = useAuth();
  const { data: cart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = (cart?.items || []).reduce((s: number, i: { qty: number }) => s + i.qty, 0);

  return (
    <header className="border-b border-border/80 bg-card/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              SG
            </span>
            <div className="hidden sm:block">
              <span className="shc-display text-lg font-semibold text-foreground leading-tight block">
                Home Cooks
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Heritage · HDB kitchens</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {user ? 'Account' : 'Sign in'}
            </Link>

            <Link
              href="/cart"
              className="relative p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
            >
              <ShoppingBag className="w-5 h-5" aria-hidden />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link
              href="/orders"
              className="hidden sm:flex p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              aria-label="Orders"
            >
              <ClipboardList className="w-5 h-5" aria-hidden />
            </Link>

            <Link
              href="/profile"
              className="hidden sm:flex p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              aria-label="Account"
            >
              <User className="w-5 h-5" aria-hidden />
            </Link>

            <button
              type="button"
              className="md:hidden p-2.5 text-muted-foreground hover:bg-secondary rounded-lg"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden pb-4 border-t border-border/60 pt-3 flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm text-foreground hover:bg-secondary rounded-lg"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/orders" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg">
              Orders
            </Link>
            <Link href="/profile" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg">
              Account & credits
            </Link>
            <Link href="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg">
              {user ? 'Account' : 'Sign in'}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}