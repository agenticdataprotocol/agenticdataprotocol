/**
 * ADP Curation Manifest TypeScript Schema
 * Version: 2026-01-20
 *
 * This schema defines the types for the ADP Curation Plane's three-layered
 * manifest strategy (Physical, Semantic, Policy). These manifests transform
 * raw infrastructure into Agent-Ready Resources that can be used with the
 * ADP protocol.
 */

// Import common types from the main ADP schema
import type {
  PredicateOperator,
  Field,
  Resource,
  ResourceId,
  SortOrder,
  IntentClass,
} from "./schema";

/* ============================================================================
 * Common Types
 * ============================================================================ */

/**
 * Supported backend types for physical data sources.
 *
 * @category Curation Physical Manifest
 */
export type BackendType =
  | "RDBMS" // Relational databases (PostgreSQL, MySQL, etc.)
  | "VECTOR" // Vector databases (Pinecone, Weaviate, etc.)
  | "S3" // Object storage (AWS S3, MinIO, etc.)
  | "NOSQL" // NoSQL databases (MongoDB, DynamoDB, etc.)
  | "GRAPH"; // Graph databases (Neo4j, etc.)

/**
 * Backend provider (implementation/variant) within a type.
 * Used to distinguish concrete backends when `type` alone is ambiguous
 * (e.g. RDBMS could be PostgreSQL, MySQL, etc.).
 *
 * Suggested values by type:
 * - RDBMS: "postgresql", "mysql", "sqlite", "oracle", "mssql", etc.
 * - VECTOR: "pinecone", "weaviate", "qdrant", "milvus", etc.
 * - S3: "s3", "minio", "gcs" (S3-compatible), etc.
 * - NOSQL: "mongodb", "dynamodb", "cassandra", etc.
 * - GRAPH: "neo4j", "janusgraph", etc.
 *
 * Implementors use this to select the correct driver or client.
 *
 * @category Curation Physical Manifest
 */
export type BackendProvider = string;

/* ============================================================================
 * Physical Manifest Types
 * ============================================================================ */

/**
 * Reference to credentials stored externally.
 *
 * @category Curation Physical Manifest
 * @example
 * // Environment variable
 * { "type": "env", "key": "DB_PASSWORD" }
 * @example
 * // AWS Secrets Manager
 * { "type": "secret", "manager": "AWS_SECRETS_MANAGER", "key": "production/db-credentials" }
 * @example
 * // HashiCorp Vault
 * { "type": "secret", "manager": "HASHICORP_VAULT", "key": "secret/data/database" }
 * @example
 * // Azure Key Vault
 * { "type": "secret", "manager": "AZURE_KEY_VAULT", "key": "db-connection-string" }
 * @example
 * // File path
 * { "type": "file", "key": "/etc/secrets/db-password.txt" }
 */
export interface CredentialReference {
  /**
   * Type of credential reference.
   * - `env`: Environment variable
   * - `secret`: Secret manager (AWS Secrets Manager, HashiCorp Vault, etc.)
   * - `file`: Path to credential file
   */
  type: "env" | "secret" | "file";

  /**
   * The key or path to the credential.
   *
   * For `env` type: The environment variable name (e.g., "DB_PASSWORD").
   *
   * For `secret` type: The secret identifier/path in the secret manager.
   * The format depends on the manager:
   * - AWS Secrets Manager: Secret name or ARN (e.g., "production/db-credentials")
   * - HashiCorp Vault: Secret path (e.g., "secret/data/database")
   * - Azure Key Vault: Secret name (e.g., "db-connection-string")
   * - Google Secret Manager: Secret name (e.g., "projects/PROJECT_ID/secrets/SECRET_NAME")
   *
   * For `file` type: Absolute or relative file path (e.g., "/etc/secrets/db-password.txt").
   */
  key: string;

  /**
   * Secret manager identifier (required when `type` is `"secret"`).
   *
   * Common values:
   * - `"AWS_SECRETS_MANAGER"` - AWS Secrets Manager
   * - `"HASHICORP_VAULT"` - HashiCorp Vault
   * - `"AZURE_KEY_VAULT"` - Azure Key Vault
   * - `"GCP_SECRET_MANAGER"` - Google Cloud Secret Manager
   * - `"KUBERNETES_SECRET"` - Kubernetes Secrets
   * - Custom string for other secret managers
   *
   * @example "AWS_SECRETS_MANAGER"
   * @example "HASHICORP_VAULT"
   */
  manager?: string;
}

/**
 * Configuration for RDBMS backend types.
 *
 * @category Curation Physical Manifest
 */
export interface RDBMSBackendConfig {
  /**
   * Connection URI for the database. For PostgreSQL, the format is:
   * postgresql://[user[:password]@][host][:port][/dbname][?param1=value1&...]
   * For MySQL, the format is:
   * mysql://[user[:password]@][host][:port][/dbname][?param1=value1&...]
   * For MySQL the dbname is optional in the uri and will be used as the default database.
   *
   * @example "postgresql://db.acme.com:5432/finance"
   * @example "mysql://user@localhost:3306/mydb"
   */
  uri: string;

  /**
   * Database schema name (optional).
   * For PostgreSQL, the schema name is optional and will be used as the default schema.
   * For MySQL, the schema name is not supported. If you need to specify a default DB, you
   * can specify the dbname in the uri.
   *
   * @example "public"
   * @example "finance"
   */
  schema?: string;

  /**
   * Additional properties for the RDBMS backend.
   */
  properties?: Record<string, unknown>;
}

/**
 * Configuration for Vector backend types.
 *
 * @category Curation Physical Manifest
 */
export interface VectorBackendConfig {
  /**
   * Index or collection name.
   */
  indexName: string;

  /**
   * API endpoint (if required).
   */
  endpoint?: string;

  /**
   * Vector dimensions (optional, may be defined in semantic layer).
   */
  dimensions?: number;
}

/**
 * Configuration for S3 backend types.
 *
 * @category Curation Physical Manifest
 */
export interface S3BackendConfig {
  /**
   * S3 bucket URI.
   * @example "s3://acme-finance-datalake/"
   */
  uri: string;

  /**
   * AWS region (or equivalent for other S3-compatible services).
   */
  region: string;

  /**
   * Endpoint URL for S3-compatible services (optional).
   */
  endpoint?: string;
}

/**
 * Backend-specific configuration.
 * Each backend type has its own configuration structure.
 *
 * @category Curation Physical Manifest
 */
export type BackendConfig =
  | ({ type: "RDBMS" } & RDBMSBackendConfig)
  | ({ type: "VECTOR" } & VectorBackendConfig)
  | ({ type: "S3" } & S3BackendConfig)
  | ({ type: "NOSQL" | "GRAPH" } & Record<string, unknown>);

/**
 * Definition of a physical backend data source.
 *
 * @category Curation Physical Manifest
 * @example
 * {
 *   "id": "finance_sql",
 *   "type": "RDBMS",
 *   "provider": "postgresql",
 *   "config": {
 *     "type": "RDBMS",
 *     "uri": "postgresql://db.acme.com:5432/finance"
 *   },
 *   "credentials": { "type": "env", "key": "DB_PASS" }
 * }
 */
export interface Backend {
  /**
   * Unique identifier for this backend.
   * Referenced by resources in the semantic manifest via `backendId`.
   */
  id: string;

  /**
   * Type of backend (category).
   */
  type: BackendType;

  /**
   * Provider (implementation/variant) to distinguish backends with the same type.
   * E.g. for type "RDBMS", provider may be "postgresql" or "mysql". Implementors
   * use this to select the correct driver or client.
   */
  provider: BackendProvider;

  /**
   * Backend-specific configuration.
   */
  config: BackendConfig;

  /**
   * Credential reference for authentication.
   */
  credentials?: CredentialReference;

  /**
   * Additional metadata about the backend.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Root structure for the physical manifest (physical.yaml).
 *
 * @category Curation Physical Manifest
 * @example
 * {
 *   "version": "1.0.0",
 *   "backends": [
 *     {
 *       "id": "finance_sql",
 *       "type": "RDBMS",
 *       "provider": "postgresql",
 *       "config": {
 *         "type": "RDBMS",
 *         "uri": "postgresql://db.acme.com:5432/finance"
 *       },
 *       "credentials": { "type": "env", "key": "DB_PASS" }
 *     }
 *   ]
 * }
 */
export interface PhysicalManifest {
  /**
   * Version of the manifest schema.
   * **Required.** Used to identify which spec version this manifest follows.
   */
  version: string;

  /**
   * List of backend definitions.
   */
  backends: Backend[];
}

/* ============================================================================
 * Semantic Manifest Types
 * ============================================================================ */

/**
 * Definition of a source within a resource.
 * Each source represents a specific data source (table, collection, prefix, etc.)
 * within a backend, with its own field definitions.
 *
 * @category Curation Semantic Manifest
 */
export interface SourceDefinition {
  /**
   * Source identifier in the backend.
   *
   * Interpretation depends on the backend type:
   * - RDBMS: table or view name (e.g., "v_failures_consolidated"), the format can be {table_name} or {schema_name}.{table_name}
   * - Vector: collection or index name (e.g., "bank-summaries")
   * - S3: prefix pattern (e.g., "finance/reports/")
   * - NoSQL: collection or namespace name
   * - Graph: node label or pattern
   */
  source: string;

  /**
   * Field definitions for this source.
   *
   * When provided, these define the ADP-visible field schema for this source.
   *
   * For some backends, there may be no stable or meaningful field-level schema
   * (for example, opaque blob stores or key/value stores with arbitrary values).
   * In those cases, this property can be safely omitted and the resource will
   * be treated as exposing an opaque or implementation-defined payload.
   */
  fields?: Field[];
}

/**
 * Definition of a resource in the semantic layer.
 * Extends Resource with curation-specific fields for backend binding and a single source definition.
 *
 * Each curated resource is backed by exactly one `sourceDefinition` within a backend
 * (table, collection, prefix, etc.) and has its own field definitions.
 *
 * **Required definition**: To support ADP operations like `adp.discover` and `adp.describe`,
 * resources must be explicitly defined in `semantic.yaml` (no auto-discovery bootstrap mode).
 *
 * @category Curation Semantic Manifest
 * @example
 * // Full manual definition - single source
 * {
 *   "resourceId": "com.acme.finance:bank_failures",
 *   "intentClasses": ["QUERY"],
 *   "version": 1,
 *   "description": "Bank failure records",
 *   "backendId": "finance_sql",
 *   "sourceDefinition": {
 *     "source": "v_failures_consolidated",
 *     "fields": [
 *       { "fieldId": "bank_id", "type": "STRING", "description": "FDIC Certificate Number" },
 *       { "fieldId": "closing_date", "type": "DATE", "description": "The date the institution was closed." }
 *     ]
 *   }
 * }
 */
export interface CuratedResource extends Resource {
  /**
   * Reference to the backend in physical.yaml that provides this resource.
   * Required.
   */
  backendId: string;

  /**
   * Source definition for this resource.
   *
   * Represents the single data source within the backend (table, collection, prefix, etc.)
   * that backs this resource and defines its fields.
   */
  sourceDefinition: SourceDefinition;
}

/**
 * Intent class support for CuratedResource.
 *
 * **Wildcard Intent Class**: The resource can accept any intent class by:
 * 1. Explicitly specifying `["*"]` (explicit wildcard)
 *
 * When `intentClasses` contains `"*"`, it acts as a wildcard and accepts any intent class.
 * If `"*"` is included with other intent classes (e.g., `["QUERY", "*"]`), the wildcard
 * takes precedence and all intent classes are accepted.
 *
 * **Empty Array**: If `intentClasses` is an empty array `[]`, no intent classes are accepted.
 * The resource will reject all requests regardless of intent class. This effectively disables
 * the resource.
 *
 * **Specific Intent Classes**: When `intentClasses` is specified with specific values
 * (e.g., `["QUERY", "LOOKUP"]`), only those listed intent classes are supported.
 * The resource will reject requests with intent classes not in the list.
 */

/**
 * Root structure for the semantic manifest (semantic.yaml).
 *
 * **Required definition**: `resources` must be provided. ADP operations like `adp.discover`
 * and `adp.describe` rely on these explicit resource definitions.
 *
 * @category Curation Semantic Manifest
 * @example
 * // Full manual definition
 * {
 *   "version": "1.0.0",  // manifest schema version (string)
 *   "resources": [
 *     {
 *       "resourceId": "com.acme.finance:bank_failures",
 *       "backendId": "finance_sql",
 *       "sourceDefinition": {
 *         "source": "v_failures_consolidated",
 *         "fields": [
 *           { "fieldId": "bank_id", "type": "STRING", "description": "FDIC Certificate Number" },
 *           { "fieldId": "closing_date", "type": "DATE", "description": "The date the institution was closed." }
 *         ]
 *       }
 *     }
 *   ]
 * }
 */
export interface SemanticManifest {
  /**
   * Version of the manifest schema.
   * **Required.** Used to identify which spec version this manifest follows.
   */
  version: string;

  /**
   * List of resource definitions.
   *
   * Required. Each entry binds a `resourceId` to one backend and one source definition.
   */
  resources: CuratedResource[];
}

/* ============================================================================
 * Policy Manifest Types
 * ============================================================================ */

/**
 * Condition expression for conditional policies.
 * Supports simple expressions like `agent_tier == 'BASIC'`.
 *
 * @category Curation Policy Manifest
 */
export type PolicyCondition = string;

/**
 * `ResourceSelector` is used in policy matching to select resources.
 *
 * **Grammar (string form)** — wildcard `*` may appear **only once** and, when
 * present, MUST appear as the final token. Supported shapes are:
 * - **Exact**: `"namespace:name"` — matches a single `ResourceId`
 *   (e.g. `"com.acme.finance:bank_failures"`). No `*` allowed.
 * - **All names in one namespace**: `"namespace:*"` — matches all resources
 *   whose `ResourceId` has the exact `namespace` and any name
 *   (e.g. `"com.acme.finance:*"`).
 * - **Namespace prefix (no colon)**: `"namespace.*"` — matches all resources
 *   whose namespace starts with `namespace.` and any name
 *   (e.g. `"com.acme.*"`, `"com.acme.finance.*"`). But, it does not match resources
 *   in the com.acme namespace itself — use "com.acme:*" for that
 * - **Global**: `"*"` — matches **all** resources, regardless of namespace or
 *   name. This is useful for bootstrap-style default ACCESS rules (see
 *   `examples/policy-bootstrap.yaml`).
 *
 * Disallowed examples:
 * - `"a*"` or `"a.b*"` (wildcard inside a segment)
 * - `"com.acme.*:bank_failures"` (wildcard not in the last token)
 * - `"com.acme.*:*"` (more than one wildcard token)
 *
 * **Relationship to `ResourceId`**:
 * - `ResourceId` is always a concrete `namespace:name` identifier with **no wildcards**.
 * - `ResourceSelector` may be an exact `ResourceId`, `"*"`, or one of the wildcard
 *   forms above.
 *
 * @category Curation Policy Manifest
 */
export type ResourceSelector = string;

/**
 * Mandatory filter policy that enforces required predicates.
 * Applies to exactly one resource; `resourceId` is required and must be an
 * exact resource ID (no wildcards). `fieldId` is interpreted against that
 * resource's schema.
 *
 * @category Curation Policy Manifest
 * @example
 * {
 *   "type": "MANDATORY_FILTER",
 *   "resourceId": "com.acme.finance:bank_failures",
 *   "fieldId": "closing_date",
 *   "op": "GT",
 *   "value": "2020-01-01"
 * }
 */
export interface MandatoryFilterPolicy {
  /**
   * Type of policy.
   */
  type: "MANDATORY_FILTER";

  /**
   * Resource ID (exact) this policy applies to. `fieldId` is interpreted against
   * this resource's schema. No wildcards.
   */
  resourceId: ResourceId;

  /**
   * Field identifier for the mandatory filter.
   */
  fieldId: string;

  /**
   * Operator for the mandatory filter.
   */
  op: PredicateOperator;

  /**
   * Value for the mandatory filter.
   */
  value: string | number | boolean | (string | number | boolean)[];

  /**
   * Optional condition for when this policy applies.
   */
  condition?: PolicyCondition;
}

/**
 * Operational policy that applies constraints for resource access.
 * Applies to exactly one resource; `resourceId` is required and must be an
 * exact resource ID (no wildcards). `defaultOrderBy` is interpreted against
 * that resource's schema.
 *
 * @category Curation Policy Manifest
 * @example
 * {
 *   "type": "OPERATIONAL",
 *   "resourceId": "com.acme.finance:bank_failures",
 *   "enforceLimit": 100,
 *   "defaultOrderBy": { "fieldId": "closing_date", "direction": "DESC" }
 * }
 */
export interface OperationalPolicy {
  /**
   * Type of policy.
   */
  type: "OPERATIONAL";

  /**
   * Resource ID (exact) this policy applies to. `defaultOrderBy` is interpreted
   * against this resource's schema. No wildcards.
   */
  resourceId: ResourceId;

  /**
   * Maximum number of results to return (enforced limit).
   */
  enforceLimit?: number;

  /**
   * Default sort order to apply to the resource.
   * Uses structured SortOrder format with fieldId and direction.
   */
  defaultOrderBy?: SortOrder;

  /**
   * Optional condition for when this policy applies.
   */
  condition?: PolicyCondition;
}

/**
 * Role-to-intents mapping for RBAC access control.
 * Defines which intent classes a role is allowed to use on the resource.
 *
 * @category Curation Policy Manifest
 * @example
 * { "role": "admin", "allowedIntents": ["LOOKUP", "QUERY", "REVISE", "INGEST"] }
 * @example
 * { "role": "user", "allowedIntents": ["LOOKUP", "QUERY"] }
 */
export interface RoleAccessEntry {
  /**
   * Role identifier (e.g. "admin", "user").
   * The runtime supplies the current role from auth/session when evaluating access.
   */
  role: string;

  /**
   * Intent classes this role is allowed to use on the resource.
   * Use "*" to allow all intent classes for this role.
   */
  allowedIntents: IntentClass[];
}

/**
 * RBAC-style access policy: restricts which roles can use which intent classes.
 * Each ACCESS policy declares which resources it applies to via required
 * `resourceSelector`, which uses the `ResourceSelector` grammar:
 * - Exact resource ID (e.g. `"com.acme.finance:bank_failures"`), or
 * - Wildcard pattern with `*` only as the final token, such as
 *   `"com.acme.finance:*"`, `"com.acme.*"`, or `"com.acme.finance.*"`.
 *
 * **Deterministic resolution when multiple ACCESS policies match**
 *
 * Multiple ACCESS policies may match the same concrete `ResourceId` via overlapping
 * selectors (for example, `"com.acme.*"` and `"com.acme.finance:*"`). Runtimes
 * MUST resolve them deterministically as follows:
 *
 * 1. Compute the set of ACCESS policies whose `resourceSelector` matches the
 *    target `ResourceId`.
 * 2. For each matching selector, compute a specificity rank:
 *    - Highest: exact `namespace:name`
 *    - Next: exact-namespace wildcard name (`namespace:*`)
 *    - Lowest: namespace-prefix forms (`namespace.*`, `namespace.sub.*`), where
 *      longer namespaces are more specific than shorter ones.
 * 3. Discard any ACCESS policies whose selector has lower specificity than the
 *    maximum rank among matches.
 * 4. From the remaining ACCESS policies (all with equal, highest specificity),
 *    merge `roles` deterministically:
 *    - For each role, take the **union** of `allowedIntents` across policies,
 *      de-duplicating values.
 *    - If any `allowedIntents` for a role contains `"*"`, treat that as
 *      "all intent classes" for that role regardless of other entries.
 *
 * After this resolution/merge, the resulting effective `roles` set is used
 * to decide if a given `(role, intentClass)` is allowed.
 *
 * **Default behavior when no ACCESS policy matches (closed-by-default)**
 *
 * If, after step 1 above, the set of ACCESS policies whose `resourceSelector`
 * matches a given concrete `ResourceId` is **empty**, runtimes MUST treat the
 * effective `roles` set for that resource as empty:
 *
 * - No `(role, intentClass)` pair is allowed by ACCESS for that resource.
 * - There is **no implicit fallback** that grants access when no ACCESS policy
 *   matches; lack of a match means "no access".
 *
 * This applies regardless of whether the manifest defines ACCESS policies for
 * other resources. ACCESS therefore behaves as a **closed-by-default gate**:
 * you must opt resources in by defining at least one matching ACCESS rule.
 *
 * For development or bootstrap scenarios that require open-by-default behavior,
 * manifests SHOULD define an explicit catch-all ACCESS rule (for example,
 * `"resourceSelector": "*"` or an org-scoped selector such as `"com.acme.*"`)
 * that allows the desired roles and intent classes, as illustrated in
 * `examples/policy-bootstrap.yaml`.
 *
 * @category Curation Policy Manifest
 * @example
 * {
 *   "type": "ACCESS",
 *   "resourceSelector": "com.acme.finance:bank_failures",
 *   "roles": [
 *     { "role": "admin", "allowedIntents": ["LOOKUP", "QUERY", "REVISE", "INGEST"] },
 *     { "role": "user", "allowedIntents": ["LOOKUP", "QUERY"] }
 *   ]
 * }
 */
export interface AccessPolicy {
  /**
   * Type of policy.
   */
  type: "ACCESS";

  /**
   * Resource selector for which resources this policy applies (exact resource ID
   * or wildcard, e.g. com.acme.finance:* or com.acme.*).
   */
  resourceSelector: ResourceSelector;

  /**
   * List of role-to-allowed-intents mappings.
   * Request is allowed only if the current role is listed and the intent class
   * is in that role's allowedIntents (and the resource supports the intent).
   */
  roles: RoleAccessEntry[];
}

/**
 * Union type for all policy types (each appears as a rule in the manifest).
 *
 * Supported policy types:
 * - MANDATORY_FILTER: Enforces required predicates that must be included in queries
 * - OPERATIONAL: Applies operational constraints (limits, default sorting)
 * - ACCESS: Role-based allowed intents per resource (RBAC)
 *
 * @category Curation Policy Manifest
 */
export type Policy = MandatoryFilterPolicy | OperationalPolicy | AccessPolicy;

/**
 * Root structure for the policy manifest (policy.yaml).
 *
 * **Bootstrap Mode (no policies)**: For the simplest setup, you can omit the
 * `policies` array entirely. When omitted or empty, no special enforcements are
 * applied for MANDATORY_FILTER or OPERATIONAL (no required predicates, no limits,
 * no default sorting). ACCESS remains **closed-by-default**: if no ACCESS rule
 * matches a given resource, that resource has no ACCESS permissions.
 *
 * Each policy in the list carries its own scope: `resourceId` for MANDATORY_FILTER and
 * OPERATIONAL (exact resource only), `resourceSelector` for ACCESS (exact or wildcard).
 *
 * @category Curation Policy Manifest
 * @example
 * // Bootstrap mode - no policy enforcements for MANDATORY_FILTER / OPERATIONAL.
 * // ACCESS stays closed-by-default (no ACCESS rule => no access for that resource).
 * {
 *   "version": "1.0.0"
 *   // No policies array needed.
 * }
 * @example
 * // Empty policies - same as bootstrap mode above
 * {
 *   "version": "1.0.0",
 *   "policies": []
 * }
 * @example
 * // Bootstrap mode with explicit default ACCESS allow rule (see policy-bootstrap.yaml)
 * {
 *   "version": "1.0.0",
 *   "policies": [
 *     {
 *       "type": "ACCESS",
 *       "resourceSelector": "*",
 *       "roles": [
 *         {
 *           "role": "public",
 *           "allowedIntents": ["*"]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * @example
 * // Full manual definition with policy rules
 * {
 *   "version": "1.0.0",
 *   "policies": [
 *     { "type": "ACCESS", "resourceSelector": "com.acme.finance:bank_failures", "roles": [{ "role": "admin", "allowedIntents": ["LOOKUP", "QUERY", "REVISE", "INGEST"] }, { "role": "user", "allowedIntents": ["LOOKUP", "QUERY"] }] },
 *     { "type": "MANDATORY_FILTER", "resourceId": "com.acme.finance:bank_failures", "fieldId": "closing_date", "op": "GT", "value": "2020-01-01" },
 *     { "type": "OPERATIONAL", "resourceId": "com.acme.finance:bank_failures", "enforceLimit": 100, "defaultOrderBy": { "fieldId": "closing_date", "direction": "DESC" } }
 *   ]
 * }
 */
export interface PolicyManifest {
  /**
   * Version of the manifest schema.
   * **Required.** Used to identify which spec version this manifest follows.
   */
  version: string;

  /**
   * List of policies (rules). If omitted or empty, no special enforcements are applied
   * for MANDATORY_FILTER and OPERATIONAL (no required predicates, no limits, no
   * default sorting).
   *
   * **ACCESS and default semantics**: ACCESS policies are evaluated per-resource using
   * the resolution algorithm described on `AccessPolicy`. If, for a given concrete
   * `ResourceId`, no ACCESS policy's `resourceSelector` matches, runtimes MUST treat
   * the effective ACCESS roles for that resource as empty (no roles or intent classes
   * are permitted). There is no implicit "allow if no ACCESS rule matches" fallback.
   *
   * **Bootstrap behavior**: For development and testing, manifests MAY define an
   * explicit "default allow" ACCESS rule (for example, a catch-all selector such as
   * `"*"` that grants `"*"` intents to a default role) to simulate
   * open-by-default behavior while still following the closed-by-default ACCESS
   * semantics. See `examples/policy-bootstrap.yaml` for a reference layout.
   *
   * For production, define targeted policies to enforce security, data governance,
   * and access controls. Each policy specifies its own scope (resourceId or
   * resourceSelector).
   */
  policies?: Policy[];
}
