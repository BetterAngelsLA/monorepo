import { MoodEnum } from '@monorepo/expo/betterangels';
import { IIconProps } from '@monorepo/expo/shared/icons';

import React, { ComponentType } from 'react';
import { View } from 'react-native';
import MoodCheckbox from './MoodCheckbox';

interface Mood {
  Icon: ComponentType<IIconProps>;
  title: string;
  enum: MoodEnum;
  id?: string;
  tab: 'pleasant' | 'neutral' | 'unpleasant';
}

interface MoodSelectorProps {
  moodsData: Mood[];
  noteId: string | undefined;
  tab: 'pleasant' | 'neutral' | 'unpleasant';
}

const MoodSelector: React.FC<MoodSelectorProps> = ({
  moodsData,
  noteId,
  tab,
}) => {
  return (
    <View>
      {moodsData.map((mood, idx) => (
        <MoodCheckbox
          tab={tab}
          noteId={noteId}
          idx={idx}
          key={mood.enum}
          mood={mood}
        />
      ))}
    </View>
  );
};

export default MoodSelector;
