# Code Signing Setup Guide for PDF Organiser

This guide will walk you through setting up code signing for both macOS and Windows platforms.

## Prerequisites

- Apple Developer Account (for macOS signing)
- Code signing certificate for Windows (EV certificate recommended)
- GitHub repository with Actions enabled

## macOS Code Signing Setup

### Step 1: Generate Certificates in Apple Developer Portal

1. **Log in to Apple Developer Portal**
   - Go to [https://developer.apple.com/account/](https://developer.apple.com/account/)
   - Navigate to "Certificates, Identifiers & Profiles"

2. **Create Developer ID Application Certificate**
   - Click "Certificates" → "+" (Add new certificate)
   - Select "Developer ID Application" under "Production"
   - Follow the instructions to create a Certificate Signing Request (CSR) using Keychain Access
   - Upload the CSR and download the certificate
   - Double-click the certificate to install it in your Keychain

3. **Create Developer ID Installer Certificate** (Optional, for PKG installers)
   - Repeat the process but select "Developer ID Installer"

### Step 2: Extract Certificate for CI/CD

1. **Export Certificate from Keychain**
   ```bash
   # Open Keychain Access
   # Right-click on your "Developer ID Application" certificate
   # Select "Export" and save as .p12 file with a strong password
   ```

2. **Convert to Base64** (for GitHub Secrets)
   ```bash
   base64 -i /path/to/your/certificate.p12 | pbcopy
   ```

### Step 3: Set up App-Specific Password

1. **Generate App-Specific Password**
   - Go to [https://appleid.apple.com/](https://appleid.apple.com/)
   - Sign in with your Apple ID
   - Go to "App-Specific Passwords"
   - Generate a new password for "PDF Organiser Notarization"

### Step 4: Update package.json

Update the `APPLE_TEAM_ID` in your package.json:
```json
"notarize": true
```

Find your Team ID in the Apple Developer Portal under "Membership Details".

## Windows Code Signing Setup

### Option 1: Traditional EV Certificate

As of **June 2023**, Microsoft requires Extended Validation (EV) certificates for Windows code signing. Regular certificates will show security warnings.

#### Purchase EV Certificate

Popular certificate providers include:
- [DigiCert](https://www.digicert.com/code-signing/) - Recommended by Electron team
- [Sectigo (formerly Comodo)](https://sectigo.com/ssl-certificates-tls/code-signing)
- [GlobalSign](https://www.globalsign.com/en/code-signing-certificate/)
- [SSL.com](https://www.ssl.com/certificates/code-signing/)

**Important**: EV certificates must be stored on FIPS 140 Level 2+ hardware security modules (HSMs). Many providers now offer "cloud signing" solutions.

#### Setup for Cloud-Based Signing

1. **DigiCert KeyLocker Example**:
   - Purchase DigiCert EV certificate with KeyLocker
   - Get your signing credentials from DigiCert
   - Use their cloud-based signing API

2. **Configure Environment Variables** (see GitHub Secrets section below)

### Option 2: Azure Trusted Signing (Recommended)

[Azure Trusted Signing](https://learn.microsoft.com/en-us/azure/trusted-signing/) is Microsoft's modern alternative to traditional certificates.

**Benefits**:
- Cheaper than traditional EV certificates
- Eliminates SmartScreen warnings
- Cloud-based, no hardware tokens required

**Eligibility** (as of 2024):
- US and Canada-based organizations
- 3+ years of verifiable business history
- Microsoft may expand availability over time

#### Setup Steps:

1. **Apply for Azure Trusted Signing**
   - Go to Azure Portal
   - Search for "Trusted Signing"
   - Follow the verification process

2. **Create Service Principal**
   ```bash
   az ad sp create-for-rbac --name "pdf-organiser-signing" --role contributor
   ```

3. **Configure Trusted Signing Account**
   - In Azure Portal, create a Trusted Signing account
   - Create a certificate profile
   - Note your endpoint URL and account details

## GitHub Repository Secrets Setup

### Add the following secrets to your GitHub repository:

**Repository Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### macOS Secrets:

| Secret Name                   | Description                     | Example Value                      |
| ----------------------------- | ------------------------------- | ---------------------------------- |
| `MAC_CSC_LINK`                | Base64 encoded .p12 certificate | `MIIKxgIBAzCCCoAGCSqGSIb3DQEHA...` |
| `MAC_CSC_KEY_PASSWORD`        | Password for .p12 certificate   | `your-certificate-password`        |
| `APPLE_ID`                    | Your Apple ID email             | `developer@yourcompany.com`        |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password           | `abcd-efgh-ijkl-mnop`              |
| `APPLE_TEAM_ID`               | Your Apple Developer Team ID    | `ABCD123456`                       |

### Windows Secrets (Traditional Certificate):

| Secret Name            | Description                        | Example Value                 |
| ---------------------- | ---------------------------------- | ----------------------------- |
| `WIN_CSC_LINK`         | Path to certificate file or base64 | `/path/to/cert.p12` or base64 |
| `WIN_CSC_KEY_PASSWORD` | Certificate password               | `your-certificate-password`   |

### Windows Secrets (Azure Trusted Signing):

| Secret Name                       | Description                       |
| --------------------------------- | --------------------------------- |
| `AZURE_TENANT_ID`                 | Azure AD tenant ID                |
| `AZURE_CLIENT_ID`                 | Service principal client ID       |
| `AZURE_CLIENT_SECRET`             | Service principal secret          |
| `AZURE_ENDPOINT_URL`              | Trusted Signing endpoint URL      |
| `AZURE_CODE_SIGNING_ACCOUNT_NAME` | Your Trusted Signing account name |
| `AZURE_CERTIFICATE_PROFILE_NAME`  | Certificate profile name          |

## Testing Your Setup

### Local Testing

1. **macOS Local Build**:
   ```bash
   export CSC_LINK="path/to/your/certificate.p12"
   export CSC_KEY_PASSWORD="your-password"
   export APPLE_ID="your-apple-id"
   export APPLE_APP_SPECIFIC_PASSWORD="your-app-password"
   export APPLE_TEAM_ID="your-team-id"
   
   pnpm run electron:dist -- --mac
   ```

2. **Windows Local Build**:
   ```bash
   set WIN_CSC_LINK=path\to\your\certificate.p12
   set WIN_CSC_KEY_PASSWORD=your-password
   
   pnpm run electron:dist -- --win
   ```

### CI/CD Testing

1. **Push to GitHub** and create a tag:
   ```bash
   git tag v1.4.1
   git push origin v1.4.1
   ```

2. **Monitor GitHub Actions**:
   - Go to your repository's "Actions" tab
   - Watch the build process
   - Check for signing success/failure messages

## Verification

### macOS Verification

1. **Check if signed**:
   ```bash
   codesign -dv --verbose=4 /path/to/PDF\ Organiser.app
   ```

2. **Check if notarized**:
   ```bash
   spctl -a -vvv -t install /path/to/PDF\ Organiser.app
   ```

### Windows Verification

1. **Check signature**:
   ```powershell
   Get-AuthenticodeSignature "path\to\PDF Organiser.exe"
   ```

2. **Right-click the .exe** → Properties → Digital Signatures tab

## Troubleshooting

### Common macOS Issues

1. **"No identity found"**
   - Ensure certificate is installed in Keychain
   - Check certificate name matches in Keychain Access

2. **Notarization fails**
   - Verify Apple ID and App-Specific Password
   - Check Team ID is correct
   - Ensure hardened runtime is enabled

3. **"Gatekeeper will not allow"**
   - App needs to be notarized for distribution
   - Check entitlements are correct

### Common Windows Issues

1. **"signtool not found"**
   - Install Windows SDK
   - Ensure signtool.exe is in PATH

2. **"Certificate not found"**
   - Check certificate path and password
   - For cloud signing, verify all credentials

3. **SmartScreen warnings**
   - Use EV certificate or Azure Trusted Signing
   - Regular certificates show warnings since June 2023

## Security Best Practices

1. **Never commit certificates or passwords** to version control
2. **Use GitHub Secrets** for all sensitive data
3. **Rotate certificates** before expiration
4. **Monitor certificate validity** regularly
5. **Test builds** after certificate updates

## Resources

- [Electron Code Signing Documentation](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [electron-builder Code Signing Guide](https://www.electron.build/code-signing)
- [Apple Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/Introduction/Introduction.html)
- [Microsoft Code Signing Best Practices](https://docs.microsoft.com/en-us/windows-hardware/drivers/dashboard/code-signing-best-practices)

## Support

If you encounter issues:
1. Check the build logs in GitHub Actions
2. Verify all secrets are set correctly
3. Test locally first before CI/CD
4. Refer to the troubleshooting section above

---

**Note**: Code signing certificates typically cost $100-400/year for Windows and are included with Apple Developer Program ($99/year for macOS). 
