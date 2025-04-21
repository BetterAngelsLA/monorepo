export function CurrentLocationDot() {
  return (
    <div className="relative w-4 h-4">
      <div className="absolute inset-0 animate-ping bg-blue-400 rounded-full opacity-75" />
      <div className="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white" />
    </div>
  );
}
