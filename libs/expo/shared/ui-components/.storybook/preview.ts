// .storybook/preview.ts

// Replace your-framework with the framework you are using (e.g., react, vue3)
import { Preview } from '@storybook/react';

// import './global.css';

// const style = document.createElement('style');
// style.innerHTML = `
//   @font-face {
//     font-family: 'Poppins';
//     src: url('../../../../assets/src/fonts/Poppins-Regular.ttf')
//       format('truetype');
//     font-weight: 400;
//     font-style: normal;
//   }

//   body {
//     font-family: 'Poppins', sans-serif;
//     font-size: 42px;
//   }
// `;
// document.head.appendChild(style);

const preview: Preview = {
  parameters: {
    layout: 'centered',
  },
};

export default preview;
