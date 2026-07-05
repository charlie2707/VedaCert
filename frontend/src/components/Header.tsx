'use client';

/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWalletStore } from '../state/walletStore';
import { FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { XBULL_ID } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { LOBSTR_ID } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { Shield, Wallet, Disc, LogOut, Menu, X, Globe } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { address, isConnecting, initializeKit, connect, disconnect, network } = useWalletStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    initializeKit();
  }, [initializeKit]);

  const handleConnect = async (type: string) => {
    setIsModalOpen(false);
    await connect(type);
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Activity Feed', href: '/feed' },
    { name: 'Tx Center', href: '/tx' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--glass-border)] bg-[rgba(3,3,3,0.7)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white">
            <Shield className="h-6 w-6 text-white glow-text" />
            <span className="font-semibold tracking-wider text-lg font-sans">
              VEDA<span className="text-zinc-400">CERT</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-white ${
                    isActive ? 'text-white underline underline-offset-4' : 'text-zinc-400'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Wallet Connection / Right Section */}
          <div className="hidden md:flex items-center gap-3">
            {address ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(6,182,212,0.15)] px-2.5 py-0.5 text-xs font-medium text-cyan-400 border border-cyan-500/20">
                  <Globe className="h-3.5 w-3.5" />
                  {network.toLowerCase()}
                </span>
                
                <div className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-300">
                  <Disc className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span className="font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                  <button
                    onClick={disconnect}
                    className="ml-2 hover:text-white transition-colors cursor-pointer"
                    title="Disconnect"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={isConnecting}
                className="glass-button px-4 py-2 text-xs font-semibold gap-2 border border-[var(--glass-border)]"
              >
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {address && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(6,182,212,0.15)] px-2 py-0.5 text-2xs font-medium text-cyan-400 border border-cyan-500/10">
                {network.toLowerCase()}
              </span>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-zinc-400 hover:text-white p-1"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-30 bg-black/95 backdrop-blur-lg px-4 pt-4 pb-6 flex flex-col gap-4 border-t border-[var(--glass-border)]">
          <nav className="flex flex-col gap-3">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg text-zinc-300 hover:text-white py-2"
            >
              Home / Verify
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg text-zinc-300 hover:text-white py-2"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <hr className="border-[var(--glass-border)] my-2" />

          {address ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Disc className="h-4 w-4 text-emerald-400" />
                <span className="font-mono">{address}</span>
              </div>
              <button
                onClick={() => {
                  disconnect();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full glass-button py-2.5 text-sm gap-2 border border-red-500/10 text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsModalOpen(true);
              }}
              className="w-full glass-button py-3 text-sm font-semibold gap-2"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </button>
          )}
        </div>
      )}

      {/* Wallet Selector Modal (Premium Glassmorphic overlay) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-md p-6 bg-[rgba(10,10,12,0.85)] relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-medium text-white mb-1">Connect Wallet</h3>
            <p className="text-zinc-400 text-xs mb-6">Select a Stellar wallet provider to connect with VedaCert.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleConnect(FREIGHTER_ID)}
                className="glass-button w-full p-4 flex items-center justify-between text-sm group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src="https://stellar.creit.tech/wallet-icons/freighter.png"
                    alt="Freighter Logo"
                    className="h-9 w-9 object-contain shrink-0"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-white">Freighter Wallet</div>
                    <div className="text-2xs text-zinc-400">Official extension wallet by SDF</div>
                  </div>
                </div>
                <span className="text-zinc-500 group-hover:text-white transition-colors">➔</span>
              </button>

              <button
                onClick={() => handleConnect(XBULL_ID)}
                className="glass-button w-full p-4 flex items-center justify-between text-sm group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src="https://stellar.creit.tech/wallet-icons/xbull.png"
                    alt="xBull Logo"
                    className="h-9 w-9 object-contain shrink-0"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-white">xBull Wallet</div>
                    <div className="text-2xs text-zinc-400">Power-user wallet for Stellar</div>
                  </div>
                </div>
                <span className="text-zinc-500 group-hover:text-white transition-colors">➔</span>
              </button>

              <button
                onClick={() => handleConnect(LOBSTR_ID)}
                className="glass-button w-full p-4 flex items-center justify-between text-sm group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src="https://stellar.creit.tech/wallet-icons/lobstr.png"
                    alt="LOBSTR Logo"
                    className="h-9 w-9 object-contain shrink-0"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-white">LOBSTR Wallet</div>
                    <div className="text-2xs text-zinc-400">Simple and secure mobile-friendly wallet</div>
                  </div>
                </div>
                <span className="text-zinc-500 group-hover:text-white transition-colors">➔</span>
              </button>
            </div>

            <div className="mt-6 text-center text-3xs text-zinc-500">
              By connecting your wallet, you agree to secure cryptographic interactions.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
