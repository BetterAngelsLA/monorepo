export default function formatPhoneNumber(phoneNumber: string) {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return cleaned;
  }
  const areaCode = `(${cleaned.slice(0, 3)}) `;
  const firstThreeDigits = cleaned.slice(3, 6);
  const lastFourDigits = cleaned.slice(6, 10);

  return areaCode + firstThreeDigits + '-' + lastFourDigits;
}
