interface IWatchedValue {
  purposes: { value: string }[];
  nextStepActions: { action: string }[];
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
  const changedG = purposes
    .map((purpose) => purpose.value.toLowerCase())
    .filter(Boolean);

  const purposeText =
    changedG.length > 0
      ? changedG.length === 1
        ? 'The goal for this session was to'
        : 'The goals for this session were to'
      : '';
  const changedP = nextStepActions.map((item) => item.action).filter(Boolean);

  const moodIText =
    moods.length > 0 ? 'Case Manager asked how client was feeling.' : '';

  const moodRText =
    moods.length > 0
      ? 'Client responded that he was ' +
        moods.slice(0, -1).join(', ').toLowerCase() +
        (moods.length > 1 ? ', and ' : '') +
        moods[moods.length - 1].toLowerCase() +
        '.'
      : '';

  const serviceIText =
    providedServices.length > 0
      ? 'Case Manager provided ' +
        providedServices.slice(0, -1).join(', ').toLowerCase() +
        (providedServices.length > 1 ? ', and ' : '') +
        providedServices[providedServices.length - 1].toLowerCase() +
        '.'
      : '';

  const serviceRText =
    providedServices.length > 0
      ? 'Client accepted ' +
        providedServices.slice(0, -1).join(', ').toLowerCase() +
        (providedServices.length > 1 ? ', and ' : '') +
        providedServices[providedServices.length - 1].toLowerCase() +
        '.'
      : '';

  const requestedText =
    requestedServices.length > 0
      ? 'Client requested ' +
        requestedServices.slice(0, -1).join(', ').toLowerCase() +
        (requestedServices.length > 1 ? ', and ' : '') +
        requestedServices[requestedServices.length - 1].toLowerCase() +
        '.'
      : '';

  const updatedI =
    'I -' +
    (moodIText ? ' ' + moodIText : '') +
    (serviceIText ? ' ' + serviceIText : '');

  const updatedR =
    'R -' +
    (moodRText ? ' ' + moodRText : '') +
    (serviceRText ? ' ' + serviceRText : '') +
    (requestedText ? ' ' + requestedText : '');

  const updatedG =
    changedG.length > 0
      ? `G - ${purposeText} ${changedG.slice(0, -1).join(', ')}${
          changedG.length > 1 ? ', and ' : ''
        }${changedG[changedG.length - 1]}.`
      : 'G -';

  const updatedP = changedP ? `P - ${changedP.join(', ')}` : 'P -';

  const hasRDate = nextStepDate ? `${updatedP} ${nextStepDate}` : updatedP;

  const newPublicNote = `${updatedG}\n${updatedI}\n${updatedR}\n${hasRDate}`;

  return newPublicNote;
}
