import { ChevronLeftIcon, GlobeIcon } from '@monorepo/react/icons';
import { useEffect, useRef, useState } from 'react';
import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  className?: string;
};

export function GoogleTranslateBtn(props: IProps) {
  const { className } = props;

  const parentCss = [className, 'relative', 'inline-block'];

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>(
    'right'
  );
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = dropdownRef.current.offsetWidth;

      // Check available space on the right and left
      const availableSpaceRight = window.innerWidth - buttonRect.right;
      const availableSpaceLeft = buttonRect.left;

      // Flip to the left if there's not enough space on the right
      if (
        availableSpaceRight < dropdownWidth &&
        availableSpaceLeft >= dropdownWidth
      ) {
        setDropdownPosition('left');
      } else {
        setDropdownPosition('right');
      }
      const options = dropdownRef.current.querySelectorAll<HTMLLIElement>('li');
      options.forEach((option) => {
        const handleOptionClick = () => {
          const selectElement =
            document.querySelector<HTMLSelectElement>('.goog-te-combo');
          if (selectElement) {
            selectElement.value = option.id;
            const event = new Event('change');
            selectElement.dispatchEvent(event);
          }
          closeDropdown();
        };
        option.addEventListener('click', handleOptionClick);

        // Cleanup event listener on unmount or when the dropdown closes
        return () => {
          option.removeEventListener('click', handleOptionClick);
        };
      });
    }
  }, [isOpen]);

  return (
    <div className={mergeCss(parentCss)} ref={dropdownRef}>
      <button
        ref={buttonRef}
        className="flex items-center cursor-pointer"
        onClick={toggleDropdown}
      >
        <GlobeIcon className="h-6 w-6 lg:hidden" stroke="white" fill="none" />
        <span className="hidden lg:flex items-center">
          Language
          <ChevronLeftIcon
            className={`ml-1 h-4 w-4 transform transition-transform ${
              isOpen ? 'rotate-90' : '-rotate-90'
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 w-48 bg-white text-black border border-gray-200 rounded shadow-lg z-10 ${
            dropdownPosition === 'left' ? 'left-0' : 'right-0'
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
