import { Accordion } from '@monorepo/expo/shared/ui-components';
import { Dispatch, ReactElement } from 'react';
import { ClientProfileCardEnum, ClientProfileCardTitles } from '../constants';
import { TClientProfileCardTitle } from '../types';

export type TCardAccordion = {
  section: ClientProfileCardEnum;
  children: ReactElement;
  expandedTitle: TClientProfileCardTitle | null;
  setExpandedTitle: Dispatch<
    React.SetStateAction<TClientProfileCardTitle | null>
  >;
};

export function CardAccordion(props: TCardAccordion) {
  const { expandedTitle, section, setExpandedTitle, children } = props;

  const title = ClientProfileCardTitles[section];
  const isExpanded = expandedTitle === title;

  function onClickExpanded() {
    setExpandedTitle(isExpanded ? null : title);
  }

  return (
    <Accordion
      expanded={expandedTitle}
      setExpanded={() => onClickExpanded()}
      mb="xs"
      title={title}
    >
      {isExpanded && children}
    </Accordion>
  );
}
