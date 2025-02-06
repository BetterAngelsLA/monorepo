import { TQuestion } from '../../../../../../shared/components/survey/types';

export const qIsSmallBusiness: TQuestion = {
  id: 'qIsSmallBusiness',
  type: 'radio',
  title:
    'Do you own or run a small business that was impacted by the wildfires?',
  body: 'A small business is an independent for profit* company with less than 500 employees and $5 million in annual revenue – the revenue limit amount can vary by industry.',
  note: (
    <span>
      *Note: Qualified non-profit organizations whose facilities have been
      impacted by the wildfires, can be eligible for FEMA disaster assistance (
      <a
        href="https://www.fema.gov"
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        FEMA.gov
      </a>
      )
    </span>
  ),
  options: [
    {
      optionId: 'smallBusinessYes',
      label: 'Yes',
      // tags: ['Business - Small Business']
      tags: ['business-small-business'],
    },
    {
      optionId: 'smallBusinessNo',
      label: 'No',
    },
  ],
  rules: {
    required: true,
  },
};
