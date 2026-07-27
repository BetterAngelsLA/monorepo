// Mock for @monorepo/react-icons — prevents SVG import failures in tests.
// Returns a null-render component for every icon.
const Icon = () => null;

export {
  Icon as default,
  Icon as ArrowLeftIcon,
  Icon as BaShelterLogoIcon,
  Icon as CheckIcon,
  Icon as CloseIcon,
  Icon as FilterIcon,
  Icon as ImageIcon,
  Icon as LockIcon,
  Icon as MenuIcon,
  Icon as SearchIcon,
  Icon as UserIcon,
};
