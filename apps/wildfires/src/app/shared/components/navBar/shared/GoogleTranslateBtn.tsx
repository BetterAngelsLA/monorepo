import { useEffect, useRef, useState } from 'react';
import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  className?: string;
};

export function GoogleTranslateBtn(props: IProps) {
  const { className } = props;

  const parentCss = ['md:mr-12', className, 'relative', 'inline-block'];

  const [isOpen, setIsOpen] = useState(false);
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
    if (isOpen && dropdownRef.current) {
      const options = dropdownRef.current.querySelectorAll<HTMLLIElement>('li');

      options.forEach((option) => {
        const handleOptionClick = () => {
          const selectElement =
            document.querySelector<HTMLSelectElement>('.goog-te-combo');
          if (selectElement) {
            console.log(`Option ${option.id} selected, ${selectElement}`);
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
    // <div className={mergeCss(parentCss)} id="google_translate_element"></div>
    <div className={mergeCss(parentCss)} ref={dropdownRef}>
      <button className="mr-8" onClick={toggleDropdown}>
        Language
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white text-black border border-gray-200 rounded shadow-lg z-10">
          <ul className="py-1">
            {langs.map((lang) => (
              <li
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
