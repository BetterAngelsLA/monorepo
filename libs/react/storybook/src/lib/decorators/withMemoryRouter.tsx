import { MemoryRouter } from 'react-router-dom';

export const withMemoryRouter =
  (path: string = '/') =>
  (StoryComponent: any) =>
    (
      <MemoryRouter initialEntries={[path]}>
        <StoryComponent />
      </MemoryRouter>
    );
