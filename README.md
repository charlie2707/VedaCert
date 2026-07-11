<h1 align="center">VedaCert Credentialing</h1>

<p align="center">
  <strong>A Decentralized, Tamper-Proof Credential Verification Platform built on the Stellar network using decoupled Soroban smart contracts.</strong>
</p>

<p align="center">
  <a href="https://vedacert.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/LIVE_DEMO-VEDACERT.VERCEL.APP-cyan?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/charlie2707/VedaCert/actions/workflows/ci.yml" target="_blank">
    <img src="https://github.com/charlie2707/VedaCert/actions/workflows/ci.yml/badge.svg" alt="CI/CD Pipeline" />
  </a>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#directory-structure">Directory Structure</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#development">Development</a> •
  <a href="#deployment-guide">Deployment Guide</a> •
  <a href="#verification">Verification Links</a> •
  <a href="#screenshots">Screenshots</a>
</p>

---

* **GitHub Repository:** [charlie2707/VedaCert](https://github.com/charlie2707/VedaCert)
* **Walkthrough Demo Video:** [VedaCert Demo Video Link]

---

## Table of Contents

* [1. Product Overview & Problem Statement](#overview)
  * [The Problem](#the-problem)
  * [The VedaCert Solution](#the-vedacert-solution)
* [2. Technical Stack](#tech-stack)
* [3. Directory Structure](#directory-structure)
* [4. Technical Architecture & Component Flow](#architecture)
  * [1. Decoupled Access Control Flow](#decoupled-flow)
  * [2. Inter-Contract Communication sequence](#inter-contract-communication)
* [5. Smart Contract Storage Design](#storage-design)
* [6. Local Development & Testing](#development)
  * [Prerequisites](#prerequisites)
  * [Compilation & Testing](#compilation-testing)
  * [Frontend Dev](#frontend-dev)
* [7. Stellar Testnet Deployment Guide (Manual)](#deployment-guide)
  * [Step 1: Configure Deployer Identity](#deployer-identity)
  * [Step 2: Compile WASM targets](#compile-wasm)
  * [Step 3: Deploy Authority Registry](#deploy-registry)
  * [Step 4: Deploy Certification Vault](#deploy-vault)
  * [Step 5: Initialize Contracts & Authorize Issuer](#initialize-contracts)
* [8. Deployed Contract Verification](#verification)
  * [Contract Addresses](#contract-addresses)
  * [Explorer Interaction Links](#interaction-links)
* [9. Security Considerations](#security)
* [10. Project Media & Screenshots](#screenshots)

---

<a name="overview"></a>
## 1. Product Overview & Problem Statement

### The Problem
Traditional educational credentials and enterprise certificates rely on centralized databases or paper verification, which are vulnerable to record tampering, database leaks, and validation latencies. Institutions must maintain expensive validation APIs, and verifiers must manually request verification, causing settlement times of days or weeks.

### The VedaCert Solution
VedaCert resolves these structural limitations using:
* **Decoupled Registry Authority**: Institutions are registered under custom roles (ROLE_ADMIN, ROLE_ISSUER, ROLE_AUDITOR) in a secure global identity registry.
* **On-Chain Vault Storage**: Certificates are cryptographically hashed and anchored into permanent, decentralized vault storage with instant on-chain verification.
* **Contract-to-Contract (C2C) Verification**: The vault validates the issuer's active authority dynamically in real-time before anchoring any document.

---

<a name="tech-stack"></a>
## 2. Technical Stack

* **Smart Contracts:** Rust, Soroban SDK
* **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, lucide-react
* **State Management:** Zustand (wallet session persistence, transaction center logs)
* **Data Querying:** React Query (RPC state synchronization)
* **Wallet Connection:** `@creit.tech/stellar-wallets-kit` SDK (Freighter / xBull / LOBSTR)
* **Web3 Design Aesthetics:** Glowing dark-mode theme, glassmorphic layout, mobile responsive grids.

---

<a name="directory-structure"></a>
## 3. Directory Structure

```
VedaCert/
├── .github/
│   └── workflows/
│       └── ci.yml                     # CI/CD Pipeline Configuration
├── contracts/
│   ├── authority-registry/
│   │   ├── src/
│   │   │   ├── lib.rs                 # Registry contract rules & RBAC
│   │   │   └── test.rs                # Registry unit test suite
│   │   └── Cargo.toml                 # Registry manifest
│   └── certification-vault/
│       ├── src/
│       │   ├── lib.rs                 # Vault contract rules & C2C calls
│       │   └── test.rs                # Vault unit test suite
│       └── Cargo.toml                 # Vault manifest
├── scripts/
│   └── deploy.js                      # Automated Testnet deploy script
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── dashboard/             # Institution admin workspace
    │   │   ├── settings/              # Settings & Custom Contract binding
    │   │   └── page.tsx               # Home & Public Verification page
    │   ├── components/                # Header, Footer, Providers
    │   ├── services/
    │   │   └── stellar.ts             # Transaction building & signing layers
    │   └── state/
    │       └── walletStore.ts         # Zustand wallet status manager
```

---

<a name="architecture"></a>
## 4. Technical Architecture & Component Flow

<a name="decoupled-flow"></a>
### 1. Decoupled Access Control Flow

```mermaid
graph TD
    Owner[Platform Owner]
    Admin[Admin Account]
    School[Institution Wallet]
    Verifier[Public Verifier]
    
    subgraph Soroban Smart Contracts
        Reg[Authority Registry Contract]
        Vault[Certification Vault Contract]
    end
    
    subgraph Storage Layout
        InstanceReg[(Instance Storage: Registry Admin)]
        PersistentReg[(Persistent Storage: Inst configs & Roles)]
        InstanceVault[(Instance Storage: Owner & Registry Ref)]
        PersistentVault[(Persistent Storage: Certificate Hash Records)]
    end

    Owner -->|Initialize| Reg
    Admin -->|Add / Suspend Issuer| Reg
    Reg -->|Read Admin/Roles| InstanceReg & PersistentReg
    
    School -->|Request Mint Certificate| Vault
    Vault -->|Validate Issuer C2C Call| Reg
    Vault -->|Read Configs| InstanceVault
    Vault -->|Save Credentials| PersistentVault
    
    Verifier -->|Query Verify| Vault
```

<a name="inter-contract-communication"></a>
### 2. Inter-Contract Communication Flow (C2C)

```mermaid
sequenceDiagram
    autonumber
    actor Issuer as Institution (Issuer)
    participant Vault as Certification Vault Contract
    participant Registry as Authority Registry Contract

    Issuer->>Vault: mint_certificate(issuer_address, cert_id, recipient, uri, expiration)
    Note over Vault: Performs issuer_address.require_auth()
    Vault->>Registry: has_role(issuer_address, ROLE_ISSUER)
    Note over Registry: Looks up institution in Persistent Storage
    Registry-->>Vault: returns true (authorized & active)
    Vault->>Vault: Mints cert & saves to Persistent Storage
    Vault->>Vault: Emits event: certificate_minted
    Vault-->>Issuer: Success Transaction Response
```

---

<a name="storage-design"></a>
## 5. Smart Contract Storage Design

* **Instance Storage**: Used for configuration flags, referencing target contract variables, and owner parameters (e.g. `Admin` in the registry and `Owner`/`Registry` references in the vault) to optimize transaction footprints.
* **Persistent Storage**: Holds registry institution profiles (`InstitutionConfig`) and hash verification structures (`CertificateData`) with Soroban state leases to guarantee permanent storage integrity.

---

<a name="development"></a>
## 6. Local Development & Testing

### Prerequisites
* Rust & Cargo (with `wasm32-unknown-unknown` target configured)
* Node.js v20+

### Compilation & Testing
```bash
# Run contract unit tests
cargo test

# Compile optimized WASM binaries
cargo build --target wasm32-unknown-unknown --release
```

### Frontend Dev
```bash
cd frontend
npm install --ignore-scripts
npm run dev
```

---

<a name="deployment-guide"></a>
## 7. Stellar Testnet Deployment Guide (Manual)

### Step 1: Configure Deployer Identity
Generate and fund a test account:
```bash
stellar keys generate vini --network testnet --fund
```

### Step 2: Compile WASM targets
```bash
cargo build --target wasm32-unknown-unknown --release
```
This generates the optimized WASM files in `target/wasm32-unknown-unknown/release/` (or `target/wasm32v1-none/release/` depending on the active rust toolchain target).

### Step 3: Deploy Authority Registry
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/authority_registry.wasm \
  --source-account vini \
  --network testnet \
  --alias authority_registry
```
* **Output Address**: `CALO4ABMH7IZBV5HBHOFUGQRZSB6AMLU4YQHABG23NVJ5PEQJC22L2NK`

### Step 4: Deploy Certification Vault
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/certification_vault.wasm \
  --source-account vini \
  --network testnet \
  --alias certification_vault
```
* **Output Address**: `CDSIRMRE43V475FH2Y2FVKONSZYOBLI7F3CLA4HKEYAJ6LDQ45AVNVAF`

### Step 5: Initialize Contracts & Authorize Issuer

1. **Initialize the Registry**:
```bash
stellar contract invoke \
  --id CALO4ABMH7IZBV5HBHOFUGQRZSB6AMLU4YQHABG23NVJ5PEQJC22L2NK \
  --source-account vini \
  --network testnet \
  -- initialize \
  --admin GBWDU3MGRM7KSDQBUPHXZS5FDD2T4LURXDNZRJ34FJIZOD6U4YW7N6WP
```

2. **Initialize the Vault** (binding it to the Registry address):
```bash
stellar contract invoke \
  --id CDSIRMRE43V475FH2Y2FVKONSZYOBLI7F3CLA4HKEYAJ6LDQ45AVNVAF \
  --source-account vini \
  --network testnet \
  -- initialize \
  --owner GBWDU3MGRM7KSDQBUPHXZS5FDD2T4LURXDNZRJ34FJIZOD6U4YW7N6WP \
  --registry CALO4ABMH7IZBV5HBHOFUGQRZSB6AMLU4YQHABG23NVJ5PEQJC22L2NK
```

3. **Register vini as an authorized ROLE_ISSUER (Role = 2)**:
```bash
stellar contract invoke \
  --id CALO4ABMH7IZBV5HBHOFUGQRZSB6AMLU4YQHABG23NVJ5PEQJC22L2NK \
  --source-account vini \
  --network testnet \
  -- add_institution \
  --admin GBWDU3MGRM7KSDQBUPHXZS5FDD2T4LURXDNZRJ34FJIZOD6U4YW7N6WP \
  --institution GBWDU3MGRM7KSDQBUPHXZS5FDD2T4LURXDNZRJ34FJIZOD6U4YW7N6WP \
  --name "Platform Root Issuer" \
  --role 2
```

---

<a name="verification"></a>
## 8. Deployed Contract Verification

### Contract Addresses
* **Authority Registry Contract**: `CALO4ABMH7IZBV5HBHOFUGQRZSB6AMLU4YQHABG23NVJ5PEQJC22L2NK`
* **Certification Vault Contract**: `CDSIRMRE43V475FH2Y2FVKONSZYOBLI7F3CLA4HKEYAJ6LDQ45AVNVAF`
* **Deployer Owner Public Address**: `GBWDU3MGRM7KSDQBUPHXZS5FDD2T4LURXDNZRJ34FJIZOD6U4YW7N6WP`

### Interaction Links
* Authority Registry Contract: [Stellar Laboratory Link](https://lab.stellar.org/r/testnet/contract/CALO4ABMH7IZBV5HBHOFUGQRZSB6AMLU4YQHABG23NVJ5PEQJC22L2NK)
* Certification Vault Contract: [Stellar Laboratory Link](https://lab.stellar.org/r/testnet/contract/CDSIRMRE43V475FH2Y2FVKONSZYOBLI7F3CLA4HKEYAJ6LDQ45AVNVAF)

---

<a name="security"></a>
## 9. Security Considerations

* **Decoupled Roles checks**: Dynamic role validations checked dynamically using C2C calls during validation steps.
* **Storage Leases**: Automated persistent storage leases built directly to prevent state deletion.

---

<a name="screenshots"></a>
## 10. Project Media & Screenshots

### Deployed Smart Contracts CLI Outputs
1. **Authority Registry Deployment on Testnet**
   * Manually compiled and uploaded WASM bytecode, successfully deploying registry at `CALO4ABMH7IZBV5HBHOFUGQRZSB6AMLU4YQHABG23NVJ5PEQJC22L2NK`.
   * *Status: Success*

2. **Certification Vault Deployment on Testnet**
   * Uploaded WASM bytecode, deploying the vault instance at `CDSIRMRE43V475FH2Y2FVKONSZYOBLI7F3CLA4HKEYAJ6LDQ45AVNVAF`.
   * *Status: Success*

### User Interface Layout
* **Mobile Responsive VedaCert Landing Workspace**:
  * Clean layout optimized for mobile screens, maintaining Web3 glowing highlights and font hierarchies.
* **Institution Admin Dashboard**:
  * Responsive credential ledger and quick-action panels for minting and revocation.
* **CI/CD Pipeline Status**:
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/51861b41-5b4e-4199-af2e-0accece33a4d" />

* **Smart Contract Test Suite Output**:
 <img width="727" height="102" alt="WhatsApp Image 2026-07-06 at 2 24 06 AM" src="https://github.com/user-attachments/assets/d3689702-f16f-4126-a163-c36e688d9c62" />

