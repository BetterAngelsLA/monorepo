type TProps = {
  purpose?: string;
  providedServices?: string[];
  requestedServices?: string[];
};

export function generateGirpNote(props: TProps) {
  const { purpose, providedServices = [], requestedServices = [] } = props;
  const changedG = purpose
    ? `G - The goal for this session was to ${purpose}`
    : 'G - ';

  const serviceIText =
    providedServices.length > 0
      ? 'Case Manager provided ' +
        providedServices.slice(0, -1).join(', ').toLowerCase() +
        (providedServices.length > 1 ? ', and ' : '') +
        providedServices[providedServices.length - 1]?.toLowerCase() +
        '.'
      : '';

  const serviceRText =
    providedServices.length > 0
      ? 'Client accepted ' +
        providedServices.slice(0, -1).join(', ').toLowerCase() +
        (providedServices.length > 1 ? ', and ' : '') +
        providedServices[providedServices.length - 1]?.toLowerCase() +
        '.'
      : '';

  const updatedP =
    requestedServices.length > 0
      ? 'P - Follow up with client regarding requested ' +
        requestedServices.slice(0, -1).join(', ').toLowerCase() +
        (requestedServices.length > 1 ? ', and ' : '') +
        requestedServices[requestedServices.length - 1]?.toLowerCase() +
        '.'
      : 'P - Touch base with client for general wellness check.';

  const requestedText =
    requestedServices.length > 0
      ? 'Client requested ' +
        requestedServices.slice(0, -1).join(', ').toLowerCase() +
        (requestedServices.length > 1 ? ', and ' : '') +
        requestedServices[requestedServices.length - 1]?.toLowerCase() +
        '.'
      : '';

  const updatedI = 'I -' + (serviceIText ? ' ' + serviceIText : '');

  const updatedR =
    'R -' +
    (serviceRText ? ' ' + serviceRText : '') +
    (requestedText ? ' ' + requestedText : '');

  return `${changedG}\n${updatedI}\n${updatedR}\n${updatedP}`;
}
