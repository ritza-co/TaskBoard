import os
import yaml
import re

def load_config_with_env_substitution(config_path):
    """Load YAML config file with environment variable substitution."""
    
    # Read the config file
    with open(config_path, 'r') as file:
        content = file.read()
    
    # Replace environment variables in format ${VAR_NAME} or ${VAR_NAME:default_value}
    def replace_env_var(match):
        var_spec = match.group(1)
        if ':' in var_spec:
            var_name, default_value = var_spec.split(':', 1)
        else:
            var_name, default_value = var_spec, ''
        
        return os.getenv(var_name, default_value)
    
    # Substitute environment variables
    content = re.sub(r'\$\{([^}]+)\}', replace_env_var, content)
    
    # Parse the YAML
    return yaml.safe_load(content)