import type { ReactElement } from 'react';
import { HmisClientProfileType } from '../../../../apollo';
import { ClientProfileSectionEnum } from '../../../../screenRouting';
import { ClientViewTabEnum } from '../../../Client/ClientTabs';
import { ClientDocsViewHmis } from '../ClientDocsViewHmis';
import { ClientInteractionsViewHmis } from '../ClientInteractionsViewHmis';
import { ClientLocationsViewHmis } from '../ClientLocationsViewHmis';
import { ClientProfileViewHmis } from '../ClientProfileViewHmis';
import { ClientTasksViewHmis } from '../ClientTasksViewHmis';

type RenderArgs = {
  client?: HmisClientProfileType;
  openCard?: ClientProfileSectionEnum | null;
};

const tabRendererMap: Partial<
  Record<ClientViewTabEnum, (args: RenderArgs) => ReactElement | null>
> = {
  [ClientViewTabEnum.Profile]: ({ client, openCard }) => (
    <ClientProfileViewHmis client={client} openCard={openCard} />
  ),
  [ClientViewTabEnum.Docs]: ({ client }) => (
    <ClientDocsViewHmis client={client} />
  ),
  [ClientViewTabEnum.Interactions]: ({ client }) => (
    <ClientInteractionsViewHmis client={client} />
  ),
  [ClientViewTabEnum.Locations]: ({ client }) => (
    <ClientLocationsViewHmis clientProfileId={client?.id} />
  ),
  [ClientViewTabEnum.Tasks]: ({ client }) => (
    <ClientTasksViewHmis client={client} />
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
