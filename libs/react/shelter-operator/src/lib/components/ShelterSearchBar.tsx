import { useState } from 'react';

interface ShelterSearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
}

export default function ShelterSearchBar({
  placeholder = 'Search shelters',
  onSearch,
}: ShelterSearchBarProps) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
    console.log(query);
  };

  return (
    <form className="w-full flex items-center gap-2">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="px-4 py-2 rounded-xl outline-none shadow-sm my-4"
      />
    </form>
  );
}
