export default { title: 'Disabled until Expo storybook fixed' };
export const Placeholder = () => null;

// import { Spacings } from '@monorepo/expo/shared/static';
// import { ComponentMeta, ComponentStory } from '@storybook/react-native';
// import { useState } from 'react';
// import { View } from 'react-native';
// import { BasicTextarea } from './BasicTextarea';

// const BasicTextareaMeta: ComponentMeta<typeof BasicTextarea> = {
//   title: 'BasicTextarea',
//   component: BasicTextarea,
//   decorators: [
//     (Story) => {
//       return (
//         <View style={{ padding: Spacings.sm }}>
//           <View style={{ padding: Spacings.sm }}>
//             <Story />
//           </View>
//         </View>
//       );
//     },
//   ],
// };

// export default BasicTextareaMeta;

// type BasicTextareaStory = ComponentStory<typeof BasicTextarea>;

// export const Basic: BasicTextareaStory = () => {
//   const [value, setValue] = useState('');
//   return (
//     <BasicTextarea
//       label="Test"
//       height={56}
//       value={value}
//       onChangeText={setValue}
//     />
//   );
// };
