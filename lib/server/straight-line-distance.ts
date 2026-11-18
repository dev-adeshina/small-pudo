export interface Wgs84Coordinate {
  latitude: number;
  longitude: number;
}

export interface StraightLineDistanceEvidence {
  measurementCategory: "straight_line";
  method: "haversine";
  coordinateReferenceSystem: "WGS84";
  unit: "metres";
  distanceMeters: number;
}

const EARTH_MEAN_RADIUS_METERS = 6_371_008.8;

function validateCoordinate(coordinate: Wgs84Coordinate, label: string): void {
  if (
    !coordinate ||
    typeof coordinate.latitude !== "number" ||
    !Number.isFinite(coordinate.latitude) ||
    coordinate.latitude < -90 ||
    coordinate.latitude > 90
  ) {
    throw new TypeError(`${label} latitude must be between -90 and 90.`);
  }

  if (
    typeof coordinate.longitude !== "number" ||
    !Number.isFinite(coordinate.longitude) ||
    coordinate.longitude < -180 ||
    coordinate.longitude > 180
  ) {
    throw new TypeError(`${label} longitude must be between -180 and 180.`);
  }
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateStraightLineDistance(
  from: Wgs84Coordinate,
  to: Wgs84Coordinate,
): StraightLineDistanceEvidence {
  validateCoordinate(from, "Origin");
  validateCoordinate(to, "Destination");

  const latitudeDifference = toRadians(to.latitude - from.latitude);
  const longitudeDifference = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const centralAngle =
    2 * Math.atan2(
      Math.sqrt(Math.min(1, haversine)),
      Math.sqrt(Math.max(0, 1 - haversine)),
    );

  return {
    measurementCategory: "straight_line",
    method: "haversine",
    coordinateReferenceSystem: "WGS84",
    unit: "metres",
    distanceMeters: EARTH_MEAN_RADIUS_METERS * centralAngle,
  };
}
