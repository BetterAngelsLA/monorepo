import { ClientProfileQuery } from '../__generated__/Client.generated';

export interface IProfileSectionProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  client: ClientProfileQuery | undefined;
}
