import { Colors } from '@monorepo/expo/shared/static';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { MainScrollContainer } from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import ContactInfo from './ContactInfo';
import DemographicInfo from './DemographicInfo';
import HouseholdMembers from './HouseholdMembers';
import PersonalInfo from './PersonalInfo';
import RelevantContacts from './RelevantContacts';

interface ProfileRef {
  scrollToRelevantContacts: () => void;
}

interface ProfileProps {
  client: ClientProfileQuery | undefined;
}

const Profile = forwardRef<ProfileRef, ProfileProps>(({ client }, ref) => {
  const [expanded, setExpanded] = useState<undefined | string | null>();
  const scrollRef = useRef<ScrollView>(null);
  const viewRef = useRef<View>(null);

  const scrollToView = async () => {
    await setExpanded('Relevant Contacts');
    setTimeout(() => {
      viewRef.current?.measureLayout(scrollRef.current as any, (x, y) => {
        scrollRef.current?.scrollTo({
          y: y,
          animated: true,
        });
      });
    }, 300);
  };

  useImperativeHandle(ref, () => ({
    scrollToRelevantContacts: scrollToView,
  }));

  const props = {
    client,
    expanded,
    setExpanded,
  };

  return (
    <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <PersonalInfo {...props} />
      <DemographicInfo {...props} />
      <ContactInfo {...props} />
      <RelevantContacts ref={viewRef} {...props} />
      <HouseholdMembers {...props} />
    </MainScrollContainer>
  );
});

export default Profile;
