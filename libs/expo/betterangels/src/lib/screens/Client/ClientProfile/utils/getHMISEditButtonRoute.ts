import {
  ClientProfileSectionEnum,
  TStandardSection,
  getEditClientProfileRoute,
} from '../../../../screenRouting';

type TProps = {
  profileId: string;
  section: ClientProfileSectionEnum;
};

export function getHMISEditButtonRoute(props: TProps) {
  const { profileId, section } = props;

  return getEditClientProfileRoute({
    profileId,
    section: section as TStandardSection,
  });
}
