import { useQuery } from '@apollo/client/react';
import { SingleSelect } from '@monorepo/expo/shared/ui-components';
import { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import { useSnackbar } from '../../../hooks';
import { useUserOrganizationPreference } from '../../../state';
import { FilterOrganizationsDocument } from '../../Filters/FilterOrganizations/__generated__/filterOrganizations.generated';

type TProps = {
  style?: ViewStyle;
  disabled?: boolean;
};

export function UserOrganizationPreferenceSelect(props: TProps) {
  const { disabled, style } = props;
  const [organizationId, setOrganizationId] = useUserOrganizationPreference();
  const { showSnackbar } = useSnackbar();

  const { data } = useQuery(FilterOrganizationsDocument, {
    variables: { ordering: [{ name: 'ASC' as any }] },
  });

  const organizations = data?.caseworkerOrganizations?.results ?? [];

  // Auto-select if user belongs to exactly one organization
  useEffect(() => {
    if (!organizationId && organizations.length === 1) {
      setOrganizationId(organizations[0].id);
    }
  }, [organizationId, organizations, setOrganizationId]);

  const handleSelect = (newOrgId: string) => {
    setOrganizationId(newOrgId);
    const org = organizations.find((o) => o.id === newOrgId);
    showSnackbar({
      message: `Default organization saved: ${org?.name ?? 'None'}`,
      type: 'success',
    });
  };

  return (
    <View style={style}>
      <SingleSelect
        allowSelectNone={true}
        disabled={disabled}
        placeholder="Select organization"
        items={organizations.map((org) => ({
          value: org.id,
          displayValue: org.name,
        }))}
        selectedValue={organizationId ?? undefined}
        onChange={(value) => {
          handleSelect(value);
        }}
      />
    </View>
  );
}
