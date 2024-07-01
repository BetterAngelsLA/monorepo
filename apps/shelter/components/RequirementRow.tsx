import React from 'react';
import { View } from './Themed';
import Requirement from './Requirement';

interface RequirementData {
  value: string;
  iconName?: string;
}

interface RequirementRowProps {
  requirementsData: RequirementData[];
  onSelectionChange: (value: string, selection: string) => void;
}

const RequirementRow = ({ requirementsData, onSelectionChange }: RequirementRowProps) => {
  return (
    <View>
      {requirementsData.map(requirement => (
        <Requirement 
          key={requirement.value} 
          value={requirement.value} 
          iconName={requirement.iconName}
          onSelect={onSelectionChange} 
        />
      ))}
    </View>
  );
};

export default RequirementRow;
