import { FlowCard } from "homey";
import { ExtendedZone } from "homey-api";
import { ArgumentAutocompleteResults } from "homey/lib/FlowCard";
import getIconForZone from "./getIconForZone.mjs";
import ZonesDb from "../lib/ZonesDb.mjs";

export default async function handleZoneAutocomplete(query: string, zonesDb: ZonesDb): Promise<FlowCard.ArgumentAutocompleteResults> {
	const results: ArgumentAutocompleteResults = [];
	const addedZoneIds = new Set<string>();

	const addZoneAndChildren = async (zone: ExtendedZone): Promise<void> => {
		if (addedZoneIds.has(zone.id)) {
			return;
		}

		const parents = await zonesDb.getAllParents(zone.id);
		const description = parents.reverse().map(parent => parent.name).join(' > ');

		results.push({
			name: zone.name,
			description,
			icon: getIconForZone(zone.icon),
			id: zone.id
		});

		addedZoneIds.add(zone.id);
		const children = await zonesDb.getDirectChildren(zone.id);
		children.sort((a, b) => a.name.localeCompare(b.name));
		for (const child of children) {
			await addZoneAndChildren(child);
		}
	};

	const rootZones = Array.from(await zonesDb.getZones()).filter(zone => !zone.parent);
	rootZones.sort((a, b) => a.name.localeCompare(b.name));
	for (const rootZone of rootZones) {
		await addZoneAndChildren(rootZone);
	}

	const filteredResults = results.filter((result) => {
		return result.name.toLowerCase().includes(query.toLowerCase());
	});

	return filteredResults;
}