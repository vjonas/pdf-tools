// Conditional notarization configuration
// Only notarize if Apple ID credentials are available

module.exports = {
  getNotarizeConfig: () => {
    const appleId = process.env.APPLE_ID;
    const applePassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
    const teamId = process.env.APPLE_TEAM_ID || "4GZCA4SKS5";

    // Only enable notarization if credentials are available
    if (appleId && applePassword) {
      console.log("🍎 Apple ID credentials found - enabling notarization");
      return true;
    } else {
      console.log("⚠️  Apple ID credentials not found - skipping notarization");
      console.log(
        "   Set APPLE_ID and APPLE_APP_SPECIFIC_PASSWORD to enable notarization"
      );
      return false;
    }
  },
};
