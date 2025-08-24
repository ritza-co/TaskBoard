const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.1.0',
  info: {
    title: 'TaskBoard API',
    version: '1.0.0',
    description: `A comprehensive API for managing Kanban tasks.

## Authentication

Protected endpoints require user identification via one of these methods:
1. **Query Parameter**: \`?userId=<userId>\`  
2. **Request Body**: Include \`userId\` field in JSON body

## Features

- User registration and authentication
- CRUD operations for Kanban items (todo, doing, done)`,
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication endpoints'
    },
    {
      name: 'Items',
      description: 'Kanban item management endpoints'
    }
  ]
};

// Options for swagger-jsdoc
const options = {
  definition: swaggerDefinition,
  apis: [
    './src/app/api/*/route.ts',
    './src/app/api/*/*/route.ts', // For nested routes like items/[id]
  ],
};

// Generate swagger specification
const specs = swaggerJSDoc(options);

// Ensure public directory exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the spec file
const outputPath = path.join(publicDir, 'swagger.json');
fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));

console.log(`✅ OpenAPI spec generated at ${outputPath}`);
console.log(`📋 Generated spec includes:`);
console.log(`   - OpenAPI 3.1.0`);
console.log(`   - Components from JSDoc annotations`);
console.log(`   - All endpoints with x-gram extensions`);
console.log(`   - Field validation constraints`);
console.log(`   - Required userId parameters`);