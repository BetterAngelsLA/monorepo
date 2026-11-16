import { MemoryRouter } from 'react-router';

export const withMemoryRouter =
  (path: string = '/') =>
  (StoryComponent: any) => (
    <MemoryRouter initialEntries={[path]}>
      <StoryComponent />
    </MemoryRouter>
  );
