declare module 'eslint-plugin-react-native-a11y' {
  const plugin: {
    configs: {
      basic: { rules: Record<string, string> };
      ios: { rules: Record<string, string> };
      android: { rules: Record<string, string> };
      all: { rules: Record<string, string> };
    };
    rules: Record<string, unknown>;
  };
  export default plugin;
}
