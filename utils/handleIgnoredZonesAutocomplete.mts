import { FlowCard } from "homey";
import Homey from "homey/lib/Homey";
import { ArgumentAutocompleteResults } from "homey/lib/FlowCard";
import handleZoneAutocomplete from "./handleZoneAutocomplete.mjs";
import ZonesDb from "../lib/ZonesDb.mjs";

/**
 * Get the ids of the zones selected in an argument filled by handleIgnoredZonesAutocomplete.
 */
export function getSelectedZoneIds(value: { id?: string, ids?: string[] } | null | undefined): string[] {
	if (value == null)
		return [];
	if (Array.isArray(value.ids))
		return value.ids.filter(id => id);
	return value.id ? [value.id] : [];
}

/**
 * Autocomplete for an argument that holds any number of zones below the zone in the 'zone' argument.
 *
 * Homey has no picker for multiple values that are not hardcoded in app.json, but it does pass the
 * current value of the argument being edited. So each result stands for a whole selection: after
 * picking 'Bedroom', the results offer 'Bedroom, Garage'. The selection is stored in `ids`.
 */
export default async function handleIgnoredZonesAutocomplete(query: string, args: { zone?: { id: string }, exclude?: { id?: string, ids?: string[] } }, homey: Homey, zonesDb: ZonesDb): Promise<FlowCard.ArgumentAutocompleteResults> {
	const zones = await handleZoneAutocomplete('', zonesDb);
	const zoneNames = new Map(zones.map(zone => [zone.id, zone.name]));
	const selectedIds = getSelectedZoneIds(args.exclude).filter(id => zoneNames.has(id));
	const selectedNames = (ids: string[]): string => ids.map(id => zoneNames.get(id)).join(', ');

	const descendantIds = args.zone?.id != null
		? new Set((await zonesDb.getAllChildren(args.zone.id)).map(child => child.id))
		: null;

	const results: ArgumentAutocompleteResults = [{
		name: homey.__('no_zone_ignored') ?? '— no zone ignored —',
		id: '',
		ids: [],
	}];

	zones
		.filter(zone => !selectedIds.includes(zone.id) && (descendantIds === null || descendantIds.has(zone.id)))
		.filter(zone => zone.name.toLowerCase().includes(query.toLowerCase()))
		.forEach(zone => {
			const ids = [...selectedIds, zone.id];
			results.push({
				name: selectedNames(ids),
				description: selectedIds.length > 0 ? homey.__('add_zone', { zone: zone.name }) ?? `add ${zone.name}` : zone.description,
				icon: zone.icon,
				id: ids.join(','),
				ids,
			});
		});

	selectedIds
		.filter(id => zoneNames.get(id)?.toLowerCase().includes(query.toLowerCase()))
		.forEach(id => {
			const ids = selectedIds.filter(other => other !== id);
			results.push({
				name: ids.length > 0 ? selectedNames(ids) : homey.__('no_zone_ignored') ?? '— no zone ignored —',
				description: homey.__('remove_zone', { zone: zoneNames.get(id) }) ?? `remove ${zoneNames.get(id)}`,
				id: ids.join(','),
				ids,
			});
		});

	return results;
}
