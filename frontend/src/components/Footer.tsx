import React from 'react';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--glass-border)] bg-[var(--background)] py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-zinc-500" />
            <span className="text-xs font-semibold tracking-wider text-zinc-500">
              VEDA<span className="text-zinc-600">CERT</span>
            </span>
          </div>
          <p className="text-zinc-600 text-3xs font-mono">
            SECURED CRYPTOGRAPHICALLY BY STELLAR | TESTNET
          </p>
          <p className="text-zinc-600 text-3xs">
            © {new Date().getFullYear()} VedaCert. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
