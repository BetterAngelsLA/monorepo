import { Button } from '@monorepo/react/components';
import { useState } from 'react';
import Input from '../Input';

export function AddUserForm() {
  const [disabled, setDisabled] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  function onSubmit() {
    console.log('################################### onSubmit');
  }

  function onCancel() {
    console.log('################################### onCancel');
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-6">
        <Input
          required
          type="text"
          className="mb-4"
          inputClassname="input-md w-96"
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoCapitalize="none"
          placeholder="Enter first name"
        />

        <Input
          required
          type="text"
          className="mb-4"
          inputClassname="input-md w-96"
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoCapitalize="none"
          placeholder="Enter last name"
        />

        <Input
          required
          type="email"
          className="mb-4"
          inputClassname="input-md w-96"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoCapitalize="none"
          placeholder="Enter email address"
        />
      </div>

      <div className="mt-auto border-t border-neutral-90 p-6 flex justify-end items-center">
        <button
          className="mr-12 text-primary-20 text-base font-semibold"
          onClick={onCancel}
          disabled={disabled}
        >
          Cancel
        </button>

        <Button
          size="2xl"
          variant="accent"
          onClick={onSubmit}
          disabled={disabled}
        >
          Add User
        </Button>
      </div>
    </div>
  );
}
