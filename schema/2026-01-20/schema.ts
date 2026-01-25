/**
 * Agentic Data Protocol (ADP) TypeScript Schema
 * Version: 2026-01-20
 *
 * This schema defines the types for the ADP protocol using JSON-RPC 2.0,
 * enabling AI agents to access heterogeneous data systems safely
 * and reproducibly via a unified intent interface.
 */

/* ============================================================================
 * JSON-RPC Types
 * ============================================================================ */

/**
 * Refers to any valid JSON-RPC object that can be decoded off the wire, or encoded to be sent.
 *
 * @category JSON-RPC
 */
export type JSONRPCMessage = JSONRPCRequest | JSONRPCResponse;

/** @internal */
export const LATEST_PROTOCOL_VERSION = "2026-01-20";
/** @internal */
export const JSONRPC_VERSION = "2.0";

/**
 * A uniquely identifying ID for a request in JSON-RPC.
 *
 * @category JSON-RPC
 */
export type RequestId = string | number;

/**
 * A progress token, used to associate progress notifications with the original request.
 *
 * @category Common Types
 */
export type ProgressToken = string | number;

/**
 * An opaque token used to represent a cursor for pagination.
 *
 * @category Common Types
 */
export type Cursor = string;

/**
 * Common params for any request.
 *
 * @internal
 */
export interface RequestParams {
  /**
   * See [General fields] for notes on `_meta` usage.
   */
  _meta?: {
    /**
     * If specified, the caller is requesting out-of-band progress notifications
     * for this request. The value of this parameter is an opaque token that will
     * be attached to any subsequent notifications.
     */
    progressToken?: ProgressToken;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** @internal */
export interface Request {
  method: string;
  params?: { [key: string]: unknown };
}

/**
 * Common result type for all successful responses.
 *
 * @category JSON-RPC
 */
export interface Result {
  /**
   * See [General fields] for notes on `_meta` usage.
   */
  _meta?: { [key: string]: unknown };
  [key: string]: unknown;
}

/**
 * JSON-RPC error object.
 *
 * @category JSON-RPC
 */
export interface JSONRPCError {
  /**
   * The error type that occurred.
   */
  code: number;
  /**
   * A short description of the error. The message SHOULD be limited to a concise single sentence.
   */
  message: string;
  /**
   * Additional information about the error.
   */
  data?: unknown;
}

/**
 * A request that expects a response.
 *
 * @category JSON-RPC
 */
export interface JSONRPCRequest extends Request {
  jsonrpc: typeof JSONRPC_VERSION;
  id: RequestId;
}

/**
 * A successful (non-error) response to a request.
 *
 * @category JSON-RPC
 */
export interface JSONRPCResultResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  id: RequestId;
  result: Result;
}

/**
 * A response to a request that indicates an error occurred.
 *
 * @category JSON-RPC
 */
export interface JSONRPCErrorResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  id?: RequestId;
  error: JSONRPCError;
}

/**
 * A response to a request, containing either the result or error.
 *
 * @category JSON-RPC
 */
export type JSONRPCResponse = JSONRPCResultResponse | JSONRPCErrorResponse;

// Standard JSON-RPC error codes
export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;

// ADP-specific error codes (range -32000 to -32099)
export const RESOURCE_NOT_FOUND = -32001;
export const VALIDATION_FAILED = -32002;
export const UNAUTHORIZED = -32003;
export const EXECUTION_FAILED = -32004;

/* ============================================================================
 * Common Types
 * ============================================================================ */

/**
 * A domain-qualified entity identifier using the format `domain:alias`.
 * The domain prefix acts as a namespace to prevent collisions.
 *
 * @example "com.acme.finance:bank_failures"
 *
 * @category Common Types
 */
export type ResourceId = string;

/**
 * A unique identifier for tracing and debugging purposes.
 * Used to correlate requests, responses, and error messages.
 *
 * @category Common Types
 */
export type TraceId = string;

/**
 * READ operations:
 * - `LOOKUP` - Retrieve a single entity by unique key
 * - `QUERY` - Retrieve a set of entities using boolean predicates
 *
 * WRITE operations:
 * - `INGEST` - Create or append new data entries
 * - `REVISE` - Update existing entries (full or partial)
 *
 * COGNITIVE operations:
 * - `SYNTHESIZE` - Transform/Extract structure from unstructured data
 *
 * @category Common Types
 */
export type IntentClass =
  | "LOOKUP"
  | "QUERY"
  | "INGEST"
  | "REVISE"
  | "SYNTHESIZE";
// TODO: Future intent classes may include: PRUNE, MERGE, PATH, CORRELATE, SUMMARIZE

/**
 * Operators supported for predicate expressions.
 *
 * @category Common Types
 */
export type PredicateOperator =
  | "EQ" // Equal
  | "NEQ" // Not equal
  | "GT" // Greater than
  | "LT" // Less than
  | "GTE" // Greater than or equal
  | "LTE" // Less than or equal
  | "CONTAINS" // Contains substring or element
  | "IN" // Value in set
  | "LIKE" // Simple pattern match (case-sensitive)
  | "ILIKE" // Simple pattern match (case-insensitive)
  | "SIMILAR"; // Vector similarity search

/**
 * Logic operators supported for predicate expressions.
 *
 * @category Common Types
 */
export type LogicOperator = "AND" | "OR" | "NOT";

/**
 * Severity levels for validation issues.
 *
 * - `BLOCKING` - Execution will fail; must be fixed
 * - `WARNING` - Execution will proceed but with side effects
 *
 * @category Common Types
 */
export type IssueSeverity = "BLOCKING" | "WARNING";

/**
 * Data consistency levels for execution results.
 *
 * @category Common Types
 */
export type ConsistencyLevel = "STRONG" | "EVENTUAL";

/**
 * Structured value for SIMILAR operator (vector similarity search).
 *
 * @category Common Types
 */
export interface SimilarValue {
  /**
   * Text content to search for similarity.
   */
  text?: string;

  /**
   * Binary content as Base64 or URI reference.
   */
  blob?: string;

  /**
   * Maximum number of results to return.
   */
  top?: number;

  /**
   * Similarity threshold (0.0 to 1.0).
   */
  threshold?: number;

  /**
   * Distance function to use (e.g., "COSINE", "L2", "INNER_PRODUCT").
   */
  distanceFunction?: string;
}

/**
 * A single predicate in an Intent IR.
 *
 * @category Common Types
 */
export interface Predicate {
  /**
   * The field identifier to filter on.
   */
  fieldId: string;

  /**
   * The comparison operator.
   */
  op: PredicateOperator;

  /**
   * The value to compare against.
   * For SIMILAR operator, this should be a SimilarValue object.
   * For other operators, this can be a primitive value or array of primitives.
   */
  value:
    | string
    | number
    | boolean
    | (string | number | boolean)[]
    | SimilarValue;
}

/**
 * An identity predicate used for unique key lookups.
 * Only allows the EQ operator to ensure exact matching.
 *
 * @category Common Types
 */
export interface IdentityPredicate {
  /**
   * The field identifier to filter on.
   */
  fieldId: string;

  /**
   * The comparison operator. Must be EQ for identity lookups.
   */
  op: "EQ";

  /**
   * The value to compare against. Should be a single value (not an array).
   */
  value: string | number | boolean;
}

/**
 * A group of predicates with a logic operator.
 *
 * @category Common Types
 * @example
 * {
 *   "op": "AND",
 *   "predicates": [
 *     { "fieldId": "color", "op": "EQ", "value": "red" },
 *     {
 *       "op": "OR",
 *       "predicates": [
 *         { "fieldId": "size", "op": "EQ", "value": "large" },
 *         { "fieldId": "size", "op": "EQ", "value": "small" }
 *       ]
 *     },
 *     {
 *       "op": "NOT",
 *       "predicates": [
 *         { "fieldId": "color", "op": "EQ", "value": "green" }
 *       ]
 *     }
 *   ]
 * }
 */
export interface PredicateGroup {
  /**
   * The logic operator to use.
   */
  op: LogicOperator;

  /**
   * The predicates to use.
   *
   * Note: For the "NOT" operator, callers are expected by convention to supply
   * exactly one predicate or predicate group, but this is not enforced by the
   * type system and multiple predicates are still allowed here.
   */
  predicates: (Predicate | PredicateGroup)[];
}

/* ============================================================================
 * Initialization
 * ============================================================================ */

/**
 * Describes the ADP implementation.
 *
 * @category `adp.initialize`
 * @example
 * {
 *   "name": "Gravitino-ADP-Gateway",
 *   "version": "0.8.0-incubating"
 * }
 */
export interface Implementation {
  /**
   * Name of the implementation.
   */
  name: string;

  /**
   * Version of the implementation.
   */
  version: string;
}

/**
 * Capabilities a client may support.
 *
 * @category `adp.initialize`
 * @example
 * {
 *   "experimental": {
 *     "customFeature": { "enabled": true }
 *   }
 * }
 */
export interface ClientCapabilities {
  /**
   * Experimental, non-standard capabilities that the client supports.
   */
  experimental?: { [key: string]: object };
}

/**
 * Capabilities that a server may support.
 *
 * @category `adp.initialize`
 */
export interface ServerCapabilities {
  /**
   * Experimental, non-standard capabilities that the server supports.
   */
  experimental?: { [key: string]: object };

  /**
   * Supported intent classes by this server.
   */
  supportedIntentClasses?: IntentClass[];
}

/**
 * Parameters for an `adp.initialize` request.
 *
 * @category `adp.initialize`
 */
export interface InitializeRequestParams extends RequestParams {
  /**
   * The latest version of the ADP protocol that the client supports.
   */
  protocolVersion: string;

  /**
   * Client capabilities.
   */
  capabilities: ClientCapabilities;

  /**
   * Information about the client implementation.
   */
  clientInfo: Implementation;
}

/**
 * This request is sent from the client to the server when it first connects.
 *
 * @category `adp.initialize`
 */
export interface InitializeRequest extends JSONRPCRequest {
  method: "adp.initialize";
  params: InitializeRequestParams;
}

/**
 * After receiving an initialize request from the client, the server sends this response.
 *
 * @category `adp.initialize`
 */
export interface InitializeResult extends Result {
  /**
   * The version of the ADP protocol that the server wants to use.
   */
  protocolVersion: string;

  /**
   * Server capabilities.
   */
  capabilities: ServerCapabilities;

  /**
   * Information about the server implementation.
   */
  serverInfo: Implementation;

  /**
   * Instructions describing how to use the server and its features.
   */
  instructions?: string;
}

/* ============================================================================
 * Ping
 * ============================================================================ */

/**
 * A ping, issued by either the server or the client, to check that the other party is still alive.
 *
 * @category `adp.ping`
 */
export interface PingRequest extends JSONRPCRequest {
  method: "adp.ping";
  params?: RequestParams;
}

/**
 * A response that indicates success but carries no data.
 *
 * @category Common Types
 */
export type EmptyResult = Result;

/* ============================================================================
 * Pagination
 * ============================================================================ */

/**
 * Common parameters for paginated requests.
 *
 * @internal
 */
export interface PaginatedRequestParams extends RequestParams {
  /**
   * An opaque token representing the current pagination position.
   */
  cursor?: Cursor;
}

/**
 * Common result type for paginated responses.
 *
 * @internal
 */
export interface PaginatedResult extends Result {
  /**
   * An opaque token representing the pagination position after the last returned result.
   */
  nextCursor?: Cursor;
}

/* ============================================================================
 * DISCOVER Operation
 * ============================================================================ */

/**
 * Filter criteria for the DISCOVER operation.
 *
 * @category `adp.discover`
 */
export interface DiscoverFilter {
  /**
   * Filter resources by domain prefix.
   * @example "com.acme"
   */
  domainPrefix?: string;

  /**
   * Filter resources by intent class.
   */
  intentClass?: IntentClass;

  /**
   * Filter resources by keyword search.
   */
  keyword?: string;
}

/**
 * Parameters for the `adp.discover` request.
 *
 * @category `adp.discover`
 */
export interface DiscoverRequestParams extends PaginatedRequestParams {
  /**
   * Optional filters to narrow down the resource list.
   */
  filter?: DiscoverFilter;
}

/**
 * Request to browse available resources.
 *
 * @category `adp.discover`
 */
export interface DiscoverRequest extends JSONRPCRequest {
  method: "adp.discover";
  params?: DiscoverRequestParams;
}

/**
 * A single resource returned in the DISCOVER response.
 *
 * @category `adp.discover`
 */
export interface Resource {
  /**
   * The unique domain-qualified identifier for this resource.
   */
  resourceId: ResourceId;

  /**
   * The version of this resource's schema.
   */
  version: string;

  /**
   * The primary intent class this resource supports.
   */
  intentClass: IntentClass;

  /**
   * A brief summary of the resource.
   */
  summary: string;

  /**
   * A detailed semantic description of the resource.
   */
  semanticDescription?: string;

  /**
   * Tags for categorization and filtering.
   * @example ["PII-FREE", "FINANCE"]
   */
  tags?: string[];
}

/**
 * Result of the `adp.discover` request.
 *
 * @category `adp.discover`
 */
export interface DiscoverResult extends PaginatedResult {
  /**
   * List of discovered resources matching the filter criteria.
   */
  resources: Resource[];
}

/* ============================================================================
 * DESCRIBE Operation
 * ============================================================================ */

/**
 * Metadata about a field's characteristics.
 *
 * @category `adp.describe`
 */
export interface FieldMetadata {
  /**
   * Number of unique values in this field.
   */
  cardinality?: number | string;

  /**
   * Expected format pattern.
   * @example "YYYY-MM-DD", "AA"
   */
  format?: string;

  /**
   * If true, only values from provided samples/examples are valid.
   */
  whitelistOnly?: boolean;

  /**
   * A hint for the Agent about how to use this field.
   */
  hint?: string;
}

/**
 * Definition of a single field in a resource.
 *
 * @category `adp.describe`
 */
export interface Field {
  /**
   * The field identifier.
   */
  fieldId: string;

  /**
   * The data type of this field.
   * @example "STRING", "INTEGER", "BOOLEAN", "DATE"
   */
  type: string;

  /**
   * Human-readable description of the field.
   */
  description?: string;

  /**
   * Sample values for this field.
   */
  samples?: unknown[];

  /**
   * If true, this field is masked/redacted by policy.
   * @default false
   */
  isMasked?: boolean;

  /**
   * Additional metadata about the field.
   */
  metadata?: FieldMetadata;
}

/**
 * Predicate usage requirement.
 *
 * @category `adp.describe`
 */
export type PredicateUsage = "REQUIRED" | "OPTIONAL";

/**
 * Definition of a predicate capability for a field.
 *
 * @category `adp.describe`
 */
export interface PredicateCapability {
  /**
   * The field this predicate applies to.
   */
  fieldId: string;

  /**
   * Whether this predicate is required or optional.
   */
  usage: PredicateUsage;

  /**
   * Allowed operators for this predicate.
   */
  operators: PredicateOperator[];
}

/**
 * Definition of a projection capability.
 *
 * @category `adp.describe`
 */
export interface ProjectionCapability {
  /**
   * The field that can be projected.
   */
  fieldId: string;
}

/**
 * Definition of a mutable field capability (for WRITE operations).
 *
 * @category `adp.describe`
 */
export interface MutableCapability {
  /**
   * The field that can be mutated.
   */
  fieldId: string;

  /**
   * Constraints on the mutation.
   */
  constraints?: Record<string, unknown>;
}

/**
 * Capabilities available for a resource.
 *
 * @category `adp.describe`
 */
export interface Capabilities {
  /**
   * Available predicate capabilities.
   */
  predicates?: PredicateCapability[];

  /**
   * Available projection capabilities.
   */
  projections?: ProjectionCapability[];

  /**
   * Available mutable field capabilities (for WRITE operations).
   */
  mutables?: MutableCapability[];
}

/**
 * The usage contract returned by DESCRIBE.
 *
 * @category `adp.describe`
 */
export interface UsageContract {
  /**
   * Field definitions for this resource.
   */
  fields: Field[];

  /**
   * Capabilities available for this resource and intent.
   */
  capabilities: Capabilities;
}

/**
 * Parameters for the `adp.describe` request.
 *
 * @category `adp.describe`
 */
export interface DescribeRequestParams extends PaginatedRequestParams {
  /**
   * The unique identifier of the resource to describe.
   */
  resourceId: ResourceId;

  /**
   * The intent class the Agent plans to use.
   */
  intentClass: IntentClass;
}

/**
 * Request to get the usage contract for a resource.
 *
 * @category `adp.describe`
 */
export interface DescribeRequest extends JSONRPCRequest {
  method: "adp.describe";
  params: DescribeRequestParams;
}

/**
 * Result of the `adp.describe` request.
 *
 * @category `adp.describe`
 */
export interface DescribeResult extends PaginatedResult {
  /**
   * The resource's full qualified identifier.
   */
  resourceId: ResourceId;

  /**
   * The resource's schema version.
   */
  version: string;

  /**
   * The intent class this contract applies to.
   */
  intentClass: IntentClass;

  /**
   * The usage contract for this resource and intent.
   */
  usageContract: UsageContract;
}

/* ============================================================================
 * VALIDATE Operation
 * ============================================================================ */

/**
 * Intent for retrieving a single entity by its unique identifier.
 *
 * @category Common Types
 */
export interface LookupIntent {
  intentClass: "LOOKUP";

  /**
   * The identity predicate specifying the unique key to lookup.
   * This should uniquely identify a single entity (e.g., primary key lookup).
   * Only the EQ operator is allowed for identity lookups.
   *
   * @example { "fieldId": "bank_id", "op": "EQ", "value": "FDIC-10538" }
   * @example { "fieldId": "id", "op": "EQ", "value": 12345 }
   */
  key: IdentityPredicate;

  /**
   * Fields to project.
   */
  projections?: string[];
}

/**
 * Sort order for a field.
 *
 * @category Common Types
 */
export interface SortOrder {
  /**
   * The direction of the sort order.
   */
  direction: "ASC" | "DESC";

  /**
   * The field to sort by.
   */
  fieldId: string;
}

/**
 * Intent for retrieving a set of entities based on criteria.
 *
 * @category Common Types
 */
export interface QueryIntent {
  intentClass: "QUERY";

  /**
   * Predicates for filtering data.
   */
  predicates: PredicateGroup;

  /**
   * Fields to project.
   */
  projections?: string[];

  /**
   * Fields to order results by.
   * @example [{ "fieldId": "name", "direction": "ASC" }, { "fieldId": "created_at", "direction": "DESC" }]
   */
  orderBy?: SortOrder[];

  /**
   * The maximum number of results to return.
   */
  limit?: number;
}

/**
 * Intent for creating or appending new data.
 *
 * @category Common Types
 */
export interface IngestIntent {
  intentClass: "INGEST";

  /**
   * The data payload to ingest.
   * An array of records (key-value maps).
   */
  payload: Record<string, unknown>[];
}

/**
 * Intent for updating existing data.
 *
 * @category Common Types
 */
export interface ReviseIntent {
  intentClass: "REVISE";

  /**
   * Predicates to identify the records to update.
   */
  predicates: PredicateGroup;

  /**
   * The data payload containing the fields to update.
   */
  payload: Record<string, unknown>;
}

/**
 * Intent for transforming unstructured data into structured form.
 *
 * @category Common Types
 */
export interface SynthesizeIntent {
  intentClass: "SYNTHESIZE";

  /**
   * Description of the desired structure or question to answer.
   */
  instruction: string;

  /**
   * Optional context data or references.
   */
  context?: unknown;
}

/**
 * The Intent structure used in VALIDATE and EXECUTE operations.
 *
 * @category Common Types
 */
export type Intent =
  | LookupIntent
  | QueryIntent
  | IngestIntent
  | ReviseIntent
  | SynthesizeIntent;

/**
 * Validation issue codes.
 *
 * @category `adp.validate`
 */
export type ValidationIssueCode =
  | "MISSING_REQUIRED_PREDICATE"
  | "INVALID_FORMAT"
  | "FIELD_NOT_PERMITTED"
  | "FIELD_NOT_FOUND"
  | "INVALID_OPERATOR"
  | "INVALID_VALUE"
  | "CARDINALITY_EXCEEDED";

/**
 * A single validation issue.
 *
 * @category `adp.validate`
 */
export interface ValidationIssue {
  /**
   * The type of validation issue.
   */
  code: ValidationIssueCode;

  /**
   * The field associated with this issue.
   */
  field?: string;

  /**
   * Severity of this issue.
   */
  severity: IssueSeverity;

  /**
   * Human-readable message describing the issue.
   */
  message: string;

  /**
   * Correction hint for the Agent.
   */
  correctionHint?: string;
}

/**
 * Parameters for the `adp.validate` request.
 *
 * @category `adp.validate`
 */
export interface ValidateRequestParams extends RequestParams {
  /**
   * The resource to validate against.
   */
  resourceId: ResourceId;

  /**
   * The Intent to validate.
   */
  intent: Intent;
}

/**
 * Request to validate an Intent IR before execution.
 *
 * @category `adp.validate`
 */
export interface ValidateRequest extends JSONRPCRequest {
  method: "adp.validate";
  params: ValidateRequestParams;
}

/**
 * Result of the `adp.validate` request.
 *
 * @category `adp.validate`
 */
export interface ValidateResult extends Result {
  /**
   * Whether the Intent IR is valid.
   */
  valid: boolean;

  /**
   * List of validation issues, if any.
   */
  issues?: ValidationIssue[];
}

/* ============================================================================
 * EXECUTE Operation
 * ============================================================================ */

/**
 * Parameters for the `adp.execute` request.
 *
 * @category `adp.execute`
 */
export interface ExecuteRequestParams extends PaginatedRequestParams {
  /**
   * The resource to execute against.
   */
  resourceId: ResourceId;

  /**
   * The Intent to execute.
   */
  intent: Intent;
}

/**
 * Request to execute an Intent IR.
 *
 * @category `adp.execute`
 */
export interface ExecuteRequest extends JSONRPCRequest {
  method: "adp.execute";
  params: ExecuteRequestParams;
}

/**
 * Metadata about execution performance and characteristics.
 *
 * @category `adp.execute`
 */
export interface ExecutionMetadata {
  /**
   * Time taken to execute the query in milliseconds.
   */
  durationMs?: number;

  /**
   * The backend system that served the request.
   */
  sourceSystem?: string;

  /**
   * Data consistency level of the result.
   */
  consistency?: ConsistencyLevel;
}

/**
 * Result of the `adp.execute` request.
 *
 * @category `adp.execute`
 */
export interface ExecuteResult extends PaginatedResult {
  /**
   * The result data.
   */
  results: Record<string, unknown>[];

  /**
   * Additional metadata about the execution.
   */
  executionMetadata?: ExecutionMetadata;
}

/* ============================================================================
 * Unified ADP Interface Summary
 * ============================================================================ */

/**
 * Summary of the ADP JSON-RPC interface.
 *
 * | Method          | Params Type              | Result Type        |
 * |-----------------|--------------------------|-------------------|
 * | adp.initialize  | InitializeRequestParams  | InitializeResult  |
 * | adp.ping        | RequestParams            | EmptyResult       |
 * | adp.discover    | DiscoverRequestParams    | DiscoverResult    |
 * | adp.describe    | DescribeRequestParams    | DescribeResult    |
 * | adp.validate    | ValidateRequestParams    | ValidateResult    |
 * | adp.execute     | ExecuteRequestParams     | ExecuteResult     |
 */
