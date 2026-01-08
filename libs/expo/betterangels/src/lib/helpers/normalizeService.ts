const normalizeService = (item: {
  id: string;
  service?: {
    id: string;
    label: string;
    category?: { id: string } | null;
  } | null;
}) => {
  if (item.service && !item.service.category) {
    return {
      id: item.id,
      service: null,
      serviceOther: item.service.label,
    };
  }

  return {
    id: item.id,
    service: item.service
      ? { id: item.service.id, label: item.service.label }
      : null,
    serviceOther: null,
  };
};

export default normalizeService;
