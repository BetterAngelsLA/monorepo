export type TGqlExtensionEntry = {
  extensions?: Record<string, unknown>;
};

export type TGqlExtensionEntries = readonly TGqlExtensionEntry[];

export type TResultMinimal = {
  errors?: readonly {
    extensions?: Record<string, unknown>;
  }[];
};

export type TResultWithError = {
  error?: {
    errors?: readonly {
      extensions?: Record<string, unknown>;
    }[];
  } | null;
};
