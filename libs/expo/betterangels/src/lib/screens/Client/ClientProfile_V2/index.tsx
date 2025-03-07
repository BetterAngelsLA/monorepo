import { Colors } from '@monorepo/expo/shared/static';
import { Accordion } from '@monorepo/expo/shared/ui-components';
import { Dispatch, ReactElement, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { MainScrollContainer } from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { ContactInfo } from './ClientProfileSections/ContactInfo';
import { DemographicInfo } from './ClientProfileSections/DemographicInfo';
import { FullNameDetails } from './ClientProfileSections/FullNameDetails';
import { HouseholdMembers } from './ClientProfileSections/HouseholdMembers';
import { ImportantNotes } from './ClientProfileSections/ImportantNotes';
import { PersonalInfo } from './ClientProfileSections/PersonalInfo';
import { RelevantContacts } from './ClientProfileSections/RelevantContacts';
import { ClientProfileSectionsEnum, ClientSectionTitles } from './constants';
import { TClientSectionTitle } from './types';

interface ProfileProps {
  client: ClientProfileQuery | undefined;
}

export default function ClientProfile(props: ProfileProps) {
  const { client } = props;
  const scrollRef = useRef<ScrollView>(null);

  const [expandedTitle, setExpandedTitle] =
    useState<TClientSectionTitle | null>(null);

  const clientProfile = client?.clientProfile;

  return (
    <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View>
        <AccordionSection
          section={ClientProfileSectionsEnum.FullName}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <FullNameDetails clientProfile={clientProfile} />
        </AccordionSection>

        <AccordionSection
          section={ClientProfileSectionsEnum.PersonalInfo}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <PersonalInfo clientProfile={clientProfile} />
        </AccordionSection>

        <AccordionSection
          section={ClientProfileSectionsEnum.ImportantNotes}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <ImportantNotes clientProfile={clientProfile} />
        </AccordionSection>

        <AccordionSection
          section={ClientProfileSectionsEnum.Demographic}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <DemographicInfo clientProfile={clientProfile} />
        </AccordionSection>

        <AccordionSection
          section={ClientProfileSectionsEnum.ContactInfo}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <ContactInfo clientProfile={clientProfile} />
        </AccordionSection>

        <AccordionSection
          section={ClientProfileSectionsEnum.RelevantContacts}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <RelevantContacts clientProfile={clientProfile} />
        </AccordionSection>

        <AccordionSection
          section={ClientProfileSectionsEnum.Household}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <HouseholdMembers clientProfile={clientProfile} />
        </AccordionSection>

        <AccordionSection
          section={ClientProfileSectionsEnum.HmisIds}
          expandedTitle={expandedTitle}
          setExpandedTitle={setExpandedTitle}
        >
          <ImportantNotes clientProfile={clientProfile} />
        </AccordionSection>
      </View>
    </MainScrollContainer>
  );
}

type TAccordionSection = {
  section: ClientProfileSectionsEnum;
  children: ReactElement;
  expandedTitle: TClientSectionTitle | null;
  setExpandedTitle: Dispatch<React.SetStateAction<TClientSectionTitle | null>>;
};

function AccordionSection(props: TAccordionSection) {
  const { expandedTitle, section, setExpandedTitle, children } = props;

  const title = ClientSectionTitles[section];
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
