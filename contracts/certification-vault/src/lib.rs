#![no_std]
use soroban_sdk::{contract, contractclient, contractimpl, contracttype, Address, BytesN, Env, String};

pub const ROLE_ADMIN: u32 = 1;
pub const ROLE_ISSUER: u32 = 2;

// Define the interface for the Authority Registry contract dynamically
#[contractclient(name = "RegistryClient")]
pub trait RegistryInterface {
    fn has_role(env: &Env, institution: Address, role: u32) -> bool;
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CertificateData {
    pub recipient: String,
    pub issuer: Address,
    pub issue_date: u64,
    pub expiration_date: u64, // 0 if never expires
    pub is_revoked: bool,
    pub metadata_uri: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Owner,
    Registry,
    Certificate(BytesN<32>),
}

#[contract]
pub struct CertificationVault;

#[contractimpl]
impl CertificationVault {
    // Initialize the vault with owner and authority registry addresses
    pub fn initialize(env: Env, owner: Address, registry: Address) {
        if env.storage().instance().has(&DataKey::Owner) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Registry, &registry);
    }

    // Mint a new certificate after checking issuer role in the authority registry
    pub fn mint_certificate(
        env: Env,
        issuer: Address,
        cert_id: BytesN<32>,
        recipient: String,
        metadata_uri: String,
        expiration_date: u64,
    ) {
        issuer.require_auth();

        // 1. Fetch registry address and perform C2C call to verify ROLE_ISSUER
        let registry_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .expect("registry address not configured");

        let registry_client = RegistryClient::new(&env, &registry_addr);
        let is_authorized_issuer = registry_client.has_role(&issuer, &ROLE_ISSUER);

        if !is_authorized_issuer {
            panic!("unauthorized: caller is not an active issuer");
        }

        // 2. Check if certificate already exists
        let cert_key = DataKey::Certificate(cert_id.clone());
        if env.storage().persistent().has(&cert_key) {
            panic!("certificate already exists");
        }

        // 3. Store certificate data
        let timestamp = env.ledger().timestamp();
        let cert_data = CertificateData {
            recipient: recipient.clone(),
            issuer: issuer.clone(),
            issue_date: timestamp,
            expiration_date,
            is_revoked: false,
            metadata_uri: metadata_uri.clone(),
        };

        env.storage().persistent().set(&cert_key, &cert_data);

        // 4. Emit Mint event
        env.events().publish(
            (env.current_contract_address(), String::from_str(&env, "certificate_minted")),
            (cert_id, recipient, issuer, expiration_date),
        );
    }

    // Revoke a certificate. Only the original issuer or Vault Owner can do this.
    pub fn revoke_certificate(env: Env, caller: Address, cert_id: BytesN<32>) {
        caller.require_auth();

        let cert_key = DataKey::Certificate(cert_id.clone());
        let mut cert_data: CertificateData = env
            .storage()
            .persistent()
            .get(&cert_key)
            .expect("certificate does not exist");

        if cert_data.is_revoked {
            panic!("certificate is already revoked");
        }

        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .expect("contract not initialized");

        // The caller must be either the owner or the original issuer
        if caller != owner && caller != cert_data.issuer {
            panic!("unauthorized to revoke this certificate");
        }

        cert_data.is_revoked = true;
        env.storage().persistent().set(&cert_key, &cert_data);

        // Emit Revocation event
        env.events().publish(
            (env.current_contract_address(), String::from_str(&env, "certificate_revoked")),
            (cert_id, caller),
        );
    }

    // Read helper: Verify if certificate exists and get details
    pub fn verify_certificate(env: Env, cert_id: BytesN<32>) -> Option<CertificateData> {
        let cert_key = DataKey::Certificate(cert_id);
        env.storage().persistent().get(&cert_key)
    }

    // Update registry contract address
    pub fn update_registry(env: Env, owner: Address, new_registry: Address) {
        owner.require_auth();

        let saved_owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .expect("contract not initialized");

        if owner != saved_owner {
            panic!("unauthorized: caller is not owner");
        }

        env.storage().instance().set(&DataKey::Registry, &new_registry);

        env.events().publish(
            (env.current_contract_address(), String::from_str(&env, "registry_updated")),
            new_registry,
        );
    }

    // Read helpers
    pub fn get_owner(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Owner)
    }

    pub fn get_registry(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Registry)
    }
}

mod test;
