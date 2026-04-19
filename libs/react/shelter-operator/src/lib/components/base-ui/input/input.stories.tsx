import type { Meta } from '@storybook/react';
import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  component: Input,
  title: 'Base UI/Input',
  parameters: {
    customLayout: {
      canvasClassName: 'w-[36rem] max-w-[min(36rem,calc(100vw-4rem))]',
    },
  },
};

export default meta;

const storyWrapperClass = 'w-full p-4';

export const Basic = () => {
  const [value, setValue] = useState('');

  return (
    <div className={storyWrapperClass}>
      <Input
        label="Shelter Name"
        placeholder="Enter shelter name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};

export const EmailValidation = () => {
  const [value, setValue] = useState('');

  return (
    <div className={storyWrapperClass}>
      <Input
        label="Email Address"
        dataType="email"
        required
        placeholder="name@example.org"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};

export const WithError = () => {
  const [value, setValue] = useState('');

  return (
    <div className={storyWrapperClass}>
      <Input
        label="Phone Number"
        dataType="phone number"
        required
        placeholder="(555) 123-4567"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};

export const WithAdornments = () => {
  const [value, setValue] = useState('');

  return (
    <div className={storyWrapperClass}>
      <Input
        label="Search Operator"
        placeholder="Search by name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rightAdornment={<SearchIcon className="h-4 w-4" />}
      />
    </div>
  );
};

export const Disabled = () => {
  return (
    <div className={storyWrapperClass}>
      <Input
        label="Read Only Field"
        placeholder="Cannot edit"
        value="Pre-filled value"
        disabled
        readOnly
      />
    </div>
  );
};

export const Paragraph = () => {
  const [value, setValue] = useState('');

  return (
    <div className={storyWrapperClass}>
      <Input
        variant="paragraph"
        label="Field Label"
        required
        placeholder="Placeholder text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};
