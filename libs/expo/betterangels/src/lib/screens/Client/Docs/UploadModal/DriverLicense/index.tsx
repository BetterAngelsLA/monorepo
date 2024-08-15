import Section from '../Section';
import { ITab } from '../types';

export default function DriverLicense({
  setTab,
}: {
  setTab: (tab: ITab) => void;
}) {
  return (
    <Section
      title="Upload Driver's License"
      subtitle="You need to upload front and back of the license."
      onSubmit={() => console.log('submit')}
      setTab={setTab}
    ></Section>
  );
}
