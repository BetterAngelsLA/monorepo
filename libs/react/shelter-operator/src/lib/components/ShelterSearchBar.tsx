import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { searchQueryAtom } from '../atoms/shelters';

export default function ShelterSearchBar({ placeholder = 'Search shelters' }) {
  const [query, setQuery] = useState('');
  const setSearchQuery = useSetAtom(searchQueryAtom);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSearchQuery(value);
  };

  return (
    <form className="w-full flex items-center gap-2">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="px-6 py-2 rounded-3xl border outline-none shadow-sm my-4"
      />
    </form>
  );
}
