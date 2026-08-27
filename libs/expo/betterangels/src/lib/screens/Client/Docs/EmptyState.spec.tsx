import { render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import EmptyState from './EmptyState';

vi.mock('@monorepo/expo/shared/icons', () => ({
  FileOutlineIcon: () => null,
  PlusIcon: () => null,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  TextRegular: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

describe('Docs EmptyState', () => {
  it('renders the empty state title and subtitle', () => {
    const { getByText } = render(<EmptyState />);

    expect(getByText('No files yet')).toBeTruthy();
    expect(
      getByText(
        'After you upload a file, it will appear here along with its folder.',
      ),
    ).toBeTruthy();
  });
});
