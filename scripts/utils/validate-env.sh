#!/bin/bash

# Validate Sanity environment variables and configuration

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2

    case $status in
        "error")
            echo -e "${RED}❌ ${message}${NC}"
            ;;
        "success")
            echo -e "${GREEN}✅ ${message}${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  ${message}${NC}"
            ;;
        *)
            echo "$message"
            ;;
    esac
}

# Check required environment variables
check_env_vars() {
    local required_vars=("SANITY_PROJECT_ID" "SANITY_DATASET")
    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_status "error" "Missing required environment variables: ${missing_vars[*]}"
        return 1
    fi

    print_status "success" "Required environment variables are set"
    return 0
}

# Validate Sanity project ID format
validate_project_id() {
    local project_id="${SANITY_PROJECT_ID:-}"

    if [[ ! "$project_id" =~ ^[a-z0-9]+$ ]]; then
        print_status "error" "Invalid project ID format: $project_id"
        return 1
    fi

    print_status "success" "Project ID format is valid"
    return 0
}

# Validate dataset name
validate_dataset() {
    local dataset="${SANITY_DATASET:-}"

    if [[ ! "$dataset" =~ ^[a-z0-9]+[a-z0-9-]*$ ]]; then
        print_status "error" "Invalid dataset name: $dataset"
        return 1
    fi

    print_status "success" "Dataset name is valid"
    return 0
}

# Check authentication token
check_auth_token() {
    if [ -z "${SANITY_AUTH_TOKEN:-}" ] && [ -z "${SANITY_DEPLOY_TOKEN:-}" ]; then
        print_status "warning" "No authentication token found. Some operations may fail."
        return 1
    fi

    print_status "success" "Authentication token is configured"
    return 0
}

# Validate Sanity configuration file
check_sanity_config() {
    local config_file="sanity.config.js"
    local alt_config_file="sanity.config.ts"

    if [ -f "$config_file" ] || [ -f "$alt_config_file" ]; then
        print_status "success" "Sanity configuration file found"
        return 0
    else
        print_status "warning" "No sanity.config.js/ts found in current directory"
        return 1
    fi
}

# Main validation function
main() {
    echo "🔍 Validating Sanity environment..."
    echo ""

    local has_errors=0

    check_env_vars || has_errors=1
    validate_project_id || has_errors=1
    validate_dataset || has_errors=1
    check_auth_token || has_errors=1
    check_sanity_config || has_errors=1

    echo ""

    if [ $has_errors -eq 0 ]; then
        print_status "success" "Environment validation passed!"
        exit 0
    else
        print_status "error" "Environment validation failed!"
        exit 1
    fi
}

# Run main function if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi