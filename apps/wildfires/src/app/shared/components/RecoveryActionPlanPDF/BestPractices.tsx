import { Link, Path, StyleSheet, Svg, View } from '@react-pdf/renderer';
import { BestPracticesCard } from './BestPracticesCard';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 32,
    gap: 16,
  },
});

export const BestPractices = () => (
  <View style={styles.container}>
    <BestPracticesCard
      bgColor="#fffed5"
      title="Remember to document everything"
      description="Take videos and pictures of damages, keep receipts of all expenses!"
      icon={
        <Svg viewBox="0 0 256 256" width="24" height="24">
          <Path
            fill="currentColor"
            d="M208 56h-27.72l-13.63-20.44A8 8 0 0 0 160 32H96a8 8 0 0 0-6.65 3.56L75.71 56H48a24 24 0 0 0-24 24v112a24 24 0 0 0 24 24h160a24 24 0 0 0 24-24V80a24 24 0 0 0-24-24m8 136a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V80a8 8 0 0 1 8-8h32a8 8 0 0 0 6.66-3.56L100.28 48h55.43l13.63 20.44A8 8 0 0 0 176 72h32a8 8 0 0 1 8 8ZM128 88a44 44 0 1 0 44 44a44.05 44.05 0 0 0-44-44m0 72a28 28 0 1 1 28-28a28 28 0 0 1-28 28"
          />
        </Svg>
      }
    />
    <BestPracticesCard
      bgColor="#F2FAFC"
      title="Access the valuable resources available to you. Below are steps you can take now."
      description={
        <>
          These are listed in order of priority and can be your guide to
          navigating online and/or to help you be prepared for an in-person
          meeting at a{' '}
          <Link
            style={{ textDecoration: 'underline' }}
            aria-label="open disaster recovery center website in new tab"
            // target="_blank"
            href="https://www.disasterassistance.gov/"
            // rel="noreferrer"
          >
            Disaster Recovery Center.
          </Link>
        </>
      }
      icon={
        <Svg viewBox="0 0 24 24" width="24" height="24">
          <Path
            fill="currentColor"
            d="M12 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4h3l5 4V4zm9.5 4c0 1.71-.96 3.26-2.5 4V8c1.53.75 2.5 2.3 2.5 4"
          />
        </Svg>
      }
    />
  </View>
);
