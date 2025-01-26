import { ChevronLeftIcon, GlobeIcon } from '@monorepo/react/icons';
import { useEffect, useRef, useState } from 'react';
import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  className?: string;
};

export function GoogleTranslateBtn(props: IProps) {
  const { className } = props;

  const parentCss = ['md:mr-12', className, 'relative', 'inline-block'];

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('right');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const langs = [
    { id: 'hy', text: 'Armenian' },
    { id: 'zh-CN', text: 'Chinese (Simplified)' },
    { id: 'en', text: 'English' },
    { id: 'tl', text: 'Filipino' },
    { id: 'fr', text: 'French' },
    { id: 'ja', text: 'Japanese' },
    { id: 'ko', text: 'Korean' },
    { id: 'fa', text: 'Persian' },
    { id: 'ru', text: 'Russian' },
    { id: 'es', text: 'Spanish' },
    { id: 'vi', text: 'Vietnamese' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const isMobile = window.innerWidth < 768; // Mobile breakpoint
      setDropdownPosition(isMobile ? 'right' : 'left'); // Adjust alignment
    }
  }, [isOpen]);

  return (
    <div className={mergeCss(parentCss)} ref={dropdownRef}>
      {/* Render GlobeIcon on mobile and "Language" with arrow on large screens */}
      <button
        className="flex items-center space-x-2 cursor-pointer"
        onClick={toggleDropdown}
      >
        <GlobeIcon
          className="h-6 w-6 lg:hidden" // Globe icon visible only on mobile
          stroke="white"
          fill="none"
        />
        <span className="hidden lg:flex items-center">
          Language
          <ChevronLeftIcon
            className={`ml-1 h-4 w-4 transform transition-transform ${
              isOpen ? 'rotate-90' : '-rotate-90'
            }`}
          /> {/* Toggles between pointing up and down */}
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 w-48 bg-white text-black border border-gray-200 rounded shadow-lg z-10 ${
            dropdownPosition === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <ul className="py-1">
            {langs.map((lang) => (
              <li
                key={lang.id}
                id={lang.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer notranslate"
              >
                {lang.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
