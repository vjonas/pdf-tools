const { getNotarizeConfig } = require("./build/notarize-config");

module.exports = {
  appId: "com.pdforganiser.app",
  productName: "PDF Organiser",
  directories: {
    output: "dist-electron",
  },

  files: [
    "dist/**/*",
    "electron/**/*",
    "node_modules/**/*",
    "public/**/*",
    "public/pdf-worker/pdf.worker.min.js",
  ],
  asarUnpack: ["public/**/*", "public/pdf-worker/pdf.worker.min.js"],
  fileAssociations: [
    {
      ext: "pdf",
      name: "PDF Document",
      description: "Portable Document Format",
      role: "Viewer",
    },
  ],
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64", "ia32", "arm64"],
      },
    ],
    icon: "assets/icon.png",
    verifyUpdateCodeSignature: false,
    signtoolOptions: {
      sign: "./build/sign-win.js",
    },
    fileAssociations: [
      {
        ext: "pdf",
        name: "PDF Document",
        description: "Portable Document Format",
        icon: "assets/icon.png",
        role: "Viewer",
      },
    ],
  },
  mac: {
    target: "dmg",
    icon: "assets/icon.png",
    category: "public.app-category.productivity",
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "build/entitlements.mac.plist",
    entitlementsInherit: "build/entitlements.mac.plist",
    notarize: getNotarizeConfig(),
    fileAssociations: [
      {
        ext: "pdf",
        name: "PDF Document",
        description: "Portable Document Format",
        icon: "assets/icon.png",
        role: "Viewer",
      },
    ],
  },
  linux: {
    target: "AppImage",
    icon: "assets/icon.png",
    fileAssociations: [
      {
        ext: "pdf",
        name: "PDF Document",
        description: "Portable Document Format",
        mimeType: "application/pdf",
      },
    ],
  },
};
