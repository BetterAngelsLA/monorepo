import {
  ScheduleTypeChoices,
  type ScheduleInput,
} from '@monorepo/react/shelter';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  useAdminShelterProfile,
  useUpdateShelterProfile,
} from '../../../../hooks';
import { ButtonDropdown } from '../../../base-ui/buttonDropdown';
import { Tabs } from '../../../base-ui/tabs';
import { useToast } from '../../../base-ui/toast';
import { Form } from '../../../form/Form';
import { SCHEDULE_TABS, SCHEDULE_TAB_LABELS } from './constants';
import { DeleteScheduleModal } from './DeleteScheduleModal';
import { ShelterSchedulesForm } from './ShelterSchedulesForm';

type TProps = {
  shelterId: string;
};

export function ShelterSchedules(props: TProps) {
  const { shelterId } = props;

  const [currentTab, setCurrentTab] = useState(ScheduleTypeChoices.Operating);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const { shelter } = useAdminShelterProfile(shelterId);
  const { updateShelter } = useUpdateShelterProfile();
  const { showToast } = useToast();

  async function onSave(
    scheduleType: ScheduleTypeChoices,
    scheduleInputs: ScheduleInput[]
  ) {
    if (!shelter) {
      return;
    }

    const isDelete = scheduleInputs.length === 0;

    const otherSchedules: ScheduleInput[] = shelter.schedules
      .filter((s) => s.scheduleType !== scheduleType)
      .map((s) => ({
        scheduleType: s.scheduleType,
        days: s.day ? [s.day] : undefined,
        startTime: s.startTime ?? undefined,
        endTime: s.endTime ?? undefined,
        startDate: s.startDate ?? undefined,
        endDate: s.endDate ?? undefined,
        condition: s.condition ?? undefined,
        isException: s.isException,
      }));

    try {
      const response = await updateShelter({
        variables: {
          data: {
            id: shelterId,
            schedules: [...otherSchedules, ...scheduleInputs],
          },
        },
      });

      const result = response.data?.updateShelter;

      if (result?.__typename === 'ShelterType') {
        showToast({
          status: 'success',
          title: isDelete ? 'Schedule deleted.' : 'Schedule updated.',
        });

        return;
      }

      throw new Error('unexpected query error');
    } catch (e) {
      console.error(`[updateShelter error]: ${e}.`);

      showToast({
        status: 'error',
        title: isDelete ? 'Delete failed' : 'Update failed',
        description: 'An unexpected error occurred.',
      });
    }
  }

  if (!shelter) {
    return null;
  }

  const existingTypes = SCHEDULE_TABS.filter((type) =>
    shelter.schedules.some((s) => s.scheduleType === type)
  );

  const missingTypes = SCHEDULE_TABS.filter((t) => !existingTypes.includes(t));
  const missingItems = missingTypes.map((t) => ({
    value: t,
    label: SCHEDULE_TAB_LABELS[t],
  }));

  const displayedTabs = existingTypes.includes(currentTab)
    ? existingTypes
    : [...existingTypes, currentTab];

  return (
    <>
      {deleteModalVisible && (
        <DeleteScheduleModal
          scheduleType={currentTab}
          onConfirm={() => {
            onSave(currentTab, []);
            setDeleteModalVisible(false);
          }}
          onClose={() => setDeleteModalVisible(false)}
        />
      )}

      <div className="px-6 flex-col flex-1 pb-72">
        <Form.Header title="Shelter Schedule" className="pl-5" />

        <Tabs
          tabs={displayedTabs}
          selectedTab={currentTab}
          onTabPress={setCurrentTab}
          getLabel={(tab) => SCHEDULE_TAB_LABELS[tab]}
          endContent={
            <ButtonDropdown
              className="ml-auto"
              items={missingItems}
              disabled={missingTypes.length === 0}
              onSelect={(item) =>
                setCurrentTab(item.value as ScheduleTypeChoices)
              }
              leftIcon={<Plus size={20} />}
              menuAlign="right"
            >
              Add Schedule
            </ButtonDropdown>
          }
        />

        <ShelterSchedulesForm
          scheduleType={currentTab}
          schedules={shelter.schedules}
          onSave={(schedules) => onSave(currentTab, schedules)}
          onDelete={() => setDeleteModalVisible(true)}
        />
      </div>
    </>
  );
}
