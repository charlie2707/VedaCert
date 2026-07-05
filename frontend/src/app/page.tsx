'use client';

import React, { useState } from 'react';
import { verifyCertificate, CertificateData } from '../services/stellar';
import { Search, ShieldAlert, ShieldCheck, Calendar, Award, ExternalLink, Zap, Lock, RefreshCw } from 'lucide-react';

export default function Home() {
  const [searchHash, setSearchHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<CertificateData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchHash.trim()) return;

    setIsVerifying(true);
    setErrorMessage('');
    setHasSearched(false);
    setResult(null);

    try {
      // Validate length roughly (should be 32 bytes i.e. 64 chars hex or start with 0x)
      const cleanHash = searchHash.trim().startsWith('0x') ? searchHash.trim().slice(2) : searchHash.trim();
      if (cleanHash.length !== 64 && searchHash.trim().toLowerCase() !== 'demo') {
        throw new Error('Cert ID must be a 32-byte hexadecimal hash (64 characters).');
      }

      const certData = await verifyCertificate(searchHash.trim());
      setResult(certData);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      setErrorMessage((err as Error).message || 'Failed to query certificate state.');
    } finally {
      setIsVerifying(false);
    }
  };

  const loadDemoHash = () => {
    setSearchHash('0xabc1234567890123456789012345678901234567890123456789012345671111');
  };

  const getStatus = (cert: CertificateData) => {
    if (cert.isRevoked) return 'revoked';
    if (cert.expirationDate > 0 && cert.expirationDate < Math.floor(Date.now() / 1000)) {
      return 'expired';
    }
    return 'valid';
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 md:px-8 relative overflow-hidden bg-[#030303]">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[500px] md:h-[500px] bg-white/2 rounded-full blur-[80px] md:blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <div className="text-center max-w-2xl mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white glow-text font-sans mb-4">
          Decentralized Credential Verification
        </h1>
        <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto">
          Verify tamper-proof digital certificates issued on the Stellar blockchain instantly, without central gatekeepers.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleVerify} className="w-full max-w-xl mb-12">
        <div className="glass-panel p-2 flex items-center gap-2 bg-zinc-950/30">
          <Search className="h-5 w-5 text-zinc-500 ml-3" />
          <input
            type="text"
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            placeholder="Enter 32-byte Certificate Hash (0x...)"
            className="flex-1 bg-transparent border-0 outline-none text-white placeholder-zinc-500 text-sm py-3"
          />
          <button
            type="submit"
            disabled={isVerifying}
            className="glass-button px-5 py-2.5 text-xs font-semibold uppercase text-white hover:bg-white/10"
          >
            {isVerifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'VERIFY'}
          </button>
        </div>

        <div className="flex items-center justify-between mt-3 px-2">
          <button
            type="button"
            onClick={loadDemoHash}
            className="text-3xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2 cursor-pointer"
          >
            Load Demo Certificate ID
          </button>
          <span className="text-3xs text-zinc-600 font-mono">Powered by Soroban smart contracts</span>
        </div>
      </form>

      {/* Error Output */}
      {errorMessage && (
        <div className="w-full max-w-xl glass-panel p-4 mb-12 border-red-500/20 bg-red-950/5 text-center">
          <p className="text-xs text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Results Verification Cards */}
      {hasSearched && (
        <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-200">
          {result ? (
            (() => {
              const status = getStatus(result);
              return (
                <div
                  className={`glass-panel p-6 bg-zinc-950/40 relative overflow-hidden transition-all duration-300 ${
                    status === 'valid'
                      ? 'neon-border-green'
                      : status === 'revoked'
                      ? 'border-zinc-500/10'
                      : 'neon-border-amber'
                  }`}
                >
                  {/* Fluorescent Status Indicator Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--glass-border)]">
                    <span className="text-2xs font-mono text-zinc-400 tracking-wider">ON-CHAIN VAULT CERTIFICATE</span>
                    
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                        status === 'valid'
                          ? 'bg-[rgba(16,185,129,0.1)] text-emerald-400 border-emerald-500/20'
                          : status === 'revoked'
                          ? 'bg-[rgba(113,113,122,0.1)] text-zinc-400 border-zinc-500/20'
                          : 'bg-[rgba(245,158,11,0.1)] text-amber-400 border-amber-500/20'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          status === 'valid'
                            ? 'bg-emerald-400'
                            : status === 'revoked'
                            ? 'bg-zinc-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      {status === 'valid' && 'VERIFIED VALID'}
                      {status === 'revoked' && 'REVOKED / CANCELLED'}
                      {status === 'expired' && 'EXPIRED'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Award className="h-10 w-10 text-white mt-1 shrink-0 glow-text" />
                      <div>
                        <p className="text-2xs text-zinc-500 uppercase tracking-wide">Recipient Name</p>
                        <h3 className="text-xl font-bold text-white tracking-wide mt-0.5">
                          {result.recipient}
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-2xs text-zinc-500 uppercase tracking-wide">Issuer Signature (Address)</p>
                        <p className="text-xs font-mono text-zinc-300 mt-1 truncate" title={result.issuer}>
                          {result.issuer}
                        </p>
                      </div>
                      <div>
                        <p className="text-2xs text-zinc-500 uppercase tracking-wide">Anchor Link</p>
                        <a
                          href={result.metadataUri.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${result.metadataUri.slice(7)}` : result.metadataUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline mt-1"
                        >
                          IPFS Metadata
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--glass-border)]">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <div>
                          <p className="text-3xs text-zinc-500 uppercase">Issued Date</p>
                          <p className="text-xs text-zinc-300">
                            {new Date(result.issueDate * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <div>
                          <p className="text-3xs text-zinc-500 uppercase">Expiration Date</p>
                          <p className="text-xs text-zinc-300">
                            {result.expirationDate > 0
                              ? new Date(result.expirationDate * 1000).toLocaleDateString()
                              : 'Indefinite (Never)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="glass-panel p-8 bg-zinc-950/40 text-center border-amber-500/20">
              <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Credential Not Found</h3>
              <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                No certificate matches the specified hash. Check for typing errors or verify that the issuing institution has successfully anchored the document.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Feature Blocks explaining Platform mechanics */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full mt-24">
        <div className="glass-panel p-5 bg-zinc-900/10">
          <Zap className="h-8 w-8 text-cyan-400 mb-3" />
          <h4 className="text-sm font-semibold text-white mb-1">Decoupled Access Control</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Separate roles for institution registry and certificate storage keeps credentials highly modular and secure.
          </p>
        </div>
        <div className="glass-panel p-5 bg-zinc-900/10">
          <Lock className="h-8 w-8 text-emerald-400 mb-3" />
          <h4 className="text-sm font-semibold text-white mb-1">Immutable Verification</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Certificates are cryptographically hashed and anchored. Status checks happen entirely on-chain.
          </p>
        </div>
        <div className="glass-panel p-5 bg-zinc-900/10">
          <ShieldCheck className="h-8 w-8 text-white mb-3" />
          <h4 className="text-sm font-semibold text-white mb-1">Stellar Optimization</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Leveraging Soroban storage fees and state archival paradigms for permanent cost-effective verification.
          </p>
        </div>
      </div>
    </div>
  );
}
