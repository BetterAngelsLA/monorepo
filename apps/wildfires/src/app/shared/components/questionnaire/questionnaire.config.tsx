import { TSurveyConfig } from './questionnaire.types';

export const config: TSurveyConfig = {
  questions: [
    {
      id: 'start',
      question: '1. First Question. Anwer Yes or No',
      type: 'radio',
      options: [
        {
          id: 'start-yes',
          label: 'Yes',
        },
        {
          id: 'start-no',
          label: 'No',
        },
      ],
      useNav: true,
      next: ['second'],
    },
    {
      id: 'second',
      question: '2. Should the next show 1 question or 2?',
      type: 'radio',
      options: [
        {
          id: 'one-question',
          label: 'only one',
        },
        {
          id: 'two-questions',
          label: 'two please',
        },
      ],
      useNav: true,
      next: {
        'one-question': ['single-2'],
        'two-questions': ['multi-1', 'multi-2'],
      },
    },
    {
      id: 'single-2',
      question: 'Single question',
      type: 'radio',
      options: [
        {
          id: 'yes',
          label: 'Yes',
        },
        {
          id: 'no',
          label: 'No',
        },
      ],
      useNav: true,
      next: ['second'],
    },
    {
      id: 'multi-1',
      question: 'Random question 1',
      type: 'radio',
      options: [
        {
          id: 'yes',
          label: 'Yes',
        },
        {
          id: 'no',
          label: 'No',
        },
      ],
      useNav: true,
      next: ['second'],
    },
    {
      id: 'multi-2',
      question: 'Random question 2',
      type: 'radio',
      options: [
        {
          id: 'yes',
          label: 'Yes',
        },
        {
          id: 'no',
          label: 'No',
        },
      ],
      useNav: true,
      next: ['second'],
    },

    // {
    //   id: 'below',
    //   question: '3. I am below the previous question',
    //   type: 'radio',
    //   options: [
    //     {
    //       id: 'below',
    //       label: 'Below pls',
    //     },
    //     {
    //       id: 'new-screen',
    //       label: 'New screen',
    //     },
    //   ],
    //   useNav: true,
    //   next: {
    //     below: 'below',
    //     ['new-screen']: 'new-screen',
    //   },
    // },
    // {
    //   id: 'separate',
    //   // showBelow: true,
    //   question: '3. No other questions visible.',
    //   type: 'radio',
    //   options: [
    //     {
    //       id: 'yes',
    //       label: 'Yes',
    //     },
    //     {
    //       id: 'no',
    //       label: 'No',
    //     },
    //   ],
    //   next: {
    //     yes: 'xxx -- partial loss claim guidance ---',
    //     no: 'xxx --- skip',
    //   },
    // },
    // {
    //   id: 'new-screen',
    //   question: '2BI am new-screen',
    //   type: 'radio',
    //   options: [
    //     {
    //       id: 'yes',
    //       label: 'Yes',
    //     },
    //     {
    //       id: 'no',
    //       label: 'No',
    //     },
    //   ],
    //   next: {
    //     yes: 'xxx -- partial loss claim guidance ---',
    //     no: 'xxx --- skip',
    //   },
    // },
  ],
};

// export const config: TSurveyConfig = {
//   questions: [
//     {
//       id: 'fireName',
//       question: 'Which wildfire impacted you?',
//       type: 'radio',
//       options: ['Palisades', 'Eaton', 'Both'],
//       next: 'mainImpactType',
//     },
//     {
//       id: 'mainImpactType',
//       question: 'Did the wildfire impact your',
//       type: 'radio',
//       options: ['Home', 'Income', 'Business'],
//       next: {
//         Home: 'homeRentOrOwn',
//         Income: 'incomeLost',
//         Business: 'ownSmallBusiness',
//       },
//     },
//     {
//       id: 'homeRentOrOwn',
//       question: 'Do you rent or own your home/apartment/condo?',
//       type: 'radio',
//       options: ['rent', 'own'],
//       next: {
//         rent: 'renterInsurance',
//         own: 'homeTotalLoss',
//       },
//     },
//     {
//       id: 'renterInsurance',
//       question: "Do you have renter's insurance?",
//       type: 'radio',
//       options: ['Yes', 'No'],
//       next: {
//         Yes: {
//           next: 'hello',
//           // children: <div>hello div</div>,
//         },
//         No: 'no no no',
//       },
//     },
//     {
//       id: 'ownSmallBusiness',
//       question: 'Do you own a small business that was lost or impacted?',
//       type: 'radio',
//       options: ['yes', 'no'],
//       next: {
//         yes: 'xxx -- display resources ---',
//         no: 'xxx skip',
//       },
//     },
//     {
//       id: 'incomeLost',
//       question: 'Have you lost income or wages?',
//       type: 'radio',
//       options: ['yes', 'no'],
//       next: {
//         yes: 'incomeTypeLost',
//         no: 'xxx --- skip',
//       },
//     },
//     {
//       id: 'incomeTypeLost',
//       question: 'What type of income was lost?',
//       type: 'radio',
//       options: ['job', 'self-employment', 'gig work'],
//       next: {
//         job: 'xxx -- link to EDD ---',
//         'self-employment': 'xxx -- other LINKS ---',
//         'gig work': 'xxx -- other LINKS ---',
//       },
//     },
//     {
//       id: 'homeTotalLoss',
//       question: 'Was your home a total loss?',
//       type: 'radio',
//       options: ['Yes', 'No'],
//       next: {
//         yes: 'homeownerInsurance',
//         no: 'partialHomeDamage',
//       },
//     },
//     {
//       id: 'homeownerInsurance',
//       question: 'Do you have homeowner insurance?',
//       type: 'radio',
//       options: ['Yes', 'No'],
//       next: {
//         yes: 'xxx -- insurance claim guidance ---',
//         no: 'xxx --- fema links',
//       },
//     },
//     {
//       id: 'partialHomeDamage',
//       question: 'Do you have homeowner insurance?',
//       type: 'radio',
//       options: ['Yes', 'No'],
//       next: {
//         yes: 'xxx -- partial loss claim guidance ---',
//         no: 'xxx --- skip',
//       },
//     },
//   ],
// };
