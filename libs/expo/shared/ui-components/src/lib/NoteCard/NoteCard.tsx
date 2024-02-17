import { LocationDotIcon, PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import Avatar from '../Avatar';
import BodyText from '../BodyText';
import H4 from '../H4';
import IconButton from '../IconButton';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface INoteCardProps {
  id: string;
  title: string;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  onPress?: () => void;
}

// async function viewNoteFunction() {
//   try {
//     const { data } = await createNote({
//       variables: {
//         data: {
//           title: 'note title',
//           publicDetails: 'note public details',
//           client: {
//             id: '2',
//           },
//         },
//       },
//     });
//     console.log('CREATE NOTE DATA:', data);
//     router.navigate({
//       // pathname: `/add-note/2`,
//       pathname: `/add-note/${data?.createNote?.client.id}`,
//     });
//   } catch (e) {
//     console.log(e);
//   }
// }

export function NoteCard(props: INoteCardProps) {
  const { id, title, mb, mt, mr, ml, my, mx, onPress } = props;
  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
        },
      ]}
    >
      <View style={{ alignItems: 'center', paddingHorizontal: Spacings.xs }}>
        <Avatar
          accessibilityHint={`shows avatar of ${title} if available`}
          accessibilityLabel={`Avatar of ${title} Note`}
          // imageUrl={imageUrl}
          mb="xs"
          size="lg"
        />
        <H4>{title}</H4>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: Spacings.xs,
          }}
        >
          <LocationDotIcon size="sm" color={Colors.PRIMARY_EXTRA_DARK} />
          <BodyText size="sm"> {title}</BodyText>
        </View>
        <IconButton
          accessibilityHint={`goes to edit ${title} note`}
          accessibilityLabel={`Update ${title} note`}
          onPress={onPress}
          mb="xs"
          variant="secondary"
          borderColor={Colors.PRIMARY}
          height="sm"
          width="full"
        >
          <PlusIcon color={Colors.PRIMARY_EXTRA_DARK} />
        </IconButton>
      </View>
      <View style={styles.progress}>
        <View
          style={{
            backgroundColor: Colors.SUCCESS,
            height: 5,
            // width: progress,
            position: 'absolute',
            left: 0,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: Colors.NEUTRAL_EXTRA_LIGHT,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderRadius: 8,
    paddingTop: Spacings.sm,
    width: 160,
    backgroundColor: Colors.WHITE,
    overflow: 'hidden',
  },
  progress: {
    backgroundColor: Colors.NEUTRAL_LIGHT,
    height: 5,
    width: '100%',
    position: 'relative',
  },
});
