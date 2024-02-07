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
    moods.length > 0 ? 'Case manager asked how client was feeling.' : '';

  const moodRText =
    moods.length > 0
      ? 'Client responded that he was ' +
        moods.slice(0, -1).join(', ') +
        (moods.length > 1 ? ' and ' : '') +
        moods[moods.length - 1] +
        '.'
      : '';

  const serviceIText =
    providedServices.length > 0
      ? 'Case manager provided ' +
        providedServices.slice(0, -1).join(', ') +
        (providedServices.length > 1 ? ' and ' : '') +
        providedServices[providedServices.length - 1] +
        '.'
      : '';

  const serviceRText =
    providedServices.length > 0
      ? 'Client accepted ' +
        providedServices.slice(0, -1).join(', ') +
        (providedServices.length > 1 ? ' and ' : '') +
        providedServices[providedServices.length - 1] +
        '.'
      : '';

  const requestedText =
    requestedServices.length > 0
      ? 'Client requested ' +
        requestedServices.slice(0, -1).join(', ') +
        (requestedServices.length > 1 ? ' and ' : '') +
        requestedServices[requestedServices.length - 1] +
        '.'
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

  const updatedG =
    changedG.length > 0
      ? `G: ${changedG.slice(0, -1).join(', ')}${
          changedG.length > 1 ? ' and ' : ''
        }${changedG[changedG.length - 1]}.`
      : 'G:';

  const updatedP = changedP ? `P: ${changedP.join(', ')}` : 'P:';

  const hasRDate = nextStepDate ? `${updatedP} ${nextStepDate}` : updatedP;

  const newPublicNote = `${updatedG}\n${updatedI}\n${updatedR}\n${hasRDate}`;

  return newPublicNote;
}
