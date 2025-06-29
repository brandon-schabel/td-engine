# Wave TD Release Process

## Quick Start

To create a new release:

```bash
# 1. Update version in package.json and src-tauri/tauri.conf.json
# 2. Commit your changes
git add .
git commit -m "Bump version to v1.0.0"

# 3. Create and push a tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main
git push origin v1.0.0
```

This will automatically trigger the GitHub Actions workflow to build and sign the app for macOS.

## Manual Release

You can also trigger a release manually from the Actions tab:
1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Enter the version tag (e.g., v1.0.0)

## Release Checklist

Before releasing:
- [ ] All tests passing
- [ ] Version bumped in package.json
- [ ] Version bumped in src-tauri/tauri.conf.json
- [ ] Changelog updated
- [ ] Documentation updated
- [ ] Commit all changes

## Platform Support

Currently configured platforms:
- ✅ macOS (Universal Binary - Intel + Apple Silicon)
- 🚧 iOS (configuration ready, not enabled in workflow yet)
- ❌ Windows (not configured)
- ❌ Android (not configured)

## After Release

1. The workflow creates a draft release
2. Edit the release notes on GitHub
3. Publish the release when ready
4. Downloaded .dmg files will be signed and notarized (if certificates are configured)