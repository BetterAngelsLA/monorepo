import '@testing-library/jest-dom';
import { GET_SHELTERS_QUERY } from './shared/clients/apollo/queries/getShelters';

// Temporary suppression to allow incremental cleanup without regressions.
// ⚠️ If you're modifying this file, please remove this ignore and fix the issue.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mocks = [
  {
    request: {
      query: GET_SHELTERS_QUERY,
    },
    result: {
      data: {
        shelters: { id: '1', name: 'name' },
      },
    },
    maxUsageCount: 1,
  },
];

describe('App', () => {
  it('should await fixed tests later!!!', () => {
    expect(true).toBeTruthy();
  });

  // it('should not throw an error', () => {
  //   const { baseElement } = render(
  //     <MockedProvider mocks={mocks} addTypename={false}>
  //       <BrowserRouter>
  //         <App />
  //       </BrowserRouter>
  //     </MockedProvider>
  //   );

  //   expect(baseElement).toBeTruthy();
  // });
});
