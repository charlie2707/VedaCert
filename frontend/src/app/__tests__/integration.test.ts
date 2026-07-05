import { describe, it, expect } from 'vitest';

// Simulating integration interactions of the two smart contracts and client parser
interface AuthorityRegistryState {
  admin: string;
  roles: Record<string, { role: number; isActive: boolean; name: string }>;
}

interface CertificationVaultState {
  registryAddress: string;
  certificates: Record<string, {
    recipient: string;
    issuer: string;
    issueDate: number;
    expirationDate: number;
    isRevoked: boolean;
    metadataUri: string;
  }>;
}

class SystemIntegrationMock {
  registry: AuthorityRegistryState;
  vault: CertificationVaultState;

  constructor(admin: string) {
    this.registry = {
      admin,
      roles: {},
    };
    this.vault = {
      registryAddress: 'authority_registry_id',
      certificates: {},
    };
  }

  // Registry Actions
  addInstitution(admin: string, institution: string, name: string, role: number) {
    if (admin !== this.registry.admin) {
      throw new Error('unauthorized: caller is not admin');
    }
    this.registry.roles[institution] = {
      role,
      isActive: true,
      name,
    };
  }

  setInstitutionStatus(admin: string, institution: string, isActive: boolean) {
    if (admin !== this.registry.admin) {
      throw new Error('unauthorized: caller is not admin');
    }
    if (!this.registry.roles[institution]) {
      throw new Error('institution not registered');
    }
    this.registry.roles[institution].isActive = isActive;
  }

  hasRole(institution: string, role: number): boolean {
    const config = this.registry.roles[institution];
    return config ? config.isActive && config.role === role : false;
  }

  // Vault Actions (Contract-to-Contract call)
  mintCertificate(
    issuer: string,
    certId: string,
    recipient: string,
    metadataUri: string,
    expirationDate: number
  ) {
    // Contract-to-Contract Call Simulation
    const isAuthorized = this.hasRole(issuer, 2); // 2 = ROLE_ISSUER
    if (!isAuthorized) {
      throw new Error('unauthorized: caller is not an active issuer');
    }

    if (this.vault.certificates[certId]) {
      throw new Error('certificate already exists');
    }

    this.vault.certificates[certId] = {
      recipient,
      issuer,
      issueDate: Math.floor(Date.now() / 1000),
      expirationDate,
      isRevoked: false,
      metadataUri,
    };
  }

  revokeCertificate(caller: string, certId: string) {
    const cert = this.vault.certificates[certId];
    if (!cert) {
      throw new Error('certificate does not exist');
    }
    if (cert.isRevoked) {
      throw new Error('certificate is already revoked');
    }

    // Must be Admin or original issuer
    const isOwner = caller === this.registry.admin;
    const isIssuer = caller === cert.issuer;
    if (!isOwner && !isIssuer) {
      throw new Error('unauthorized to revoke this certificate');
    }

    cert.isRevoked = true;
  }

  verifyCertificate(certId: string) {
    return this.vault.certificates[certId] || null;
  }
}

describe('System Integration E2E Mock Flow', () => {
  const admin = 'G_ADMIN_ADDR';
  const school = 'G_SCHOOL_ADDR';
  const stranger = 'G_STRANGER_ADDR';
  const certId = '0x123abc456def';

  it('verifies integration lifecycle successfully', () => {
    const sys = new SystemIntegrationMock(admin);

    // 1. School tries to mint before onboarding -> Should Fail
    expect(() => {
      sys.mintCertificate(school, certId, 'Alice', 'ipfs://data', 0);
    }).toThrow('unauthorized: caller is not an active issuer');

    // 2. Admin registers school as ROLE_ISSUER (2)
    sys.addInstitution(admin, school, 'Stellar Technical Academy', 2);
    expect(sys.hasRole(school, 2)).toBe(true);

    // 3. School now successfully mints
    sys.mintCertificate(school, certId, 'Alice', 'ipfs://data', 0);
    
    // Check validation
    const cert = sys.verifyCertificate(certId);
    expect(cert).not.toBeNull();
    expect(cert?.recipient).toBe('Alice');
    expect(cert?.isRevoked).toBe(false);

    // 4. Stranger tries to revoke -> Should Fail
    expect(() => {
      sys.revokeCertificate(stranger, certId);
    }).toThrow('unauthorized to revoke this certificate');

    // 5. School revokes certificate
    sys.revokeCertificate(school, certId);
    expect(sys.verifyCertificate(certId)?.isRevoked).toBe(true);
  });
});
