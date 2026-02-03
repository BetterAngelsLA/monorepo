import type { ReactElement } from 'react';
import { HmisClientProfileType } from '../../../../apollo';
import { ClientProfileSectionEnum } from '../../../../screenRouting';
import { ClientViewTabEnum } from '../../../Client/ClientTabs';
import { ClientDocsHmisView } from '../ClientDocsHmisView';
import { ClientInteractionsHmisView } from '../ClientInteractionsHmisView';
import { ClientLocationsHmisView } from '../ClientLocationsHmisView';
import { ClientProfileHMISView } from '../ClientProfileHMISView';
import { ClientTasksHMISView } from '../ClientTasksHMISView';

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
  [ClientViewTabEnum.Docs]: ({ client }) => (
    <ClientDocsHmisView client={client} />
  ),
  [ClientViewTabEnum.Interactions]: ({ client }) => (
    <ClientInteractionsHmisView client={client} />
  ),
  [ClientViewTabEnum.Locations]: ({ client }) => (
    <ClientLocationsHmisView clientProfileId={client?.id} />
  ),
  [ClientViewTabEnum.Tasks]: ({ client }) => (
    <ClientTasksHMISView client={client} />
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
