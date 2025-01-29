import { Link, Path, StyleSheet, Svg, Text } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    items: 'center',
    marginLeft: 'auto',
    marginTop: 32,
  },
  text: {
    fontWeight: 'bold',
  },
});

type IProps = {
  title: string;
  href: string;
};

export const ResourceLink = (props: IProps) => {
  const { title, href } = props;

  if (!href) {
    return null;
  }

  return (
    <Link
      aria-label={`open ${title} resource link in new tab`}
      style={styles.container}
      href={href}
    >
      <Text style={styles.text}>Visit Resource Site</Text>
      <Svg viewBox="0 0 24 24" width="24" height="24">
        <Path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M11.099 3c-3.65.007-5.56.096-6.781 1.318C3 5.636 3 7.757 3 12c0 4.242 0 6.364 1.318 7.682S7.757 21 11.998 21c4.243 0 6.364 0 7.682-1.318c1.22-1.221 1.31-3.133 1.317-6.782m-.441-9.404L11.05 13.06m9.507-9.563c-.494-.494-3.822-.448-4.525-.438m4.525.438c.494.495.448 3.827.438 4.531"
          color="currentColor"
        />
      </Svg>
    </Link>
  );
};
