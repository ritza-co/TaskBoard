import { NextRequest, NextResponse } from 'next/server';
import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'TaskBoard API',
      version: '1.0.0',
      description: `A comprehensive API for managing Kanban tasks with integrated MCP (Model Context Protocol) chat functionality.

## Authentication

Protected endpoints require user identification via one of these methods:
1. **Query Parameter**: \`?userId=<userId>\` (recommended)  
2. **Request Body**: Include \`userId\` field in JSON body

This flexible authentication supports both web applications and MCP integrations.

## Features

- User registration and authentication
- CRUD operations for Kanban items (todo, doing, done)  
- MCP-powered AI chat assistant integration
- Session-based conversation management
- Tool usage tracking and display`,
      contact: {
        name: 'TaskBoard Support',
        url: 'https://github.com/your-org/taskboard'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server'
      },
      {
        url: 'https://your-domain.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        UserIdParam: {
          type: 'apiKey',
          in: 'query',
          name: 'userId',
          description: 'User ID parameter required for protected endpoints'
        }
      },
      schemas: {
        UserCredentials: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
              description: 'Unique username for the account',
              example: 'john_doe'
            },
            password: {
              type: 'string',
              minLength: 6,
              maxLength: 100,
              description: 'Password for the account',
              example: 'secure_password123'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: {
              type: 'string',
              description: 'Unique identifier for the user (used in API requests)',
              example: 'clh7x1234abcd5678efgh'
            }
          }
        },
        ItemStatus: {
          type: 'string',
          enum: ['todo', 'doing', 'done'],
          description: 'Current status of the item in the Kanban board'
        },
        Item: {
          type: 'object',
          required: ['id', 'userId', 'title', 'details', 'status', 'createdAt'],
          properties: {
            id: { type: 'string', description: 'Unique identifier for the item' },
            userId: { type: 'string', description: 'ID of the user who owns this item' },
            title: { type: 'string', maxLength: 200, description: 'Title of the item' },
            details: { type: 'string', maxLength: 1000, description: 'Detailed description' },
            status: { $ref: '#/components/schemas/ItemStatus' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateItemRequest: {
          type: 'object',
          required: ['title', 'details', 'status'],
          properties: {
            title: { type: 'string', maxLength: 200 },
            details: { type: 'string', maxLength: 1000 },
            status: { $ref: '#/components/schemas/ItemStatus' },
            userId: { type: 'string', description: 'User ID (optional if provided via query param)' }
          }
        },
        UpdateItemRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 200 },
            details: { type: 'string', maxLength: 1000 },
            status: { $ref: '#/components/schemas/ItemStatus' },
            userId: { type: 'string', description: 'User ID (optional if provided via query param)' }
          }
        },
        ChatRequest: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', maxLength: 2000 },
            conversation_history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['user', 'assistant'] },
                  content: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            },
            session_id: { type: 'string', nullable: true },
            userId: { type: 'string', description: 'User ID (optional if provided via query param)' }
          }
        },
        ChatResponse: {
          type: 'object',
          required: ['response', 'session_id', 'user_message_count'],
          properties: {
            response: { type: 'string' },
            session_id: { type: 'string' },
            user_message_count: { type: 'integer', minimum: 1, maximum: 5 },
            tool_usage: { type: 'object', nullable: true }
          }
        },
        ErrorResponse: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', description: 'Error message' }
          }
        }
      }
    },
    security: [{ UserIdParam: [] }]
  },
  apis: [
    'src/app/api/*/route.ts',
    'src/app/api/*/*/route.ts'
  ]
};


export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format');

  // Generate the OpenAPI spec dynamically
  const generatedSpec = swaggerJSDoc(swaggerOptions);

  // Return JSON by default or when explicitly requested
  if (!format || format === 'json') {
    return NextResponse.json(generatedSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Return YAML format when requested
  if (format === 'yaml') {
    const yamlContent = convertToYaml(generatedSpec);
    return new NextResponse(yamlContent, {
      headers: {
        'Content-Type': 'text/yaml',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Serve Swagger UI when requested
  if (format === 'ui') {
    const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskBoard API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api/openapi?format=json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>`;

    return new NextResponse(swaggerHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }

  return NextResponse.json({ error: 'Invalid format parameter' }, { status: 400 });
}

// Simple JSON to YAML conversion (basic implementation)
function convertToYaml(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        yaml += `${spaces}- ${convertToYaml(item, indent + 1).trim()}\n`;
      } else {
        yaml += `${spaces}- ${JSON.stringify(item)}\n`;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += convertToYaml(value, indent + 1);
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n`;
        yaml += convertToYaml(value, indent + 1);
      } else {
        const yamlValue = typeof value === 'string' && value.includes('\n') 
          ? `|\n${value.split('\n').map(line => `${spaces}  ${line}`).join('\n')}\n`
          : JSON.stringify(value);
        yaml += `${spaces}${key}: ${yamlValue}\n`;
      }
    }
  }

  return yaml;
}