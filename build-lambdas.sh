#!/bin/bash

set -e

echo "Building Lambda functions..."

DIST_DIR="$(pwd)/backend/dist"
mkdir -p "$DIST_DIR"

# Build each Lambda function
FUNCTIONS=(
  "ensure-me"
  "get-me"
  "my-profile"
  "update-profile"
  "list-potential-matches"
  "update-location"
  "get-upload-url"
  "react-to-user"
  "grant-badges"
)

for func in "${FUNCTIONS[@]}"; do
  echo "Building $func..."
  
  cd "backend/cmd/$func"
  
  # Build for Lambda (Linux ARM64)
  GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o bootstrap main.go
  
  # Create dist directory and move binary
  mkdir -p "../../../backend/dist/$func"
  mv bootstrap "../../../backend/dist/$func/"
  
  cd ../../..
  
  echo "✓ $func built successfully"
done

echo "All Lambda functions built successfully!"
