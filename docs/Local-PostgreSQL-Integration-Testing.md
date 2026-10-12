# Local PostgreSQL Setup & Integration Testing Guide

> **Project:** AageOnline  
> **Milestone:** 0.20.12A  
> **Audience:** Developers, QA Engineers, and Automation Runners  
> **Environment:** Windows 10/11 (Native PowerShell & Node.js >= 22)

---

## 1. Executive Summary & Safety Policy

Milestone 0.20.12 requires validating AageOnline's persistent PostgreSQL repositories, database migrations (`001` through `011`), transactional ranking settlement, and PayU callback idempotency against a **live, disposable PostgreSQL instance**.

To prevent accidental data loss, security compromise, and invalid test results, the repository enforces strict safety invariants:

1. **Explicit Disposable Database Requirement:**
   - The test harness will **never** connect to a database whose name does not contain an explicit disposable designation (e.g., `test`, `disposable`, `sandbox`, `temp`, `dev`, `local`, `dummy`).
   - The test runner strictly rejects any target database matching production patterns: `prod`, `production`, `live`, `staging`, `main`, or `primary`.
2. **Strict Environment Mode Guard:**
   - Database integration tests will throw a fatal error if executed when `$env:NODE_ENV = "production"`.
3. **Zero Secret Leakage:**
   - All connection strings are sanitized via `redactConnectionString()` prior to logging or reporting (`username:***@host:port/database`).
4. **Deterministic Synthetic Cleanup:**
   - Test teardown only purges synthetic records created with explicit prefixes:
     - Users: `usr_test_%`
     - Businesses: `biz_test_%`
     - Markets: `mkt_test_%`
     - Memberships: `mem_test_%`
     - Bid Intents: `bi_live_%`
     - Payment Orders: `po_live_%`
     - Provider Events: `pe_%`
     - Ranking Settlements: `rs_test_%`
     - Position History: `ph_test_%`
     - Sessions: `sess_%`
5. **No False Skips:**
   - If a test database is configured via `$env:INTEGRATION_TEST_DATABASE_URL` or `$env:DATABASE_URL`, connection failures or schema violations **fail the test suite immediately**.
   - Tests only skip when no database environment variable is provided.

---

## 2. Windows-Native PostgreSQL Installation Procedure

If PostgreSQL is not currently installed or running on your local Windows system, follow one of the methods below. **Coding agents are restricted from installing system packages automatically; this is a manual prerequisite.**

### Method A: Official EnterpriseDB (EDB) Installer (Recommended GUI)
1. Download the official PostgreSQL Windows installer from [EnterpriseDB PostgreSQL Downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) (PostgreSQL 15, 16, or 17).
2. Run the installer `.exe` with Administrator privileges.
3. During setup:
   - Installation Directory: Keep default (e.g., `C:\Program Files\PostgreSQL\16`).
   - Components: Select **PostgreSQL Server**, **pgAdmin 4** (optional), and **Command Line Tools**.
   - Data Directory: Keep default.
   - Password: Set a secure local password for the default `postgres` superuser (e.g., `postgres` or your preferred local password).
   - Port: Keep default `5432`.
   - Locale: Default locale or English/United States.
4. Complete the installation and finish.

### Method B: Windows Package Manager (`winget`)
Open an elevated PowerShell (Run as Administrator) and run:
```powershell
winget install PostgreSQL.PostgreSQL
```
Follow the installer prompts to specify the superuser password and verify port 5432.

---

## 3. Verify PostgreSQL Service & Port Connectivity

After installation, verify that the PostgreSQL Windows service is running and accepting TCP connections on port 5432:

### Step 1: Check Windows Service Status
```powershell
Get-Service -Name *postgres*
```
**Expected Output:**
```text
Status   Name               DisplayName
------   ----               -----------
Running  postgresql-x64-16  postgresql-x64-16 - PostgreSQL Server 16
```
If the service is stopped, start it via PowerShell (Admin):
```powershell
Start-Service -Name postgresql-x64-16
```

### Step 2: Verify Port 5432 TCP Listener
```powershell
Test-NetConnection -ComputerName localhost -Port 5432
```
**Expected Output:**
```text
ComputerName     : localhost
RemoteAddress    : 127.0.0.1
RemotePort       : 5432
InterfaceAlias   : Loopback Pseudo-Interface 1
SourceAddress    : 127.0.0.1
TcpTestSucceeded : True
```

---

## 4. Dedicated Disposable Database Setup

Never execute integration tests against your primary development database or a production database. Create a dedicated disposable database named `aageonline_integration_test`.

### Step 1: Add PostgreSQL `bin` to Path (If needed)
If `psql` is not in your current PATH, locate your installation directory:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
```

### Step 2: Create the Disposable Database
Using `psql`:
```powershell
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE aageonline_integration_test;"
```
*(Enter your postgres superuser password when prompted)*

To verify the database exists:
```powershell
psql -U postgres -h localhost -p 5432 -l
```

---

## 5. Environment Variable Configuration (PowerShell)

AageOnline recognizes two environment variables for integration testing:
1. `INTEGRATION_TEST_DATABASE_URL` (Highest precedence, dedicated to tests).
2. `DATABASE_URL` (Standard connection string).

In PowerShell, configure your connection string for your current terminal session:

```powershell
# Set disposable test database URL (replace <password> with your actual local postgres password)
$env:INTEGRATION_TEST_DATABASE_URL = "postgresql://postgres:<password>@localhost:5432/aageonline_integration_test"
$env:NODE_ENV = "test"
```

To verify the environment variable is set without leaking your credentials:
```powershell
$env:INTEGRATION_TEST_DATABASE_URL -replace '://([^:]+):([^@]+)@', '://$1:***@'
```

---

## 6. Running Migrations & Executing Integration Tests

All repository scripts must be executed from the `frontend/` directory.

### Step 1: Navigate to Frontend Directory
```powershell
cd "D:\Aage online\frontend"
```

### Step 2: Apply Migrations (001 through 011)
Run the migration runner against the disposable test database:
```powershell
# Apply all schema migrations (users, markets, bids, payments, settlements, sessions)
$env:DATABASE_URL = $env:INTEGRATION_TEST_DATABASE_URL
npm run db:migrate
```
**Expected Output:**
```text
[MIGRATION] Migration runner acquired advisory lock 8429104
[MIGRATION] Loaded 11 migration file(s). Applied in database: 0
[MIGRATION] Applying: 001_initial_schema.sql
...
[MIGRATION] Applying: 011_market_claim_requests.sql
[MIGRATION] Successfully applied 11 migration(s).
```

### Step 3: Run the Real PostgreSQL Integration Test Suite
Execute the dedicated integration test file using Node's native test runner:
```powershell
node --experimental-strip-types --test tests/real-postgres-integration.test.ts
```

Or run all frontend unit and integration tests:
```powershell
npm test
```

---

## 7. Financial & Settlement Verification Invariants Tested

The integration test suite (`frontend/tests/real-postgres-integration.test.ts`) verifies critical financial and operational properties:

| Section | Verification Target | Invariant Enforced |
|---|---|---|
| **1. Safety & Pre-Flight** | Target URL Validation | Rejects `NODE_ENV=production`, blocks production keywords (`prod`, `live`, `main`), validates redaction. |
| **2. Migration Runner** | Schema Idempotency | Consecutive migration runs apply 0 migrations and preserve applied version records. |
| **3. Cross-Connection Persistence** | Isolation & Foreign Keys | Records committed on Connection A are visible to Connection B; cascade constraints and unique keys are strictly enforced. |
| **4. Transactional Settlement** | Market Lock Serialization | Simultaneous settlement calls serialize using `pg_advisory_xact_lock(hashtext(market_id))` and `SELECT id FROM markets WHERE id = $1 FOR UPDATE`. Explicit `ROLLBACK` reverts uncommitted state completely. |
| **5. Callback Deduplication** | PayU Idempotency | Duplicate webhook payloads with identical `(provider, payload_hash)` are rejected at the database level by unique constraint `uq_payment_provider_events_fingerprint`. |
| **6. Session Security** | Multi-Tenant Sessions | SHA-256 session token hashes are stored durably in `user_sessions`; revocations delete rows atomically. |

### Technical Note on Concurrency Locking: `hashtext()` Limitations
- In PostgreSQL, `hashtext(string)` converts a string into a signed 32-bit integer.
- Because signed 32-bit integers span approximately 4.29 billion values, hash collisions are mathematically possible under high cardinalities (Birthday Paradox).
- **AageOnline Defense-in-Depth:**
  1. The platform utilizes advisory transaction locks (`pg_advisory_xact_lock`) for cooperative in-memory serialization between distributed worker processes.
  2. To eliminate any reliance on collision-free hashing, every settlement transaction executes an immediate row-level lock on the canonical entity:
     ```sql
     SELECT id FROM markets WHERE id = $1 FOR UPDATE;
     ```
  3. This dual-locking strategy guarantees absolute database-level serialization per market without deadlock or collision vulnerability.

---

## 8. Post-Test Cleanup & Database Teardown

To clean up after testing:

### Option A: Retain Database for Ongoing Development
The test harness automatically cleans up its own synthetic records (`usr_test_%`, `biz_test_%`, `po_live_%`, etc.) in the test suite `after()` hook.

### Option B: Complete Teardown (Drop Database)
To drop the entire disposable database:
```powershell
psql -U postgres -h localhost -p 5432 -c "DROP DATABASE aageonline_integration_test;"
```

---

## 9. Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL service is stopped or port is blocked | Run `Start-Service postgresql-x64-16` or check Windows Firewall for port 5432. |
| `password authentication failed for user "postgres"` | Incorrect password in connection string | Verify password in `$env:INTEGRATION_TEST_DATABASE_URL` matches superuser password set during installation. |
| `database "aageonline_integration_test" does not exist` | Database has not yet been created | Run `psql -U postgres -c "CREATE DATABASE aageonline_integration_test;"`. |
| `SAFETY ERROR: Database target ... matches forbidden target pattern` | Database name resembles a production environment | Rename database so it contains `test` or `disposable` (e.g. `aageonline_integration_test`). |
| `SCRAM-SHA-256 authentication failed` | Password encoding mismatch or special characters | If password contains special URL characters (e.g. `#`, `@`, `/`), URL-encode them (e.g. `%23`, `%40`). |
| `deadlock detected during advisory lock` | Concurrent tests operating on conflicting markets | Ensure each test run utilizes isolated market IDs or relies on transaction-scoped locks. |
