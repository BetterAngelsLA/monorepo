import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { TasksQuery } from '../TaskList/__generated__/Tasks.generated';

type TaskCardCreatedByProps = {
  createdBy: TasksQuery['tasks']['results'][number]['createdBy'];
  team?: { name?: string | null } | null;
  organization?: TasksQuery['tasks']['results'][number]['organization'];
};

/**
 * Who created the task, as a single muted line.
 *
 * The creator is provenance, not someone the reader acts on, so it does not
 * earn an avatar row next to the client and the assignee — but it stays on the
 * card because "who wrote this" is the thing the reader asked for.
 */
export default function TaskCardCreatedBy(props: TaskCardCreatedByProps) {
  const { createdBy, team, organization } = props;

  const name = [createdBy?.firstName, createdBy?.lastName]
    .filter(Boolean)
    .join(' ');
  const affiliation = [organization?.name, team?.name]
    .filter(Boolean)
    .join(' · ');

  return (
    <TextRegular
      size="xs"
      color={Colors.NEUTRAL_DARK}
      numberOfLines={1}
      mb="sm"
    >
      {[`Created by ${name}`, affiliation].filter(Boolean).join(' · ')}
    </TextRegular>
  );
}
