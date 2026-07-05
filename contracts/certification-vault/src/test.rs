#![cfg(test)]
use super::*;
use soroban_sdk::{contract, contractimpl, testutils::Address as _, Address, BytesN, Env, String};

// Minimal Mock Registry to test contract-to-contract call logic
#[contract]
pub struct MockRegistry;

#[contractimpl]
impl MockRegistry {
    pub fn has_role(env: Env, institution: Address, role: u32) -> bool {
        let key = institution;
        if let Some(saved_role) = env.storage().instance().get::<Address, u32>(&key) {
            saved_role == role
        } else {
            false
        }
    }

    pub fn set_role(env: Env, institution: Address, role: u32) {
        let key = institution;
        env.storage().instance().set(&key, &role);
    }
}

#[test]
fn test_vault_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    // 1. Deploy & Setup Mock Registry
    let registry_id = env.register_contract(None, MockRegistry);
    let registry_client = MockRegistryClient::new(&env, &registry_id);

    let issuer = Address::generate(&env);
    registry_client.set_role(&issuer, &ROLE_ISSUER);

    // 2. Deploy & Setup Certification Vault
    let vault_id = env.register_contract(None, CertificationVault);
    let vault_client = CertificationVaultClient::new(&env, &vault_id);

    let owner = Address::generate(&env);
    vault_client.initialize(&owner, &registry_id);

    // Assert setup
    assert_eq!(vault_client.get_owner(), Some(owner.clone()));
    assert_eq!(vault_client.get_registry(), Some(registry_id.clone()));

    // 3. Mint Certificate as Authorized Issuer
    let mut cert_id_bytes = [0u8; 32];
    cert_id_bytes[0] = 42;
    let cert_id = BytesN::from_array(&env, &cert_id_bytes);

    let recipient = String::from_str(&env, "Alice");
    let metadata_uri = String::from_str(&env, "ipfs://QmSomeHash");
    let expiration = 1800000000u64; // arbitrary future date

    vault_client.mint_certificate(&issuer, &cert_id, &recipient, &metadata_uri, &expiration);

    // Verify Minting
    let cert_data = vault_client.verify_certificate(&cert_id).unwrap();
    assert_eq!(cert_data.recipient, recipient);
    assert_eq!(cert_data.issuer, issuer);
    assert_eq!(cert_data.metadata_uri, metadata_uri);
    assert_eq!(cert_data.expiration_date, expiration);
    assert_eq!(cert_data.is_revoked, false);

    // 4. Revoke Certificate as Issuer
    vault_client.revoke_certificate(&issuer, &cert_id);
    let cert_data_after = vault_client.verify_certificate(&cert_id).unwrap();
    assert_eq!(cert_data_after.is_revoked, true);
}

#[test]
#[should_panic(expected = "unauthorized: caller is not an active issuer")]
fn test_unauthorized_minting() {
    let env = Env::default();
    env.mock_all_auths();

    let registry_id = env.register_contract(None, MockRegistry);

    let vault_id = env.register_contract(None, CertificationVault);
    let vault_client = CertificationVaultClient::new(&env, &vault_id);

    let owner = Address::generate(&env);
    vault_client.initialize(&owner, &registry_id);

    let unauth_user = Address::generate(&env);
    let mut cert_id_bytes = [0u8; 32];
    cert_id_bytes[0] = 99;
    let cert_id = BytesN::from_array(&env, &cert_id_bytes);

    // This should fail because unauth_user is not ROLE_ISSUER in Mock Registry
    vault_client.mint_certificate(
        &unauth_user,
        &cert_id,
        &String::from_str(&env, "Bob"),
        &String::from_str(&env, "ipfs://hash"),
        &0,
    );
}

#[test]
#[should_panic(expected = "unauthorized to revoke this certificate")]
fn test_unauthorized_revocation() {
    let env = Env::default();
    env.mock_all_auths();

    let registry_id = env.register_contract(None, MockRegistry);
    let registry_client = MockRegistryClient::new(&env, &registry_id);

    let issuer = Address::generate(&env);
    registry_client.set_role(&issuer, &ROLE_ISSUER);

    let vault_id = env.register_contract(None, CertificationVault);
    let vault_client = CertificationVaultClient::new(&env, &vault_id);

    let owner = Address::generate(&env);
    vault_client.initialize(&owner, &registry_id);

    let mut cert_id_bytes = [0u8; 32];
    cert_id_bytes[0] = 77;
    let cert_id = BytesN::from_array(&env, &cert_id_bytes);

    vault_client.mint_certificate(
        &issuer,
        &cert_id,
        &String::from_str(&env, "Alice"),
        &String::from_str(&env, "ipfs://hash"),
        &0,
    );

    // Stranger tries to revoke
    let stranger = Address::generate(&env);
    vault_client.revoke_certificate(&stranger, &cert_id);
}
