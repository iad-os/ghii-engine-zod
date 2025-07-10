# GHII Zod Engine

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Zod](https://img.shields.io/badge/Zod-3.25.76+-purple.svg)](https://zod.dev/)

A Zod validation engine for [GHII](https://github.com/iad-os/ghii), the powerful configuration management library. This package provides seamless integration between Zod schemas and GHII's validation system.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Advanced Usage](#advanced-usage)
- [Contributing](#contributing)

## Introduction

### What is GHII Zod Engine?

GHII Zod Engine is a validation engine that bridges the gap between [Zod](https://zod.dev/) schemas and the [GHII configuration management library](https://github.com/iad-os/ghii). It allows you to use Zod's powerful schema validation capabilities within GHII's flexible configuration system.

### Key Features

- 🔒 **Type Safety**: Full TypeScript support with Zod's type inference
- ✅ **Zod Integration**: Seamless integration with Zod schemas
- 🚀 **Performance**: Optimized validation with Zod's fast parsing
- 📋 **Schema Generation**: Automatic JSON schema generation from Zod schemas
- 🔧 **Flexible**: Support for both static schemas and schema factories

### Why Use GHII Zod Engine?

- **Familiar API**: If you're already using Zod, this engine provides a familiar validation experience
- **Type Safety**: Leverage Zod's excellent TypeScript integration
- **Rich Validation**: Access to Zod's extensive validation features
- **Schema Generation**: Automatically generate JSON schemas for documentation

## Installation

### Prerequisites

- Node.js 22 or higher
- TypeScript 5.8+ (recommended)
- Zod 3.25.76 or higher

### Installation Commands

```bash
npm install @ghii/ghii-engine-zod zod
```

### TypeScript Support

This package is written in TypeScript and provides full type definitions out of the box.

## Quick Start

### Basic Setup

```typescript
import { ghii } from "@ghii/ghii-v2";
import { zodEngine } from "@ghii/ghii-engine-zod";
import { z } from "zod/v4";

// Define your configuration schema
const configSchema = z.object({
  server: z.object({
    port: z.number().default(3000),
    host: z.string().default("localhost"),
  }),
  database: z.object({
    url: z.string().url(),
    poolSize: z.number().min(1).max(20).default(10),
  }),
});

// Create a GHII instance with Zod engine
const config = ghii(zodEngine(configSchema))
  .loader(async () => ({
    database: {
      url: process.env.DATABASE_URL || "postgresql://localhost:5432/myapp",
    },
  }))
  .loader(async () => ({
    server: {
      port: parseInt(process.env.PORT || "3000"),
    },
  }));

// Take a snapshot
const snapshot = await config.takeSnapshot();
console.log(snapshot);
```

### Simple Configuration Example

```typescript
import { ghii } from "@ghii/ghii-v2";
import { zodEngine } from "@ghii/ghii-engine-zod";
import { z } from "zod/v4";

// Simple configuration with defaults
const appConfig = ghii(
  zodEngine(
    z.object({
      name: z.string().default("my-app"),
      version: z.string().default("1.0.0"),
      debug: z.boolean().default(false),
    })
  )
);

// Load configuration
const config = await appConfig.takeSnapshot();
console.log(config); // { name: 'my-app', version: '1.0.0', debug: false }
```

## API Reference

### `zodEngine(schema)`

Creates a Zod validation engine for GHII.

**Parameters:**

- `schema`: A Zod schema or a schema factory function

**Returns:** A validation engine object compatible with GHII

#### Schema Parameter Types

**Static Schema:**

```typescript
const engine = zodEngine(
  z.object({
    name: z.string(),
    port: z.number(),
  })
);
```

**Schema Factory:**

```typescript
const engine = zodEngine((z) =>
  z.object({
    name: z.string(),
    port: z.number(),
  })
);
```

## Usage Examples

### Basic Configuration

```typescript
import { ghii } from "@ghii/ghii-v2";
import { zodEngine } from "@ghii/ghii-engine-zod";
import { z } from "zod/v4";

const config = ghii(
  zodEngine(
    z.object({
      app: z.object({
        name: z.string(),
        version: z.string(),
      }),
    })
  )
).loader(() => ({
  app: {
    name: "my-app",
    version: "1.0.0",
  },
}));

const snapshot = await config.takeSnapshot();
```

### Environment-based Configuration

```typescript
const config = ghii(
  zodEngine(
    z.object({
      database: z.object({
        url: z.string().url(),
        poolSize: z.number().min(1).max(20),
      }),
      server: z.object({
        port: z.number().min(1).max(65535),
        host: z.string(),
      }),
    })
  )
).loader(() => ({
  database: {
    url: process.env.DATABASE_URL!,
    poolSize: parseInt(process.env.DB_POOL_SIZE || "10"),
  },
  server: {
    port: parseInt(process.env.PORT || "3000"),
    host: process.env.HOST || "localhost",
  },
}));
```

### Complex Validation

```typescript
const config = ghii(
  zodEngine(
    z.object({
      api: z.object({
        key: z.string().min(32, "API key must be at least 32 characters"),
        rateLimit: z.object({
          requests: z.number().positive(),
          window: z.number().positive(),
        }),
      }),
      features: z
        .object({
          cache: z.boolean(),
          compression: z.boolean(),
        })
        .refine((data) => data.cache || data.compression, "At least one feature must be enabled"),
    })
  )
);
```

### Schema Factory Pattern

```typescript
const createConfigSchema = (z: typeof import("zod/v4").z) =>
  z.object({
    environment: z.enum(["development", "production", "test"]),
    database: z
      .object({
        url: z.string().url(),
        ssl: z.boolean().default(false),
      })
      .refine(
        (data) => (data.environment === "production" ? data.ssl : true),
        "SSL is required in production"
      ),
  });

const config = ghii(zodEngine(createConfigSchema));
```

## Advanced Usage

### Custom Error Messages

```typescript
const config = ghii(
  zodEngine(
    z.object({
      port: z
        .number()
        .min(1, "Port must be at least 1")
        .max(65535, "Port must be at most 65535")
        .default(3000),
      apiKey: z
        .string()
        .min(32, "API key must be at least 32 characters long")
        .regex(/^[A-Za-z0-9]+$/, "API key must contain only alphanumeric characters"),
    })
  )
);
```

### Conditional Validation

```typescript
const config = ghii(
  zodEngine(
    z
      .object({
        mode: z.enum(["development", "production"]),
        debug: z.boolean(),
        logLevel: z.enum(["error", "warn", "info", "debug"]),
      })
      .refine(
        (data) => {
          if (data.mode === "production" && data.debug) {
            return false;
          }
          if (data.mode === "development" && data.logLevel === "error") {
            return false;
          }
          return true;
        },
        {
          message:
            "Invalid configuration: debug mode cannot be enabled in production, and development mode requires more verbose logging",
        }
      )
  )
);
```

### Array and Object Validation

```typescript
const config = ghii(
  zodEngine(
    z.object({
      servers: z
        .array(
          z.object({
            host: z.string(),
            port: z.number(),
            weight: z.number().min(0).max(1),
          })
        )
        .min(1, "At least one server must be configured"),
      cache: z.record(
        z.string(),
        z.object({
          ttl: z.number().positive(),
          maxSize: z.number().positive(),
        })
      ),
    })
  )
);
```

### Type Inference

```typescript
import { ghii } from "@ghii/ghii-v2";
import { zodEngine } from "@ghii/ghii-engine-zod";
import { z } from "zod/v4";

const schema = z.object({
  server: z.object({
    port: z.number(),
    host: z.string(),
  }),
  database: z.object({
    url: z.string().url(),
    poolSize: z.number(),
  }),
});

// TypeScript will infer the correct type
const config = ghii(zodEngine(schema));
const snapshot = await config.takeSnapshot();
// snapshot has type: { server: { port: number; host: string }; database: { url: string; poolSize: number } }
```

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Run linting: `npm run lint`

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Code Style

The project uses:

- **Biome** for linting and formatting
- **TypeScript** for type safety
- **Vitest** for testing

Run formatting: `npm run format`

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Maintainers

- **Daniele Fiungo** - [daniele.fiungo@iad2.it](mailto:daniele.fiungo@iad2.it)
- **Nicola Vurchio** - [nicola.vurchio@iad2.it](mailto:nicola.vurchio@iad2.it)
- **Irene La Bollita** - [irene.labollita@iad2.it](mailto:irene.labollita@iad2.it)
