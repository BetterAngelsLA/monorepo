import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import {
  MainScrollContainer,
  UserTeamPreferenceSelect,
} from '../../../ui-components';

export function UserTeamPreference() {
  return (
    <MainScrollContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <TextRegular mb="md">
        Select the team that will be used by default throughout the app.
      </TextRegular>

      <UserTeamPreferenceSelect />
    </MainScrollContainer>
  );
}
