#!/bin/bash

# Substitute environment variables in the config file
envsubst < mcp_agent.config.yaml > mcp_agent.config.yaml.tmp
mv mcp_agent.config.yaml.tmp mcp_agent.config.yaml

# Substitute environment variables in the secrets file
envsubst < mcp_agent.secrets.yaml > mcp_agent.secrets.yaml.tmp
mv mcp_agent.secrets.yaml.tmp mcp_agent.secrets.yaml

# Start the application
python main.py