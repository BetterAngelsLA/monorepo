interface IWatchedValue {
  purposes: { value: string }[];
  nextStepActions: { value: string }[];
  moods: string[];
  providedServices: string[];
  nextStepDate: Date;
  requestedServices: string[];
}

export default function generatedPublicNote(watchedValues: IWatchedValue) {
  const {
    purposes,
    moods,
    providedServices,
    nextStepActions,
    nextStepDate,
    requestedServices,
  } = watchedValues;
  const changedG = purposes.map((purpose) => purpose.value).filter(Boolean);
  const changedP = nextStepActions
    .map((action) => action.value)
    .filter(Boolean);

  const moodIText =
    moods.length > 0 ? 'CM asked how the client was feeling.' : '';

  const moodRText =
    moods.length > 0
      ? 'Client responded that he was ' + moods.join(', ') + '.'
      : '';

  const serviceIText =
    providedServices.length > 0
      ? 'CM provided ' + providedServices.join(', ') + '.'
      : '';

  const serviceRText =
    providedServices.length > 0
      ? 'Client accepted ' + providedServices.join(', ') + '.'
      : '';

  const requestedText =
    requestedServices.length > 0
      ? 'Client requested ' + requestedServices.join(', ') + '.'
      : '';

  const updatedI =
    'I:' +
    (moodIText ? ' ' + moodIText : '') +
    (serviceIText ? ' ' + serviceIText : '');

  const updatedR =
    'R:' +
    (moodRText ? ' ' + moodRText : '') +
    (serviceRText ? ' ' + serviceRText : '') +
    (requestedText ? ' ' + requestedText : '');

  const updatedG = changedG.length ? `G: ${changedG.join(', ')}` : 'G:';
  const updatedP = changedP ? `P: ${changedP.join(', ')}` : 'P:';

  const hasRDate = nextStepDate ? `${updatedP} ${nextStepDate}` : updatedP;

  const newPublicNote = `${updatedG}\n${updatedI}\n${updatedR}\n${hasRDate}`;

  return newPublicNote;
}
