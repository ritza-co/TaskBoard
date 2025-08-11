const { createSwaggerSpec } = require('next-swagger-doc');
const fs = require('fs');
const path = require('path');

const spec = createSwaggerSpec({
  apiFolder: 'src/app/api', // For Next.js 13+ with app directory
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskBoard API',
      version: '1.0.0',
      description: 'API documentation for TaskBoard application',
    },
  },
});

// Ensure public directory exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the spec file
const outputPath = path.join(publicDir, 'swagger.json');
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

console.log(`✅ OpenAPI spec generated at ${outputPath}`);