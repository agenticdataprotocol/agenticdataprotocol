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
  FieldMetadata,
  Field,
  FieldType,
  Resource,
  SortOrder,
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
  | "GRAPH" // Graph databases (Neo4j, etc.)

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
   * Connection URI for the database.
   * @example "postgresql://db.acme.com:5432/finance"
   * @example "mysql://user@localhost:3306/mydb"
   */
  uri: string;

  /**
   * Database schema name (optional).
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
   * Referenced by resources in the semantic manifest via `backend_id`.
   */
  id: string;

  /**
   * Type of backend.
   */
  type: BackendType;

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
   */
  version?: string;

  /**
   * List of backend definitions.
   */
  backends: Backend[];
}

/* ============================================================================
 * Semantic Manifest Types
 * ============================================================================ */

/**
 * Definition of a resource in the semantic layer.
 * Extends Resource with curation-specific fields for backend binding and field definitions.
 *
 * **Bootstrap Mode**: For quick setup without manual field definitions, you can provide minimal
 * information and let the system auto-discover the rest:
 * - If `resourceId` is omitted, it will be auto-generated from `{defaultDomain}:{source}` (sanitized)
 * - If `source` is omitted, all sources from the backend will be discovered and resources created for each
 * - If `fields` is omitted or empty, fields will be auto-discovered from the backend schema
 * - If `intentClass` is omitted, defaults to `"QUERY"`
 * - If `version` is omitted, defaults to `"1.0.0"`
 * - If `summary` is omitted, will be auto-generated from source name
 * - If `semanticDescription` is omitted, will be auto-generated from backend metadata if available
 * - If `tags` is omitted, will be auto-generated from backend type and source
 *
 * @category Curation Semantic Manifest
 * @example
 * // Full manual definition
 * {
 *   "resourceId": "com.acme.finance:bank_failures",
 *   "intentClass": "QUERY",
 *   "version": "1.0.0",
 *   "summary": "Bank failure records",
 *   "backendId": "finance_sql",
 *   "source": "v_failures_consolidated",
 *   "fields": [
 *     { "fieldId": "bank_id", "type": "STRING", "description": "FDIC Certificate Number" },
 *     { "fieldId": "closing_date", "type": "DATE", "description": "The date the institution was closed." }
 *   ]
 * }
 * @example
 * // Bootstrap mode - minimal definition (auto-discover fields)
 * {
 *   "backendId": "finance_sql",
 *   "source": "v_failures_consolidated"
 *   // resourceId, intentClass, version, summary, fields will be auto-generated
 * }
 * @example
 * // Bootstrap mode - discover all tables from backend
 * {
 *   "backendId": "finance_sql"
 *   // source omitted = discover all tables/views and create resources for each
 * }
 * @example
 * // Vector backend
 * {
 *   "resourceId": "com.acme.finance:failure_vectors",
 *   "backendId": "report_vectors",
 *   "source": "bank-summaries",
 *   "fields": [
 *     { "fieldId": "summary_embedding", "type": "VECTOR", "metadata": { "vector": { "dimensions": 1536 } } }
 *   ]
 * }
 * @example
 * // S3 backend
 * {
 *   "resourceId": "com.acme.finance:reports",
 *   "backendId": "raw_storage",
 *   "source": "finance/reports/",
 *   "fields": [...]
 * }
 */
export interface CuratedResource extends Resource {
  /**
   * Reference to the backend in physical.yaml that provides this resource.
   * Required.
   */
  backendId: string;

  /**
   * Source identifier in the backend.
   *
   * **Bootstrap behavior**: If omitted, the system will discover all available sources
   * from the backend (e.g., all tables in an RDBMS, all collections in a Vector DB)
   * and create a resource for each one.
   *
   * Interpretation depends on the backend type:
   * - RDBMS: table or view name (e.g., "v_failures_consolidated")
   * - Vector: collection or index name (e.g., "bank-summaries")
   * - S3: prefix pattern (e.g., "finance/reports/")
   * - NoSQL: collection or namespace name
   * - Graph: node label or pattern
   */
  source?: string;

  /**
   * Field definitions for this resource.
   *
   * **Bootstrap behavior**: If omitted or empty, fields will be auto-discovered from
   * the backend schema by introspecting the source structure:
   * - For RDBMS: columns from table/view schema
   * - For Vector: metadata fields from collection schema
   * - For S3: inferred from object structure or metadata
   * - For NoSQL: fields from document schema
   * - For Graph: properties from node/edge schema
   *
   * Field types will be mapped from backend types to ADP FieldType.
   * Field IDs will be derived from backend column/field names (sanitized).
   * Descriptions will be extracted from backend comments/metadata if available.
   */
  fields?: Field[];
}

/**
 * Root structure for the semantic manifest (semantic.yaml).
 *
 * **Bootstrap Mode**: For the simplest setup, you can omit the `resources` array entirely.
 * The system will automatically discover all resources from all backends defined in `physical.yaml`
 * at runtime. Just set `defaultDomain` to enable auto-generation of resourceIds.
 *
 * @category Curation Semantic Manifest
 * @example
 * // Full auto-discovery bootstrap mode - simplest setup
 * {
 *   "defaultDomain": "com.acme.finance"
 *   // No resources array needed - all resources will be auto-discovered from physical.yaml backends
 *   // For each backend, all sources (tables, collections, etc.) will be discovered
 *   // ResourceIds will be auto-generated as "{defaultDomain}:{source}"
 *   // Fields will be auto-discovered from backend schema
 * }
 * @example
 * // Full manual definition
 * {
 *   "version": "1.0.0",
 *   "resources": [
 *     {
 *       "resourceId": "com.acme.finance:bank_failures",
 *       "backendId": "finance_sql",
 *       "source": "v_failures_consolidated",
 *       "fields": [
 *         { "fieldId": "bank_id", "type": "STRING", "description": "FDIC Certificate Number" },
 *         { "fieldId": "closing_date", "type": "DATE", "description": "The date the institution was closed." }
 *       ]
 *     }
 *   ]
 * }
 * @example
 * // Partial bootstrap - specify some resources, auto-discover others
 * {
 *   "defaultDomain": "com.acme.finance",
 *   "resources": [
 *     {
 *       "backendId": "finance_sql",
 *       "source": "v_failures_consolidated"
 *       // resourceId will be auto-generated as "com.acme.finance:v_failures_consolidated"
 *       // fields will be auto-discovered from table schema
 *     }
 *   ]
 *   // Other backends in physical.yaml will still be auto-discovered
 * }
 */
export interface SemanticManifest {
  /**
   * Version of the manifest schema.
   */
  version?: string;

  /**
   * Default domain prefix for auto-generating resourceIds in bootstrap mode.
   *
   * **Bootstrap behavior**:
   * - When `resources` is omitted, this domain is used to generate resourceIds for all
   *   auto-discovered resources from all backends in `physical.yaml`.
   * - When `resources` is provided but a resource doesn't specify `resourceId`, it will be
   *   auto-generated using this domain.
   *
   * Format should be reverse DNS (e.g., "com.acme.finance").
   *
   * If not provided, the system will attempt to infer the domain from backend metadata
   * or use a default domain.
   *
   * @example "com.acme.finance"
   */
  defaultDomain?: string;

  /**
   * List of resource definitions.
   *
   * **Bootstrap behavior**: If omitted, the system will automatically discover all resources
   * from all backends defined in `physical.yaml` at runtime:
   * - For each backend, all available sources will be discovered (tables, collections, prefixes, etc.)
   * - A resource will be created for each discovered source
   * - ResourceIds will be auto-generated as `{defaultDomain}:{source}` (sanitized)
   * - Fields will be auto-discovered from backend schema introspection
   * - All other resource properties (intentClass, version, summary, etc.) will use defaults
   *
   * If provided, resources can be defined in full (with all fields) or in bootstrap mode (minimal fields).
   * Bootstrap resources will have missing fields auto-generated during manifest processing.
   * Resources explicitly defined here will be used; other backends may still be auto-discovered
   * depending on implementation behavior.
   */
  resources?: CuratedResource[];
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
 *   "field_id": "closing_date",
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
 * Union type for all policy rule types.
 *
 * Supported rule types:
 * - MANDATORY_FILTER: Enforces required predicates that must be included in queries
 * - OPERATIONAL: Applies operational constraints (limits, default sorting)
 *
 * @category Curation Policy Manifest
 */
export type PolicyRule = MandatoryFilterRule | OperationalRule;

/**
 * Policy rules for a specific resource.
 *
 * @category Curation Policy Manifest
 * @example
 * {
 *   "resourceId": "com.acme.finance:bank_failures",
 *   "rules": [
 *     { "type": "MANDATORY_FILTER", "fieldId": "closing_date", "op": "GT", "value": "2020-01-01" },
 *     { "type": "OPERATIONAL", "enforceLimit": 100, "defaultOrderBy": { "fieldId": "closing_date", "direction": "DESC" } }
 *   ]
 * }
 */
export interface ResourcePolicy {
  /**
   * Resource identifier for which these policies apply.
   * @example "com.acme.finance:bank_failures"
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
   */
  version?: string;

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
