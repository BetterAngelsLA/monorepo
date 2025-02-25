import { Colors } from '@monorepo/expo/shared/static';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { MainScrollContainer } from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import FullNameDetails from './ClientProfileSections/FullNameDetails';

interface ProfileRef {
  scrollToRelevantContacts: () => void;
}

interface ProfileProps {
  client: ClientProfileQuery | undefined;
}

const ClientProfile = forwardRef<ProfileRef, ProfileProps>(
  ({ client }, ref) => {
    const scrollRef = useRef<ScrollView>(null);
    const viewRef = useRef<View>(null);

    const scrollToView = async () => {
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

    return (
      <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <View>
          <FullNameDetails client={client} />
        </View>
      </MainScrollContainer>
    );
  }
);

export default ClientProfile;
