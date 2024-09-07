import { ExtendedZone } from "homey-api";
import { ArgumentAutocompleteResults } from "homey/lib/FlowCard";
import Zones from "lib/Zones";
import getIconForZone from "./getIconForZone";

export default function getAutocompleteResultsForZone(zones: Zones): ArgumentAutocompleteResults {
	const results: ArgumentAutocompleteResults = [];
	const addedZoneIds = new Set<string>();

	const addZoneAndChildren = (zone: ExtendedZone): void => {
		if (addedZoneIds.has(zone.id)) {
			return;
		}

		const parents = zones.getAllParents(zone.id);
		const description = parents.reverse().map(parent => parent.name).join(' > ');

		results.push({
			name: zone.name,
			description,
			icon: getIconForZone(zone.icon),
			id: zone.id
		});

		addedZoneIds.add(zone.id);
		const children = zones.getAllChildren(zone.id);
		children.sort((a, b) => a.name.localeCompare(b.name));
		children.forEach(addZoneAndChildren);
	};

	const rootZones = Array.from(zones.getZones()).filter(zone => !zone.parent);
	rootZones.sort((a, b) => a.name.localeCompare(b.name));
	rootZones.forEach(addZoneAndChildren);
	return results;
}