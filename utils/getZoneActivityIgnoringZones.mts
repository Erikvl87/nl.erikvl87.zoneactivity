import { ExtendedHomeyAPIV3Local, ExtendedZone } from "homey-api";
import ZonesDb from "../lib/ZonesDb.mjs";

/**
 * Determine whether a zone is active while leaving some of the zones below it out.
 *
 * Zone activity is inherited upward: a zone is active whenever any zone below it is active. The zone
 * itself and every zone on the path down to an ignored zone may therefore only be active because of
 * the ignored zone, so their state can not be used. Every other branch below the zone is read as a
 * whole, because its state does not depend on the ignored zones.
 *
 * `since` is when the result started to hold: for active, when the remaining zone that has been active
 * the longest became active; for inactive, when the last remaining zone became inactive.
 */
export default async function getZoneActivityIgnoringZones(zone: ExtendedZone, ignoredZoneIds: string[], homeyApi: ExtendedHomeyAPIV3Local, zonesDb: ZonesDb): Promise<{ active: boolean, since: Date, remainingZones: ExtendedZone[] }> {
	const pathZoneIds = new Set<string>([zone.id]);
	const ignoredIds = new Set<string>();
	const descendants = await zonesDb.getAllChildren(zone.id);

	for (const ignoredZoneId of ignoredZoneIds) {
		const ignoredZone = await zonesDb.getZone(ignoredZoneId);
		if (ignoredZone == null)
			throw new Error(`Zone with id '${ignoredZoneId}' not found.`);

		// Only use which zones are parents, not their order: handleZoneAutocomplete reverses the cached array in place.
		const parentIds = new Set((await zonesDb.getAllParents(ignoredZone.id)).map(parent => parent.id));
		if (!parentIds.has(zone.id))
			throw new Error(`Zone '${ignoredZone.name}' is not inside zone '${zone.name}'.`);

		descendants.filter(descendant => parentIds.has(descendant.id)).forEach(descendant => pathZoneIds.add(descendant.id));
		ignoredIds.add(ignoredZone.id);
		(await zonesDb.getAllChildren(ignoredZone.id)).forEach(child => ignoredIds.add(child.id));
	}

	const remainingZoneIds: string[] = [];
	for (const pathZoneId of pathZoneIds) {
		const children = await zonesDb.getDirectChildren(pathZoneId);
		children
			.filter(child => !pathZoneIds.has(child.id) && !ignoredIds.has(child.id))
			.forEach(child => remainingZoneIds.push(child.id));
	}

	// Answering 'inactive' because nothing is left to check would be wrong, so fail instead.
	if (remainingZoneIds.length === 0)
		throw new Error(`No zones are left to check in zone '${zone.name}' when ignoring the selected zones.`);

	// Fetch the states directly from the API, for the same reason as the workaround in ConditionCardZoneActiveForMinutes.
	const zones = await homeyApi.zones.getZones();
	const remainingZones = remainingZoneIds.map(id => {
		if (zones[id] == null)
			throw new Error(`Zone with id '${id}' not found.`);
		return zones[id];
	});

	const lastUpdated = (remainingZone: ExtendedZone): number => remainingZone.activeLastUpdated == null ? 0 : new Date(remainingZone.activeLastUpdated).getTime();
	const activeZones = remainingZones.filter(remainingZone => remainingZone.active);
	if (activeZones.length > 0)
		return { active: true, since: new Date(Math.min(...activeZones.map(lastUpdated))), remainingZones };

	return { active: false, since: new Date(Math.max(...remainingZones.map(lastUpdated))), remainingZones };
}
