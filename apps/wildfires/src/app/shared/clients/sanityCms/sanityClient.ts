import { createClient } from '@sanity/client';

const DEFAULT_DATASET = 'production';
const DEFAULT_PROJECT_ID = '4v490tec';

const dataset = import.meta.env.VITE_CMS_SANITY_DATASET;
const projectId = import.meta.env.VITE_CMS_SANITY_PROJECT_ID;

export const sanityClient = createClient({
  projectId: projectId || DEFAULT_PROJECT_ID,
  dataset: dataset || DEFAULT_DATASET,
  useCdn: true,
  apiVersion: '2025-01-17', // use current date (YYYY-MM-DD) to target the latest API version
});
