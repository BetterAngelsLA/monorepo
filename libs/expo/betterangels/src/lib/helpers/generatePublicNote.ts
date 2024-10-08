import { ServiceEnum, ViewNoteQuery } from '../apollo';
import { enumDisplayServices } from '../static/enumDisplayMapping';

interface IWatchedValue {
  purpose: ViewNoteQuery['note']['purpose'];
  moods: ViewNoteQuery['note']['moods'];
  providedServices: ViewNoteQuery['note']['providedServices'];
  requestedServices: ViewNoteQuery['note']['requestedServices'];
}

export default function generatePublicNote(watchedValues: IWatchedValue) {
  const { purpose, providedServices, requestedServices } = watchedValues;
  const changedG = purpose
    ? `G - The goal for this session was to ${purpose}`
    : 'G - ';

  // const moodIText =
  //   moods.length > 0 ? 'Case Manager asked how client was feeling.' : '';

  // const moodsArray = moods.map((item) => item.descriptor);

  // const moodRText =
  //   moodsArray.length > 0
  //     ? 'Client responded that he was ' +
  //       moodsArray.slice(0, -1).join(', ').toLowerCase() +
  //       (moodsArray.length > 1 ? ', and ' : '') +
  //       moodsArray[moodsArray.length - 1].toLowerCase() +
  //       '.'
  //     : '';

  const providedServicesArray = providedServices.map((item) => {
    if (item.service === ServiceEnum.Other) {
      return item.serviceOther;
    }
    return enumDisplayServices[item.service];
  });

  const serviceIText =
    providedServicesArray.length > 0
      ? 'Case Manager provided ' +
        providedServicesArray.slice(0, -1).join(', ').toLowerCase() +
        (providedServicesArray.length > 1 ? ', and ' : '') +
        providedServicesArray[providedServicesArray.length - 1]?.toLowerCase() +
        '.'
      : '';

  const serviceRText =
    providedServicesArray.length > 0
      ? 'Client accepted ' +
        providedServicesArray.slice(0, -1).join(', ').toLowerCase() +
        (providedServicesArray.length > 1 ? ', and ' : '') +
        providedServicesArray[providedServicesArray.length - 1]?.toLowerCase() +
        '.'
      : '';

  const requestedServicesArray = requestedServices.map((item) => {
    if (item.service === ServiceEnum.Other) {
      return item.serviceOther;
    }
    return enumDisplayServices[item.service];
  });

  const updatedP =
    requestedServicesArray.length > 0
      ? 'P - Follow up with client regarding requested ' +
        requestedServicesArray.slice(0, -1).join(', ').toLowerCase() +
        (requestedServicesArray.length > 1 ? ', and ' : '') +
        requestedServicesArray[
          requestedServicesArray.length - 1
        ]?.toLowerCase() +
        '.'
      : 'P - Touch base with client for general wellness check.';

  const requestedText =
    requestedServicesArray.length > 0
      ? 'Client requested ' +
        requestedServicesArray.slice(0, -1).join(', ').toLowerCase() +
        (requestedServicesArray.length > 1 ? ', and ' : '') +
        requestedServicesArray[
          requestedServicesArray.length - 1
        ]?.toLowerCase() +
        '.'
      : '';

  const updatedI =
    'I -' +
    // (moodIText ? ' ' + moodIText : '') +
    (serviceIText ? ' ' + serviceIText : '');

  const updatedR =
    'R -' +
    // (moodRText ? ' ' + moodRText : '') +
    (serviceRText ? ' ' + serviceRText : '') +
    (requestedText ? ' ' + requestedText : '');

  const newPublicNote = `${changedG}\n${updatedI}\n${updatedR}\n${updatedP}`;

  return newPublicNote;
}
