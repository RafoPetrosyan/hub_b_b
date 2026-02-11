import { INestApplication } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';

const BUSINESS_TAGS = ['business'];

const COMMON_TAGS = ['app', 'common'];

const ADMIN_TAGS = ['admin'];

function matchesAllowedTags(operationTags: string[] = [], allowedTags: string[]) {
  return operationTags.some(tag =>
    allowedTags.some(allowedTag => tag.includes(allowedTag)),
  );
}

function resolveControllerName(operation: any): string {
  // 1️⃣ Explicit controller tag (recommended)
  const controllerTag = (operation.tags || []).find((t: string) =>
    t.endsWith('Controller'),
  );
  if (controllerTag) {
    return controllerTag;
  }

  // 2️⃣ Fallback: infer from operationId (NestJS format)
  // Example: UserController_findAll → UserController
  if (operation.operationId) {
    const match = operation.operationId.match(/^([A-Za-z0-9]+Controller)/);
    if (match) {
      return match[1];
    }
  }

  return 'UnknownController';
}

/**
 * Helpers to resolve $ref and build examples from OpenAPI schemas
 */
function resolveRef(document: OpenAPIObject, ref: string): any | undefined {
  // ref like '#/components/schemas/Name'
  if (!ref || !ref.startsWith('#/')) return undefined;
  const parts = ref.slice(2).split('/');
  let node: any = document;
  for (const p of parts) {
    if (!node) return undefined;
    node = node[p];
  }
  return node;
}

function getExampleFromSchema(document: OpenAPIObject, schema: any, seen = new Set()): any {
  if (!schema) return undefined;

  // avoid cycles
  if (schema.$ref) {
    if (seen.has(schema.$ref)) return {};
    seen.add(schema.$ref);
    const resolved = resolveRef(document, schema.$ref);
    return getExampleFromSchema(document, resolved, seen);
  }

  if (schema.example !== undefined) return schema.example;
  // OpenAPI allows top-level examples map or examples object
  if (schema.examples) {
    const firstKey = Object.keys(schema.examples)[0];
    if (firstKey && schema.examples[firstKey] && schema.examples[firstKey].value !== undefined) {
      return schema.examples[firstKey].value;
    }
  }

  // If schema has a discriminator or enum, pick first enum
  if (schema.enum && Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];

  // Primitive types
  const type = schema.type;
  if (!type && schema.properties) {
    // treat as object
    const obj: any = {};
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      obj[propName] = getExampleFromSchema(document, propSchema as any, new Set(seen));
    }
    return obj;
  }

  if (type === 'object') {
    const obj: any = {};
    const props = schema.properties || {};
    for (const [propName, propSchema] of Object.entries(props)) {
      obj[propName] = getExampleFromSchema(document, propSchema as any, new Set(seen));
    }
    // include additionalProperties example if present
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      obj['additionalPropertyExample'] = getExampleFromSchema(document, schema.additionalProperties, new Set(seen));
    }
    return obj;
  }

  if (type === 'array') {
    const items = schema.items || {};
    const itemExample = getExampleFromSchema(document, items, new Set(seen));
    return [itemExample === undefined ? {} : itemExample];
  }

  if (type === 'string') {
    if (schema.format === 'date-time') return new Date().toISOString();
    if (schema.format === 'date') return new Date().toISOString().split('T')[0];
    if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
    if (schema.format === 'email') return 'user@example.com';
    if (schema.default !== undefined) return schema.default;
    return schema.example ?? 'string';
  }

  if (type === 'number' || type === 'integer') {
    if (schema.default !== undefined) return schema.default;
    if (schema.minimum !== undefined) return schema.minimum;
    return 0;
  }

  if (type === 'boolean') {
    if (schema.default !== undefined) return schema.default;
    return false;
  }

  // fallback
  return {};
}

/**
 * Get best example for the operation's requestBody (prefers explicit examples)
 */
function getExampleFromRequestBody(document: OpenAPIObject, operation: any): any {
  if (!operation || !operation.requestBody) return undefined;

  const content = operation.requestBody.content || {};
  // prefer application/json
  const media = content['application/json'] || Object.values(content)[0];
  if (!media) return undefined;

  // 1) media.example top-level
  if (media.example !== undefined) return media.example;

  // 2) media.examples map
  if (media.examples && typeof media.examples === 'object') {
    const firstKey = Object.keys(media.examples)[0];
    if (firstKey && media.examples[firstKey].value !== undefined) {
      return media.examples[firstKey].value;
    }
  }

  // 3) media.schema -> resolve schema example or generate
  const schema = media.schema;
  if (schema) {
    return getExampleFromSchema(document, schema, new Set());
  }

  return undefined;
}

/**
 * Build Postman collection grouped into folders business/common/admin/rest
 */
function buildPostmanCollection(document: OpenAPIObject, opts: {
  name?: string,
  baseUrl?: string,
  includeTags?: boolean
} = {}) {
  const baseUrl = opts.baseUrl || (document.servers && document.servers[0]?.url) || 'http://localhost:3001';
  const collectionName = opts.name || (document.info && document.info.title) || 'API Collection';

  // folders map => name -> items[]
  const folders: Record<string, Record<string, any[]>> = {
    business: {},
    common: {},
    admin: {},
    rest: {},
  };

  Object.entries(document.paths || {}).forEach(([path, methods]: any) => {
    Object.entries(methods).forEach(([method, operation]: any) => {
      // skip non-operations if any
      if (!operation || !operation.tags) return;

      // decide group (priority: business -> common -> admin). Use same 'includes' check.
      let group = 'rest';
      if (matchesAllowedTags(operation.tags, BUSINESS_TAGS)) group = 'business';
      else if (matchesAllowedTags(operation.tags, COMMON_TAGS)) group = 'common';
      else if (matchesAllowedTags(operation.tags, ADMIN_TAGS)) group = 'admin';

      // build request object (Postman v2.1 structure)
      const methodUpper = method.toUpperCase();

      // build headers: tenant headers + any header parameters
      const headers: any[] = [];

      // Tenant placeholders
      headers.push({ key: 'x-tenant', value: '{{x-tenant}}', description: 'Company subdomain (tenant identifier)' });
      headers.push({
        key: 'x-company-subdomain',
        value: '{{x-company-subdomain}}',
        description: 'Company subdomain (tenant identifier)',
      });

      // If operation has parameters, extract header and query params
      const urlQuery: any[] = [];
      const pathSegments = path.split('/').filter(Boolean);

      (operation.parameters || []).forEach((p: any) => {
        if (p.in === 'header') {
          headers.push({ key: p.name, value: p.example ?? p.schema?.default ?? '', description: p.description || '' });
        } else if (p.in === 'query') {
          urlQuery.push({ key: p.name, value: p.example ?? p.schema?.default ?? '', description: p.description || '' });
        } else if (p.in === 'path') {
          // path params will remain in the path; Postman shows them as :param
        }
      });

      // If security includes bearer or global securitySchemes includes bearer, add Authorization header placeholder
      const hasBearer = (operation.security || document.security || []).some((sec: any) =>
        Object.keys(sec || {}).some(k => k.toLowerCase().includes('bearer') || k.toLowerCase().includes('jwt')),
      );
      if (hasBearer) {
        headers.unshift({ key: 'Authorization', value: 'Bearer {{token}}', description: 'Bearer token' });
      }

      // Build raw url
      // Keep path as-is; replace OpenAPI templated {id} with :id for Postman (Postman supports :var or {{var}})
      const rawPath = path.replace(/{/g, ':').replace(/}/g, '');
      const raw = `${baseUrl}${rawPath}`;

      const requestItem = {
        name: operation.summary || operation.operationId || `${methodUpper} ${path}`,
        request: {
          method: methodUpper,
          header: headers,
          url: {
            raw,
            // Postman client can handle raw, but we also provide parsed items
            host: [baseUrl],
            path: rawPath.split('/').filter(Boolean),
            query: urlQuery,
          },
          description: operation.description || '',
          body: {},
        },
        response: [],
      };

      // Add example body if present (requestBody schema)
      const exampleBody = getExampleFromRequestBody(document, operation);
      if (exampleBody !== undefined) {
        // ensure content-type header exists
        const hasContentType = headers.some(h => h.key.toLowerCase() === 'content-type');
        if (!hasContentType) {
          headers.push({ key: 'Content-Type', value: 'application/json' });
        }

        // string/primitive examples should be raw as-is, objects -> JSON
        const rawBody = (typeof exampleBody === 'object') ? JSON.stringify(exampleBody, null, 2) : String(exampleBody);
        requestItem.request.body = {
          mode: 'raw',
          raw: rawBody,
        };
      } else {
        // keep existing behavior (empty raw) so Postman shows an editable body
        requestItem.request.body = {
          mode: 'raw',
          raw: '',
        };
      }

      const controllerName = resolveControllerName(operation);

      folders[group][controllerName] ??= [];
      folders[group][controllerName].push(requestItem);
    });
  });

  // build collection with folder structure as items (each item is a folder)
  const items = Object.entries(folders).map(([groupName, controllers]) => ({
    name: groupName,
    item: Object.entries(controllers).map(([controllerName, requests]) => ({
      name: controllerName,
      item: requests,
    })),
  }));


  const collection = {
    info: {
      name: collectionName,
      _postman_id: '', // optional
      description: document.info?.description || '',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      version: document.info?.version || '1.0.0',
    },
    item: items,
    // Add a top-level variable placeholders
    variable: [
      { key: 'baseUrl', value: baseUrl },
      { key: 'token', value: '' },
      { key: 'x-tenant', value: '' },
      { key: 'x-company-subdomain', value: '' },
    ],
  };

  return collection;
}

/**
 * Setup endpoints to serve Postman collections
 */
export function setupPostmanExports(app: INestApplication, fullDocument: OpenAPIObject) {
  const server = app.getHttpAdapter().getInstance();

  // full grouped collection
  server.get('/swagger/postman', (_req, res) => {
    const collection = buildPostmanCollection(fullDocument, { name: `${fullDocument.info?.title || 'API'} - Full` });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="aesthetic-hub-postman.json"');
    res.send(collection);
  });

  // individual group exports (single-folder collections)
  const groupMap: Record<string, string[]> = {
    business: BUSINESS_TAGS,
    common: COMMON_TAGS,
    admin: ADMIN_TAGS,
    rest: [], // we'll compute rest by filtering
  };

  Object.keys(groupMap).forEach(groupName => {
    server.get(`/swagger/postman/${groupName}`, (_req, res) => {
      if (groupName === 'rest') {
        // Build full collection then strip out the matched groups' items
        const full = buildPostmanCollection(fullDocument, { name: `${fullDocument.info?.title || 'API'} - Full` }) as any;
        // Keep only "rest" folder item
        const restFolder = (full.item || []).find((it: any) => it.name === 'rest') || { name: 'rest', item: [] };
        const collection = {
          info: full.info,
          item: [restFolder],
          variable: full.variable,
        };
        res.json(collection);
      } else {
        // Build full and pick only the requested folder
        const full = buildPostmanCollection(fullDocument, { name: `${fullDocument.info?.title || 'API'} - Full` }) as any;
        const folder = (full.item || []).find((it: any) => it.name === groupName) || { name: groupName, item: [] };
        const collection = {
          info: {
            ...full.info,
            name: `${full.info.name} - ${groupName}`,
          },
          item: [folder],
          variable: full.variable,
        };
        res.json(collection);
      }
    });
  });
}
