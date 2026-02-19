type TProps = {
  className?: string;
};

export function SearchSource(props: TProps) {
  const { className = '' } = props;

  return <div className={className}>(based on your search area)</div>;
}
