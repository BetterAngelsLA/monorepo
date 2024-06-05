import { ServiceEnum, ViewNoteQuery } from '../apollo';

interface IWatchedValue {
  purposes: ViewNoteQuery['note']['purposes'];
  nextSteps: ViewNoteQuery['note']['nextSteps'];
  moods: ViewNoteQuery['note']['moods'];
  providedServices: ViewNoteQuery['note']['providedServices'];
  requestedServices: ViewNoteQuery['note']['requestedServices'];
}

export default function generatePublicNote(watchedValues: IWatchedValue) {
  const { purposes, moods, providedServices, nextSteps, requestedServices } =
    watchedValues;
  const changedG = purposes
    .map((purpose) => purpose.title.toLowerCase())
    .filter(Boolean);

  const purposeText =
    changedG.length > 0
      ? changedG.length === 1
        ? 'The goal for this session was to'
        : 'The goals for this session were to'
      : '';
  const changedP = nextSteps
    .filter((item) => !!item.title)
    .map((filtered) => `${filtered.title}`);

  const moodIText =
    moods.length > 0 ? 'Case Manager asked how client was feeling.' : '';

  const moodsArray = moods.map((item) => item.descriptor);

  const moodRText =
    moodsArray.length > 0
      ? 'Client responded that he was ' +
        moodsArray.slice(0, -1).join(', ').toLowerCase() +
        (moodsArray.length > 1 ? ', and ' : '') +
        moodsArray[moodsArray.length - 1].toLowerCase() +
        '.'
      : '';

  const providedArray = providedServices.map((item) => {
    if (item.service === ServiceEnum.Other) {
      return item.customService;
    }
    return item.service;
  });

  const serviceIText =
    providedArray.length > 0
      ? 'Case Manager provided ' +
        providedArray.slice(0, -1).join(', ').toLowerCase() +
        (providedArray.length > 1 ? ', and ' : '') +
        providedArray[providedArray.length - 1]?.toLowerCase() +
        '.'
      : '';

  const serviceRText =
    providedArray.length > 0
      ? 'Client accepted ' +
        providedArray.slice(0, -1).join(', ').toLowerCase() +
        (providedArray.length > 1 ? ', and ' : '') +
        providedArray[providedArray.length - 1]?.toLowerCase() +
        '.'
      : '';

  const requestedArray = requestedServices.map((item) => {
    if (item.service === ServiceEnum.Other) {
      return item.customService;
    }
    return item.service;
  });

  const requestedText =
    requestedArray.length > 0
      ? 'Client requested ' +
        requestedArray.slice(0, -1).join(', ').toLowerCase() +
        (requestedArray.length > 1 ? ', and ' : '') +
        requestedArray[requestedArray.length - 1]?.toLowerCase() +
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

  const newPublicNote = `${updatedG}\n${updatedI}\n${updatedR}\n${updatedP}`;

  return newPublicNote;
}
