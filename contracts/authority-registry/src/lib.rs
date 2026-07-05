#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

// Role Constants
pub const ROLE_ADMIN: u32 = 1;
pub const ROLE_ISSUER: u32 = 2;
pub const ROLE_AUDITOR: u32 = 3;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InstitutionConfig {
    pub name: String,
    pub role: u32,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Institution(Address),
}

#[contract]
pub struct AuthorityRegistry;

#[contractimpl]
impl AuthorityRegistry {
    // Initialize the registry with an administrator
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    // Add or update an institution with a role
    pub fn add_institution(
        env: Env,
        admin: Address,
        institution: Address,
        name: String,
        role: u32,
    ) {
        // Authenticate the administrator
        admin.require_auth();

        let saved_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("contract not initialized");
        if admin != saved_admin {
            panic!("unauthorized: caller is not admin");
        }

        if role != ROLE_ADMIN && role != ROLE_ISSUER && role != ROLE_AUDITOR {
            panic!("invalid role");
        }

        let config = InstitutionConfig {
            name,
            role,
            is_active: true,
        };

        // Write to persistent storage as this holds larger institutional data
        let key = DataKey::Institution(institution.clone());
        env.storage().persistent().set(&key, &config);

        // Emit registry event
        env.events().publish(
            (env.current_contract_address(), String::from_str(&env, "institution_added")),
            (institution, role),
        );
    }

    // Update institution status (activate/suspend)
    pub fn set_institution_status(
        env: Env,
        admin: Address,
        institution: Address,
        is_active: bool,
    ) {
        admin.require_auth();

        let saved_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("contract not initialized");
        if admin != saved_admin {
            panic!("unauthorized: caller is not admin");
        }

        let key = DataKey::Institution(institution.clone());
        let mut config: InstitutionConfig = env
            .storage()
            .persistent()
            .get(&key)
            .expect("institution not registered");

        config.is_active = is_active;
        env.storage().persistent().set(&key, &config);

        env.events().publish(
            (env.current_contract_address(), String::from_str(&env, "institution_status")),
            (institution, is_active),
        );
    }

    // Read helper: Check if an institution has a specific active role
    pub fn has_role(env: Env, institution: Address, role: u32) -> bool {
        let key = DataKey::Institution(institution);
        if let Some(config) = env.storage().persistent().get::<DataKey, InstitutionConfig>(&key) {
            config.is_active && config.role == role
        } else {
            false
        }
    }

    // Read helper: Get full details for an institution
    pub fn get_institution(env: Env, institution: Address) -> Option<InstitutionConfig> {
        let key = DataKey::Institution(institution);
        env.storage().persistent().get(&key)
    }

    // Read helper: Get the current admin
    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }
}

mod test;
