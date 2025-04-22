import { Colors } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { MainScrollContainer } from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';

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
          <TextBold>HELLO REDESIGN</TextBold>
        </View>
      </MainScrollContainer>
    );
  }
);

export default ClientProfile;
