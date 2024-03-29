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
  setMoods: (
    e: {
      enum: MoodEnum;
      title: string;
    }[]
  ) => void;
  moods: {
    enum: MoodEnum;
    title: string;
  }[];
}

const MoodSelector: React.FC<MoodSelectorProps> = ({
  moodsData,
  noteId,
  tab,
  moods,
  setMoods,
}) => {
  return (
    <View>
      {moodsData.map((mood, idx) => (
        <MoodCheckbox
          moods={moods}
          setMoods={setMoods}
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
