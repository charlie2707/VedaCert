const fs = require('fs');
const path = require('path');
const {
  rpc,
  Horizon,
  Keypair,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Contract,
  Address,
  nativeToScVal,
  xdr,
} = require('@stellar/stellar-sdk');
require('dotenv').config();

const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const server = new rpc.Server(RPC_URL);
const horizonServer = new Horizon.Server(HORIZON_URL);

// Use custom target directory configured previously or default target
const WASM_REGISTRY_PATH = path.join(__dirname, '../build_target/wasm32-unknown-unknown/release/authority_registry.wasm');
const WASM_VAULT_PATH = path.join(__dirname, '../build_target/wasm32-unknown-unknown/release/certification_vault.wasm');

async function getOrGenerateKeypair() {
  const secret = process.env.STELLAR_SECRET_KEY;
  if (secret) {
    console.log('Using secret key from env configuration.');
    return Keypair.fromSecret(secret);
  }
  
  console.log('No secret key found in env. Creating a new test keypair...');
  const pair = Keypair.random();
  console.log(`Public Address: ${pair.publicKey()}`);
  console.log(`Secret Seed (SAVE THIS): ${pair.secret()}`);
  return pair;
}

async function fundAccount(publicKey) {
  try {
    console.log(`Funding account ${publicKey} via Friendbot...`);
    const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
    if (response.ok) {
      console.log('Account funded successfully!');
    } else {
      console.warn('Friendbot return status:', response.status);
    }
  } catch (error) {
    console.error('Failed to fund account:', error);
  }
}

async function uploadWasm(wasmPath, keypair) {
  console.log(`Reading WASM: ${wasmPath}`);
  const wasm = fs.readFileSync(wasmPath);
  
  const account = await server.getAccount(keypair.publicKey());
  const op = xdr.Operation.fromXDR(
    TransactionBuilder.uploadContractWasmOperation({ wasm })
  );

  const tx = new TransactionBuilder(account, {
    fee: (parseInt(BASE_FEE) * 20).toString(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(op)
    .setTimeout(60)
    .build();

  console.log('Simulating WASM upload...');
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, sim);
  preparedTx.sign(keypair);
  
  console.log('Submitting upload transaction...');
  const response = await server.sendTransaction(preparedTx);
  if (response.status === 'ERROR') {
    throw new Error(`Upload failed: ${response.errorResultXdr}`);
  }

  console.log(`Polishing transaction status: ${response.hash}`);
  let status = await pollTxStatus(response.hash);
  
  // Extract WASM Hash from transaction result
  const meta = xdr.TransactionMeta.fromXDR(status.resultMetaXdr, 'base64');
  const wasmHash = meta.v3().sorobanMeta().returnValue().bytes();
  console.log(`Uploaded WASM Hash: ${wasmHash.toString('hex')}`);
  return wasmHash;
}

async function deployContract(wasmHash, keypair) {
  const account = await server.getAccount(keypair.publicKey());
  const op = xdr.Operation.fromXDR(
    TransactionBuilder.createContractOperation({
      wasmHash,
      address: new Address(keypair.publicKey()),
    })
  );

  const tx = new TransactionBuilder(account, {
    fee: (parseInt(BASE_FEE) * 10).toString(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(op)
    .setTimeout(60)
    .build();

  console.log('Simulating contract creation...');
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, sim);
  preparedTx.sign(keypair);

  const response = await server.sendTransaction(preparedTx);
  if (response.status === 'ERROR') {
    throw new Error(`Instantiation failed: ${response.errorResultXdr}`);
  }

  const status = await pollTxStatus(response.hash);
  const meta = xdr.TransactionMeta.fromXDR(status.resultMetaXdr, 'base64');
  const contractId = meta.v3().sorobanMeta().returnValue().address().contractId();
  const contractAddress = Address.fromContractId(contractId).toString();
  console.log(`Contract Deployed at Address: ${contractAddress}`);
  return contractAddress;
}

async function pollTxStatus(txHash) {
  let attempts = 0;
  while (attempts < 15) {
    const res = await server.getTransaction(txHash);
    if (res.status === 'SUCCESS') return res;
    if (res.status === 'FAILED') throw new Error('Transaction execution failed');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }
  throw new Error('Transaction polling timed out');
}

// Invoke smart contract method (e.g. initialize)
async function invokeInit(contractAddress, method, args, keypair) {
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(contractAddress);

  const tx = new TransactionBuilder(account, {
    fee: (parseInt(BASE_FEE) * 10).toString(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation init failed: ${sim.error}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, sim);
  preparedTx.sign(keypair);

  const response = await server.sendTransaction(preparedTx);
  await pollTxStatus(response.hash);
  console.log(`Initialized contract successfully via tx: ${response.hash}`);
  return response.hash;
}

async function main() {
  console.log('--- STARTING VEDACERT DEPLOYMENT WORKFLOW ---');
  
  const keypair = await getOrGenerateKeypair();
  await fundAccount(keypair.publicKey());

  // Wait a short moment for ledger state consistency
  await new Promise(r => setTimeout(r, 3000));

  // 1. Deploy Authority Registry
  console.log('\n--- 1. Deploying Authority Registry ---');
  const regWasmHash = await uploadWasm(WASM_REGISTRY_PATH, keypair);
  const registryAddress = await deployContract(regWasmHash, keypair);

  console.log('Initializing Authority Registry Admin...');
  await invokeInit(
    registryAddress,
    'initialize',
    [new Address(keypair.publicKey()).toScVal()],
    keypair
  );

  // 2. Deploy Certification Vault
  console.log('\n--- 2. Deploying Certification Vault ---');
  const vaultWasmHash = await uploadWasm(WASM_VAULT_PATH, keypair);
  const vaultAddress = await deployContract(vaultWasmHash, keypair);

  console.log('Initializing Certification Vault Owner & Registry reference...');
  const initTx = await invokeInit(
    vaultAddress,
    'initialize',
    [
      new Address(keypair.publicKey()).toScVal(),
      new Address(registryAddress).toScVal()
    ],
    keypair
  );

  // 3. Register self (admin) as ROLE_ISSUER so we can mint certificates directly
  console.log('\nRegistering deployment address as ROLE_ISSUER (Role = 2)...');
  await invokeInit(
    registryAddress,
    'add_institution',
    [
      new Address(keypair.publicKey()).toScVal(),
      new Address(keypair.publicKey()).toScVal(),
      nativeToScVal('Platform Root Issuer'),
      nativeToScVal(2) // ROLE_ISSUER = 2
    ],
    keypair
  );

  // 4. Save metadata addresses to frontend folder
  const metadataDir = path.join(__dirname, '../frontend/src/contracts');
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }

  const addressesJson = {
    registryAddress,
    vaultAddress,
    ownerAddress: keypair.publicKey(),
    network: 'testnet',
    lastUpdated: new Date().toISOString(),
    sampleTxHash: initTx,
  };

  fs.writeFileSync(
    path.join(metadataDir, 'addresses.json'),
    JSON.stringify(addressesJson, null, 2)
  );

  console.log('\n--- DEPLOYMENT COMPLETED SUCCESSFULLY ---');
  console.log(JSON.stringify(addressesJson, null, 2));
}

main().catch(console.error);
