# SSL.com eSigner Setup Guide for Kreadiv BV

This guide walks through setting up SSL.com eSigner cloud-based code signing for **PDF Organiser** by **Kreadiv BV**.

## 🛍️ Step 1: Purchase SSL.com EV Certificate

### What to Buy:
- **Product**: EV Code Signing Certificate with eSigner
- **Company**: Kreadiv BV
- **Country**: Belgium
- **Service**: Cloud-based signing (eSigner)
- **Duration**: 1 year (recommended to start)
- **Estimated Cost**: €200-350/year

### Purchase Process:
1. Go to [SSL.com Code Signing Certificates](https://www.ssl.com/certificates/code-signing/buy/)
2. Select **"EV Code Signing Certificate"**
3. Choose **"Cloud-based signing (eSigner)"** option
4. Fill in **Kreadiv BV** business details

### Required Information:
- **Legal Business Name**: Kreadiv BV
- **KBO/BCE Number**: (Your Belgian business registration number)
- **Business Address**: (Your registered business address)
- **Phone Number**: (Business phone)
- **Email**: (Your business email)
- **Authorized Representative**: (Name of person authorized to sign for the company)

## 📋 Step 2: Business Verification

SSL.com will verify your business. This typically takes 3-5 business days and may require:

- **Business registration documents**
- **Proof of business address**
- **Phone verification call**
- **Email verification**
- **Identity verification** of the authorized representative

## 🔑 Step 3: eSigner Account Setup

Once verification is complete, SSL.com will:

1. **Create your eSigner account**
2. **Send login credentials** via email
3. **Provide access** to the eSigner portal

### Initial Setup:
1. Log in to SSL.com eSigner portal
2. **Set up 2FA** (Two-Factor Authentication)
3. **Download your certificate** (if needed for reference)
4. **Note your credentials**:
   - Username (usually your email)
   - Password
   - TOTP secret (for automated 2FA)

## 🔧 Step 4: Configure Your Development Environment

### For Local Development:

#### Download CodeSignTool:
```bash
# Download from https://www.ssl.com/download/codesigntool-for-windows/
# Extract to a folder and add to PATH
```

#### Set Environment Variables:
```bash
# Windows (PowerShell)
$env:SSL_COM_USERNAME = "your-esigner-username"
$env:SSL_COM_PASSWORD = "your-esigner-password"

# Windows (Command Prompt)
set SSL_COM_USERNAME=your-esigner-username
set SSL_COM_PASSWORD=your-esigner-password

# macOS/Linux
export SSL_COM_USERNAME="your-esigner-username"
export SSL_COM_PASSWORD="your-esigner-password"
```

#### Test Local Signing:
```bash
pnpm run electron:dist -- --win
```

You should see:
```
📡 Using SSL.com eSigner cloud-based signing...
🔑 Signing with SSL.com eSigner for user: your-username
🚀 Executing SSL.com signing command...
✅ Successfully signed with SSL.com eSigner!
```

## ☁️ Step 5: Configure GitHub Actions (CI/CD)

### Add GitHub Secrets:

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name             | Value                                           |
| ----------------------- | ----------------------------------------------- |
| `SSL_COM_USERNAME`      | Your eSigner username (email)                   |
| `SSL_COM_PASSWORD`      | Your eSigner password                           |
| `SSL_COM_TOTP_SECRET`   | Your TOTP secret (optional, for automation)     |
| `SSL_COM_CREDENTIAL_ID` | Certificate ID (optional, if you have multiple) |

### Test CI/CD:
1. Create a new tag: `git tag v1.5.1 && git push origin v1.5.1`
2. Monitor GitHub Actions for signing success
3. Check release artifacts are signed properly

## 🧪 Step 6: Verification

### Verify Signed Executable:
```powershell
# Check signature
Get-AuthenticodeSignature "path\to\PDF Organiser.exe"

# Should show:
# Status: Valid
# SignerCertificate: CN=Kreadiv BV, ...
```

### Test on Windows:
- Download your signed executable
- Right-click → Properties → Digital Signatures
- Should show **Kreadiv BV** as the signer
- **No SmartScreen warnings** when running

## 💡 Tips for Kreadiv BV

### Cost Optimization:
- Start with **1-year certificate** to test the process
- Consider **multi-year** discounts for renewals

### Team Collaboration:
- **Share credentials securely** within your team
- Consider **separate staging/production** accounts for larger teams

### Automation:
- Set up **TOTP secret** for fully automated signing in CI/CD
- Use **credential ID** if you have multiple certificates

### Monitoring:
- **Monitor certificate expiration**
- **Test signing monthly** to catch issues early
- **Keep credentials updated** in GitHub Secrets

## 🚨 Security Best Practices

1. **Never commit credentials** to version control
2. **Use GitHub Secrets** for all sensitive data
3. **Rotate passwords** regularly
4. **Monitor signing logs** for suspicious activity
5. **Keep CodeSignTool updated**

## 📞 Support

### SSL.com Support:
- **Technical Support**: [SSL.com Support Portal](https://www.ssl.com/support/)
- **Documentation**: [eSigner Documentation](https://www.ssl.com/guide/esigner-ev-code-signing/)

### PDF Organiser Code Signing:
- **Main Guide**: See `CODE_SIGNING_SETUP.md`
- **Verification Script**: Run `bash scripts/verify-signing-setup.sh`

## ✅ Success Checklist

- [ ] SSL.com EV certificate purchased for Kreadiv BV
- [ ] Business verification completed
- [ ] eSigner account set up with 2FA
- [ ] CodeSignTool installed locally
- [ ] Local signing tested and working
- [ ] GitHub Secrets configured
- [ ] CI/CD signing tested and working
- [ ] Signed executables verified on Windows
- [ ] No SmartScreen warnings when running signed app

---

**🎉 Once complete, your PDF Organiser releases will be automatically signed with your Kreadiv BV certificate, eliminating security warnings for your users!** 
