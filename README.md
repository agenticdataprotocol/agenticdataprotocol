# Agentic Data Protocol (ADP) TypeScript Specification

ADP is a deterministic, policy-aware protocol that allows AI agents to access heterogeneous data systems safely and reproducibly via a unified intent interface.

## Protocol Overview

ADP uses **JSON-RPC 2.0** as its transport format. All communication follows the JSON-RPC request/response pattern:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "adp.discover",
  "params": { "filter": { "domainPrefix": "com.acme" } }
}
```

### JSON-RPC Methods

| Method           | Purpose                                         | Params Type               | Result Type        |
| ---------------- | ----------------------------------------------- | ------------------------- | ------------------ |
| `adp.initialize` | Establish connection and negotiate capabilities | `InitializeRequestParams` | `InitializeResult` |
| `adp.ping`       | Health check                                    | `RequestParams`           | `EmptyResult`      |
| `adp.discover`   | Browse available resources                      | `DiscoverRequestParams`   | `DiscoverResult`   |
| `adp.describe`   | Get usage contract for a resource               | `DescribeRequestParams`   | `DescribeResult`   |
| `adp.validate`   | Dry-run validation of Intent IR                 | `ValidateRequestParams`   | `ValidateResult`   |
| `adp.execute`    | Execute Intent IR against backend               | `ExecuteRequestParams`    | `ExecuteResult`    |

## Intent Classes

| Category | Intent   | Description                                  |
| -------- | -------- | -------------------------------------------- |
| READ     | `LOOKUP` | Retrieve single entity by unique key         |
| READ     | `QUERY`  | Retrieve entity set using boolean predicates |
| WRITE    | `INGEST` | Create/append new data                       |
| WRITE    | `REVISE` | Update existing entries                      |

## Installation

```bash
npm install
```

## Development

```bash
# Check all (TypeScript + ESLint + Prettier + JSON Schema)
npm run check

# Generate JSON Schema from TypeScript
npm run generate:schema:json

# Format code
npm run format
```

## Usage

```typescript
import {
  InitializeRequest,
  DiscoverRequest,
  DescribeRequest,
  ValidateRequest,
  ExecuteRequest,
} from "./schema/2026-01-20/schema";

// Initialize connection
const initReq: InitializeRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "adp.initialize",
  params: {
    protocolVersion: "2026-01-20",
    capabilities: {},
    clientInfo: { name: "my-agent", version: "1.0.0" },
  },
};

// Discover available resources
const discoverReq: DiscoverRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "adp.discover",
  params: { filter: { domainPrefix: "com.acme" } },
};

// Execute a query
const executeReq: ExecuteRequest = {
  jsonrpc: "2.0",
  id: 3,
  method: "adp.execute",
  params: {
    resourceId: "com.acme.finance:bank_failures",
    intent: {
      intentClass: "QUERY",
      predicates: [{ field: "state_code", op: "EQ", value: "CA" }],
      selection: ["bank_name", "closing_date"],
    },
  },
};
```

## License

Apache-2.0
