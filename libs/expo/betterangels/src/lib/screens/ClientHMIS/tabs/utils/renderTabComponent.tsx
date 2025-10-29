import type { ReactElement } from 'react';
import { HmisClientType } from '../../../../apollo';
import { ClientProfileSectionEnum } from '../../../../screenRouting';
import { ClientViewTabEnum } from '../../../Client/ClientTabs';
import { ClientInteractionsHmisView } from '../ClientInteractionsHmisView';
import { ClientProfileHMISView } from '../ClientProfileHMISView';
import { ProgramNotes } from '../ProgramNotes';

type RenderArgs = {
  client?: HmisClientType;
  openCard?: ClientProfileSectionEnum | null;
};

const tabRendererMap: Partial<
  Record<ClientViewTabEnum, (args: RenderArgs) => ReactElement | null>
> = {
  [ClientViewTabEnum.Profile]: ({ client, openCard }) => (
    <ClientProfileHMISView client={client} openCard={openCard} />
  ),
  [ClientViewTabEnum.Interactions]: ({ client }) => (
    <ProgramNotes client={client} />
  ),
};

export function renderTabComponent(
  tabKey: ClientViewTabEnum,
  args: RenderArgs
): ReactElement | null {
  const Component = tabRendererMap[tabKey];

  if (!Component) {
    return null;
  }

  return Component(args);
}
