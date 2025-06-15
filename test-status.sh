#!/bin/bash

echo "=== Test Status Report ==="
echo ""

echo "SKIPPED TESTS:"
echo "--------------"
grep -r "describe\.skip" test --include="*.test.ts" | cut -d: -f1 | sort | uniq | while read file; do
  echo "❌ $file"
done

echo ""
echo "ACTIVE TESTS:"
echo "-------------"
find test -name "*.test.ts" | while read file; do
  if ! grep -q "describe\.skip" "$file"; then
    echo "✅ $file"
  fi
done

echo ""
echo "PROBLEMATIC PATTERNS:"
echo "--------------------"
echo "Files using describeSystem: $(grep -r "describeSystem(" test --include="*.test.ts" | wc -l | tr -d ' ')"
echo "Files using describeEntity: $(grep -r "describeEntity(" test --include="*.test.ts" | wc -l | tr -d ' ')"
echo "Files using withTestContext: $(grep -r "withTestContext(" test --include="*.test.ts" | wc -l | tr -d ' ')"