'use client';

import React from 'react';
import { useAuth } from '../../lib/useAuth';
// Colors inlined (shc-ui full import pulls RN deps incompatible in Next build path; tokens match theme.ts)

export function DevRoleSwitcher() {
  const { user, switchRole } = useAuth();
  const switchTo = (role: 'customer' | 'cook') => {
    switchRole(role, role === 'cook' ? 'Auntie Rose' : 'Demo Customer');
    // auto-nav hint only (client can listen but for simplicity, manual or use link)
    if (typeof window !== 'undefined') {
      // For demo E2E, push state or just note; pages will react on reload or link click
      console.info('[web-dev] switched role to', role);
    }
  };
  return (
    <div className="w-full bg-[#F5F0E6] text-xs py-1 border-b border-[#E8D5B7]">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-end gap-2">
        <span className="text-[#5C5144] mr-1">DEV SWITCH (test full E2E, same seeds/contracts as mobile):</span>
        <button
          onClick={() => switchTo('customer')}
          className={`px-2 py-0.5 rounded text-xs ${user.role === 'customer' ? 'bg-[#1D9E75] text-white' : 'bg-white border'}`}
          data-testid="dev-switch-customer"
        >
          Customer
        </button>
        <button
          onClick={() => switchTo('cook')}
          className={`px-2 py-0.5 rounded text-xs ${user.role === 'cook' ? 'bg-[#1D9E75] text-white' : 'bg-white border'}`}
          data-testid="dev-switch-cook"
        >
          Cook (Auntie Rose)
        </button>
        <span className="text-[#5C5144] ml-2 text-[10px]">Rules + seeds live • one-cook • PDPA • earnings 85%</span>
      </div>
    </div>
  );
}
