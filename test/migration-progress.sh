#!/bin/bash

echo "Test Migration Progress Tracker"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track original vs migrated files
ORIGINAL_TOTAL=0
MIGRATED_TOTAL=0
MIGRATED_FILES=()

# Check if file has been migrated (contains new imports)
is_migrated() {
    local file=$1
    if grep -q "withTestContext\|createGameWithState\|describeEntity\|describeSystem" "$file" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

echo "Analyzing test files..."
echo ""

# Analyze each test file
for file in $(find test -name "*.test.ts" -type f | sort); do
    if [[ "$file" == *"refactored"* ]] || [[ "$file" == *"EXAMPLE"* ]]; then
        continue
    fi
    
    lines=$(wc -l < "$file" 2>/dev/null || echo 0)
    ORIGINAL_TOTAL=$((ORIGINAL_TOTAL + lines))
    
    if is_migrated "$file"; then
        echo -e "${GREEN}✓${NC} $(basename "$file") - ${lines} lines ${GREEN}(migrated)${NC}"
        MIGRATED_FILES+=("$file")
        MIGRATED_TOTAL=$((MIGRATED_TOTAL + lines))
    else
        echo -e "${RED}✗${NC} $(basename "$file") - ${lines} lines"
    fi
done

echo ""
echo "Summary"
echo "======="
echo "Total test files: $(find test -name "*.test.ts" -type f | wc -l)"
echo "Migrated files: ${#MIGRATED_FILES[@]}"
echo "Original total lines: $ORIGINAL_TOTAL"
echo "Migrated files lines: $MIGRATED_TOTAL"
echo ""

# Calculate progress
if [ $ORIGINAL_TOTAL -gt 0 ]; then
    PROGRESS=$((MIGRATED_TOTAL * 100 / ORIGINAL_TOTAL))
    echo -e "Migration progress: ${YELLOW}${PROGRESS}%${NC}"
fi

# Show recently migrated files
if [ ${#MIGRATED_FILES[@]} -gt 0 ]; then
    echo ""
    echo "Recently migrated files:"
    for file in "${MIGRATED_FILES[@]}"; do
        echo "  - $(basename "$file")"
    done
fi

echo ""
echo "Next files to migrate (top 5 by size):"
find test -name "*.test.ts" -type f | while read -r file; do
    if ! is_migrated "$file" && [[ "$file" != *"refactored"* ]]; then
        lines=$(wc -l < "$file" 2>/dev/null || echo 0)
        echo "$lines $file"
    fi
done | sort -rn | head -5 | while read -r lines file; do
    echo "  - $(basename "$file") ($lines lines)"
done