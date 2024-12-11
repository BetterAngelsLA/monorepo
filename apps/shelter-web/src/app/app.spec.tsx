import { MockedProvider } from '@apollo/client/testing';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './app';
import { GET_SHELTERS_QUERY } from './shared/clients/apollo/queries/getShelters';

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
  it('should not throw an error', () => {
    const { baseElement } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MockedProvider>
    );

    expect(baseElement).toBeTruthy();
  });
});
