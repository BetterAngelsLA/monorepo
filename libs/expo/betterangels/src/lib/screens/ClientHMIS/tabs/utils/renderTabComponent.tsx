import type { ReactElement } from 'react';
import { HmisClientProfileType } from '../../../../apollo';
import { ClientProfileSectionEnum } from '../../../../screenRouting';
import { ClientViewTabEnum } from '../../../Client/ClientTabs';
import { InteractionLocations } from '../../../Client/Locations';
import { ClientInteractionsHmisView } from '../ClientInteractionsHmisView';
import { ClientProfileHMISView } from '../ClientProfileHMISView';

type RenderArgs = {
  client?: HmisClientProfileType;
  openCard?: ClientProfileSectionEnum | null;
};

const tabRendererMap: Partial<
  Record<ClientViewTabEnum, (args: RenderArgs) => ReactElement | null>
> = {
  [ClientViewTabEnum.Profile]: ({ client, openCard }) => (
    <ClientProfileHMISView client={client} openCard={openCard} />
  ),
  [ClientViewTabEnum.Interactions]: ({ client }) => (
    <ClientInteractionsHmisView client={client} />
  ),
  [ClientViewTabEnum.Locations]: ({ client }) => (
    <InteractionLocations clientProfileId={client?.id} />
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
