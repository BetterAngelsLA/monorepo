import { CheckIcon } from '@monorepo/expo/shared/icons';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Switch, View } from 'react-native';
import Section from '../Section';
import { ITab } from '../types';

export default function DriverLicense({
  setTab,
}: {
  setTab: (tab: ITab) => void;
}) {
  const [isCaLicense, setIsCaLicense] = useState(false);
  return (
    <Section
      title="Upload Driver's License"
      subtitle="You need to upload front and back of the license."
      onSubmit={() => console.log('submit')}
      setTab={setTab}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextRegular>Is this a CA Driver's License?</TextRegular>
        <View
          style={{
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Switch
            style={{ transform: [{ scaleX: 0.774 }, { scaleY: 0.774 }] }}
            value={isCaLicense}
            onChange={() => setIsCaLicense(!isCaLicense)}
          />
          <View style={{ position: 'absolute' }}>
            <CheckIcon />
          </View>
        </View>
      </View>
    </Section>
  );
}
