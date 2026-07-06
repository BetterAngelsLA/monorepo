// SVG mock for Jest tests
// This replaces @nx/expo/plugins/jest/svg-mock which is broken in strict mode
// (cannot set properties on a string primitive).
const React = require('react');
const { View } = require('react-native');

const SvgMock = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref, testID: 'svg-mock' });
});

module.exports = SvgMock;
module.exports.ReactComponent = SvgMock;
module.exports.default = SvgMock;
