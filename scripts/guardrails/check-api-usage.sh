#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

status=0

check_usage() {
  local description="$1"
  local pattern="$2"
  local include_path="$3"
  shift 3
  local tmp
  tmp="$(mktemp)"
  if rg --files-with-matches "$pattern" "$include_path" "$@" >"$tmp"; then
    echo "Guardrail violation: $description" >&2
    cat "$tmp" >&2
    status=1
  fi
  rm -f "$tmp"
}

# Ensure apiClient is only used within service layer exports
check_usage "Direct apiClient usage outside services" "apiClient" "frontend/src" --glob '!**/services/**' --glob '!**/types/**'

# Ensure legacy ApiResponse-based helpers are confined to the service layer and type definitions
check_usage "ApiResponse usage outside services/types" "ApiResponse<" "frontend/src" --glob '!**/services/**' --glob '!**/types/**'

if [[ $status -ne 0 ]]; then
  echo "\nHint: move data fetching to services that return ApiResult via request(), then consume via useApiCall." >&2
fi

exit $status
