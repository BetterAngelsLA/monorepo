import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet } from 'react-native';

/** Marker colors: green = dedicated field, red = referral notes / sensitive. */
export const GREEN = '#4E9E6A';
export const RED = '#C06A60';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.NEUTRAL_LIGHT,
  },
  headerBtn: {
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 8,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
  },
  headerBtnFlex: {
    flex: 1,
    alignItems: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.md,
  },
  legend: {
    gap: Spacings.xxs,
    marginBottom: Spacings.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  legendText: {
    fontStyle: 'italic',
    flexShrink: 1,
  },
  sectionLabel: {
    marginBottom: Spacings.xs,
    marginTop: Spacings.sm,
  },
  field: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    padding: Spacings.md,
    marginBottom: Spacings.sm,
  },
  fieldSensitive: {
    borderLeftWidth: 3,
    borderLeftColor: RED,
  },
  fieldHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    flexShrink: 1,
  },
  fieldMarkers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
  piiTag: {
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  help: {
    marginTop: 2,
    marginBottom: Spacings.xs,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderTopWidth: 1,
    borderTopColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  profileRowSensitive: {
    borderLeftWidth: 3,
    borderLeftColor: RED,
    paddingLeft: Spacings.xs,
  },
  profileLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    flexShrink: 1,
  },
  editLink: {
    alignSelf: 'flex-start',
    marginTop: Spacings.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
    marginTop: Spacings.xs,
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xs,
    backgroundColor: Colors.WHITE,
  },
  chipOn: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  input: {
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    marginTop: Spacings.xs,
    fontSize: 14,
    color: Colors.NEUTRAL_DARK,
  },
  textarea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    marginTop: Spacings.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.WHITE,
  },
  checkboxOn: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    marginVertical: Spacings.md,
  },
  footerSpace: {
    height: Spacings.xl,
  },
  deferredCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderStyle: 'dashed',
    padding: Spacings.md,
    marginBottom: Spacings.sm,
  },
  deferredHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  deferredTitleWrap: {
    flexShrink: 1,
  },
  deferredBody: {
    marginTop: Spacings.xs,
  },
  deferredGroup: {
    marginTop: Spacings.xs,
    gap: 2,
  },
  deferredList: {
    lineHeight: 18,
  },
});
