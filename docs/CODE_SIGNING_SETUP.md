# Wave TD Code Signing Setup Guide

This guide walks you through setting up code signing for macOS and iOS releases of Wave TD.

## Prerequisites

- Apple Developer Account ($99/year) - Required for both macOS and iOS distribution
- macOS computer with Xcode installed (for iOS development)
- GitHub repository with Actions enabled

## macOS Code Signing Setup

### 1. Create Developer ID Certificate

1. Sign in to [Apple Developer](https://developer.apple.com/account)
2. Navigate to Certificates, Identifiers & Profiles
3. Click the "+" button to create a new certificate
4. Select "Developer ID Application" under Software
5. Follow the instructions to create a Certificate Signing Request (CSR) using Keychain Access
6. Upload the CSR and download your certificate
7. Double-click the certificate to install it in your Keychain

### 2. Export Certificate for GitHub Actions

1. Open Keychain Access
2. Find your "Developer ID Application" certificate
3. Right-click and select "Export"
4. Choose .p12 format
5. Set a strong password (you'll need this for GitHub secrets)
6. Save the file

### 3. Encode Certificate for GitHub Secrets

```bash
# Convert certificate to base64
base64 -i YourCertificate.p12 | pbcopy
# The certificate is now in your clipboard
```

### 4. Configure GitHub Secrets

Go to your repository Settings → Secrets and variables → Actions, and add:

- `APPLE_CERTIFICATE`: The base64-encoded certificate (from clipboard)
- `APPLE_CERTIFICATE_PASSWORD`: The password you set when exporting
- `APPLE_SIGNING_IDENTITY`: Your signing identity (e.g., "Developer ID Application: Your Name (TEAMID)")
  - Find this in Keychain Access by looking at your certificate details
- `APPLE_ID`: Your Apple ID email
- `APPLE_PASSWORD`: App-specific password (see below)
- `APPLE_TEAM_ID`: Your Team ID (found in Apple Developer account membership page)

### 5. Create App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in and go to "Sign-In and Security"
3. Select "App-Specific Passwords"
4. Generate a new password for "Wave TD Notarization"
5. Save this password - you'll use it for `APPLE_PASSWORD` secret

## iOS Code Signing Setup

### 1. Create App ID

1. In Apple Developer portal, go to Identifiers
2. Click "+" to register a new App ID
3. Select "App IDs" and continue
4. Use Bundle ID: `com.tauri-td.app` (or your chosen identifier)
5. Configure capabilities as needed

### 2. Create iOS Certificates

You'll need two certificates:

#### Development Certificate (for testing)
1. Go to Certificates → "+"
2. Select "iOS App Development"
3. Follow CSR instructions
4. Download and install

#### Distribution Certificate (for App Store)
1. Go to Certificates → "+"
2. Select "iOS Distribution"
3. Follow CSR instructions
4. Download and install

### 3. Create Provisioning Profiles

#### Development Profile
1. Go to Profiles → "+"
2. Select "iOS App Development"
3. Select your App ID
4. Select your development certificate
5. Select test devices (if any)
6. Name it "Wave TD Development"
7. Download

#### App Store Profile
1. Go to Profiles → "+"
2. Select "App Store"
3. Select your App ID
4. Select your distribution certificate
5. Name it "Wave TD App Store"
6. Download

### 4. Export iOS Certificates and Profiles

Similar to macOS, export certificates as .p12 files and encode them:

```bash
# Encode certificate
base64 -i iOSDistribution.p12 | pbcopy

# Encode provisioning profile
base64 -i TDEngineAppStore.mobileprovision | pbcopy
```

### 5. Configure iOS GitHub Secrets

Add these secrets:

- `IOS_CERTIFICATE`: Base64-encoded distribution certificate
- `IOS_CERTIFICATE_PASSWORD`: Certificate password
- `IOS_MOBILE_PROVISION`: Base64-encoded provisioning profile

## Building Locally

### macOS Build

```bash
# Development build (no signing)
npm run tauri:build

# Production build with signing
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
npm run tauri:build -- --target universal-apple-darwin
```

### iOS Build

First, initialize iOS support:

```bash
npm run tauri:ios:init
```

Then build:

```bash
# Development
npm run tauri:ios:dev

# Production
npm run tauri:ios:build
```

## Triggering GitHub Actions Release

The workflow triggers automatically when you push a tag:

```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

Or manually trigger from GitHub Actions tab using the "Run workflow" button.

## Troubleshooting

### Certificate Not Found

- Ensure the certificate is properly installed in Keychain Access
- Check that the signing identity string matches exactly
- Verify the certificate hasn't expired

### Notarization Failed

- Check that the app-specific password is correct
- Ensure your Apple ID has accepted the latest developer agreements
- Verify the Team ID is correct

### iOS Build Failures

- Ensure Xcode is up to date
- Check that provisioning profiles match the certificate
- Verify the bundle identifier matches across all configurations

## Security Best Practices

1. **Rotate certificates** before they expire (typically 1-5 years)
2. **Never commit** certificates or passwords to the repository
3. **Use separate certificates** for development and production
4. **Limit access** to GitHub secrets to trusted team members
5. **Backup certificates** securely - losing them means you can't update your app

## Next Steps

1. Test the build process locally first
2. Verify certificates are properly configured
3. Do a test release with a pre-release tag
4. Monitor the GitHub Actions workflow for any issues

For more information, see:
- [Tauri v2 Code Signing Guide](https://v2.tauri.app/distribute/sign/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)