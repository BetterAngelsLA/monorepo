import { Colors } from '@monorepo/expo/shared/static';
import { Accordion } from '@monorepo/expo/shared/ui-components';
import { ReactElement, forwardRef, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { MainScrollContainer } from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import FullNameDetails from './ClientProfileSections/FullNameDetails';
import ImportantNotes from './ClientProfileSections/ImportantNotes';
import PersonalInfo from './ClientProfileSections/PersonalInfo';

interface ProfileRef {
  scrollToRelevantContacts: () => void;
}

interface ProfileProps {
  client: ClientProfileQuery | undefined;
}

enum ClientProfileSectionsEnum {
  FullName = 'FULL_NAME',
  PersonalInfo = 'PERSONAL_INFO',
  ImportantNotes = 'IMPORTANT_NOTES',
  Demographic = 'DEMOGRAPHIC',
  ContactInfo = 'CONTACT_INFO',
  RelevantContacts = 'RELEVANT_CONTACTS',
  Household = 'HOUSEHOLD',
  HmisIds = 'HMIS_IDS',
}

const SectionTitles: Record<ClientProfileSectionsEnum, string> = {
  [ClientProfileSectionsEnum.FullName]: 'Full Name',
  [ClientProfileSectionsEnum.PersonalInfo]: 'Personal Info',
  [ClientProfileSectionsEnum.ImportantNotes]: 'Important Notes',
  [ClientProfileSectionsEnum.Demographic]: 'Demographic',
  [ClientProfileSectionsEnum.ContactInfo]: 'Contact Info',
  [ClientProfileSectionsEnum.RelevantContacts]: 'Relevant Contacts',
  [ClientProfileSectionsEnum.Household]: 'Household',
  [ClientProfileSectionsEnum.HmisIds]: 'HMIS IDs',
} as const;

type TSectionTitleKey = keyof typeof SectionTitles;
type TSectionTitle = (typeof SectionTitles)[TSectionTitleKey];

const ClientProfile = forwardRef<ProfileRef, ProfileProps>(
  ({ client }, ref) => {
    const scrollRef = useRef<ScrollView>(null);

    const [expandedTitle, setExpandedTitle] = useState<TSectionTitle | null>(
      null
    );

    return (
      <MainScrollContainer ref={scrollRef} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <View>
          <AccordionSection
            section={ClientProfileSectionsEnum.FullName}
            expandedTitle={expandedTitle}
            setExpandedTitle={setExpandedTitle}
          >
            <FullNameDetails client={client} />
          </AccordionSection>

          <AccordionSection
            section={ClientProfileSectionsEnum.PersonalInfo}
            expandedTitle={expandedTitle}
            setExpandedTitle={setExpandedTitle}
          >
            <PersonalInfo client={client} />
          </AccordionSection>

          <AccordionSection
            section={ClientProfileSectionsEnum.ImportantNotes}
            expandedTitle={expandedTitle}
            setExpandedTitle={setExpandedTitle}
          >
            <ImportantNotes client={client} />
          </AccordionSection>
        </View>
      </MainScrollContainer>
    );
  }
);

export default ClientProfile;

type TAccordionSection = {
  section: ClientProfileSectionsEnum;
  children: ReactElement;
  expandedTitle: TSectionTitle | null;
  setExpandedTitle: any;
};

function AccordionSection(props: TAccordionSection) {
  const { expandedTitle, section, setExpandedTitle, children } = props;

  const title = SectionTitles[section];
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
