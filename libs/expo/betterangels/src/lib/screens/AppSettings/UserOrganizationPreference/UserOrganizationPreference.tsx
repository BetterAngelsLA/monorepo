import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import {
  MainScrollContainer,
  UserOrganizationPreferenceSelect,
} from '../../../ui-components';

export function UserOrganizationPreference() {
  return (
    <MainScrollContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <TextRegular mb="md">
        Select the organization that will be used by default when creating
        interactions, tasks, and documents.
      </TextRegular>

      <UserOrganizationPreferenceSelect />
    </MainScrollContainer>
  );
}
