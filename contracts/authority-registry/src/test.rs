#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_authority_registry_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, AuthorityRegistry);
    let client = AuthorityRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let institution = Address::generate(&env);

    // Initialize
    client.initialize(&admin);

    // Assert Admin is correct
    assert_eq!(client.get_admin(), Some(admin.clone()));

    // Try to register institution
    let inst_name = String::from_str(&env, "Test University");
    client.add_institution(&admin, &institution, &inst_name, &ROLE_ISSUER);

    // Assert institution has role
    assert!(client.has_role(&institution, &ROLE_ISSUER));
    assert!(!client.has_role(&institution, &ROLE_ADMIN));

    // Get config and assert
    let config = client.get_institution(&institution).unwrap();
    assert_eq!(config.name, inst_name);
    assert_eq!(config.role, ROLE_ISSUER);
    assert!(config.is_active);

    // Suspend institution
    client.set_institution_status(&admin, &institution, &false);
    assert!(!client.has_role(&institution, &ROLE_ISSUER));

    // Reactivate
    client.set_institution_status(&admin, &institution, &true);
    assert!(client.has_role(&institution, &ROLE_ISSUER));
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_cannot_double_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AuthorityRegistry);
    let client = AuthorityRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);
    client.initialize(&admin);
}

#[test]
#[should_panic(expected = "unauthorized: caller is not admin")]
fn test_unauthorized_registration() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, AuthorityRegistry);
    let client = AuthorityRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let mal_actor = Address::generate(&env);
    let inst = Address::generate(&env);

    client.initialize(&admin);

    // mal_actor tries to register, should fail
    client.add_institution(
        &mal_actor,
        &inst,
        &String::from_str(&env, "Malicious U"),
        &ROLE_ISSUER,
    );
}
