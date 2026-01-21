import { TGirpServiceType } from './GirpNoteForm';

type TProps = {
  purpose?: string;
  providedServices?: TGirpServiceType[];
  requestedServices?: TGirpServiceType[];
};

export function generateGirpNote(props: TProps) {
  const { purpose, providedServices = [], requestedServices = [] } = props;

  const changedG = purpose
    ? `G - The goal for this session was to ${purpose}`
    : 'G - ';

  const providedServiceList = providedServices.map(
    (service) => service.service?.label || service.serviceOther
  );

  const serviceIText =
    providedServiceList.length > 0
      ? 'Case Manager provided ' +
        providedServiceList.slice(0, -1).join(', ').toLowerCase() +
        (providedServiceList.length > 1 ? ', and ' : '') +
        providedServiceList[providedServiceList.length - 1]?.toLowerCase() +
        '.'
      : '';

  const serviceRText =
    providedServiceList.length > 0
      ? 'Client accepted ' +
        providedServiceList.slice(0, -1).join(', ').toLowerCase() +
        (providedServiceList.length > 1 ? ', and ' : '') +
        providedServiceList[providedServiceList.length - 1]?.toLowerCase() +
        '.'
      : '';

  const requestedServiceList = requestedServices.map(
    (service) => service.service?.label || service.serviceOther
  );

  const updatedP =
    requestedServiceList.length > 0
      ? 'P - Follow up with client regarding requested ' +
        requestedServiceList.slice(0, -1).join(', ').toLowerCase() +
        (requestedServiceList.length > 1 ? ', and ' : '') +
        requestedServiceList[requestedServiceList.length - 1]?.toLowerCase() +
        '.'
      : 'P - Touch base with client for general wellness check.';

  const requestedText =
    requestedServiceList.length > 0
      ? 'Client requested ' +
        requestedServiceList.slice(0, -1).join(', ').toLowerCase() +
        (requestedServiceList.length > 1 ? ', and ' : '') +
        requestedServiceList[requestedServiceList.length - 1]?.toLowerCase() +
        '.'
      : '';

  const updatedI = 'I -' + (serviceIText ? ' ' + serviceIText : '');

  const updatedR =
    'R -' +
    (serviceRText ? ' ' + serviceRText : '') +
    (requestedText ? ' ' + requestedText : '');

  return `${changedG}\n${updatedI}\n${updatedR}\n${updatedP}`;
}
