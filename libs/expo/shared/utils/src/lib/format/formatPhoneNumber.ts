export function formatPhoneNumber(originalNumber: string) {
  try {
    const parsed = parseNumber(originalNumber);

    return formatNumber(parsed);
  } catch (e) {
    if (typeof originalNumber === 'string') {
      return [originalNumber.replace(/\D/g, '')];
    }

    return [''];
  }
}

type IParsed = {
  areaCode: string;
  firstPart: string;
  secondPart: string;
  extension?: string;
};

function parseNumber(phoneNumber: string): IParsed {
  if (typeof phoneNumber !== 'string') {
    throw new Error('invalid number');
  }

  const extMatch = phoneNumber.match(/(?:ext\.?|x|extension)[\s.:,-]*(\d+)/i);

  let extension;
  let coreNumber = phoneNumber;

  if (extMatch) {
    extension = extMatch[1];
    coreNumber = coreNumber.slice(0, extMatch.index).trim();
  }

  const cleaned = coreNumber.replace(/\D/g, '');

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
    extension,
  };
}

function formatNumber(phoneNumber: IParsed) {
  const { areaCode, firstPart, secondPart, extension } = phoneNumber;
  const formatted = `(${areaCode}) ${firstPart}-${secondPart}`;

  return [formatted, extension];
}
