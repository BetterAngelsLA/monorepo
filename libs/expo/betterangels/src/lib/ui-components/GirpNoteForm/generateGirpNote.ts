type TProps = {
  purpose?: string;
  providedServicesList?: string[];
  requestedServicesList?: string[];
};

export function generateGirpNote(props: TProps) {
  const {
    purpose,
    providedServicesList = [],
    requestedServicesList = [],
  } = props;

  const changedG = purpose
    ? `G - The goal for this session was to ${purpose}`
    : 'G - ';

  const serviceIText =
    providedServicesList.length > 0
      ? 'Case Manager provided ' +
        providedServicesList.slice(0, -1).join(', ').toLowerCase() +
        (providedServicesList.length > 1 ? ', and ' : '') +
        providedServicesList[providedServicesList.length - 1]?.toLowerCase() +
        '.'
      : '';

  const serviceRText =
    providedServicesList.length > 0
      ? 'Client accepted ' +
        providedServicesList.slice(0, -1).join(', ').toLowerCase() +
        (providedServicesList.length > 1 ? ', and ' : '') +
        providedServicesList[providedServicesList.length - 1]?.toLowerCase() +
        '.'
      : '';

  const updatedP =
    requestedServicesList.length > 0
      ? 'P - Follow up with client regarding requested ' +
        requestedServicesList.slice(0, -1).join(', ').toLowerCase() +
        (requestedServicesList.length > 1 ? ', and ' : '') +
        requestedServicesList[requestedServicesList.length - 1]?.toLowerCase() +
        '.'
      : 'P - Touch base with client for general wellness check.';

  const requestedText =
    requestedServicesList.length > 0
      ? 'Client requested ' +
        requestedServicesList.slice(0, -1).join(', ').toLowerCase() +
        (requestedServicesList.length > 1 ? ', and ' : '') +
        requestedServicesList[requestedServicesList.length - 1]?.toLowerCase() +
        '.'
      : '';

  const updatedI = 'I -' + (serviceIText ? ' ' + serviceIText : '');

  const updatedR =
    'R -' +
    (serviceRText ? ' ' + serviceRText : '') +
    (requestedText ? ' ' + requestedText : '');

  return `${changedG}\n${updatedI}\n${updatedR}\n${updatedP}`;
}
