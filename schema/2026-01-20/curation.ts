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
  ResourceId,
  PredicateOperator,
  Field,
  Resource,
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
   * Vector database provider.
   * @example "PINECONE", "WEAVIATE", "QDRANT"
   */
  provider: string;

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
 * Condition expression for conditional policy rules.
 * Supports simple expressions like `agent_tier == 'BASIC'`.
 *
 * @category Curation Policy Manifest
 */
export type PolicyCondition = string;

/**
 * Mandatory filter rule that enforces required predicates.
 *
 * @category Curation Policy Manifest
 * @example
 * {
 *   "type": "MANDATORY_FILTER",
 *   "fieldId": "closing_date",
 *   "op": "GT",
 *   "value": "2020-01-01"
 * }
 */
export interface MandatoryFilterRule {
  /**
   * Type of policy rule.
   */
  type: "MANDATORY_FILTER";

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
   * Optional condition for when this rule applies.
   */
  condition?: PolicyCondition;
}

/**
 * Operational constraints for resource access.
 *
 * @category Curation Policy Manifest
 * @example
 * {
 *   "type": "OPERATIONAL",
 *   "enforceLimit": 100,
 *   "defaultOrderBy": { "fieldId": "closing_date", "direction": "DESC" }
 * }
 */
export interface OperationalRule {
  /**
   * Type of policy rule.
   */
  type: "OPERATIONAL";

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
   * Optional condition for when this rule applies.
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
 * RBAC-style access rule: restricts which roles can use which intent classes.
 * At most one ACCESS rule per resource is recommended to avoid ambiguity.
 *
 * @category Curation Policy Manifest
 * @example
 * {
 *   "type": "ACCESS",
 *   "roles": [
 *     { "role": "admin", "allowedIntents": ["LOOKUP", "QUERY", "REVISE", "INGEST"] },
 *     { "role": "user", "allowedIntents": ["LOOKUP", "QUERY"] }
 *   ]
 * }
 */
export interface AccessRule {
  /**
   * Type of policy rule.
   */
  type: "ACCESS";

  /**
   * List of role-to-allowed-intents mappings.
   * Request is allowed only if the current role is listed and the intent class
   * is in that role's allowedIntents (and the resource supports the intent).
   */
  roles: RoleAccessEntry[];
}

/**
 * Union type for all policy rule types.
 *
 * Supported rule types:
 * - MANDATORY_FILTER: Enforces required predicates that must be included in queries
 * - OPERATIONAL: Applies operational constraints (limits, default sorting)
 * - ACCESS: Role-based allowed intents per resource (RBAC)
 *
 * @category Curation Policy Manifest
 */
export type PolicyRule = MandatoryFilterRule | OperationalRule | AccessRule;

/**
 * Policy rules for a specific resource.
 *
 * @category Curation Policy Manifest
 * @example
 * {
 *   "resourceId": "com.acme.finance:bank_failures",
 *   "rules": [
 *     { "type": "ACCESS", "roles": [{ "role": "admin", "allowedIntents": ["LOOKUP", "QUERY", "REVISE", "INGEST"] }, { "role": "user", "allowedIntents": ["LOOKUP", "QUERY"] }] },
 *     { "type": "MANDATORY_FILTER", "fieldId": "closing_date", "op": "GT", "value": "2020-01-01" },
 *     { "type": "OPERATIONAL", "enforceLimit": 100, "defaultOrderBy": { "fieldId": "closing_date", "direction": "DESC" } }
 *   ]
 * }
 */
export interface ResourcePolicy {
  /**
   * Resource ID or wildcard pattern for which resources this policy applies.
   * Both namespace and name can use `*` (e.g. `com.acme.finance:*`, `com.acme.*`).
   * @example "com.acme.finance:bank_failures"
   * @example "com.acme.finance:*"
   * @example "com.acme.*"
   */
  resourceId: ResourceId;

  /**
   * List of policy rules to apply to this resource.
   * If omitted or empty, no special enforcements are applied for this resource.
   */
  rules?: PolicyRule[];
}

/**
 * Root structure for the policy manifest (policy.yaml).
 *
 * **Bootstrap Mode**: For the simplest setup, you can omit the `policies` array entirely.
 * When omitted or empty, no special enforcements are applied - resources are accessible
 * without mandatory filters or operational constraints. This is ideal for
 * development and testing scenarios.
 *
 * @category Curation Policy Manifest
 * @example
 * // Full auto-discovery bootstrap mode - no policy enforcements
 * {
 *   "version": "1.0.0"
 *   // No policies array needed - no special enforcements will be applied
 *   // All resources are accessible without restrictions
 * }
 * @example
 * // Empty policies - same as bootstrap mode
 * {
 *   "version": "1.0.0",
 *   "policies": []
 * }
 * @example
 * // Full manual definition with policy rules
 * {
 *   "version": "1.0.0",
 *   "policies": [
 *     {
 *       "resourceId": "com.acme.finance:bank_failures",
 *       "rules": [
 *         { "type": "MANDATORY_FILTER", "fieldId": "closing_date", "op": "GT", "value": "2020-01-01" },
 *         { "type": "OPERATIONAL", "enforceLimit": 100, "defaultOrderBy": { "fieldId": "closing_date", "direction": "DESC" } }
 *       ]
 *     }
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
   * List of resource policies.
   *
   * **Bootstrap behavior**: If omitted or empty, no special enforcements are applied.
   * Resources are accessible without:
   * - Mandatory filters (no required predicates)
   * - Operational constraints (no limits, no default sorting)
   *
   * This provides unrestricted access, ideal for:
   * - Development and testing
   * - Quick prototyping
   * - Internal tools with trusted access
   *
   * For production use, explicitly define policies to enforce security, data governance,
   * and access controls.
   */
  policies?: ResourcePolicy[];
}
