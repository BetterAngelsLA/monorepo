// import { render, screen, waitFor } from '@testing-library/react';
// import { useGetFeatureControlsQuery } from '../../providers/featureControls/__generated__/featureControls.generated';

// // Mock the GraphQL query hook to return mocked feature control data
// jest.mock(
//   '../../providers/featureControls/__generated__/featureControls.generated',
//   () => ({
//     useGetFeatureControlsQuery: jest.fn(),
//   })
// );

// // Mock data for feature controls
// const mockFeatureControls = {
//   featureControls: {
//     flags: [
//       { name: 'newFeature', isActive: true }, // Active flag
//     ],
//     switches: [],
//     samples: [],
//   },
// };

// // Component that uses the `useFeatureFlagActive` hook
// const TestComponent = () => {
//   const isActive = useFeatureFlagActive();
//   //   const isActive = useFeatureFlagActive(FeatureFlag);

//   return <div>{isActive ? 'Active' : 'Inactive'}</div>;
// };

// describe('useFeatureFlagActive', () => {
//   beforeEach(() => {
//     // Reset mock before each test
//     (useGetFeatureControlsQuery as jest.Mock).mockReturnValue({
//       data: mockFeatureControls,
//       refetch: jest.fn(),
//     });
//   });

//   it('should return true when the feature flag is active', async () => {
//     render(
//       <FeatureControlProvider>
//         <TestComponent />
//       </FeatureControlProvider>
//     );

//     // Wait for the component to render with the active flag value
//     await waitFor(() => screen.getByText('Active'));
//   });
// });
