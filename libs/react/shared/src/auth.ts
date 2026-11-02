// Router-dependent auth surface, deliberately OUT of the `@monorepo/react/shared`
// barrel: the barrel is imported by the React Native app, and Metro does not
// tree-shake `export *`, so anything reachable from it lands in the Hermes
// bytecode. react-router v7 ships dynamic `import()` (its RSC route modules),
// which hermesc rejects outright, so the router must not be reachable from the
// native bundle. Web apps import `@monorepo/react/shared/auth` instead.
export * from './lib/auth';
