import { mergeCss } from '@monorepo/react/shared';
import { useState } from 'react';
import { useShelter } from '../../../hooks/useShelter';
import { LocationPicker } from '../../../pages/dashboard/components/create-shelter-form/components/LocationPicker';
import {
  DEMOGRAPHICS_OPTIONS,
  getSelectedOptions,
} from '../../../pages/dashboard/formOptions';
import { LocationData } from '../../../pages/dashboard/formTypes';
import { Dropdown } from '../../base-ui/dropdown';
import { Input } from '../../base-ui/input';
import { Switch } from '../../base-ui/switch';
import { Form } from '../../form/Form';

type TProps = {
  shelterId: string;
};

export function BasicInfo(props: TProps) {
  const { shelterId } = props;

  const [isEditMode, setEditMode] = useState<boolean>(false);
  const [disabled, _setDisabled] = useState<boolean>(false);

  const { shelter } = useShelter(shelterId);

  const {
    name,
    isPrivate,
    location,
    email,
    phone,
    description,
    website,
    demographics = [],
  } = shelter || {};

  console.log(shelter);
  console.log(demographics);

  function onSave() {
    console.log('SAVE');
  }

  function onCancel() {
    setEditMode(false);
  }

  const rowCss = ['grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8'];

  return (
    <div className="px-6 flex-col flex-1 pb-48">
      <Form className="flex-1">
        <Form.Header
          title="Basic Information"
          onEditClick={isEditMode ? undefined : () => setEditMode(true)}
          className="pl-5"
        />

        <div className="flex flex-col gap-6 mt-8">
          <Input
            label="Name"
            dataType="string"
            value={name}
            onChange={(v) => console.log(v.target.value)}
            disabled={disabled}
            required={true}
            isViewMode={!isEditMode}
          />

          <LocationPicker
            value={location as LocationData}
            onChange={(value) => console.log(value)}
            // error={errors.location}
            label="Location"
            expandable={true}
            isViewMode={!isEditMode}
          />

          <Input
            variant="paragraph"
            label="Description"
            dataType="string"
            value={description}
            onChange={(v) => console.log(v.target.value)}
            disabled={disabled}
            isViewMode={!isEditMode}
          />

          <div className={mergeCss(rowCss)}>
            <Input
              label="Email"
              dataType="email"
              value={email ?? ''}
              onChange={(v) => console.log(v.target.value)}
              disabled={disabled}
              isViewMode={!isEditMode}
            />

            <Switch
              label="Private"
              value={!!isPrivate}
              onChange={() => console.log('switch')}
              disabled={disabled}
              isViewMode={!isEditMode}
            />

            <Input
              label="Phone"
              dataType="phone-number"
              value={phone ?? ''}
              onChange={(v) => console.log(v.target.value)}
              disabled={disabled}
              isViewMode={!isEditMode}
            />

            <Input
              label="Website"
              dataType="string"
              value={website ?? ''}
              onChange={(v) => console.log(v.target.value)}
              disabled={disabled}
              isViewMode={!isEditMode}
            />

            <Dropdown
              label="Demographics Served"
              options={DEMOGRAPHICS_OPTIONS}
              isMulti={true}
              isViewMode={!isEditMode}
              disabled={disabled}
              onChange={(v) => {
                console.log(v);
              }}
              value={getSelectedOptions(demographics, DEMOGRAPHICS_OPTIONS)}
            />
          </div>

          {isEditMode && (
            <Form.Actions onPrimaryClick={onSave} onSecondaryClick={onCancel} />
          )}
        </div>
      </Form>
    </div>
  );
}
