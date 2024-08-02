interface IErrors {
  [key: string]: any;
}

export default function extractNamesWithErrors(errors: IErrors) {
  const namesArray: string[] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (Object.prototype.hasOwnProperty.call(value, 'message')) {
      namesArray.push(key);
    } else if (key === 'user') {
      const userError = Object.keys(errors[key]).map((name) => {
        return `${key}.${name}`;
      });
      namesArray.push(...userError);
    }
  }
  return namesArray;
}
