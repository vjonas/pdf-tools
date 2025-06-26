#!/bin/bash

# Verification script for code signing setup
# Usage: ./scripts/verify-signing-setup.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 PDF Organiser Code Signing Setup Verification${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking configuration files...${NC}"

# Check if build directory exists
if [ -d "build" ]; then
    echo -e "${GREEN}✅ Build directory exists${NC}"
else
    echo -e "${RED}❌ Build directory missing${NC}"
fi

# Check entitlements file
if [ -f "build/entitlements.mac.plist" ]; then
    echo -e "${GREEN}✅ macOS entitlements file exists${NC}"
else
    echo -e "${RED}❌ macOS entitlements file missing${NC}"
fi

# Check Windows signing script
if [ -f "build/sign-win.js" ]; then
    echo -e "${GREEN}✅ Windows signing script exists${NC}"
else
    echo -e "${RED}❌ Windows signing script missing${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Checking package.json configuration...${NC}"

# Check if macOS signing config exists
if grep -q "hardenedRuntime" package.json; then
    echo -e "${GREEN}✅ macOS hardened runtime configured${NC}"
else
    echo -e "${RED}❌ macOS hardened runtime not configured${NC}"
fi

if grep -q "notarize" package.json; then
    echo -e "${GREEN}✅ macOS notarization configured${NC}"
else
    echo -e "${RED}❌ macOS notarization not configured${NC}"
fi

if grep -q "entitlements" package.json; then
    echo -e "${GREEN}✅ macOS entitlements configured${NC}"
else
    echo -e "${RED}❌ macOS entitlements not configured${NC}"
fi

# Check Windows signing config
if grep -q "signtoolOptions" package.json; then
    echo -e "${GREEN}✅ Windows signing options configured${NC}"
else
    echo -e "${RED}❌ Windows signing options not configured${NC}"
fi

echo ""
echo -e "${BLUE}🔑 Checking environment variables (local)...${NC}"

# Check macOS environment variables
if [ -n "$CSC_LINK" ]; then
    echo -e "${GREEN}✅ CSC_LINK is set${NC}"
else
    echo -e "${YELLOW}⚠️  CSC_LINK not set (normal for CI-only setup)${NC}"
fi

if [ -n "$APPLE_ID" ]; then
    echo -e "${GREEN}✅ APPLE_ID is set${NC}"
else
    echo -e "${YELLOW}⚠️  APPLE_ID not set (normal for CI-only setup)${NC}"
fi

if [ -n "$APPLE_TEAM_ID" ]; then
    echo -e "${GREEN}✅ APPLE_TEAM_ID is set${NC}"
else
    echo -e "${YELLOW}⚠️  APPLE_TEAM_ID not set (normal for CI-only setup)${NC}"
fi

# Check Windows environment variables
if [ -n "$WIN_CSC_LINK" ]; then
    echo -e "${GREEN}✅ WIN_CSC_LINK is set${NC}"
else
    echo -e "${YELLOW}⚠️  WIN_CSC_LINK not set (normal for CI-only setup)${NC}"
fi

echo ""
echo -e "${BLUE}🛠️  Checking required tools...${NC}"

# Check if Node.js is available
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js available (${NODE_VERSION})${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
fi

# Check if pnpm is available
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "${GREEN}✅ pnpm available (v${PNPM_VERSION})${NC}"
else
    echo -e "${RED}❌ pnpm not found${NC}"
fi

# macOS specific checks
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo -e "${BLUE}🍎 macOS specific checks...${NC}"

    # Check if Xcode command line tools are installed
    if command -v codesign &> /dev/null; then
        echo -e "${GREEN}✅ codesign available${NC}"
    else
        echo -e "${RED}❌ codesign not found (install Xcode command line tools)${NC}"
    fi

    # Check for certificates in keychain
    if security find-identity -p codesigning &> /dev/null; then
        CERT_COUNT=$(security find-identity -p codesigning | grep -c "Developer ID Application" || echo "0")
        if [ "$CERT_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ Found ${CERT_COUNT} Developer ID Application certificate(s)${NC}"
        else
            echo -e "${YELLOW}⚠️  No Developer ID Application certificates found in keychain${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Unable to check keychain certificates${NC}"
    fi
fi

# Windows specific checks
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    echo ""
    echo -e "${BLUE}🪟 Windows specific checks...${NC}"

    # Check if signtool is available
    if command -v signtool &> /dev/null; then
        echo -e "${GREEN}✅ signtool available${NC}"
    else
        echo -e "${YELLOW}⚠️  signtool not found (install Windows SDK)${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}For macOS signing:${NC}"
    echo "1. Create certificates in Apple Developer Portal"
    echo "2. Export certificate as .p12 file"
    echo "3. Add GitHub Secrets (see CODE_SIGNING_SETUP.md)"
    echo "4. Update APPLE_TEAM_ID in package.json"
    echo ""
fi

echo -e "${YELLOW}For Windows signing:${NC}"
echo "1. Purchase EV certificate or set up Azure Trusted Signing"
echo "2. Configure signing credentials"
echo "3. Add GitHub Secrets (see CODE_SIGNING_SETUP.md)"
echo ""

echo -e "${YELLOW}General:${NC}"
echo "1. Read CODE_SIGNING_SETUP.md for detailed instructions"
echo "2. Set up GitHub repository secrets"
echo "3. Test locally before pushing to CI/CD"
echo ""

echo -e "${GREEN}🎉 Verification complete! Check any ❌ or ⚠️  items above.${NC}"
