const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  transformIgnorePatterns: [
    // sanitize-html@^2.17.4 depends on htmlparser2 which is ESM-only.
    // Jest needs to transform it through Babel.
    'node_modules/(?!htmlparser2/)',
  ],
};
