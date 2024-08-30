import { ExtendedZone } from "homey-api";

export default function getPathForZone(zoneId: string, zones: { [key: string]: ExtendedZone; }): string {
	let zone = zones[zoneId];
	const path = [];
	while (zone != null) {
		path.push(zone.name);
		zone = zones[zone.parent];
	}
	path.reverse();
	return path.join(' > ');
}
