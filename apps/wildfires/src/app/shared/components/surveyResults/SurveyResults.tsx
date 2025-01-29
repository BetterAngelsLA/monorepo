import { surveyConfig } from '../../../pages/introduction/firesSurvey/config/config';
import { TResource } from '../../clients/sanityCms/types';
import { mergeCss } from '../../utils/styles/mergeCss';
import { TAnswer, TOption, TSurveyResults } from '../survey/types';
import { getAllQuestions } from '../survey/utils/validateConfig';
import { SurveyResources } from '../surveyResources/SurveyResources';

const savedResources: TResource[] = [
  {
    title: 'Resources to help your business',
    slug: 'resources-to-help-your-business',
    resourceType: 'resource',
    resourceLink:
      'https://ewdd.lacity.gov/index.php/2025-los-angeles-wild-fires-resources',
    tipsDescription: [
      {
        markDefs: [
          {
            _key: '39ebba651a94',
            _type: 'link',
            href: 'https://docs.google.com/forms/d/e/1FAIpQLSejjhsy6xYTX_VGjEpYApTIvji9RhB8aqHJ9vWproXcie570w/viewform',
          },
        ],
        children: [
          {
            marks: [],
            text: 'If your business has been impacted by the LA wildfires, please complete the ',
            _key: 'cd2a6109d94f',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: ['strong', '39ebba651a94'],
            text: 'LA Region Wildfires Business Impact Survey',
            _key: '90aa7e8f03de',
          },
          {
            _key: '8bc870ad13e8',
            _type: 'span',
            marks: [],
            text: '. The survey aims to track, monitor, and quantify business losses in the LA region. The aggregated data will be shared with federal and state agencies to advocate for additional support for the affected business community.',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '93266113d284',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'For additional resources, visit the resource link.',
            _key: '1b19663d4d0a',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '1d563db032d4',
      },
    ],
    shortDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: 'c0ceaf37f830',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'The ',
            _key: '3c9128fb7a2b',
          },
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: "City of Los Angeles' Economic & Workforce Development Department ",
            _key: '633bdf3757b6',
          },
          {
            marks: [],
            text: 'provides business assistance and information for businesses and workers to support recovery, avoid layoffs and navigate loans and grants.',
            _key: '85ba0b320617',
            _type: 'span',
          },
        ],
      },
    ],
    priority: 2,
    tags: [
      {
        slug: 'general-business-resources',
        label: 'General - Business Resources',
        category: {
          slug: 'seek-business-assistance',
          name: 'Seek Business Assistance',
          priority: 6,
        },
      },
    ],
  },
  {
    title: 'Free Food and Meals Near You',
    slug: 'free-food-and-meals-near-you',
    resourceType: 'resource',
    resourceLink:
      'https://docs.google.com/document/d/1uDvWhGvPS5rtJh9XtR5Z94IkoTw21DaEc1MXaNqCLlc/edit?tab=t.uctg61pvz2j5',
    tipsDescription: null,
    shortDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: '31591594be9f',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'List of current organizations giving out food or providing hot meals.',
            _key: 'a24e89791d93',
          },
        ],
      },
    ],
    priority: 4,
    tags: [
      {
        slug: 'general-food',
        label: 'General - Food',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: 'Wildfire Pet Resources',
    slug: 'wildfire-pet-resources',
    resourceType: 'resource',
    resourceLink: 'https://www.imaginela.org/wildfirepetresources',
    tipsDescription: null,
    shortDescription: [
      {
        children: [
          {
            text: 'A current list of wildfire-related pet resources such as finding a lost pet, shelters, pantries, and fostering.',
            _key: '5a94cd16f685',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '032f9a80c195',
        markDefs: [],
      },
    ],
    priority: 3,
    tags: [
      {
        slug: 'general-pet',
        label: 'General - Pet',
        category: {
          slug: 'utilize-these-other-resources',
          name: 'Utilize These Other Resources',
          priority: 99,
        },
      },
    ],
  },
  {
    title: 'Health & Mental Health',
    slug: 'health-and-mental-health',
    resourceType: 'resource',
    resourceLink: 'https://www.imaginela.org/health-and-mentalhealth',
    tipsDescription: null,
    shortDescription: [
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Disaster-related Health & Mental Health Resource – A current list of Wildfire related Health & Mental Health Resources.',
            _key: '7d71decdeea4',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'ddde36823d83',
      },
    ],
    priority: 2,
    tags: [
      {
        slug: 'general-health',
        label: 'General - Health',
        category: {
          slug: 'utilize-these-other-resources',
          name: 'Utilize These Other Resources',
          priority: 99,
        },
      },
    ],
  },
  {
    title: 'Emergency Cash From Charities',
    slug: 'emergency-cash-from-charities',
    resourceType: 'resource',
    resourceLink: 'https://www.imaginela.org/cash-assistance',
    tipsDescription: [
      {
        _type: 'block',
        style: 'h4',
        _key: 'a4c52bbdee00',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Eligibility Criteria',
            _key: 'd1a021f687df',
          },
        ],
      },
      {
        _type: 'block',
        style: 'normal',
        _key: 'a1a0733c693e',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Eligibility criteria and required information may vary by charity. Please refer to the "Who They Help" column on the resource link for specific details on which organizations will serve you best.',
            _key: 'f0ebbf0712d7',
          },
        ],
      },
    ],
    shortDescription: [
      {
        _key: 'b1859e08aaaa',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'Various Local Charities',
            _key: '0930c09db5f4',
          },
          {
            text: ' are providing one time cash assistance for low-income housholds to help with immediate needs. Each organization has different requirements and may be able to help with rent, bills, food, or other urgent expenses.',
            _key: 'd9118230cf77',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
        style: 'normal',
      },
    ],
    priority: 1,
    tags: [
      {
        slug: 'income-low-income',
        label: 'Income - Low Income',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: 'Temporary Housing Resources',
    slug: 'temporary-housing-resources',
    resourceType: 'resource',
    resourceLink: 'https://www.imaginela.org/temporaryhousingresources',
    tipsDescription: null,
    shortDescription: [
      {
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'List of current Temporary Housing Resources including 211 hotel vouchers, AirB&B and other government resources',
            _key: '817ac8b7719b',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'af5af939935c',
        markDefs: [],
      },
    ],
    priority: 1,
    tags: [
      {
        slug: 'housing-temporary-housing',
        label: 'Housing - Temporary Housing',
        category: {
          slug: 'secure-housing',
          name: 'Secure Housing',
          priority: 4,
        },
      },
    ],
  },
  {
    title: 'Better Angels STEP Fund',
    slug: 'better-angels-step-fund',
    resourceType: 'resource',
    resourceLink: 'https://www.thestepfund.org/',
    tipsDescription: null,
    shortDescription: [
      {
        style: 'normal',
        _key: 'eb772fdf7c31',
        markDefs: [],
        children: [
          {
            _key: '01a793f717db',
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'Better Angels',
          },
          {
            marks: [],
            text: ' offers interest-free loans to low-income residents of LA County who are facing eviction in the next 30 days due to a recent financial problem, and who demonstrate future ability to repay their loan. Fill out a simple online application at the resource link, and complete a verification call with a friendly member of our team –the team aims to notify loans within 7 days.',
            _key: 'cdaf3a2d9627',
            _type: 'span',
          },
        ],
        _type: 'block',
      },
    ],
    priority: 2,
    tags: [
      {
        slug: 'income-job-loss',
        label: 'Income - Job Loss',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
      {
        slug: 'income-self-employed-freelance',
        label: 'Income - Self-Employed/Freelance',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: 'FEMA & INSURANCE TIP',
    slug: 'fema-and-insurance-tip',
    resourceType: 'alert',
    resourceLink: null,
    tipsDescription: null,
    shortDescription: [
      {
        children: [
          {
            text: 'If you have insurance, please file a claim with your insurance provider as soon as possible. You do not have to file your claim prior to applying for FEMA disaster assistance, but you will be required to provide FEMA your insurance settlement or denial before being considered for certain types of assistance.\n',
            _key: 'c9c79ad83063',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'ada451d959d8',
        markDefs: [],
      },
    ],
    priority: 3,
    tags: [
      {
        slug: 'housing-owner-with-insurance',
        label: 'Housing - Owner with Insurance',
        category: {
          slug: 'file-insurance-claims',
          name: 'File Insurance Claims',
          priority: 3,
        },
      },
      {
        slug: 'housing-renter-with-insurance',
        label: 'Housing - Renter with Insurance',
        category: {
          slug: 'file-insurance-claims',
          name: 'File Insurance Claims',
          priority: 3,
        },
      },
    ],
  },
  {
    title: 'Clothing & Essential Items from City of LA District 11',
    slug: 'clothing-and-essential-items-from-city-of-la-district-11',
    resourceType: 'resource',
    resourceLink: 'https://lacity.gov/directory/councilmember-district-11',
    tipsDescription: [
      {
        markDefs: [
          {
            _type: 'link',
            href: 'tel:+1311',
            _key: '627203578a9c',
          },
          {
            _type: 'link',
            href: 'tel:+12134733231',
            _key: 'e8070a3948a8',
          },
        ],
        children: [
          {
            marks: ['strong'],
            text: 'Contact',
            _key: '61e5024cc1aa',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Call ',
            _key: 'b40187f818ce',
          },
          {
            _type: 'span',
            marks: ['strong', '627203578a9c'],
            text: '311',
            _key: '33df0582eafc',
          },
          {
            _type: 'span',
            marks: [],
            text: ' or ',
            _key: '2ab02cacf88a',
          },
          {
            _type: 'span',
            marks: ['strong', 'e8070a3948a8'],
            text: '(213) 473-3231',
            _key: '3d72ccbe090f',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '31b4d8455aa7',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '42121aa5da6b',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Available Donations',
            _key: '6c1f5c4ae6ce',
          },
          {
            _key: '85c3ff33fee9',
            _type: 'span',
            marks: [],
            text: ':',
          },
        ],
      },
      {
        style: 'normal',
        _key: '6ff90e07fcc9',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Water',
            _key: 'dbcfd0c447c5',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        _key: 'ab00a3f6a775',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Essential items',
            _key: 'a11c201309e5',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: 'df7af3700b6d',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Clothing',
            _key: '8de2313922de',
          },
        ],
        level: 1,
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Toiletries',
            _key: '125251b47f99',
            _type: 'span',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '32d84a42f214',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '48c4d043d163',
        markDefs: [],
        children: [
          {
            text: 'For more information, visit the website or call the provided numbers to access resources and support.',
            _key: 'abadf318aaf7',
            _type: 'span',
            marks: [],
          },
        ],
      },
    ],
    shortDescription: [
      {
        children: [
          {
            _key: 'd837dbc38e94',
            _type: 'span',
            marks: [],
            text: 'The ',
          },
          {
            text: 'City of Los Angeles District 11',
            _key: 'fb5b3cc172dd',
            _type: 'span',
            marks: ['em', 'strong'],
          },
          {
            _type: 'span',
            marks: [],
            text: ' is offering donations of water, essential items, clothing, and toiletries to individuals affected by the recent wildfires.',
            _key: '5c2a728bb39c',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '33591990137d',
        markDefs: [],
      },
    ],
    priority: 2,
    tags: [
      {
        slug: 'general-childcare',
        label: 'General - Childcare',
        category: {
          slug: 'utilize-these-other-resources',
          name: 'Utilize These Other Resources',
          priority: 99,
        },
      },
    ],
  },
  {
    title: 'Help Finding Missing Persons',
    slug: 'help-finding-missing-persons',
    resourceType: 'resource',
    resourceLink:
      'https://www.redcross.org/get-help/disaster-relief-and-recovery-services/contact-and-locate-loved-ones/california-wildfires-reunification.html',
    tipsDescription: [
      {
        style: 'h4',
        _key: '16517c2d2497',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Application Submission and Requirements',
            _key: 'ac529fad4379',
          },
        ],
        _type: 'block',
      },
      {
        _key: '6e4038a58b7d',
        markDefs: [],
        children: [
          {
            text: 'Applications',
            _key: '60d2613d7bef',
            _type: 'span',
            marks: ['strong'],
          },
          {
            _type: 'span',
            marks: [],
            text: ' must be submitted via the ',
            _key: '4ab71d9dab5a',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'in-site messaging service',
            _key: '3299ed2bfc11',
          },
          {
            marks: [],
            text: '.',
            _key: 'efcd86b58402',
            _type: 'span',
          },
        ],
        _type: 'block',
        style: 'normal',
      },
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Information Required',
            _key: '21b959f18348',
          },
        ],
        _type: 'block',
        style: 'h5',
        _key: '6b0ef09b4c16',
        markDefs: [],
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Applicants must provide the following details:',
            _key: '3a4476ec6813',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '7d6633dd15b7',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '316c6cfd108b',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            text: 'Name',
            _key: 'f83a2df1e94a',
            _type: 'span',
            marks: [],
          },
        ],
      },
      {
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Organization Title',
            _key: '8bda0c5a310f',
            _type: 'span',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'a33cd46d9411',
        listItem: 'bullet',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '51e0906bb903',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Organization',
            _key: 'f4d93e04113b',
          },
        ],
        level: 1,
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '1dbcc7001cc5',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '6adcfe2e48a6',
            _type: 'span',
            marks: [],
            text: 'Year Organization Established',
          },
        ],
        level: 1,
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Business Address',
            _key: 'f1a6cef91bab',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'e58cb7ecdf7e',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '890f690840b3',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            text: 'Email',
            _key: '0cff56efab71',
            _type: 'span',
            marks: [],
          },
        ],
        level: 1,
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '465c7865c384',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Phone Number',
            _key: 'a78138f55e43',
            _type: 'span',
          },
        ],
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '235d33553d23',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Business Type',
            _key: '9cc3ecf93c25',
          },
        ],
      },
      {
        children: [
          {
            text: 'Number of Employees',
            _key: '50497a963889',
            _type: 'span',
            marks: [],
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'f1d38d19f037',
        listItem: 'bullet',
        markDefs: [],
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Note',
            _key: '7ab8938b00c7',
          },
          {
            _type: 'span',
            marks: [],
            text: ': No documents are required. However, applicants must specify the areas in which they or their business are requesting assistance.',
            _key: '58e8cea484a9',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '25e2449d88d5',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Available Resources',
            _key: 'bd76e89c6623',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: '2eda05e64bba',
      },
      {
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Applicants may select up to ',
            _key: '0a51a86a9855',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'two',
            _key: '3e5b6f0d5dc2',
          },
          {
            _type: 'span',
            marks: [],
            text: ' of the following resources:',
            _key: '5fe45637c8ab',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'e9e54b6f61a4',
        markDefs: [],
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '80b41e76bbf7',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Assistance Accessing Procurement Opportunities',
            _key: 'a45d79817e6c',
          },
        ],
        level: 1,
      },
      {
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Access to Capital',
            _key: 'cb7456730a1b',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '3b0061f81edc',
        listItem: 'bullet',
        markDefs: [],
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Assistance with Cost Containment',
            _key: '8401a87f6348',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '187e1da5a7ce',
        listItem: 'bullet',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '40af5eca4629',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Assistance with Tax Credits and Incentives',
            _key: '23954a30cbe9',
          },
        ],
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Assistance with Workforce Development',
            _key: '4d5e0f3ca595',
            _type: 'span',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'c948a6b0e469',
      },
      {
        style: 'normal',
        _key: '07d80c89a818',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Business Attraction, Retention, or Expansion',
            _key: 'c11839ba9563',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '0bf268b72d98',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Business Resilience Resources',
            _key: 'af8a15ad6da0',
          },
        ],
        level: 1,
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'COVID Business Recovery Resources',
            _key: 'c2ffd751ba8d',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '86cc8c60e5fa',
        listItem: 'bullet',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '43b74ebb2de9',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Connection with Regional Economic Development Corporations (EDCs)',
            _key: '74d373936b78',
          },
        ],
        level: 1,
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Connection to City Staff (all cities in Los Angeles County)',
            _key: '66de30c71201',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'bf30fd74b1a5',
      },
      {
        markDefs: [],
        children: [
          {
            _key: '87889b41d3ae',
            _type: 'span',
            marks: [],
            text: 'International Connections',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '03cb4167ce47',
        listItem: 'bullet',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Marketing Strategy Consulting',
            _key: '5316df052812',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'b946453c1744',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Permit Assistance',
            _key: 'c9fa6c53e18d',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'a2034074f0fd',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Strategic Consulting',
            _key: '1506a5360d3b',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '3dce42e0c9d3',
      },
      {
        style: 'normal',
        _key: '8ddd2cb8a9ae',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Utility Rate Reduction',
            _key: '9b1a3bcb87db',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Webinars',
            _key: '7c6cc99ab3da',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'f8f8bd659f8d',
        listItem: 'bullet',
      },
    ],
    shortDescription: [
      {
        _key: 'ada451d959d8',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'The ',
            _key: '60f0778019830',
          },
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'Red Cross',
            _key: 'ab0278d8a3f2',
          },
          {
            _key: '72eba4bae80a',
            _type: 'span',
            marks: [],
            text: ' provides Reunification Support to help find Friends and Family after the California Wildfires.',
          },
        ],
        _type: 'block',
        style: 'normal',
      },
    ],
    priority: 4,
    tags: [
      {
        slug: 'general-reunification',
        label: 'General - Reunification',
        category: {
          slug: 'utilize-these-other-resources',
          name: 'Utilize These Other Resources',
          priority: 99,
        },
      },
    ],
  },
  {
    title: 'Personal Income Tax Relief',
    slug: 'personal-income-tax-relief',
    resourceType: 'resource',
    resourceLink:
      'https://www.ftb.ca.gov/file/when-to-file/los-angeles-county-fires.html',
    tipsDescription: [
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'State Taxes',
            _key: 'f0ab7784edb6',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: 'b3e19eeaa81e',
        markDefs: [],
      },
      {
        style: 'normal',
        _key: '685aab4792b5',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            text: 'Tip',
            _key: '14356cf8f305',
            _type: 'span',
            marks: ['strong'],
          },
          {
            _type: 'span',
            marks: [],
            text: ': The CA Franchise Tax Board (FTB) provides disaster-related personal income tax relief and filing extensions.',
            _key: '331ead9b1aa4',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        _key: 'ae5b9ce6464c',
        listItem: 'bullet',
        markDefs: [
          {
            _type: 'link',
            href: 'https://www.ftb.ca.gov/file/when-to-file/los-angeles-county-fires.html',
            _key: '5649bd52ec4d',
          },
        ],
        children: [
          {
            marks: ['strong'],
            text: 'Resource Link',
            _key: 'f8106eef1aff',
            _type: 'span',
          },
          {
            text: ': ',
            _key: 'efb5f428a250',
            _type: 'span',
            marks: [],
          },
          {
            text: 'State of CA Franchise Tax Board Website',
            _key: '6c7a96c89e18',
            _type: 'span',
            marks: ['5649bd52ec4d'],
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        markDefs: [],
        children: [
          {
            _key: 'f51ec6b6752a',
            _type: 'span',
            marks: ['strong'],
            text: 'Federal Taxes',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: '900e2cef8a1e',
      },
      {
        _key: 'd6c4c2a94495',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Tip',
            _key: '1e54c7c06f0a',
          },
          {
            _type: 'span',
            marks: [],
            text: ': IRS: California wildfire victims qualify for tax relief; various deadlines are postponed to October 15.',
            _key: '4511db67245c',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '12daa6e43295',
        listItem: 'bullet',
        markDefs: [
          {
            _type: 'link',
            href: 'https://www.irs.gov/newsroom/irs-california-wildfire-victims-qualify-for-tax-relief-various-deadlines-postponed-to-oct-15',
            _key: '5fbca241d981',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Resource Link',
            _key: '46ed516be40d',
          },
          {
            _type: 'span',
            marks: [],
            text: ': ',
            _key: '7a0cbbaddc3f',
          },
          {
            text: 'IRS Website',
            _key: '576216c434ea',
            _type: 'span',
            marks: ['5fbca241d981'],
          },
        ],
        level: 1,
      },
    ],
    shortDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: '990ee7a44895',
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'The ',
            _key: 'c3d6cc9776130',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'CA Franchise Tax Board (FTB)',
            _key: '059a6fa63f8c',
          },
          {
            _key: '8fab1e2ce53d',
            _type: 'span',
            marks: [],
            text: ' provides disaster related personal income tax relief and filing extensions.',
          },
        ],
      },
    ],
    priority: 7,
    tags: [
      {
        slug: 'general-financial-assistance',
        label: 'General - Financial Assistance',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: 'Replace Passport',
    slug: 'replace-passport',
    resourceType: 'resource',
    resourceLink:
      'https://travel.state.gov/content/travel/en/passports/have-passport.html',
    tipsDescription: [
      {
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'To replace a lost or stolen passport, you must first report it as lost or stolen. This can be done using an ',
            _key: '42b83d379aa7',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'online form',
            _key: '54d3e030579e',
          },
          {
            _type: 'span',
            marks: [],
            text: ' provided by the ',
            _key: '77483d2e1ad5',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Department of State',
            _key: '849541907277',
          },
          {
            _key: 'f930662f8126',
            _type: 'span',
            marks: [],
            text: '.',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'f99e6ce4ffd0',
        markDefs: [],
      },
      {
        markDefs: [],
        children: [
          {
            text: 'Information Needed',
            _key: '79fd79c09d02',
            _type: 'span',
            marks: ['strong'],
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: 'f90dc6159f0d',
      },
      {
        style: 'normal',
        _key: '30523a4b6621',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Be sure to carefully follow the provided instructions and have the following details ready:',
            _key: '7c6b8b8a1768',
          },
        ],
        _type: 'block',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'e99e8e46a9b3',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Full Name',
            _key: '18cbc97a7d0a',
            _type: 'span',
          },
        ],
      },
      {
        _key: 'ecb7c4de1878',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Date of Birth (D.O.B.)',
            _key: 'df22c8a6ca6a',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'ada9ea30e4ff',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: 'b91f9925eadb',
            _type: 'span',
            marks: [],
            text: 'Social Security Number',
          },
        ],
      },
      {
        style: 'normal',
        _key: 'bc27b98cce12',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: 'f36eb8fb946e',
            _type: 'span',
            marks: [],
            text: 'Height',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Occupation',
            _key: '8e231ddd58c7',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '5c76ffd686d8',
        listItem: 'bullet',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '00dca1a1bc6c',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Address',
            _key: '7448f7b4a7ed',
          },
        ],
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '30b5c992c932',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Passport Number and Date Issued (',
            _key: 'e7504a6ec1ba',
          },
          {
            marks: ['em'],
            text: 'You can leave this blank if unknown',
            _key: 'cec661a65b32',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ').',
            _key: 'bfa4a5e3be30',
          },
        ],
        level: 1,
      },
      {
        markDefs: [],
        children: [
          {
            marks: ['strong'],
            text: 'Form Generation and Submission',
            _key: '39632de7fa61',
            _type: 'span',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: 'bfaa31aad106',
      },
      {
        _key: '5e2104e6be57',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'The form filler will generate ',
            _key: '3dd5894d57e2',
          },
          {
            marks: ['strong'],
            text: 'DS-64',
            _key: '125e37ce37e1',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ' and ',
            _key: 'ce908c40d4c7',
          },
          {
            marks: ['strong'],
            text: 'DS-11',
            _key: '142fdac27902',
            _type: 'span',
          },
          {
            marks: [],
            text: ' forms for you.',
            _key: '229bdd064dfa',
            _type: 'span',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        style: 'normal',
        _key: '02f908df576d',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Submission Requirements',
            _key: '36c5ee37430d',
          },
          {
            marks: [],
            text: ':',
            _key: '226d78c0ba9a',
            _type: 'span',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        markDefs: [],
        children: [
          {
            _key: '18360df792e1',
            _type: 'span',
            marks: [],
            text: 'DS-64: ',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Print out and mail',
            _key: 'fb2ee5f2563c',
          },
          {
            _type: 'span',
            marks: [],
            text: ' this form to the government.',
            _key: 'fb0d199a8e06',
          },
        ],
        level: 2,
        _type: 'block',
        style: 'normal',
        _key: 'bfcd6e360c8b',
        listItem: 'bullet',
      },
      {
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'DS-11: ',
            _key: '3026701f4c76',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Appear in person',
            _key: 'ffd617c95f81',
          },
          {
            marks: [],
            text: ' to sign and submit this form.',
            _key: '143f105fd0ac',
            _type: 'span',
          },
        ],
        level: 2,
        _type: 'block',
        style: 'normal',
        _key: '2f21e5d83218',
        listItem: 'bullet',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '0f558aa86839',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: ['strong'],
            text: 'Processing Time:',
            _key: '8a7992fefa2a',
            _type: 'span',
          },
        ],
        level: 1,
      },
      {
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Processing times typically range from ',
            _key: '816f29ddc725',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: '4-6 weeks',
            _key: '456a423ec0c9',
          },
          {
            _key: '12cb1aebc185',
            _type: 'span',
            marks: [],
            text: ', but delays may occur depending on circumstances.',
          },
        ],
        level: 2,
        _type: 'block',
        style: 'normal',
        _key: '91e24b476105',
        listItem: 'bullet',
        markDefs: [],
      },
    ],
    shortDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: '880595cef547',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'The',
            _key: '29c05fdfe053',
          },
          {
            _type: 'span',
            marks: ['em'],
            text: ' ',
            _key: '327a5d43bfd5',
          },
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'US Department of State',
            _key: '1dea1e2c27c1',
          },
          {
            _type: 'span',
            marks: [],
            text: ' will replace your passport if it was lost in the fire.',
            _key: '612afd155c28',
          },
        ],
      },
    ],
    priority: 4,
    tags: [
      {
        slug: 'document-replacement-passport',
        label: 'Document Replacement - Passport',
        category: {
          slug: 'replace-documents',
          name: 'Replace Documents',
          priority: 1,
        },
      },
    ],
  },
  {
    title: 'Loans to repair or replace property',
    slug: 'loans-to-repair-or-replace-property',
    resourceType: 'resource',
    resourceLink:
      'https://www.sba.gov/funding-programs/disaster-assistance/physical-damage-loans',
    tipsDescription: [
      {
        style: 'h4',
        _key: 'b9ede2c874bd',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Loan Eligibility',
            _key: '65fa06b84111',
          },
        ],
        _type: 'block',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'e3e113490ceb',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Homeowners',
            _key: '672a14935798',
          },
          {
            _type: 'span',
            marks: [],
            text: ': May apply for up to ',
            _key: 'fcdda0b2c345',
          },
          {
            marks: ['strong'],
            text: '$500,000',
            _key: 'a0dcccb74f55',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ' to replace or repair their primary residence.',
            _key: '445ac90d7f47',
          },
        ],
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Renters and Homeowners',
            _key: '39c0aa2b83e6',
          },
          {
            _key: '14216db303e4',
            _type: 'span',
            marks: [],
            text: ': May borrow up to ',
          },
          {
            marks: ['strong'],
            text: '$100,000',
            _key: 'e601504f967e',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ' to replace or repair personal property (e.g., clothing, furniture, cars, and appliances) damaged or destroyed in a disaster.',
            _key: 'f5f8c7369535',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'c144e4eaadc2',
        listItem: 'bullet',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Secondary Homes or Vacation Properties',
            _key: 'fe50e231b372',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Not eligible for these loans. However, qualified ',
            _key: 'd33ca2f26487',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'rental properties',
            _key: '1d85463551f1',
          },
          {
            _type: 'span',
            marks: [],
            text: " may be eligible under SBA's business physical disaster loan program.",
            _key: 'd09b98dbf228',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '7185dd94dd8d',
        listItem: 'bullet',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '1768469bfdc8',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Insurance Consideration',
            _key: 'cfdf020edb93',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Loans cover disaster losses not fully covered by insurance or other sources. Insurance proceeds may be deducted from the eligible loan amount.',
            _key: '91e6659d8a24',
          },
        ],
        level: 1,
      },
      {
        markDefs: [],
        children: [
          {
            _key: '03050c35145e',
            _type: 'span',
            marks: ['strong'],
            text: 'Use of Proceeds',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: '3b799937b4c4',
      },
      {
        markDefs: [],
        children: [
          {
            _key: 'f99636aff021',
            _type: 'span',
            marks: ['strong'],
            text: 'Prohibited Use',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Funds cannot be used to upgrade homes or make additions unless required by local building codes.',
            _key: '87e888f1bb96',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '396fa454026a',
        listItem: 'bullet',
      },
      {
        _key: 'ca5cc1c97646',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Risk Mitigation Improvements',
            _key: '3d0362a86606',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Eligible for up to a ',
            _key: '9ef6fafe82d7',
          },
          {
            text: '20% increase',
            _key: '83ff517e08e4',
            _type: 'span',
            marks: ['strong'],
          },
          {
            _type: 'span',
            marks: [],
            text: ' above verified real estate damage for improvements to prevent future property damage.',
            _key: 'a238c361ae21',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Mortgage Refinancing',
            _key: '34218457bea4',
          },
          {
            _type: 'span',
            marks: [],
            text: ': SBA may refinance all or part of a previous mortgage if the applicant lacks credit elsewhere and has suffered substantial disaster damage.',
            _key: '6a2f28284a59',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '22dd7cb6cad8',
        listItem: 'bullet',
        markDefs: [],
      },
      {
        style: 'h4',
        _key: 'ec1542e3129a',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Loan Terms',
            _key: '70b86b378944',
          },
        ],
        _type: 'block',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '3229ff75560e',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            text: 'First Payment',
            _key: '9b07cc5cf1a7',
            _type: 'span',
            marks: ['strong'],
          },
          {
            _type: 'span',
            marks: [],
            text: ': Deferred for ',
            _key: 'e37a37781a19',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: '12 months',
            _key: 'bac709662246',
          },
          {
            marks: [],
            text: '.',
            _key: '351db88a78de',
            _type: 'span',
          },
        ],
        level: 1,
      },
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Interest',
            _key: '312208979574',
          },
          {
            marks: [],
            text: ': No accrual for the first 12 months.',
            _key: 'f1be529a76c0',
            _type: 'span',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '88921895a702',
        listItem: 'bullet',
        markDefs: [],
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Interest Rates',
            _key: 'a17f461780da',
          },
          {
            _type: 'span',
            marks: [],
            text: ' (for applicants unable to obtain credit elsewhere):',
            _key: '562262bd1158',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '963247504fd6',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Will not exceed ',
            _key: '2d34bbfcbff3',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: '4%',
            _key: '91da9034d7db',
          },
          {
            _type: 'span',
            marks: [],
            text: '.',
            _key: '63d9346cca94',
          },
        ],
        level: 2,
        _type: 'block',
        style: 'normal',
        _key: '6638df6fa320',
      },
      {
        _key: '3806528a236c',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '4a82cec5e4ec',
            _type: 'span',
            marks: [],
            text: 'SBA determines credit availability.',
          },
        ],
        level: 2,
        _type: 'block',
        style: 'normal',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Maturity',
            _key: '7aebaef81fe5',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: '051a160db3af',
      },
      {
        _key: '891921b4c95c',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '376d7056e6d9',
            _type: 'span',
            marks: [],
            text: 'Loans may have a term of up to ',
          },
          {
            text: '30 years',
            _key: 'f8754b6c4e71',
            _type: 'span',
            marks: ['strong'],
          },
          {
            text: '.',
            _key: 'a04d0c12d0bf',
            _type: 'span',
            marks: [],
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: 'dc88410f5877',
            _type: 'span',
            marks: [],
            text: 'No prepayment penalties or fees.',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'dfbcfc9212f5',
      },
      {
        _key: '26f70d0c8fa7',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Collateral Requirements',
            _key: '350db6a16ac8',
          },
        ],
        _type: 'block',
        style: 'h4',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            text: 'Collateral is required for:',
            _key: 'c671d395ea1e',
            _type: 'span',
            marks: [],
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'f7b4b55608f9',
      },
      {
        markDefs: [],
        children: [
          {
            text: 'Physical damage loans over ',
            _key: '1cb16bfd05f1',
            _type: 'span',
            marks: [],
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: '$50,000',
            _key: '64b45c01220d',
          },
          {
            _type: 'span',
            marks: [],
            text: ' (Presidential declarations).',
            _key: 'e7a35f9a09e1',
          },
        ],
        level: 2,
        _type: 'block',
        style: 'normal',
        _key: 'cae1e1138284',
        listItem: 'bullet',
      },
      {
        level: 2,
        _type: 'block',
        style: 'normal',
        _key: '3e536f95a210',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '2dd1a34dd548',
            _type: 'span',
            marks: [],
            text: 'Physical damage loans over ',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: '$14,000',
            _key: 'b57ec36ae556',
          },
          {
            _type: 'span',
            marks: [],
            text: ' (Agency declarations).',
            _key: '482af539c999',
          },
        ],
      },
      {
        children: [
          {
            marks: ['strong'],
            text: 'Preferred Collateral',
            _key: '26afd4b4df59',
            _type: 'span',
          },
          {
            text: ': Real estate, even if equity is insufficient to secure the full loan amount.',
            _key: '2fb40a6767a6',
            _type: 'span',
            marks: [],
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '6188a241ad9a',
        listItem: 'bullet',
        markDefs: [],
      },
      {
        style: 'normal',
        _key: 'bf443c4a0ab1',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            text: 'Additional Collateral',
            _key: '2583e3c61309',
            _type: 'span',
            marks: ['strong'],
          },
          {
            text: ': SBA will request any available collateral but will not decline a loan for lack of collateral.',
            _key: 'fdec7aed7aae',
            _type: 'span',
            marks: [],
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        style: 'h3',
        _key: 'b368e7b63a83',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'How to Apply',
            _key: '014f7c097c16',
          },
        ],
        _type: 'block',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Application Process',
            _key: '94bde3af9fc7',
          },
          {
            _type: 'span',
            marks: [],
            text: ':',
            _key: '8abd60b29468',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'b7425475153d',
      },
      {
        level: 2,
        _type: 'block',
        style: 'normal',
        _key: '4bff1640110f',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '3eb83198926b',
            _type: 'span',
            marks: [],
            text: 'Apply online for an SBA disaster assistance loan.',
          },
        ],
      },
      {
        children: [
          {
            text: 'After submission, SBA inspectors will estimate the cost of damages.',
            _key: '8090620799fa',
            _type: 'span',
            marks: [],
          },
        ],
        level: 2,
        _type: 'block',
        style: 'normal',
        _key: '6793ef9b4f65',
        listItem: 'bullet',
        markDefs: [],
      },
      {
        markDefs: [],
        children: [
          {
            text: 'Required Documentation',
            _key: 'c5a2e85c737d',
            _type: 'span',
            marks: ['strong'],
          },
          {
            text: ':',
            _key: 'a1a48b635c9a',
            _type: 'span',
            marks: [],
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'a5912d785913',
        listItem: 'bullet',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '8e73f11d176b',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Proof of Income',
            _key: '28b0619b308f',
          },
          {
            _type: 'span',
            marks: [],
            text: ': e.g., a pay stub.',
            _key: 'f30430ba6390',
          },
        ],
        level: 2,
      },
      {
        level: 2,
        _type: 'block',
        style: 'normal',
        _key: '360f71c3d98e',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Debt and Asset Values',
            _key: '4dd5b38ea44f',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Documentation of the entire household.',
            _key: '8166be3c4ab9',
          },
        ],
      },
    ],
    shortDescription: [
      {
        _key: '5390e03afaa2',
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'The ',
            _key: '72dc70cfa62e',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'Small Business Administration',
            _key: '4971a5662db9',
          },
          {
            _type: 'span',
            marks: [],
            text: ' provides Home and Personal Property Loans to homeowners or renters to repair or replace disaster-damaged real estate and personal property, including automobiles.',
            _key: '3b060e5e06b5',
          },
        ],
        _type: 'block',
        style: 'normal',
      },
    ],
    priority: 6,
    tags: [
      {
        slug: 'general-housing-resources',
        label: 'General - Housing Resources',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: 'LA Mission Donation Distribution',
    slug: 'la-mission-donation-distribution',
    resourceType: 'resource',
    resourceLink:
      'https://losangelesmission.org/ways-to-give/i-need-help/?ref=rkd_wildfire_hpb_GetHelpGT',
    tipsDescription: [
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Recovery efforts are ongoing and may evolve over time, with the availability of donations and resources assessed daily on a case-by-case basis.',
            _key: '9c91ecb0c62b',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'f2f3f3fc25be',
      },
      {
        style: 'normal',
        _key: '9e138528ca45',
        markDefs: [
          {
            _type: 'link',
            href: 'tel:+12136291227',
            _key: '26b42a5ae889',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'For assistance, visit:\n',
            _key: '2f4c71750673',
          },
          {
            text: '303 E 5th St, Los Angeles, CA 90013',
            _key: 'bfb2c2b04a23',
            _type: 'span',
            marks: ['strong'],
          },
          {
            _key: '1a7764702dbd',
            _type: 'span',
            marks: [],
            text: '\nCall: ',
          },
          {
            _type: 'span',
            marks: ['strong', '26b42a5ae889'],
            text: '(213) 629-1227',
            _key: '7377f8a70370',
          },
        ],
        _type: 'block',
      },
      {
        style: 'normal',
        _key: 'a2f964b991bd',
        markDefs: [],
        children: [
          {
            text: 'Visit the resource link for more information and support.',
            _key: 'f78ffa3bca5c',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
      },
    ],
    shortDescription: [
      {
        children: [
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'Los Angeles Mission',
            _key: '865665b3c3aa',
          },
          {
            _type: 'span',
            marks: [],
            text: ' offers vital support to individuals impacted by wildfires, including food, shelter, clothing, and recovery services. To help us better understand and evaluate your needs, please fill out the assistance form on their website. ',
            _key: '5dc97c11d413',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '38f73fa7b3af',
        markDefs: [],
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '3eaea4db6a1c',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: '',
            _key: 'a4154c5dd538',
          },
        ],
      },
    ],
    tags: [
      {
        slug: 'general-childcare',
        label: 'General - Childcare',
        category: {
          slug: 'utilize-these-other-resources',
          name: 'Utilize These Other Resources',
          priority: 99,
        },
      },
    ],
  },
  {
    title: 'Emergency Childcare Resources',
    slug: 'emergency-childcare-resources',
    resourceType: 'resource',
    resourceLink: 'https://www.imaginela.org/emergency-childcareresources',
    tipsDescription: null,
    shortDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: 'ada451d959d8',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'A current list of childcare resources.',
            _key: '60f0778019830',
          },
        ],
      },
    ],
    priority: 1,
    tags: [
      {
        slug: 'general-childcare',
        label: 'General - Childcare',
        category: {
          slug: 'utilize-these-other-resources',
          name: 'Utilize These Other Resources',
          priority: 99,
        },
      },
    ],
  },
  {
    title: "Replace Lost Driver's License or ID",
    slug: 'replace-lost-drivers-license-or-id',
    resourceType: 'resource',
    resourceLink:
      'https://www.dmv.ca.gov/portal/customer-service/natural-disaster-assistance/',
    tipsDescription: [
      {
        _key: '7558bf34bc74',
        markDefs: [],
        children: [
          {
            text: 'Online',
            _key: '7ecadeb41ab0',
            _type: 'span',
            marks: ['strong'],
          },
          {
            _type: 'span',
            marks: [],
            text: ': Use the provided online link to replace your driver’s license. A ',
            _key: '5aca55448649',
          },
          {
            marks: ['strong'],
            text: '$36 fee',
            _key: '971d99c3515d',
            _type: 'span',
          },
          {
            text: ' applies.',
            _key: '67fff537fa06',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
        style: 'normal',
      },
      {
        children: [
          {
            marks: ['strong'],
            text: 'In-Person',
            _key: '71a84cbb7a31',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ': If replacing due to loss in a fire, mention this at the DMV to have the ',
            _key: '3890dcbcff8b',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'fee waived',
            _key: 'f91e81ed9a85',
          },
          {
            text: '.',
            _key: '1c1180e7e2de',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'cbc4e0ce84be',
        markDefs: [],
      },
    ],
    shortDescription: [
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'CA DMV',
            _key: 'db957397bb48',
          },
          {
            _type: 'span',
            marks: [],
            text: ' will replace your Driver’s License, ID, or other auto-related documents lost in the fire.',
            _key: '6a41bba49a5d',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '2f8e261cc010',
      },
      {
        markDefs: [],
        children: [
          {
            marks: [],
            text: '',
            _key: '06a54cb0454d',
            _type: 'span',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '35693e668a12',
      },
    ],
    priority: 3,
    tags: [
      {
        slug: 'document-replacement-id',
        label: 'Document Replacement - ID',
        category: {
          slug: 'replace-documents',
          name: 'Replace Documents',
          priority: 1,
        },
      },
    ],
  },
  {
    title: 'Forward Your Mail',
    slug: 'forward-your-mail',
    resourceType: 'resource',
    resourceLink: 'https://www.usps.com/manage/forward.htm',
    tipsDescription: null,
    shortDescription: [
      {
        children: [
          {
            _key: '35e751091bcc0',
            _type: 'span',
            marks: [],
            text: 'Use link to utilize the ',
          },
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: "US Postal Service's",
            _key: 'ab73dda268bf',
          },
          {
            _type: 'span',
            marks: [],
            text: ' forwarding mail service.',
            _key: '35ce38014c9e',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '62b5de13818b',
        markDefs: [],
      },
    ],
    priority: 1,
    tags: [
      {
        slug: 'general-mail-forwarding',
        label: 'General - Mail Forwarding',
        category: {
          slug: 'forward-your-mail',
          name: 'Forward Your Mail',
          priority: 2,
        },
      },
    ],
  },
  {
    title: 'Emergency loans for businesses',
    slug: 'emergency-loans-for-businesses',
    resourceType: 'resource',
    resourceLink:
      'https://www.sba.gov/funding-programs/disaster-assistance/california-wildfires',
    tipsDescription: [
      {
        _key: '85c55c134f31',
        markDefs: [],
        children: [
          {
            text: 'Types of Available Small Business Loans',
            _key: 'a34af91cd8eb',
            _type: 'span',
            marks: ['strong'],
          },
        ],
        _type: 'block',
        style: 'h4',
      },
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: '1. Business Physical Disaster Loans',
            _key: '116614931912',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'f2e54b15ca84',
        markDefs: [],
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Purpose:',
            _key: 'cd7bbc3ce129',
          },
          {
            _type: 'span',
            marks: [],
            text: ' To help businesses repair or replace disaster-damaged property owned by the business, including real estate, inventories, supplies, machinery, and equipment.',
            _key: '3ece641a5dcb',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '2e980777c320',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Eligibility:',
            _key: 'bdeccb3140fd',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '1912af4e7b5a',
      },
      {
        _key: '6973ba69b4f4',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Businesses of any size.',
            _key: '0450bca3be53',
          },
        ],
        level: 2,
        _type: 'block',
        style: 'normal',
      },
      {
        level: 2,
        _type: 'block',
        style: 'normal',
        _key: '7263401de272',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Private, non-profit organizations, including charities, churches, private universities, and more.',
            _key: 'cfb3b40a3b9d',
            _type: 'span',
          },
        ],
      },
      {
        style: 'normal',
        _key: '2e5fd335c230',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: '2. Economic Injury Disaster Loans (EIDL)',
            _key: '19f0df5ec3b4',
          },
        ],
        _type: 'block',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '4d10fca212af',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Purpose:',
            _key: '58e5bf11f0b8',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Working capital loans designed to assist small businesses, small agricultural cooperatives, small aquaculture businesses, and most private, non-profit organizations in meeting their ordinary and necessary financial obligations that cannot be fulfilled due to the disaster.',
            _key: 'ac66668c853f',
          },
        ],
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Key Details:',
            _key: '69d15bfc557f',
          },
          {
            text: ' These loans are intended to support businesses throughout the disaster recovery period.',
            _key: '9538f66a270b',
            _type: 'span',
            marks: [],
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'bdfee8378927',
      },
    ],
    shortDescription: [
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'The',
            _key: '2c771a86c3e7',
          },
          {
            _type: 'span',
            marks: ['em'],
            text: ' ',
            _key: '935abf7172fb',
          },
          {
            marks: ['em', 'strong'],
            text: 'Federal Small Business Administration (SBA)',
            _key: '0b1086d213b8',
            _type: 'span',
          },
          {
            _key: 'f5d086be21c7',
            _type: 'span',
            marks: [],
            text: ' provides disaster loans to small businesses with physical repairs, economic injury due to the disaster.',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '330269623f3a',
      },
    ],
    priority: 1,
    tags: [
      {
        slug: 'business-small-business',
        label: 'Business - Small Business',
        category: {
          slug: 'seek-business-assistance',
          name: 'Seek Business Assistance',
          priority: 6,
        },
      },
    ],
  },
  {
    title: 'Help with Money, Food, and Healthcare',
    slug: 'help-with-money-food-and-healthcare',
    resourceType: 'resource',
    resourceLink: 'https://benefitscal.com/?lang=en',
    tipsDescription: [
      {
        style: 'normal',
        _key: 'a324039b5334',
        markDefs: [
          {
            _type: 'link',
            href: 'tel:+12135841808',
            _key: '996b6c0e4238',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'TIP:',
            _key: '98bc1c64c73c',
          },
          {
            _type: 'span',
            marks: [],
            text: " If you're struggling to afford rent, food, childcare, or are facing possible eviction, contact the ",
            _key: 'd7000986a8e3',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: "Mayor’s Fund for Los Angeles' We Are LA Hotline ",
            _key: '5d8958257210',
          },
          {
            _type: 'span',
            marks: [],
            text: 'at',
            _key: '0b14a1cd12fa',
          },
          {
            text: ' ',
            _key: 'f64b489b58b3',
            _type: 'span',
            marks: ['strong'],
          },
          {
            marks: ['strong', '996b6c0e4238'],
            text: '213 584-1808',
            _key: '21472f9a8bdd',
            _type: 'span',
          },
          {
            marks: [],
            text: ' for assistance.',
            _key: '8074baca5fa5',
            _type: 'span',
          },
        ],
        _type: 'block',
      },
      {
        style: 'h3',
        _key: 'cfe1716e946f',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Documents Needed to Apply for Public Benefits',
            _key: 'a5fe64124bd4',
          },
        ],
        _type: 'block',
      },
      {
        _key: 'efe6100504c3',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: '1. General Relief',
            _key: '120d916cb346',
          },
        ],
        _type: 'block',
        style: 'h4',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '5350a2bd8e65',
        markDefs: [],
        children: [
          {
            _key: '71275a7ca564',
            _type: 'span',
            marks: [],
            text: 'A Los Angeles County program providing cash assistance for adults with no-to-extremely low income and no children.',
          },
        ],
      },
      {
        markDefs: [],
        children: [
          {
            text: 'Documents Needed:',
            _key: '29b817ed4b98',
            _type: 'span',
            marks: ['strong'],
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'd5a899b2e779',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Proof of Income:',
            _key: 'ca9f1c344155',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Paystubs, disability benefits, unemployment benefits, veteran benefits, pension, or a bank statement.',
            _key: '267678e45771',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '067f11b7fdb8',
        listItem: 'bullet',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '35ff41615843',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Proof of Net Worth:',
            _key: 'f4d745e0e2b9',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Value of house, car, investments, and current statements for all bank accounts.',
            _key: 'f6cb2ad560e2',
          },
        ],
      },
      {
        style: 'normal',
        _key: 'fde52ae1dea3',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Verification of Citizenship: ',
            _key: '0c5ec1880c4b',
          },
          {
            _key: '07a283ba1a95',
            _type: 'span',
            marks: [],
            text: 'Birth certificate, photo ID, Social Security Number.',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        _type: 'block',
        style: 'h4',
        _key: 'a84fc8de51be',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: '2. CALWORKS',
            _key: '388c0d6b65c5',
          },
        ],
      },
      {
        _key: 'b0249c1bce12',
        markDefs: [],
        children: [
          {
            text: 'Provides cash assistance for low-income families.',
            _key: '5ec5c53a8c5f',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
        style: 'normal',
      },
      {
        markDefs: [],
        children: [
          {
            marks: ['strong'],
            text: 'Documents Needed:',
            _key: '96ee02d2a2d2',
            _type: 'span',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'ce1876ec25bb',
      },
      {
        markDefs: [],
        children: [
          {
            _key: '4f4ec001f000',
            _type: 'span',
            marks: ['strong'],
            text: 'Proof of Income:',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Paystub and asset value for the entire household.',
            _key: '65870f1a585c',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '543776035a11',
        listItem: 'bullet',
      },
      {
        _key: '4b0190934796',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Citizenship Status:',
            _key: '9edaeec34237',
          },
          {
            _type: 'span',
            marks: [],
            text: " Social Security Numbers (SSN), birth certificates, driver's licenses, or other documentation for everyone in the household.",
            _key: '70ba0b6570c4',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '8ba2aae07304',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Age Verification:',
            _key: 'dce04a8378a7',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Documentation for all household members.',
            _key: 'e753174fe2d0',
          },
        ],
        level: 1,
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '3ec6957af529',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: 'cc879d039e49',
            _type: 'span',
            marks: ['strong'],
            text: 'Household Address & Expenses:',
          },
          {
            marks: [],
            text: ' Rent, utilities, and other living costs.',
            _key: '11a46da687b0',
            _type: 'span',
          },
        ],
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '6e38d37b88b1',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            text: 'Work or School Status:',
            _key: 'a7164da38d26',
            _type: 'span',
            marks: ['strong'],
          },
          {
            _type: 'span',
            marks: [],
            text: ' Information for each household member.',
            _key: '410c38cdb208',
          },
        ],
      },
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Note:',
            _key: 'aea09f3e22d7',
          },
          {
            _type: 'span',
            marks: [],
            text: ' All adult family members must be ',
            _key: '947f83ee2be3',
          },
          {
            marks: ['em'],
            text: 'fingerprinted',
            _key: '73ce2e71b5a9',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ' and ',
            _key: '9733e6ec0fff',
          },
          {
            marks: ['em'],
            text: 'photo-imaged',
            _key: '204813d97a16',
            _type: 'span',
          },
          {
            _key: '3b851ed5ad60',
            _type: 'span',
            marks: [],
            text: '.',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '11a11e997710',
        markDefs: [],
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: '3. CalFresh',
            _key: '4bd36fdac47a',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: 'b14d4df05b6f',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: 'd941bf9234df',
        markDefs: [],
        children: [
          {
            _key: '608539b6b462',
            _type: 'span',
            marks: [],
            text: 'Provides monthly food benefits to low-income individuals and families.',
          },
        ],
      },
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Documents Needed:',
            _key: '2507482e0d18',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'f4f94753e21e',
        markDefs: [],
      },
      {
        style: 'normal',
        _key: '7a2fab75959d',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            text: 'Proof of Identification:',
            _key: '86d1837d227a',
            _type: 'span',
            marks: ['strong'],
          },
          {
            _type: 'span',
            marks: [],
            text: " Driver's license, ID card, health card, or equivalent.",
            _key: 'd422435404a4',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Social Security Numbers:',
            _key: '822913728dae',
          },
          {
            _key: 'a8d571f3e42a',
            _type: 'span',
            marks: [],
            text: ' For all household members.',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '58e9abbb6de2',
      },
      {
        style: 'normal',
        _key: '116f5c3fc896',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'For Non-U.S. Citizens:',
            _key: '02220d3d13c9',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Resident alien card or proof of immigration status.',
            _key: '5cc8c4f7fe5b',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '95b91e61252b',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Proof of Income:',
            _key: '5508a9a683a1',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Paystubs, child support orders, and benefit statements.',
            _key: '0aa2b926066d',
          },
        ],
      },
      {
        markDefs: [],
        children: [
          {
            marks: ['strong'],
            text: 'Proof of Expenses:',
            _key: '8aa6c06f7f90',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Rent receipts, mortgage statements, utility bills, childcare receipts, child support payments, and proof of other expenses.',
            _key: '3aac0dfb5c30',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '8ba1e57ebb61',
        listItem: 'bullet',
      },
      {
        markDefs: [],
        children: [
          {
            marks: ['strong'],
            text: 'Note:',
            _key: '0e59274c7982',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ' If you’ve already provided income and expense proof for CalWORKS or General Relief, you may not need to provide it again.',
            _key: 'eb4fb6be1942',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'ee636d9900d6',
      },
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: '4. Medi-Cal',
            _key: '1b90e502d152',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: 'bea9997c75db',
        markDefs: [],
      },
      {
        style: 'normal',
        _key: '3e86d8b42dcd',
        markDefs: [],
        children: [
          {
            marks: [],
            text: "California's Medicaid program offers medical services for children and adults with limited income and resources, often for free or at a low cost.",
            _key: 'ac7bd492fdf0',
            _type: 'span',
          },
        ],
        _type: 'block',
      },
      {
        style: 'normal',
        _key: '0fd94eb547aa',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Documents Needed:',
            _key: '47dcbd0a6b44',
          },
        ],
        _type: 'block',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: ['strong'],
            text: 'Income Verification:',
            _key: '28907b6261ff',
            _type: 'span',
          },
          {
            _key: 'a1f3797479b7',
            _type: 'span',
            marks: [],
            text: ' Paystub or other income sources.',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '1fcb31f64054',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '32bfc49a0898',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            text: 'Proof of California Residency:',
            _key: '2fa32f84f3e1',
            _type: 'span',
            marks: ['strong'],
          },
          {
            marks: [],
            text: ' Driver’s license, paystub, rent receipt, or utility bill showing a California address.',
            _key: '5477e4e0fe16',
            _type: 'span',
          },
        ],
      },
      {
        children: [
          {
            _key: 'dfe12bfe9aa7',
            _type: 'span',
            marks: ['strong'],
            text: 'Verification of Employment:',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Statement from employer.',
            _key: '985a6ad08df2',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'befe483dd93b',
        listItem: 'bullet',
        markDefs: [],
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Tax Documentation:',
            _key: 'a9bb5693224e',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Previous year’s tax return.',
            _key: '65ab4a9246b0',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '3ff138c4f5a5',
        listItem: 'bullet',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'd73e2cc09bc1',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Bank Statements:',
            _key: '51cf0224e0a3',
          },
          {
            _key: 'e6c79989f24d',
            _type: 'span',
            marks: [],
            text: ' Recent statements (if applicable).',
          },
        ],
      },
      {
        _type: 'block',
        style: 'normal',
        _key: 'e7c5a9e8dbd7',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Alimony or Child Support:',
            _key: '65a408b75482',
          },
          {
            marks: [],
            text: ' Copies of checks paid or received.',
            _key: 'b139f62ad319',
            _type: 'span',
          },
        ],
        level: 1,
      },
      {
        _key: 'e42035953888',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Asset Verification:',
            _key: 'f7d9b48f5e8c',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Statements for stocks, bonds, or other assets.',
            _key: 'e44e1b5a7a33',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        style: 'normal',
        _key: 'e79815c67dd0',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Vehicle Registration:',
            _key: '2c13f6ad9e27',
          },
          {
            marks: [],
            text: ' DMV certificate if you own a car.',
            _key: '50cd55df5133',
            _type: 'span',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        _key: 'e06cc8db389f',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Health Insurance Status:',
            _key: '3ebf78ef612b',
          },
          {
            _type: 'span',
            marks: [],
            text: ' Proof of lack of minimum essential health insurance.',
            _key: '8efa101d5981',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        style: 'normal',
        _key: '71297efda009',
        markDefs: [],
        children: [
          {
            _key: 'bfd30116f9fd',
            _type: 'span',
            marks: ['strong'],
            text: 'Note:',
          },
          {
            _type: 'span',
            marks: [],
            text: ' If you are already enrolled in programs like CalWORKS, CalFresh, SSI/SSP, Refugee Assistance, Foster Care, or Adoption Assistance may reduce documentation requirements.',
            _key: 'be58cf709dc3',
          },
        ],
        _type: 'block',
      },
    ],
    shortDescription: [
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'LA County Department of Social Services (DPSS)',
            _key: '883333026fd0',
          },
          {
            _type: 'span',
            marks: [],
            text: ' provides the CalWorks, General Relief, Medi-Cal and CalFresh programs that that supply food, cash aid, and health coverage benefits for people with low incomes. See ',
            _key: '331bfc93f087',
          },
          {
            marks: ['em'],
            text: 'Useful Tips ',
            _key: 'fa222c524317',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: 'including the Mayor’s Fund Hotline, Family Source Centers, and documents needed before applying for benefits.',
            _key: '4fd4eb52c450',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '39eaaf1549d2',
      },
    ],
    priority: 1,
    tags: [
      {
        slug: 'income-low-income',
        label: 'Income - Low Income',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
      {
        slug: 'general-food',
        label: 'General - Food',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: "Free employment transition services if you've lost your job",
    slug: 'free-employment-transition-services',
    resourceType: 'resource',
    resourceLink:
      'https://ewdd.lacity.gov/index.php/employment-services/jobloss',
    tipsDescription: [
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Orientation for Job Loss Resources',
            _key: 'a80956278bd2',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: '37eab1ebff0a',
      },
      {
        _key: '377b175fa756',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Schedule an orientation to explore available resources for individuals who have lost or will lose their jobs through no fault of their own:',
            _key: '919f92a5011b',
          },
        ],
        _type: 'block',
        style: 'normal',
      },
      {
        markDefs: [
          {
            href: 'mailto:Dennis.Parks@lacity.org',
            _key: '0a0732ebb494',
            _type: 'link',
          },
        ],
        children: [
          {
            marks: ['strong'],
            text: 'Dennis Parks',
            _key: '4d6b35621bf0',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ' (English): ',
            _key: 'c91f1453a74b',
          },
          {
            _key: '745155e766cc',
            _type: 'span',
            marks: ['0a0732ebb494'],
            text: 'Dennis.Parks@lacity.org',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'b2d07276b2af',
        listItem: 'bullet',
      },
      {
        _key: '5d7916b44d37',
        listItem: 'bullet',
        markDefs: [
          {
            _type: 'link',
            href: 'mailto:Itzel.Sanchez@lacity.org',
            _key: 'a019d94f2ee8',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Itzel Sanchez',
            _key: 'c51f6d0783e7',
          },
          {
            _type: 'span',
            marks: [],
            text: ' (Spanish): ',
            _key: '0868324b29d5',
          },
          {
            marks: ['a019d94f2ee8'],
            text: 'Itzel.Sanchez@lacity.org',
            _key: 'f50e0a175429',
            _type: 'span',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'For additional information, visit ',
            _key: '2ec0dcacc3d2',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'EWDD’s website',
            _key: 'b0d566754c50',
          },
          {
            _type: 'span',
            marks: [],
            text: '.',
            _key: 'f8b35fb7b300',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'a9a9e2b3ab03',
      },
    ],
    shortDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: 'e317e2f82fdc',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'LA City Economic Development Department',
            _key: 'a4b7f466e6a8',
          },
          {
            _type: 'span',
            marks: ['em'],
            text: ' ',
            _key: '735a83062e43',
          },
          {
            _type: 'span',
            marks: [],
            text: 'provides Job Loss Assistance.\n\n',
            _key: '97391d06d33e',
          },
        ],
      },
    ],
    priority: 2,
    tags: [
      {
        slug: 'income-job-loss',
        label: 'Income - Job Loss',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: 'Replace Lost Social Security Cards',
    slug: 'replace-lost-social-security-cards',
    resourceType: 'resource',
    resourceLink: 'https://www.ssa.gov/number-card/replace-card',
    tipsDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: '6ffc077a7708',
        markDefs: [],
        children: [
          {
            text: 'Replacing a Social Security card is ',
            _key: '9e85265d8b28',
            _type: 'span',
            marks: [],
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'free',
            _key: '97dccbb06c1c',
          },
          {
            text: '.',
            _key: 'b80f62b51ab2',
            _type: 'span',
            marks: [],
          },
        ],
      },
      {
        style: 'normal',
        _key: '908851f873de',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Online',
            _key: 'c70e101a49c4',
          },
          {
            _key: 'eb4b7d0a65fb',
            _type: 'span',
            marks: [],
            text: ': Visit the provided website and complete the "Answer a few questions" section.',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        style: 'normal',
        _key: 'ce192bbe4f8e',
        listItem: 'bullet',
        markDefs: [
          {
            _type: 'link',
            href: 'tel:+18007721213',
            _key: '0adfbd0f2f07',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'By Phone',
            _key: '9417f875e1a3',
          },
          {
            text: ': Call ',
            _key: 'fd39b60a6b63',
            _type: 'span',
            marks: [],
          },
          {
            _type: 'span',
            marks: ['strong', '0adfbd0f2f07'],
            text: '(800) 772-1213',
            _key: '8f1e10441d66',
          },
          {
            _type: 'span',
            marks: [],
            text: ' for assistance.',
            _key: 'ed76b556ba0d',
          },
        ],
        level: 1,
        _type: 'block',
      },
    ],
    shortDescription: [
      {
        _key: '6d50e948cc75',
        markDefs: [],
        children: [
          {
            _key: 'fc5c04dd0e50',
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'Social Security Administration',
          },
          {
            text: ' will replace Social Security card lost in fire at no cost.\n',
            _key: 'ca190d8103dc',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
        style: 'normal',
      },
    ],
    priority: 2,
    tags: [
      {
        slug: 'document-replacement-social-security-cards',
        label: 'Document Replacement - Social Security Cards',
        category: {
          slug: 'replace-documents',
          name: 'Replace Documents',
          priority: 1,
        },
      },
    ],
  },
  {
    title: 'Free consulting to support your Business',
    slug: 'free-consulting-to-support-your-business',
    resourceType: 'resource',
    resourceLink: 'https://laedc.org/business-assistance/',
    tipsDescription: null,
    shortDescription: [
      {
        markDefs: [
          {
            _type: 'link',
            href: 'tel:+12132364839',
            _key: 'eb81d15b713e',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'LA County Economic Development Corporation (LAEDC)',
            _key: '9b0c098a8045',
          },
          {
            _type: 'span',
            marks: [],
            text: ' provides Business Recovery Assistance including assessments, consulting services, and aiding with layoffs. Contact the team at ',
            _key: '7f71c1ee10e1',
          },
          {
            _type: 'span',
            marks: ['eb81d15b713e'],
            text: '(213) 236-4839',
            _key: '55e5deb2df49',
          },
          {
            text: ' or complete the form on their website.',
            _key: '20ce3f282f85',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'c0ceaf37f830',
      },
    ],
    priority: 2,
    tags: [
      {
        slug: 'general-business-resources',
        label: 'General - Business Resources',
        category: {
          slug: 'seek-business-assistance',
          name: 'Seek Business Assistance',
          priority: 6,
        },
      },
    ],
  },
  {
    title: 'Emergency Shelters',
    slug: 'emergency-shelters',
    resourceType: 'resource',
    resourceLink: 'https://www.imaginela.org/shelters',
    tipsDescription: null,
    shortDescription: [
      {
        markDefs: [],
        children: [
          {
            _key: '46ba393bdca60',
            _type: 'span',
            marks: [],
            text: 'A list of current emergency shelter resources.',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '6c0481defc85',
      },
    ],
    priority: 1,
    tags: [
      {
        slug: 'housing-temporary-housing',
        label: 'Housing - Temporary Housing',
        category: {
          slug: 'secure-housing',
          name: 'Secure Housing',
          priority: 4,
        },
      },
    ],
  },
  {
    title: 'Go Fund Me Alert',
    slug: 'go-fund-me-alert',
    resourceType: 'alert',
    resourceLink: null,
    tipsDescription: null,
    shortDescription: [
      {
        children: [
          {
            _key: 'c618661be822',
            _type: 'span',
            marks: ['strong'],
            text: 'Important info about GoFundMe or crowdfunding money:',
          },
          {
            text: '\n',
            _key: '60095081f365',
            _type: 'span',
            marks: [],
          },
          {
            _key: '5337962c0a14',
            _type: 'span',
            marks: ['em'],
            text: 'GoFundMe',
          },
          {
            text: ' and other crowd sourcing funds if designated as "help me rebuild my house" will be counted against your disaster benefit and will be considered as taxable income unless they are specifically designated as gifts\n',
            _key: '3d8faef7ca77',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'ada451d959d8',
        markDefs: [],
      },
    ],
    priority: 6,
    tags: [
      {
        slug: 'general-financial-assistance',
        label: 'General - Financial Assistance',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: 'Disaster Assistance',
    slug: 'disaster-assistance',
    resourceType: 'resource',
    resourceLink: 'http://DisasterAssistance.gov',
    tipsDescription: [
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Preparing for Your FEMA Application',
            _key: 'acfc57087d78',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: '89ba5df8007b',
        markDefs: [],
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Before starting your application, ensure you have the following information ready:',
            _key: 'e99159a7e58b',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'd5dde9792f94',
      },
      {
        _key: 'a3e3c8db681f',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Proof of Identity',
            _key: 'a4781e4af678',
          },
          {
            _key: '799f0da78ec7',
            _type: 'span',
            marks: [],
            text: ': Social Security Card, U.S. Passport, or similar documentation.',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'e9a5d803636d',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Proof of Home Ownership & Occupancy',
            _key: '2bf92f1ec120',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Leasing or housing agreements, utility bills, credit card receipts, etc.',
            _key: 'acdee6e58a2b',
          },
        ],
      },
      {
        _key: 'de43e750c05c',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '315e1dea7ee8',
            _type: 'span',
            marks: ['em'],
            text: 'If you do not have traditional documents, FEMA accepts written self-declarative statements under the "Expanded Flexibility" section.',
          },
        ],
        level: 2,
        _type: 'block',
        style: 'normal',
      },
      {
        style: 'normal',
        _key: '8a2d8e250c9b',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Annual Household Income',
            _key: '800ba5e79115',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Bank Account Information',
            _key: '702b84220f48',
          },
          {
            marks: [],
            text: ': Required for direct deposit.',
            _key: 'b843029d2b3c',
            _type: 'span',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '46339ad5f345',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Contact Information',
            _key: 'cca2d7fef107',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Phone number, email address, mailing address, and damaged home address.',
            _key: '9e385fea420a',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '19342251e148',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Insurance Information',
            _key: '9a9bf4fddd38',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Name of insurance company, policy type, and other relevant details.',
            _key: 'a6c607df41c0',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '52e03e29ed71',
        listItem: 'bullet',
      },
      {
        style: 'normal',
        _key: '28f0e07e4ede',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['em'],
            text: 'FEMA does not duplicate benefits already covered by insurance but may assist with uncovered damages.',
            _key: '824fb4539cae',
          },
        ],
        level: 2,
        _type: 'block',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '3870f386847b',
        markDefs: [
          {
            _type: 'link',
            href: 'https://www.fema.gov/assistance/individual/program/road-to-recovery',
            _key: 'f43cd4f49ecd',
          },
          {
            _key: '0bf5533db762',
            _type: 'link',
            href: 'http://fema.gov/',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'For a step-by-step guide to the application process and requirements, visit:\n',
            _key: '74a7beb3873d',
          },
          {
            _type: 'span',
            marks: ['f43cd4f49ecd'],
            text: "Survivors' Road to Recovery",
            _key: '131523768812',
          },
          {
            _type: 'span',
            marks: [],
            text: ' | ',
            _key: 'f59715dbad85',
          },
          {
            _type: 'span',
            marks: ['0bf5533db762'],
            text: 'FEMA.gov',
            _key: '42ef7b480636',
          },
        ],
      },
    ],
    shortDescription: [
      {
        style: 'normal',
        _key: '7a9d81aaa511',
        markDefs: [],
        children: [
          {
            marks: ['em', 'strong'],
            text: 'Federal Emergency Assistance | FEMA',
            _key: 'e6ce3a14a0d9',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ' provides disaster funds for home repairs, temporary housing, or property damage (appliances, furniture, vehicle, etc). You may also qualify for help with child care, medical, lodging, moving, funeral expenses, and financial assistance for self-employed and freelance workers and uninsured or underinsured renters and homeowners.',
            _key: '77705f2dd858',
          },
        ],
        _type: 'block',
      },
    ],
    priority: 0,
    tags: [
      {
        slug: 'housing-no-insurance',
        label: 'Housing - No Insurance',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
      {
        slug: 'general-financial-assistance',
        label: 'General - Financial Assistance',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: 'Download Watch Duty',
    slug: 'download-watch-duty',
    resourceType: 'alert',
    resourceLink: null,
    tipsDescription: null,
    shortDescription: [
      {
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Stay informed with ',
            _key: '236fc4e3f729',
          },
          {
            text: 'live updates',
            _key: '1db1882c01d9',
            _type: 'span',
            marks: ['strong'],
          },
          {
            _type: 'span',
            marks: [],
            text: ' on ',
            _key: 'c99112eaa9dd',
          },
          {
            marks: ['strong'],
            text: 'repopulation orders',
            _key: '0e33a6b56e87',
            _type: 'span',
          },
          {
            marks: [],
            text: ' and ',
            _key: '5f3b34feb400',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'water safety alerts',
            _key: 'd16dc4de1ed8',
          },
          {
            _type: 'span',
            marks: [],
            text: '.',
            _key: '8d7fc2d5a7f3',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '7179ad816855',
        markDefs: [],
      },
      {
        markDefs: [
          {
            _type: 'link',
            href: 'https://app.watchduty.org/',
            _key: '85eeca54d0fe',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Download the ',
            _key: 'a13a8fe70388',
          },
          {
            _type: 'span',
            marks: ['strong', '85eeca54d0fe'],
            text: 'Watch Duty',
            _key: '6c7a2f313dd4',
          },
          {
            _type: 'span',
            marks: [],
            text: ' app now to receive real-time notifications and critical updates directly to your device.',
            _key: '7c32844c55ca',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '5e0cbb746d47',
      },
    ],
    priority: 4,
    tags: [],
  },
  {
    title: 'Better Angels Emergency Assistance Fund',
    slug: 'emergency-assistance-fund',
    resourceType: 'resource',
    resourceLink: 'https://www.betterangels.la/emergency-assistance-fund',
    tipsDescription: null,
    shortDescription: [
      {
        style: 'normal',
        _key: '742f386f0a6d',
        markDefs: [],
        children: [
          {
            _key: '8a6fbb06e99d',
            _type: 'span',
            marks: [],
            text: 'In response to the catastrophic wildfires that decimated some of LA’s neighborhoods, ',
          },
          {
            _key: '579be68eace9',
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'Better Angels',
          },
          {
            _type: 'span',
            marks: [],
            text: ' has launched a rapid-response ',
            _key: 'af82c384ca41',
          },
          {
            _type: 'span',
            marks: ['em'],
            text: 'Emergency Assistance Fund',
            _key: '277ecb6b7ddd',
          },
          {
            _key: '7b3c48195d39',
            _type: 'span',
            marks: [],
            text: ' to support low-income families that have been impacted by the fires. The grants can be used for essentials, including food, clothing, and personal items. Applications will be reviewed, and funds will be distributed, daily.',
          },
        ],
        _type: 'block',
      },
    ],
    priority: 1,
    tags: [
      {
        slug: 'income-low-income',
        label: 'Income - Low Income',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: 'Income Support for Wildfire Job Loss',
    slug: 'income-support-for-wildfire-job-loss',
    resourceType: 'resource',
    resourceLink:
      'https://edd.ca.gov/en/about_edd/news_releases_and_announcements/disaster-unemployment-assistance-dua-now-available-to-los-angeles-county-workers-impacted-by-california-wildfires-and-severe-winds/#:~:text=SACRAMENTO%20%E2%80%94%20Los%20Angeles%20County%20workers,(EDD)%20administers%20these%20benefits',
    tipsDescription: [
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: '*Important Note*',
            _key: '2d212bc361bb',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: 'd384e2235e0d',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '195da4e219d4',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Apply for ',
            _key: '9aaed5cbe90b',
          },
          {
            text: 'EDD',
            _key: 'b9b8057d67fa',
            _type: 'span',
            marks: ['strong'],
          },
          {
            marks: [],
            text: ' only if you have lost a regular wage-earning job (W2).',
            _key: '8f89d25db27c',
            _type: 'span',
          },
        ],
      },
      {
        _key: '11ec642ca45e',
        listItem: 'bullet',
        markDefs: [
          {
            _type: 'link',
            href: 'https://edd.ca.gov/en/unemployment/Disaster_Unemployment_Assistance/',
            _key: 'ca2aa00a9625',
          },
          {
            _type: 'link',
            href: 'http://disasterassistance.gov/',
            _key: '465dd9855973',
          },
        ],
        children: [
          {
            marks: [],
            text: 'For ',
            _key: '5b706e3efac4',
            _type: 'span',
          },
          {
            _key: '4bd6e56742a3',
            _type: 'span',
            marks: ['strong'],
            text: 'self-employed',
          },
          {
            marks: [],
            text: ', freelance, or gig work, visit ',
            _key: '553fadcf3f71',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: ['strong', 'ca2aa00a9625'],
            text: 'Disaster Unemployment Assistance',
            _key: 'd14ebd36362d',
          },
          {
            _type: 'span',
            marks: [],
            text: ' or ',
            _key: 'd764e1892879',
          },
          {
            _type: 'span',
            marks: ['465dd9855973', 'strong'],
            text: 'DisasterAssistance.gov',
            _key: '253d52672714',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Information Needed to Apply',
            _key: '6b1014b61420',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: '3826f70c0676',
        markDefs: [],
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Before starting your application, ensure you have the following:',
            _key: 'f75619da9c3d',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '468bc45108e2',
      },
      {
        _type: 'block',
        style: 'h5',
        _key: '22e94130b480',
        markDefs: [],
        children: [
          {
            text: '1. Identification Documents',
            _key: '438555780037',
            _type: 'span',
            marks: ['strong'],
          },
        ],
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '7641a4f800d7',
            _type: 'span',
            marks: ['strong'],
            text: 'Social Security Number',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '3d73eb1437f7',
      },
      {
        _key: '8b98cfd05caa',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Photo ID',
            _key: 'ee57cf583a1e',
          },
          {
            _key: '9db123a8a625',
            _type: 'span',
            marks: [],
            text: ': Driver’s license, State ID, or Passport.',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        children: [
          {
            text: 'Additional Identity Document',
            _key: 'ae724ffaa104',
            _type: 'span',
            marks: ['strong'],
          },
          {
            text: ': W2, utility bill, or birth certificate.',
            _key: 'f9457854844b',
            _type: 'span',
            marks: [],
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'eabd8fdbe001',
        listItem: 'bullet',
        markDefs: [],
      },
      {
        children: [
          {
            marks: ['strong'],
            text: '2. Employment Information',
            _key: '384bbe6b9cf6',
            _type: 'span',
          },
        ],
        _type: 'block',
        style: 'h5',
        _key: '975aa28a5db3',
        markDefs: [],
      },
      {
        _type: 'block',
        style: 'normal',
        _key: 'b0fb36123187',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '37a47dd7ce09',
            _type: 'span',
            marks: ['strong'],
            text: 'Proof of Employment and Reason for Unemployment',
          },
          {
            _type: 'span',
            marks: [],
            text: ':',
            _key: '6d8f0cd94389',
          },
        ],
        level: 1,
      },
      {
        style: 'normal',
        _key: '36924b8bf66a',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Employment history for the past 18 months:',
            _key: '2bb6484c37ca',
          },
        ],
        level: 2,
        _type: 'block',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Mailing and physical addresses of employers.',
            _key: 'e6c3bb92af6a',
          },
        ],
        level: 3,
        _type: 'block',
        style: 'normal',
        _key: 'c547441a6cc9',
        listItem: 'bullet',
      },
      {
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Dates worked.',
            _key: 'a1738feeaace',
          },
        ],
        level: 3,
        _type: 'block',
        style: 'normal',
        _key: '656ff0a97cc6',
        listItem: 'bullet',
        markDefs: [],
      },
      {
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Gross wages (total before taxes/deductions).',
            _key: '91ace2d96ffc',
            _type: 'span',
          },
        ],
        level: 3,
        _type: 'block',
        style: 'normal',
        _key: '5ef391553f6c',
        listItem: 'bullet',
      },
      {
        children: [
          {
            text: 'Hours worked.',
            _key: '24ac0df1ed92',
            _type: 'span',
            marks: [],
          },
        ],
        level: 3,
        _type: 'block',
        style: 'normal',
        _key: '7bd5ea671c84',
        listItem: 'bullet',
        markDefs: [],
      },
      {
        _key: '6be60864a30d',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '2f45a30482b2',
            _type: 'span',
            marks: [],
            text: 'Payment frequency (e.g., weekly, monthly).',
          },
        ],
        level: 3,
        _type: 'block',
        style: 'normal',
      },
      {
        _key: 'a1376f0cdca5',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            text: 'Most recent employer information:',
            _key: '2d4c38e2ebd1',
            _type: 'span',
            marks: [],
          },
        ],
        level: 2,
        _type: 'block',
        style: 'normal',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Employer contact details.',
            _key: 'dc658c6faad3',
            _type: 'span',
          },
        ],
        level: 3,
        _type: 'block',
        style: 'normal',
        _key: '707873b15650',
      },
      {
        level: 3,
        _type: 'block',
        style: 'normal',
        _key: 'ee655c2876bb',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Last date worked.',
            _key: '6a40afedb49a',
          },
        ],
      },
      {
        _key: '904f386e8e3b',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Gross wages for the ',
            _key: '45e7eb4fca18',
          },
          {
            text: 'last week worked',
            _key: '5bf4bb1019fa',
            _type: 'span',
            marks: ['strong'],
          },
          {
            _type: 'span',
            marks: [],
            text: ' (Sunday through Saturday).',
            _key: '4f198c260646',
          },
        ],
        level: 3,
        _type: 'block',
        style: 'normal',
      },
      {
        style: 'h5',
        _key: 'f09fd61be9db',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: '3. Citizenship Documentation',
            _key: '397d30bb295d',
          },
        ],
        _type: 'block',
      },
      {
        style: 'normal',
        _key: '23ec06d45167',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: 'c9c26943aedc',
            _type: 'span',
            marks: [],
            text: 'Proof of Citizenship or ',
          },
          {
            _key: 'e689e2029e5b',
            _type: 'span',
            marks: ['strong'],
            text: 'USCIS Document',
          },
          {
            _type: 'span',
            marks: [],
            text: ' (if registered with USCIS as a non-citizen).',
            _key: '606f369afb96',
          },
        ],
        level: 1,
        _type: 'block',
      },
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: '4. Special Cases',
            _key: '92d7ca1ba00e',
          },
        ],
        _type: 'block',
        style: 'h5',
        _key: '1bbb0ed374d0',
        markDefs: [],
      },
      {
        _key: '84c7065907e2',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Federal Employees',
            _key: '2e5c59b41e48',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Submit ',
            _key: 'aadafe655f62',
          },
          {
            _key: 'fb1a012d66b1',
            _type: 'span',
            marks: ['strong'],
            text: 'Notice to Federal Employee About Unemployment Insurance (Standard Form 8)',
          },
          {
            marks: [],
            text: '.',
            _key: 'b8a064f2b5c8',
            _type: 'span',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '30d231840ac2',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: ['strong'],
            text: 'Military Service',
            _key: 'b826e102556f',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Submit ',
            _key: 'b5b74ba0b4f8',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'DD214 Member Copy 4',
            _key: '27eb7fc934e5',
          },
          {
            _type: 'span',
            marks: [],
            text: ' if you served in the military within the past 18 months.',
            _key: 'c043806d734e',
          },
        ],
      },
    ],
    shortDescription: [
      {
        style: 'normal',
        _key: 'ab296037e60c',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'CA EDD',
            _key: '9fca72e955d2',
          },
          {
            _type: 'span',
            marks: [],
            text: " provide Disaster Unemployment Assistance for people who can't work at their job due to the disaster.",
            _key: 'bbc5e7eba87c',
          },
        ],
        _type: 'block',
      },
    ],
    priority: 2,
    tags: [
      {
        slug: 'income-job-loss',
        label: 'Income - Job Loss',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: 'School Status Information',
    slug: 'school-status-information',
    resourceType: 'resource',
    resourceLink:
      'https://docs.google.com/document/d/1uDvWhGvPS5rtJh9XtR5Z94IkoTw21DaEc1MXaNqCLlc/edit?tab=t.ik2yoo6u7phr',
    tipsDescription: null,
    shortDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: '9e1193521213',
        markDefs: [],
        children: [
          {
            text: 'School Statuses in or near wildfire impacted areas – A current list of school information in or near wildfire areas.',
            _key: '059eb63cb6c8',
            _type: 'span',
            marks: [],
          },
        ],
      },
    ],
    priority: 1,
    tags: [
      {
        slug: 'general-childcare',
        label: 'General - Childcare',
        category: {
          slug: 'utilize-these-other-resources',
          name: 'Utilize These Other Resources',
          priority: 99,
        },
      },
    ],
  },
  {
    title: 'Get Clothing & Essential Items from Mutual AID LA Network ',
    slug: 'get-clothing-and-essential-items-from-mutual-aid-la-network',
    resourceType: 'resource',
    resourceLink:
      'https://docs.google.com/spreadsheets/d/1KMk34XY5dsvVJjAoD2mQUVHYU_Ib6COz6jcGH5uJWDY/edit?gid=395634253#gid=395634253',
    tipsDescription: null,
    shortDescription: [
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'Mutual Aid LA Network (MALAN)',
            _key: '0cd0368d8ea7',
          },
          {
            marks: [],
            text: ' is a connector and information hub for mutual aid efforts, people and resources across Los Angeles. They maintain a list of resources available to those affected by the fires in the Google Sheet below and will update it with new resources or calls for volunteers & donations.',
            _key: 'e5f396bfb128',
            _type: 'span',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '95f96c3d463d',
      },
    ],
    priority: 2,
    tags: [
      {
        slug: 'general-childcare',
        label: 'General - Childcare',
        category: {
          slug: 'utilize-these-other-resources',
          name: 'Utilize These Other Resources',
          priority: 99,
        },
      },
    ],
  },
  {
    title: 'Replace Lost Vital Records ',
    slug: 'replace-lost-vital-records',
    resourceType: 'resource',
    resourceLink:
      'https://www.lavote.gov/home/records/birth-records/birth-records-request/who-can-obtain-a-copy-of-a-birth-record',
    tipsDescription: [
      {
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Replacing records lost in a fire is ',
            _key: '88d243a9f52f',
            _type: 'span',
          },
          {
            marks: ['strong'],
            text: 'free',
            _key: '8aa21fafe1dc',
            _type: 'span',
          },
          {
            text: '.',
            _key: '7c91d370284e',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '1d6ac6db75e6',
      },
      {
        listItem: 'bullet',
        markDefs: [
          {
            _type: 'link',
            href: 'tel:+18002018999',
            _key: 'b3aff5dd8c2e',
          },
        ],
        children: [
          {
            _key: 'dead26dc6657',
            _type: 'span',
            marks: ['strong'],
            text: 'By Phone',
          },
          {
            _type: 'span',
            marks: [],
            text: ': Call ',
            _key: '5f594fb0bd29',
          },
          {
            _type: 'span',
            marks: ['b3aff5dd8c2e'],
            text: '(',
            _key: 'a06f572ea56f',
          },
          {
            _type: 'span',
            marks: ['strong', 'b3aff5dd8c2e'],
            text: '800) 201-8999',
            _key: 'ad24b36a5d71',
          },
          {
            marks: [],
            text: ', then select ',
            _key: '331717dad993',
            _type: 'span',
          },
          {
            marks: ['strong'],
            text: 'Option 1',
            _key: 'cbbd2fb0a80a',
            _type: 'span',
          },
          {
            marks: [],
            text: ' followed by ',
            _key: '88211773cd23',
            _type: 'span',
          },
          {
            marks: ['strong'],
            text: 'Option 2',
            _key: 'c64dae1c81d1',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: [],
            text: '.',
            _key: 'ef841924bd8d',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '11e29895e521',
      },
      {
        _key: '16e7055905ec',
        listItem: 'bullet',
        markDefs: [
          {
            _type: 'link',
            href: 'mailto:RRCCFireAssistance@rrcc.lacounty.gov',
            _key: 'a6035111ee83',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'By Email',
            _key: '91805d11a1f7',
          },
          {
            marks: [],
            text: ': Contact ',
            _key: '347fba4429f8',
            _type: 'span',
          },
          {
            _type: 'span',
            marks: ['strong', 'a6035111ee83'],
            text: 'RRCCFireAssistance@rrcc.lacounty.gov',
            _key: '9031ac08d220',
          },
          {
            _type: 'span',
            marks: [],
            text: ' for assistance.',
            _key: '3c3b682cbc87',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: 'aa910f9a4d89',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'More Information',
            _key: 'a1a2441669ee',
          },
          {
            marks: [],
            text: ': Visit the provided resource link for additional details and onsite locations.',
            _key: '3504de2be623',
            _type: 'span',
          },
        ],
        level: 1,
      },
    ],
    shortDescription: [
      {
        style: 'normal',
        _key: '25415c233be3',
        markDefs: [
          {
            _type: 'link',
            href: 'tel:+18002018999',
            _key: '7b9cf9a58c22',
          },
          {
            _type: 'link',
            href: 'mailto:RRCCFireAssistance@rrcc.lacounty.gov',
            _key: '321491884978',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'The ',
            _key: 'e90727c1a3fa',
          },
          {
            marks: ['em', 'strong'],
            text: 'LA County Recorder Office',
            _key: '1e131a673a47',
            _type: 'span',
          },
          {
            text: ' will replace property records, birth and death certificates, and marriage licenses lost in a fire at no cost. To request a free replacement, call ',
            _key: '14b2d66cdf91',
            _type: 'span',
            marks: [],
          },
          {
            _type: 'span',
            marks: ['7b9cf9a58c22'],
            text: '(800) 201-8999',
            _key: 'baf0e2f2f918',
          },
          {
            text: ' and select Option 1, then Option 2, or email ',
            _key: 'bd5198d95a65',
            _type: 'span',
            marks: [],
          },
          {
            _type: 'span',
            marks: ['321491884978'],
            text: 'RRCCFireAssistance@rrcc.lacounty.gov',
            _key: '234b6dcb89e5',
          },
          {
            _type: 'span',
            marks: [],
            text: '. ',
            _key: 'abffa668e5a3',
          },
        ],
        _type: 'block',
      },
    ],
    priority: 1,
    tags: [
      {
        slug: 'document-replacement-vital-records',
        label: 'Document Replacement - Vital Records',
        category: {
          slug: 'replace-documents',
          name: 'Replace Documents',
          priority: 1,
        },
      },
    ],
  },
  {
    title: 'Get In-Person Support',
    slug: 'get-in-person-support',
    resourceType: 'resource',
    resourceLink: 'https://recovery.lacounty.gov/recovery-centers/',
    tipsDescription: [
      {
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Local Assistance Centers and Disaster Recovery Centers are open daily from ',
            _key: '2fcff69a4f4c',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: '9:00 AM - 8:00 PM',
            _key: 'cf87f63a17a1',
          },
          {
            text: ' to assist the public.',
            _key: '93abc4143a18',
            _type: 'span',
            marks: [],
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '55b2c01538a8',
        markDefs: [],
      },
      {
        style: 'h4',
        _key: '4ddfdbf47307',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Locations',
            _key: 'e44d7afcb03b',
          },
        ],
        _type: 'block',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Westside Location',
            _key: '9fa3f3c8da82',
          },
          {
            _type: 'span',
            marks: [],
            text: '\nUCLA Research Park West\n10850 West Pico Blvd.\nLos Angeles, CA 90064',
            _key: '69c63da25a0e',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '5d6aaa65bc25',
      },
      {
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Eastside Location',
            _key: 'c3d2653d4778',
          },
          {
            _type: 'span',
            marks: [],
            text: '\nPasadena City College Community Education Center\n3035 E. Foothill Blvd.\nPasadena, CA 91107',
            _key: 'a78ba6fe80f4',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'cd99e360e486',
        markDefs: [],
      },
      {
        style: 'h4',
        _key: '627e87be3009',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Services Provided',
            _key: '9ebd9658ceca',
          },
        ],
        _type: 'block',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: 'c203c109526d',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Disaster centers can assist with:',
            _key: '58e8c7269bf5',
          },
        ],
      },
      {
        _key: 'd0ce87f8e509',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '78254b5a7520',
            _type: 'span',
            marks: [],
            text: 'Recovery of vital documentation (e.g., birth/death certificates, licenses, Social Security documentation).',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '1d8f33ea0c7a',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Application for disaster relief loans.',
            _key: 'e7b20d6093b3',
            _type: 'span',
          },
        ],
        level: 1,
      },
      {
        style: 'normal',
        _key: 'faae3e36c8c0',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Referrals for mental health counseling and other services.',
            _key: '42e3dbf613d9',
          },
        ],
        level: 1,
        _type: 'block',
      },
    ],
    shortDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: '07cd8e2289db',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Federal, state, and local agencies are available in one location at ',
            _key: '14d69e3c6b63',
          },
          {
            marks: ['em', 'strong'],
            text: 'Local Disaster Resource & Red Cross Centers',
            _key: 'ebe936ee5188',
            _type: 'span',
          },
          {
            text: ' ',
            _key: 'fedfc2687002',
            _type: 'span',
            marks: ['em'],
          },
          {
            _type: 'span',
            marks: [],
            text: 'to provide vital support and resources. They can help you recover important documents, apply for FEMA and other assistance programs, and provide updates on FEMA applications, including details about the appeal process. You can also speak directly with staff from local, state, and federal agencies for personalized guidance.',
            _key: '9b5372d535f7',
          },
        ],
      },
    ],
    priority: 6,
    tags: [
      {
        slug: 'general-in-person-support',
        label: 'General - In-Person Support',
        category: {
          slug: 'utilize-these-other-resources',
          name: 'Utilize These Other Resources',
          priority: 99,
        },
      },
    ],
  },
  {
    title: 'Family Source Centers',
    slug: 'family-source-centers',
    resourceType: 'resource',
    resourceLink: 'https://communityinvestment.lacity.gov/familysource-centers',
    tipsDescription: [
      {
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'With ',
            _key: 'a5bb1874031c',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: '19 locations across the City of Los Angeles',
            _key: '0ce85dd23b99',
          },
          {
            _type: 'span',
            marks: [],
            text: ', FSCs provide resources to help increase your family income, establish financial security, and build academic success.',
            _key: '8302991905aa',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'bac325714a15',
        markDefs: [],
      },
      {
        _type: 'block',
        style: 'normal',
        _key: 'bd739e706e2b',
        markDefs: [
          {
            _type: 'link',
            href: 'https://www.google.com/maps/d/u/0/viewer?mid=1uAu-LFMSL8LN5HHX-lCIGKzq6c-gQPVp&ll=34.01618317957864%2C-118.36008508217574&z=10',
            _key: '64a1a1da77f3',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: ['strong', '64a1a1da77f3'],
            text: 'View Locations Here',
            _key: '6de6c93d7a9a',
          },
        ],
      },
      {
        _type: 'block',
        style: 'h4',
        _key: 'bcc4009491fb',
        markDefs: [],
        children: [
          {
            text: 'Free Services May Include:',
            _key: '2c5868cab5e3',
            _type: 'span',
            marks: ['strong'],
          },
        ],
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Multi-Benefit Screening',
            _key: 'f854e1309ed3',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '86013ee45b6f',
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Information and Referral',
            _key: 'c90564f3ee58',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'a52e4d804ad0',
        listItem: 'bullet',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '6584d7259901',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Case Management',
            _key: 'd3110550e2fc',
          },
        ],
        level: 1,
      },
      {
        _type: 'block',
        style: 'normal',
        _key: 'ed08b9820e01',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '819a8fe652fd',
            _type: 'span',
            marks: [],
            text: 'Financial Education and Coaching',
          },
        ],
        level: 1,
      },
      {
        _key: 'b8e67576596f',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Credit Building',
            _key: '8ba1715c8926',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'c251268675a5',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Income Tax Preparation',
            _key: 'd9fc8c7a16e9',
          },
        ],
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '12e3f0b0075f',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Incentivized Savings Programs',
            _key: 'c6d8e91ccd8a',
          },
        ],
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '68dedbff251e',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Adult Education',
            _key: '860deec76481',
          },
        ],
        level: 1,
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Computer Literacy',
            _key: 'b0fbd3b09971',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '5945d57be36b',
        listItem: 'bullet',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '486281067ffc',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _key: '2eddcd8656ca',
            _type: 'span',
            marks: [],
            text: 'ESL Classes',
          },
        ],
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Pre-Employment and Employment Support',
            _key: 'c20b99e0776d',
            _type: 'span',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'b881572413d7',
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Immigration Services',
            _key: 'c6787ceda22d',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '00b325cc5831',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '27d5f11f31cb',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            marks: [],
            text: 'Parenting Classes',
            _key: 'e85d85b6c5b9',
            _type: 'span',
          },
        ],
        level: 1,
      },
      {
        _key: 'cc160dfd5d36',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'College Corner',
            _key: '06ee6a79a3c7',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '40c0fefb1b95',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Tutoring',
            _key: 'f1303dff8b33',
          },
        ],
      },
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Mentoring',
            _key: '6d5a277eee6c',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: 'f68d015cd6f6',
        listItem: 'bullet',
      },
      {
        _key: 'facdb9a3b11d',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Leadership Training',
            _key: '692ae0b38125',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '1d32e74548d9',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            text: 'Art and Cultural Activities',
            _key: 'dd9cd8d520e3',
            _type: 'span',
            marks: [],
          },
        ],
        level: 1,
      },
      {
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Civic Engagement',
            _key: '1a9cfd909a1b',
          },
        ],
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '1632f621e0d9',
      },
      {
        level: 1,
        _type: 'block',
        style: 'normal',
        _key: '0c2039636483',
        listItem: 'bullet',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Child Support Referral',
            _key: '135753e28d39',
          },
        ],
      },
    ],
    shortDescription: [
      {
        _key: '19f521f597e9',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong', 'em'],
            text: 'FamilySource Centers (FSC)',
            _key: '0913cf1b0321',
          },
          {
            _key: '175da81d1fa9',
            _type: 'span',
            marks: [],
            text: ' are a one-stop shop in your neighborhood, offering social, educational, work, and family support services. ',
          },
        ],
        _type: 'block',
        style: 'normal',
      },
    ],
    priority: 2,
    tags: [
      {
        slug: 'general-childcare',
        label: 'General - Childcare',
        category: {
          slug: 'utilize-these-other-resources',
          name: 'Utilize These Other Resources',
          priority: 99,
        },
      },
    ],
  },
  {
    title: 'Disaster Resources for Immigrant Communities ',
    slug: 'disaster-resources-for-immigrant-communities',
    resourceType: 'resource',
    resourceLink: 'https://oia.lacounty.gov/',
    tipsDescription: [
      {
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Additional Resources for Families',
            _key: '27d6969cf0eb',
          },
        ],
        _type: 'block',
        style: 'h4',
        _key: '94c089108012',
      },
      {
        _type: 'block',
        style: 'normal',
        _key: '916ec3392feb',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'For families, be sure to explore ',
            _key: 'd65684203787',
          },
          {
            _type: 'span',
            marks: ['strong'],
            text: 'Family: Childcare & School Information',
            _key: '325e4839925b',
          },
          {
            _type: 'span',
            marks: [],
            text: ' resources for assistance.',
            _key: '8a658115a958',
          },
        ],
      },
    ],
    shortDescription: [
      {
        _key: 'ada451d959d8',
        markDefs: [
          {
            _type: 'link',
            href: 'tel:+18005938222',
            _key: '29c5c187941a',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'The ',
            _key: '3dd9fe6c0571',
          },
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'Office of Immigrant Affairs',
            _key: 'bf9a99a5c124',
          },
          {
            _key: 'ba858852d79e',
            _type: 'span',
            marks: [],
            text: ' provides disaster resources including legal services for immigrants. The website is multilingual and you can call their hotline: ',
          },
          {
            _type: 'span',
            marks: ['29c5c187941a'],
            text: '(800) 593-8222',
            _key: '5b48d33e56fd',
          },
        ],
        _type: 'block',
        style: 'normal',
      },
    ],
    priority: 5,
    tags: [
      {
        slug: 'general-immigrant-related',
        label: 'General - Immigrant-Related',
        category: {
          slug: 'utilize-these-other-resources',
          name: 'Utilize These Other Resources',
          priority: 99,
        },
      },
    ],
  },
  {
    title: 'Help to Prevent Eviction',
    slug: 'help-to-prevent-eviction',
    resourceType: 'alert',
    resourceLink: null,
    tipsDescription: null,
    shortDescription: [
      {
        children: [
          {
            _type: 'span',
            marks: [],
            text: "If you're struggling to afford rent, food, childcare and possible eviction, contact the ",
            _key: '555c1f00db660',
          },
          {
            _key: 'c14ddf665060',
            _type: 'span',
            marks: ['em', 'strong'],
            text: "Mayor’s Fund For Los Angeles' We Are LA Hotline",
          },
          {
            _type: 'span',
            marks: [],
            text: ' at ',
            _key: '0bafc47eaae2',
          },
          {
            text: '(213) 584-1808',
            _key: 'f53116fdd51d',
            _type: 'span',
            marks: ['04196ed147ed'],
          },
          {
            _type: 'span',
            marks: [],
            text: '. They can help you get the help you need.',
            _key: 'e64d9097f707',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: 'f7b6565ce603',
        markDefs: [
          {
            _type: 'link',
            href: 'tel:+12135841808',
            _key: '04196ed147ed',
          },
        ],
      },
    ],
    priority: 1,
    tags: [
      {
        slug: 'income-low-income',
        label: 'Income - Low Income',
        category: {
          slug: 'seek-financial-assistance',
          name: 'Seek Financial Assistance',
          priority: 5,
        },
      },
    ],
  },
  {
    title: 'Replace Income Tax Documents',
    slug: 'replace-income-tax-documents',
    resourceType: 'resource',
    resourceLink:
      'https://www.ftb.ca.gov/file/when-to-file/los-angeles-county-fires.html',
    tipsDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: 'e68881c9b57d',
        markDefs: [
          {
            href: 'tel:+18888259868',
            _key: '727d98a5aa21',
            _type: 'link',
          },
        ],
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'For additional information on replacing income tax documents, see the resource link or call ',
            _key: 'cb1d052ac588',
          },
          {
            _type: 'span',
            marks: ['strong', '727d98a5aa21'],
            text: '(888) 825-9868',
            _key: '7ea302b973c4',
          },
          {
            _type: 'span',
            marks: [],
            text: '.',
            _key: 'a626b522659f',
          },
        ],
      },
    ],
    shortDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: '724c4d2f5783',
        markDefs: [],
        children: [
          {
            _type: 'span',
            marks: ['em', 'strong'],
            text: 'California Tax Franchise Board (FTB)',
            _key: '9ab639162eaf',
          },
          {
            _type: 'span',
            marks: [],
            text: ' can help you replace income tax documents.',
            _key: 'b8abe0178221',
          },
        ],
      },
    ],
    priority: 5,
    tags: [
      {
        slug: 'document-replacement-other',
        label: 'Document Replacement - Other',
        category: {
          slug: 'replace-documents',
          name: 'Replace Documents',
          priority: 1,
        },
      },
    ],
  },
  {
    title: 'Replace Other Documents',
    slug: 'replace-other-documents',
    resourceType: 'resource',
    resourceLink:
      'https://news.caloes.ca.gov/replacing-personal-documents-after-a-natural-disaster-2/',
    tipsDescription: null,
    shortDescription: [
      {
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'Documents that you can replace include EBT card, Medicare Cards, Green card, Military Documents, ATM & Credit Cards, Fraud alert and more.',
            _key: 'd987ceeb9bf6',
          },
        ],
        _type: 'block',
        style: 'normal',
        _key: '724c4d2f5783',
        markDefs: [],
      },
    ],
    priority: 7,
    tags: [
      {
        slug: 'document-replacement-other',
        label: 'Document Replacement - Other',
        category: {
          slug: 'replace-documents',
          name: 'Replace Documents',
          priority: 1,
        },
      },
    ],
  },
  {
    title: 'Replace Manufactured/Mobile Home Documents',
    slug: 'replace-manufactured-mobile-home-documents',
    resourceType: 'resource',
    resourceLink: 'https://www.hcd.ca.gov/manufactured-and-mobilehomes',
    tipsDescription: null,
    shortDescription: [
      {
        _type: 'block',
        style: 'normal',
        _key: '724c4d2f5783',
        markDefs: [],
        children: [
          {
            text: 'The ',
            _key: '0274951ff70e0',
            _type: 'span',
            marks: [],
          },
          {
            text: 'Department of Housing and Community Development (HCD)',
            _key: '80d8974140c0',
            _type: 'span',
            marks: ['em', 'strong'],
          },
          {
            text: ' will help you get or replace manufactured and mobile home documents.',
            _key: '9033808146ce',
            _type: 'span',
            marks: [],
          },
        ],
      },
    ],
    priority: 6,
    tags: [
      {
        slug: 'document-replacement-other',
        label: 'Document Replacement - Other',
        category: {
          slug: 'replace-documents',
          name: 'Replace Documents',
          priority: 1,
        },
      },
    ],
  },
];

const allQestions = getAllQuestions(surveyConfig);

function findQuestionById(id: string) {
  return allQestions.find((q) => q.id === id);
}

function getAnswerTags(answer: TAnswer, answerOptions: TOption[]): string[] {
  const answerTags: string[] = [];

  let results = answer.result;

  if (typeof results === 'string') {
    results = [results];
  }

  for (const result of results) {
    const resultOption = answerOptions.find((o) => o.optionId === result);

    if (!resultOption) {
      continue;
    }

    const optionTags = resultOption.tags || [];

    for (const tag of optionTags) {
      answerTags.push(tag);
    }
  }

  return answerTags;
}

function getTags(answers: TAnswer[]): string[] {
  const tags: string[] = [];

  for (const answer of answers) {
    const questionAnswered = findQuestionById(answer.questionId);

    if (!questionAnswered?.options) {
      continue;
    }

    const answerTags = getAnswerTags(answer, questionAnswered?.options);

    for (const answerTag of answerTags) {
      tags.push(answerTag);
    }
  }

  return tags;
}

type IProps = {
  className?: string;
  results?: TSurveyResults | null;
};

export function SurveyResults(props: IProps) {
  const { results, className } = props;

  // const { answers = [] } = results;

  // const queryTags = getTags(answers);

  // const { isLoading, isError, data, error } = useQuery({
  //   queryKey: queryTags,
  //   queryFn: () => fetchAllAlertsAndResourcesByTagsFn(queryTags),
  //   refetchOnWindowFocus: false,
  //   retry: 1,
  // });

  const parentCss = [className];

  return (
    <div className={mergeCss(parentCss)}>
      {/* {!!data?.length && (
        <SurveyResources className="border-4 border-red-500" resources={data} />
      )} */}

      <SurveyResources
        className="border-4 border-red-500"
        resources={savedResources as TResource[]}
      />
    </div>
  );
}
