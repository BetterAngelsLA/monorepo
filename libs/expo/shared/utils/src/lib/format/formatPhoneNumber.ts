export function formatPhoneNumber(originalNumber: string) {
  try {
    const parsed = parseNumber(originalNumber);

    return formatNumber(parsed);
  } catch (e) {
    if (typeof originalNumber === 'string') {
      return originalNumber.replace(/\D/g, '');
    }

    return '';
  }
}

type IParsed = {
  areaCode: string;
  firstPart: string;
  secondPart: string;
};

function parseNumber(phoneNumber: string) {
  if (typeof phoneNumber !== 'string') {
    throw new Error('invalid number');
  }

  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.length !== 10) {
    throw new Error('invalid number');
  }

  const areaCode = cleaned.slice(0, 3);
  const firstPart = cleaned.slice(3, 6);
  const secondPart = cleaned.slice(6, 10);

  return {
    areaCode,
    firstPart,
    secondPart,
  };
}

function formatNumber(phoneNumber: IParsed) {
  const { areaCode, firstPart, secondPart } = phoneNumber;

  return `(${areaCode}) ${firstPart}-${secondPart}`;
}
