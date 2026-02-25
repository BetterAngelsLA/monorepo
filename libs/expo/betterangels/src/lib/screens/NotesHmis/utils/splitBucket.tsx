export default function splitBucket(bucket?: {
  serviceRequests?: {
    id?: string;
    service?: { id: string; label?: string } | null;
    markedForDeletion?: boolean;
    serviceOther?: string | null;
  }[];
}) {
  const serviceRequests = bucket?.serviceRequests ?? [];

  // CREATE standard: brand-new rows (no id), not marked for deletion, with a selected service
  const toCreateStandard = serviceRequests
    .filter((s) => !s.id && !s.markedForDeletion && !!s.service?.id)
    .map((s) => ({ serviceId: s.service!.id }));

  // DELETE standard: persisted rows (has id) explicitly marked for deletion
  const toDeleteStandard = serviceRequests
    .filter((s) => !!s.id && !!s.markedForDeletion)
    .map((s) => ({ serviceRequestId: s.id! }));

  // CREATE “other”: brand-new (no serviceRequestId), not marked for deletion, with non-empty text
  const toCreateOther = serviceRequests
    .filter(
      (o) =>
        o.id?.startsWith('tmp-other') &&
        !o.markedForDeletion &&
        !!o.serviceOther &&
        o.serviceOther.trim().length > 0
    )
    .map((o) => ({ serviceOther: o.serviceOther!.trim() }));

  // DELETE “other”: persisted (has serviceRequestId) and marked for deletion
  const toDeleteOther = serviceRequests
    .filter((o) => !!o.id && !!o.markedForDeletion && !!o.serviceOther)
    .map((o) => ({ serviceRequestId: o.id! }));

  return { toCreateStandard, toDeleteStandard, toCreateOther, toDeleteOther };
}
