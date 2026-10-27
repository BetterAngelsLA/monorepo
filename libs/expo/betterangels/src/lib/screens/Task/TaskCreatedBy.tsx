import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { TextStyle } from 'react-native';
import { formatMemberName } from '../../util/formatMemberName';
import { TaskQuery } from './__generated__/Task.generated';

type TaskCreatedByProps = {
  createdBy: TaskQuery['task']['createdBy'];
  team?: TaskQuery['task']['team'];
  organization?: TaskQuery['task']['organization'];
  style?: TextStyle;
};

/**
 * Who created the task, as the left half of the detail's footer line.
 *
 * Same word and weight as the card's footer ("by …"), so provenance reads
 * identically on both surfaces. The affiliation trails it and truncates first
 * if the line runs out of room — it is the least load-bearing part.
 */
export default function TaskCreatedBy(props: TaskCreatedByProps) {
  const { createdBy, team, organization, style } = props;

  const name = formatMemberName(createdBy);
  const affiliation = [organization?.name, team?.name]
    .filter(Boolean)
    .join(' · ');

  if (!name) return null;

  return (
    <TextRegular
      size="xs"
      color={Colors.NEUTRAL_DARK}
      numberOfLines={1}
      style={style}
    >
      {[`by ${name}`, affiliation].filter(Boolean).join(' · ')}
    </TextRegular>
  );
}
