interface ModeToggleProps {
  isSignUp: boolean;
  onToggle: () => void;
}

export function ModeToggle({ isSignUp, onToggle }: ModeToggleProps) {
  return (
    <p className="text-center mt-6 text-sm">
      {isSignUp ? 'Already have an account?' : 'Don\u0027t have an account?'}{' '}
      <button
        type="button"
        className="font-semibold underline"
        onClick={onToggle}
      >
        {isSignUp ? 'Sign in' : 'Sign up'}
      </button>
    </p>
  );
}
