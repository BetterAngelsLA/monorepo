import { MockedProvider } from '@apollo/client/testing';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import { BrowserRouter } from 'react-router-dom';

import App from './app';
import { GET_CURRENT_USER } from './pages/home/home';

const mocks = [
  {
    request: {
      query: GET_CURRENT_USER,
    },
    result: {
      data: {
        dog: { id: '1', name: 'Joe' },
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
