import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { PolymorphicService } from './db/polymorph/polymorphic.service';
import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { setupPostmanExports } from './postman';
import { ValidationError } from 'class-validator';
import Helpers from './utils/helpers';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as path from 'path';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://dashboard.aesthetichubpro.com',
      'http://admin.aesthetichubpro.com',
      'http://aesthetichubpro.com',
      'http://75.119.142.31:3007'
    ],
    credentials: true,
  });
  const dataSource = app.get<DataSource>(DataSource);
  PolymorphicService.initialize(dataSource);

  const config = new DocumentBuilder()
    .setTitle('Aesthetic Hub API')
    .setDescription('The Aesthetic Hub API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-tenant',
        in: 'header',
        description: 'Company subdomain (tenant identifier). Alternative: x-company-subdomain',
      },
      'x-tenant',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-company-subdomain',
        in: 'header',
        description: 'Company subdomain (tenant identifier). Alternative: x-tenant',
      },
      'x-company-subdomain',
    )
    // Common endpoints
    .addTag('upload', 'File upload and management endpoints')
    .addTag('items', 'Redis cache and items endpoints')
    .addTag('app', 'Application health and utility endpoints')

    // Business endpoints
    .addTag('account', 'User account management endpoints')
    .addTag('company', 'Company profile and management endpoints')
    .addTag('location', 'Location management endpoints')
    .addTag('staff', 'Staff management endpoints')
    .addTag('user', 'User management endpoints')
    .addTag('register', 'Company registration endpoints')
    .addTag('login', 'Company login endpoints')
    .addTag('token', 'Token management endpoints')
    .addTag('company notification-templates', 'Company notification template management endpoints')
    .addTag('form-templates', 'Form template management endpoints')
    .addTag('specializations', 'Specialization management endpoints')

    // Admin endpoints
    .addTag('admin auth', 'Admin authentication endpoints')
    .addTag('trades', 'Trade management endpoints')
    .addTag('services', 'Service management endpoints')
    .addTag('admin user', 'Admin user management endpoints')
    .addTag('admin notification-templates', 'Admin notification template management endpoints')
    .addTag('admin mobile-version', 'Admin mobile version management endpoints')

    // Public endpoints
    .addTag('mobile-version', 'Public mobile version endpoints')
    .build();

  const BUSINESS_TAGS = ['company'];

  const COMMON_TAGS = ['common', 'app'];

  const ADMIN_TAGS = ['admin'];

  const baseConfig = new DocumentBuilder()
    .setTitle('Aesthetic Hub API')
    .setDescription(`
### API Documentation

Quick navigation:

- [Business APIs](/swagger/business)
- [Common APIs](/swagger/common)
- [Admin APIs](/swagger/admin)

---
`)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-tenant',
        in: 'header',
      },
      'x-tenant',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-company-subdomain',
        in: 'header',
      },
      'x-company-subdomain',
    )
    .build();

  function filterDocumentByTags(document: any, allowedTags: string[]) {
    const filteredPaths: any = {};

    Object.entries(document.paths).forEach(([path, methods]: any) => {
      Object.entries(methods).forEach(([method, operation]: any) => {
        if (
          operation.tags?.some((tag: string) =>
            allowedTags.some(allowedTag => tag.includes(allowedTag)),
          )
        ) {
          filteredPaths[path] ??= {};
          filteredPaths[path][method] = operation;
        }
      });
    });

    return Object.assign({}, document, {
      paths: filteredPaths,
      tags: document.tags?.filter((t: any) =>
        allowedTags.includes(t.name),
      ),
    });
  }

  const fullDocument = SwaggerModule.createDocument(app, baseConfig);

  const businessDocument = filterDocumentByTags(fullDocument, BUSINESS_TAGS);
  const commonDocument = filterDocumentByTags(fullDocument, COMMON_TAGS);
  const adminDocument = filterDocumentByTags(fullDocument, ADMIN_TAGS);

  SwaggerModule.setup('swagger/business', app, businessDocument, {
    jsonDocumentUrl: 'swagger/business/json',
    yamlDocumentUrl: 'swagger/business/yaml',
    swaggerOptions: {
      docExpansion: 'list',
      defaultModelsExpandDepth: -1,
    },
  });

  SwaggerModule.setup('swagger/common', app, commonDocument, {
    jsonDocumentUrl: 'swagger/common/json',
    yamlDocumentUrl: 'swagger/common/yaml',
    swaggerOptions: {
      docExpansion: 'list',
      defaultModelsExpandDepth: -1,
    },
  });

  SwaggerModule.setup('swagger/admin', app, adminDocument, {
    jsonDocumentUrl: 'swagger/admin/json',
    yamlDocumentUrl: 'swagger/admin/yaml',
    swaggerOptions: {
      docExpansion: 'list',
      defaultModelsExpandDepth: -1,
    },
  });

  const documentFactory = (document) => {
    // Add tag groups for nested accordions in Swagger UI
    (document as any)['x-tagGroups'] = [
      {
        name: 'Business',
        tags: [
          'account',
          'company',
          'company add-ons',
          'company onboarding',
          'company subscriptions',
          'location',
          'staff',
          'user',
          'register',
          'login',
          'token',
          'company notification-templates',
          'form-templates',
          'specializations',
          'notification-settings',
        ],
      },
      {
        name: 'Common',
        tags: [
          'common add-ons',
          'common subscription-plans',
          'upload',
          'items',
          'app',
        ],
      },
      {
        name: 'Admin',
        tags: [
          'admin auth',
          'admin add-ons',
          'admin subscription-plans',
          'trades',
          'services',
          'admin user',
          'admin notification-templates',
          'admin mobile-version',
        ],
      },
      {
        name: 'Public',
        tags: [
          'mobile-version',
        ],
      },
    ];

    // Add tenant headers as parameters to all operations so they appear in curl commands
    // This works even when endpoints have @ApiBearerAuth decorators
    const tenantHeaders = [
      {
        name: 'x-tenant',
        in: 'header',
        required: false,
        description: 'Company subdomain (tenant identifier). Alternative: x-company-subdomain',
        schema: {
          type: 'string',
          example: 'company-subdomain',
        },
      },
      {
        name: 'x-company-subdomain',
        in: 'header',
        required: false,
        description: 'Company subdomain (tenant identifier). Alternative: x-tenant',
        schema: {
          type: 'string',
          example: 'company-subdomain',
        },
      },
    ];

    // Apply headers to all paths and operations
    if (document.paths) {
      Object.keys(document.paths).forEach((path) => {
        const pathItem = document.paths[path];
        if (pathItem) {
          if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].some(method => pathItem[method]?.tags?.join(', ').includes('business'))) {
            // Iterate through all HTTP methods (get, post, put, delete, patch, etc.)
            Object.keys(pathItem).forEach((method) => {
              if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
                const operation = (pathItem as any)[method];
                if (operation && typeof operation === 'object') {
                  // Ensure parameters array exists
                  if (!operation.parameters) {
                    operation.parameters = [];
                  }
                  // Add tenant headers if not already present
                  tenantHeaders.forEach((header) => {
                    const exists = operation.parameters.some(
                      (param: any) => param.name === header.name && param.in === 'header',
                    );
                    if (!exists) {
                      operation.parameters.push(header);
                    }
                  });
                }
              }
            });
          }
        }
      });
    }

    return document;
  };
  SwaggerModule.setup('swagger', app, documentFactory(fullDocument), {
    jsonDocumentUrl: 'swagger/json',
    yamlDocumentUrl: 'swagger/yaml',
    swaggerOptions: {
      docExpansion: 'list',
    },
  });

  setupPostmanExports(app, fullDocument);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = Helpers.flattenValidationErrors(validationErrors);

        return new BadRequestException({
          messages: errors,
          error: 'Bad Request',
          statusCode: 400,
        });
      },
    }),
  );
  app.use('/webhooks/stripe', bodyParser.raw({ type: 'application/json' }));
  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.use('/public', express.static(path.join(process.cwd(), 'public')));

  await app.listen(3005);
}

function setupPostmanExport(
  app: INestApplication,
  document: OpenAPIObject,
) {
  const server = app.getHttpAdapter().getInstance();

  server.get('/swagger/postman', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="aesthetic-hub-openapi.json"',
    );
    res.send(document);
  });
}


bootstrap();
