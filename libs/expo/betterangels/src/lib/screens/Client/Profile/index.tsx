import { Colors } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { MainScrollContainer } from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import PersonalInfo from './PersonalInfo';

export default function Profile({
  client,
}: {
  client: ClientProfileQuery | undefined;
}) {
  const [expanded, setExpanded] = useState<undefined | string | null>();

  const props = {
    client,
    expanded,
    setExpanded,
  };

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <PersonalInfo {...props} />
    </MainScrollContainer>
  );
}
