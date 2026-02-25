type ApolloRuntimeConfig = {
  isDevEnv: boolean;
};

let runtimeConfig: ApolloRuntimeConfig = {
  isDevEnv: false,
};

export function initApolloRuntimeConfig(config: ApolloRuntimeConfig): void {
  runtimeConfig = config;
}

export function getApolloRuntimeConfig(): ApolloRuntimeConfig {
  return runtimeConfig;
}
