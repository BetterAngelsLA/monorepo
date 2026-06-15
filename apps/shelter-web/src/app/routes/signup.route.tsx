import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { shelterHomePath } from '@monorepo/react/shelter';
import { gql } from '@apollo/client';

const SHELTER_OPERATOR_SIGNUP = gql`
  mutation ShelterOperatorSignup($data: ShelterOperatorSignupInput!) {
    shelterOperatorSignup(data: $data) {
      user {
        id
        email
        firstName
        lastName
      }
      organization {
        id
        name
      }
    }
  }
`;

export function SignupRoute() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'loading' | 'error'>('form');
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  const [signup] = useMutation(SHELTER_OPERATOR_SIGNUP, {
    onCompleted: () => {
      navigate(shelterHomePath, { replace: true });
    },
    onError: (err) => {
      setStep('error');
      setError(err.message || 'Signup failed. Please try again.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('loading');
    setError('');

    try {
      await signup({
        variables: {
          data: {
            email: email.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            organizationName: organizationName.trim(),
          },
        },
      });
    } catch {
      // error handled in onError callback
    }
  };

  if (step === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#3B82F6] mx-auto" />
          <p className="text-gray-600">Creating your organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Create your Shelter Organization
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          Sign up to manage your shelter, rooms, and beds on Better Angels.
        </p>

        {step === 'error' && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => setStep('form')}
            >
              Try again
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              placeholder="you@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="organizationName"
              className="block text-sm font-medium text-gray-700"
            >
              Organization Name
            </label>
            <input
              id="organizationName"
              type="text"
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              placeholder="Your shelter organization name"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
          >
            Create Organization
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/sign-in" className="text-[#3B82F6] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}