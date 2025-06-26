const { execSync } = require("child_process");
const fs = require("fs");

exports.default = async function (configuration) {
  // Only sign if certificate information is available
  const certificatePath = process.env.WIN_CSC_LINK;
  const certificatePassword = process.env.WIN_CSC_KEY_PASSWORD;

  if (!certificatePath || !certificatePassword) {
    console.log(
      "Windows code signing certificate not found, skipping signing..."
    );
    return;
  }

  console.log(`Signing ${configuration.path}...`);

  try {
    // For traditional certificates (P12/PFX files)
    if (certificatePath.endsWith(".p12") || certificatePath.endsWith(".pfx")) {
      // Using signtool from Windows SDK
      const signCommand = `signtool sign /f "${certificatePath}" /p "${certificatePassword}" /t http://timestamp.digicert.com /fd sha256 "${configuration.path}"`;
      execSync(signCommand, { stdio: "inherit" });
    }
    // For Azure Trusted Signing or other cloud-based signing
    else if (process.env.AZURE_TENANT_ID) {
      // Azure Trusted Signing configuration
      const signCommand =
        `az account login --service-principal -u ${process.env.AZURE_CLIENT_ID} -p ${process.env.AZURE_CLIENT_SECRET} --tenant ${process.env.AZURE_TENANT_ID} && ` +
        `az trusted-signing sign -e ${process.env.AZURE_ENDPOINT_URL} -a ${process.env.AZURE_CODE_SIGNING_ACCOUNT_NAME} -c ${process.env.AZURE_CERTIFICATE_PROFILE_NAME} --files "${configuration.path}"`;
      execSync(signCommand, { stdio: "inherit" });
    }

    console.log("Successfully signed Windows executable");
  } catch (error) {
    console.error("Failed to sign Windows executable:", error.message);
    // Don't fail the build if signing fails - you might want to change this behavior
    console.log("Continuing build without signing...");
  }
};
