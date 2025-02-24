import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

interface TProps extends React.ComponentProps<typeof Link> {
  href: string;
  target?: '_blank' | '_self';
}

export default function WebBrowserLink(props: TProps) {
  const { href, target = '_blank', children, ...rest } = props;

  if (!href) {
    return null;
  }

  return (
    <Link
      target={target}
      href={href}
      onPress={(e) => {
        e.preventDefault();
        WebBrowser.openBrowserAsync(href);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
