#!/usr/bin/env node

/**
 * Secret management utilities for Sanity GitHub Actions
 * Helps with secure handling of tokens and credentials
 */

const crypto = require('crypto');

class SecretManager {
  /**
   * Mask sensitive values in logs
   */
  static maskSecret(secret, visibleChars = 4) {
    if (!secret || secret.length <= visibleChars) {
      return '***';
    }

    const visible = secret.substring(0, visibleChars);
    const masked = '*'.repeat(Math.max(8, secret.length - visibleChars));
    return `${visible}${masked}`;
  }

  /**
   * Validate token format
   */
  static validateToken(token, type = 'auth') {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is required and must be a string' };
    }

    // Check minimum length
    if (token.length < 20) {
      return { valid: false, error: 'Token appears to be too short' };
    }

    // Check for common prefixes
    const validPrefixes = {
      auth: ['sk', 'sanity.', 'skc'],
      deploy: ['skd', 'sanity.deploy.'],
      read: ['skr', 'sanity.read.']
    };

    const prefixes = validPrefixes[type] || validPrefixes.auth;
    const hasValidPrefix = prefixes.some(prefix => token.startsWith(prefix));

    if (!hasValidPrefix && type !== 'generic') {
      return {
        valid: false,
        error: `Token does not match expected format for ${type} token`
      };
    }

    return { valid: true };
  }

  /**
   * Parse and validate environment variables file
   */
  static parseEnvVariables(envString) {
    if (!envString) return {};

    const variables = {};
    const lines = envString.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        variables[key] = value.trim();
      }
    }

    return variables;
  }

  /**
   * Generate secure random string for temporary tokens
   */
  static generateTempToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Create GitHub Actions masking commands
   */
  static getMaskingCommands(secrets) {
    const commands = [];

    for (const [key, value] of Object.entries(secrets)) {
      if (value && typeof value === 'string' && value.length > 0) {
        commands.push(`::add-mask::${value}`);
      }
    }

    return commands;
  }

  /**
   * Validate project configuration
   */
  static validateProjectConfig(projectId, dataset) {
    const errors = [];

    // Validate project ID
    if (!projectId) {
      errors.push('Project ID is required');
    } else if (!/^[a-z0-9]+$/.test(projectId)) {
      errors.push('Project ID must contain only lowercase letters and numbers');
    }

    // Validate dataset
    if (!dataset) {
      errors.push('Dataset is required');
    } else if (!/^[a-z0-9]+[a-z0-9-]*$/.test(dataset)) {
      errors.push('Dataset must start with a letter/number and contain only lowercase letters, numbers, and hyphens');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'validate-token':
      const token = process.env[args[1]] || args[1];
      const type = args[2] || 'auth';
      const result = SecretManager.validateToken(token, type);

      if (result.valid) {
        console.log('✅ Token is valid');
        process.exit(0);
      } else {
        console.error(`❌ ${result.error}`);
        process.exit(1);
      }
      break;

    case 'mask':
      const secret = process.env[args[1]] || args[1];
      console.log(SecretManager.maskSecret(secret));
      break;

    case 'validate-config':
      const projectId = process.env.SANITY_PROJECT_ID;
      const dataset = process.env.SANITY_DATASET;
      const config = SecretManager.validateProjectConfig(projectId, dataset);

      if (config.valid) {
        console.log('✅ Project configuration is valid');
        process.exit(0);
      } else {
        console.error('❌ Configuration errors:');
        config.errors.forEach(err => console.error(`   - ${err}`));
        process.exit(1);
      }
      break;

    default:
      console.log('Usage: secret-manager.js <command> [args]');
      console.log('Commands:');
      console.log('  validate-token <token> [type]  - Validate token format');
      console.log('  mask <secret>                  - Mask sensitive value');
      console.log('  validate-config                - Validate project configuration');
      process.exit(1);
  }
}

module.exports = SecretManager;