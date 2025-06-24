#!/bin/bash

# Release script for PDF Organiser
# Interactive release script with menu selection
# Usage: ./scripts/release.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to show help
show_help() {
    echo -e "${BLUE}PDF Organiser Release Script${NC}"
    echo ""
    echo "This script will help you create a new release by:"
    echo "1. Bumping the version in package.json"
    echo "2. Creating a git commit and tag"
    echo "3. Pushing to GitHub to trigger the build"
    echo ""
    echo "Usage: $0"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}Error: Not in a git repository${NC}"
        exit 1
    fi
}

# Function to check if working directory is clean
check_clean_working_dir() {
    if ! git diff-index --quiet HEAD --; then
        echo -e "${RED}Error: Working directory is not clean. Please commit or stash your changes.${NC}"
        git status --short
        exit 1
    fi
}

# Function to check if package.json exists
check_package_json() {
    if [ ! -f "package.json" ]; then
        echo -e "${RED}Error: package.json not found in current directory${NC}"
        exit 1
    fi
}

# Function to get current version from package.json
get_current_version() {
    node -p "require('./package.json').version"
}

# Function to calculate next version
calculate_next_version() {
    local current_version=$1
    local bump_type=$2

    # Split version into parts
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    local major=${VERSION_PARTS[0]}
    local minor=${VERSION_PARTS[1]}
    local patch=${VERSION_PARTS[2]}

    case $bump_type in
        "patch")
            echo "$major.$minor.$((patch + 1))"
            ;;
        "minor")
            echo "$major.$((minor + 1)).0"
            ;;
        "major")
            echo "$((major + 1)).0.0"
            ;;
    esac
}

# Function to bump version
bump_version() {
    local bump_type=$1
    echo -e "${BLUE}Bumping ${bump_type} version...${NC}"

    # Use npm version to bump and create git tag
    local new_version=$(npm version $bump_type --no-git-tag-version)
    echo $new_version
}

# Function to create git tag and push
create_and_push_tag() {
    local version=$1
    echo -e "${BLUE}Creating git tag ${version}...${NC}"

    # Add the package.json changes
    git add package.json
    git commit -m "Bump version to ${version}"

    # Create the tag
    git tag $version

    echo -e "${BLUE}Pushing changes and tag to origin...${NC}"
    git push origin main || git push origin master  # Try main first, fallback to master
    git push origin $version

    echo -e "${GREEN}✅ Successfully created and pushed tag ${version}${NC}"
    echo -e "${YELLOW}GitHub Action will now build and create the release automatically.${NC}"
    echo -e "${BLUE}You can monitor the progress at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions${NC}"
}

# Function to show interactive menu
show_menu() {
    local current_version=$1

    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}" >&2
    echo -e "${CYAN}║                    PDF Organiser Release                    ║${NC}" >&2
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}" >&2
    echo "" >&2
    echo -e "${BLUE}Current version: ${YELLOW}${current_version}${NC}" >&2
    echo "" >&2
    echo -e "${BLUE}Select the type of release:${NC}" >&2
    echo "" >&2

    # Define menu options with descriptions
    local patch_version=$(calculate_next_version $current_version "patch")
    local minor_version=$(calculate_next_version $current_version "minor")
    local major_version=$(calculate_next_version $current_version "major")

    PS3=$'\n'"${CYAN}Enter your choice (1-4): ${NC}"

    options=(
        "🐛 Patch/Bug Fix Release    → ${patch_version}   (backwards compatible bug fixes)"
        "✨ Feature/Minor Release    → ${minor_version}   (new features, backwards compatible)"
        "💥 Major Release           → ${major_version}   (breaking changes)"
        "❌ Cancel"
    )

    select opt in "${options[@]}"
    do
        case $REPLY in
            1)
                echo -e "${GREEN}Selected: Patch/Bug Fix Release${NC}" >&2
                echo "patch"  # Only this goes to stdout
                break
                ;;
            2)
                echo -e "${GREEN}Selected: Feature/Minor Release${NC}" >&2
                echo "minor"  # Only this goes to stdout
                break
                ;;
            3)
                echo -e "${GREEN}Selected: Major Release${NC}" >&2
                echo "major"  # Only this goes to stdout
                break
                ;;
            4)
                echo -e "${YELLOW}Release cancelled.${NC}" >&2
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option. Please select 1-4.${NC}" >&2
                ;;
        esac
    done
}

# Main script logic
main() {
    # Check for help flag
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_help
        exit 0
    fi

    echo -e "${BLUE}🚀 PDF Organiser Release Script${NC}"
    echo ""

    # Perform checks
    check_git_repo
    check_package_json
    check_clean_working_dir

    # Get current version
    local current_version=$(get_current_version)

        # Show interactive menu
    local bump_type=$(show_menu $current_version)

    echo ""
    echo -e "${YELLOW}About to create a ${bump_type} release from ${current_version}${NC}"

    # Calculate what the new version will be
    local next_version=$(calculate_next_version $current_version $bump_type)
    echo -e "${YELLOW}New version will be: ${GREEN}${next_version}${NC}"
    echo ""

    # Final confirmation
    read -p "$(echo -e ${YELLOW}Continue with the release? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Release cancelled.${NC}"
        exit 0
    fi

    # Bump version
    local new_version=$(bump_version $bump_type)
    echo -e "${GREEN}Version bumped to: ${new_version}${NC}"

    # Create and push tag
    create_and_push_tag $new_version

    echo ""
    echo -e "${GREEN}🎉 Release ${new_version} initiated successfully!${NC}"
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                     Next Steps                              ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${BLUE}The GitHub Action will now:${NC}"
    echo "  1. 🔨 Build the application for all platforms"
    echo "  2. 📦 Create a GitHub release with the binaries"
    echo "  3. ⬆️  Upload installers for macOS, Windows, and Linux"
    echo ""
    echo -e "${BLUE}Monitor progress at:${NC}"
    echo -e "${CYAN}https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions${NC}"
}

# Run main function with all arguments
main "$@"
