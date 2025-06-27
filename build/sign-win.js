const { execSync } = require("child_process");
const fs = require("fs");

exports.default = async function (configuration) {
  console.log(
    `🔐 Attempting to sign Windows executable: ${configuration.path}`
  );

  // SSL.com eSigner Cloud-based signing
  if (process.env.SSL_COM_USERNAME && process.env.SSL_COM_PASSWORD) {
    console.log("📡 Using SSL.com eSigner cloud-based signing...");
    return signWithSSLComESigner(configuration.path);
  }

  // Traditional certificate signing (P12/PFX files)
  if (process.env.WIN_CSC_LINK && process.env.WIN_CSC_KEY_PASSWORD) {
    console.log("💾 Using traditional certificate signing...");
    return signWithTraditionalCert(configuration.path);
  }

  // Azure Trusted Signing
  if (process.env.AZURE_TENANT_ID) {
    console.log("☁️ Using Azure Trusted Signing...");
    return signWithAzureTrustedSigning(configuration.path);
  }

  console.log(
    "⚠️ No Windows code signing credentials found, skipping signing..."
  );
  console.log("   Available options:");
  console.log(
    "   - SSL.com eSigner: Set SSL_COM_USERNAME and SSL_COM_PASSWORD"
  );
  console.log(
    "   - Traditional cert: Set WIN_CSC_LINK and WIN_CSC_KEY_PASSWORD"
  );
  console.log("   - Azure Trusted: Set AZURE_TENANT_ID and related variables");
};

async function signWithSSLComESigner(filePath) {
  try {
    const username = process.env.SSL_COM_USERNAME;
    const password = process.env.SSL_COM_PASSWORD;
    const totpSecret = process.env.SSL_COM_TOTP_SECRET;
    const credentialId = process.env.SSL_COM_CREDENTIAL_ID;

    console.log(`🔑 Signing with SSL.com eSigner for user: ${username}`);

    // Install CodeSignTool if not present
    const codeSignToolPath = await ensureCodeSignTool();

    // Construct signing command
    let signCommand = `"${codeSignToolPath}" sign`;
    signCommand += ` -username="${username}"`;
    signCommand += ` -password="${password}"`;

    if (totpSecret) {
      signCommand += ` -totp_secret="${totpSecret}"`;
    }

    if (credentialId) {
      signCommand += ` -credential_id="${credentialId}"`;
    }

    signCommand += ` -program_name="PDF Organiser"`;
    signCommand += ` -program_version="1.5.0"`;
    signCommand += ` -program_url="https://github.com/vjonas/pdf-tools"`;
    signCommand += ` -malware_block=false`;
    signCommand += ` -clean_logs=false`;
    signCommand += ` -auto_select=true`;
    signCommand += ` "${filePath}"`;

    console.log("🚀 Executing SSL.com signing command...");
    execSync(signCommand, { stdio: "inherit" });
    console.log("✅ Successfully signed with SSL.com eSigner!");
  } catch (error) {
    console.error("❌ SSL.com eSigner signing failed:", error.message);
    throw error;
  }
}

async function ensureCodeSignTool() {
  const os = require("os");
  const path = require("path");

  // CodeSignTool paths for different platforms
  const toolPaths = {
    win32: "CodeSignTool.exe",
    darwin: "./CodeSignTool", // Will need to download for macOS
    linux: "./CodeSignTool", // Will need to download for Linux
  };

  const toolName = toolPaths[os.platform()] || "CodeSignTool";

  // Check if tool exists
  try {
    execSync(`${toolName} -version`, { stdio: "pipe" });
    return toolName;
  } catch (error) {
    console.log("📥 CodeSignTool not found, will need to download...");

    // For now, assume it's available or will be installed
    // In production, you might want to auto-download it
    return toolName;
  }
}

function signWithTraditionalCert(filePath) {
  try {
    const certificatePath = process.env.WIN_CSC_LINK;
    const certificatePassword = process.env.WIN_CSC_KEY_PASSWORD;

    console.log("📜 Signing with traditional certificate...");

    const signCommand = `signtool sign /f "${certificatePath}" /p "${certificatePassword}" /t http://timestamp.digicert.com /fd sha256 "${filePath}"`;
    execSync(signCommand, { stdio: "inherit" });
    console.log("✅ Successfully signed with traditional certificate!");
  } catch (error) {
    console.error("❌ Traditional certificate signing failed:", error.message);
    throw error;
  }
}

function signWithAzureTrustedSigning(filePath) {
  try {
    console.log("☁️ Signing with Azure Trusted Signing...");

    const signCommand =
      `az account login --service-principal -u ${process.env.AZURE_CLIENT_ID} -p ${process.env.AZURE_CLIENT_SECRET} --tenant ${process.env.AZURE_TENANT_ID} && ` +
      `az trusted-signing sign -e ${process.env.AZURE_ENDPOINT_URL} -a ${process.env.AZURE_CODE_SIGNING_ACCOUNT_NAME} -c ${process.env.AZURE_CERTIFICATE_PROFILE_NAME} --files "${filePath}"`;
    execSync(signCommand, { stdio: "inherit" });
    console.log("✅ Successfully signed with Azure Trusted Signing!");
  } catch (error) {
    console.error("❌ Azure Trusted Signing failed:", error.message);
    throw error;
  }
}
