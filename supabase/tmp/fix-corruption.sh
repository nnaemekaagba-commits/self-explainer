#!/bin/bash

# This script fixes the corruption in /supabase/functions/server/index.tsx
# by removing lines 326-340 which are corrupted/duplicate

INPUT_FILE="/supabase/functions/server/index.tsx"
OUTPUT_FILE="/supabase/functions/server/index_fixed.tsx"
TEMP_FILE="/tmp/index_temp.tsx"

# Extract lines 1-325 (before corruption)
head -n 325 "$INPUT_FILE" > "$TEMP_FILE"

# Skip lines 326-340 (corrupted section)
# Extract from line 341 onwards
tail -n +341 "$INPUT_FILE" >> "$TEMP_FILE"

# Move fixed file back
mv "$TEMP_FILE" "$OUTPUT_FILE"

echo "Fixed file created at $OUTPUT_FILE"
echo "Lines removed: 326-340 (corrupted duplicate code)"
