import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { formatMemberName } from '../../util/formatMemberName';
import { TaskQuery } from './__generated__/Task.generated';

type TaskCreatedByProps = {
  createdBy: TaskQuery['task']['createdBy'];
  team?: TaskQuery['task']['team'];
  organization?: TaskQuery['task']['organization'];
};

/**
 * Who created the task, as a single muted line.
 *
 * Matches the card's treatment: the creator is provenance, not someone the
 * reader acts on, so it reads at caption weight beside the date rather than
 * taking an avatar block of its own next to the client and the assignee.
 */
export default function TaskCreatedBy(props: TaskCreatedByProps) {
  const { createdBy, team, organization } = props;

  const name = formatMemberName(createdBy);
  const affiliation = [organization?.name, team?.name]
    .filter(Boolean)
    .join(' · ');

  if (!name) return null;

  return (
    <TextRegular size="xs" color={Colors.NEUTRAL_DARK} numberOfLines={1}>
      {[`Created by ${name}`, affiliation].filter(Boolean).join(' · ')}
    </TextRegular>
  );
}
