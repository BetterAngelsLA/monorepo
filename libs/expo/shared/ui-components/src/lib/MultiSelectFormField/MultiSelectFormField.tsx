import BottomSheet from '@gorhom/bottom-sheet';
import { useState } from 'react';
import { MultiSelectInput } from './MultiSelectInput';

type TProps = {
  name: string;
  label: string;
  options: string[];
};

export function MultiSelectFormField(props: TProps) {
  const { name, label, options } = props;

  //   const { setValue, getValues } = useFormContext();

  const [open, setOpen] = useState(false);
  //   const [staged, setStaged] = useState<string[]>(getValues(name) ?? []);

  return (
    <>
      <MultiSelectInput
        placeholder="hello"
        items={[{ displayValue: 'done', value: 'd1' }]}
        onFocus={() => {
          console.log('ON FOCUS');
        }}
      />

      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheet.Header
          title={label}
          right={
            <>
              <Button onPress={() => setStaged([])}>Clear</Button>
              <Button
                onPress={() => {
                  setValue(name, staged, {
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </>
          }
        />
        <BottomSheet.Content>
          <SearchInput onChange={/* filter */} />
          <CheckboxList
            options={options}
            values={staged}
            onChange={setStaged}
          />
        </BottomSheet.Content>
      </BottomSheet>
    </>
  );
}
