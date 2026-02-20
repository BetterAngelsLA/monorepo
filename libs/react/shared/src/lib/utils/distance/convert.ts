const METERS_PER_MILE = 1609.34; // 1 mile = 1609.34 meters
const MILES_PER_METER = 1 / METERS_PER_MILE; // 1 meter = 1/1609.34 miles
const FEET_PER_MILE = 5280; // 1 mile = 5280 feet

export function metersToMiles(meters: number) {
  return meters * MILES_PER_METER;
}

export function milesToFeet(miles: number) {
  return miles * FEET_PER_MILE;
}
