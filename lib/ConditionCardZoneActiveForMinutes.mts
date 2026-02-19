import { ExtendedHomeyAPIV3Local, ExtendedZone } from "homey-api";
import Homey from "homey/lib/Homey";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete.mjs";
import { FlowCardCondition } from "homey";
import ZonesDb from "./ZonesDb.mjs";

export default class ConditionCardZoneActiveForMinutes {
	private static instance: ConditionCardZoneActiveForMinutes | null = null;
	conditionCard: FlowCardCondition;

	private constructor(private homey: Homey, private homeyApi: ExtendedHomeyAPIV3Local, private zonesDb: ZonesDb, private log: (...args: unknown[]) => void) {
		this.conditionCard = this.homey.flow.getConditionCard('zone-active-for-minutes');
	}

	public static async initialize(homey: Homey, homeyApi: ExtendedHomeyAPIV3Local, zonesDb: ZonesDb, log: (...args: unknown[]) => void): Promise<void> {
		if (ConditionCardZoneActiveForMinutes.instance === null) {
			ConditionCardZoneActiveForMinutes.instance = new ConditionCardZoneActiveForMinutes(homey, homeyApi, zonesDb, log);
			await ConditionCardZoneActiveForMinutes.instance.setup();
		}
	}

	private async setup(): Promise<void> {
		this.conditionCard.registerRunListener(async (args, _state) => {
			// WORKAROUND: Directly fetch the zone from the API to ensure we have the most up-to-date data.
			// This should be removed once the root cause of stale data in zonesDb is identified and fixed.
			// const zone = await this.zonesDb.getZone(args.zone.id);
			const zone = await this.homeyApi.zones.getZone({ id: args.zone.id });
			const dbLastUpdated = await this.zonesDb.getLastUpdated();

			if (zone == null)
				throw new Error(`Zone with id '${args.zone.id}' not found.`);

			const now = new Date();
			const checkIsActive = args.state === 'active';

			if(checkIsActive) {
				const isZoneActive = (zone.activeLastUpdated !== null && zone.active);
				const originsData = await this.getOriginsData(zone);

				// find the oldest activeLastUpdated date
				const oldestOrigin = Object.entries(originsData).reduce(
					(oldest, [originId, originDate]) => 
						originDate < oldest.activeLastUpdated 
							? { originId, activeLastUpdated: originDate }
							: oldest,
					{ originId: null as string | null, activeLastUpdated: now }
				);
				const { originId: _oldestOriginId, activeLastUpdated } = oldestOrigin;

				const activeForGivenMinutes = activeLastUpdated.getTime() >= args.minutes * 60 * 1000;
				const isActive = isZoneActive && activeForGivenMinutes;
				this.log(`Zone '${zone.name}' is considered ${isActive ? 'active' : 'inactive'}.`, { args, zone, originsData, oldestOrigin, lastUpdated: dbLastUpdated });
				return isActive;

			} else {
				const isZoneInactive = !(zone.activeLastUpdated === null ? false : zone.active);
				const activeLastUpdated = new Date(zone.activeLastUpdated);
				const lastUpdateInMinutes = (now.getTime() - activeLastUpdated.getTime()) / (60 * 1000);
				const lastUpdatedWithinGivenMinutes = lastUpdateInMinutes >= args.minutes;
				const isInactive = isZoneInactive && lastUpdatedWithinGivenMinutes;
				this.log(`Zone '${zone.name}' is considered ${isInactive ? 'inactive' : 'active'}.`, { args, zone, activeLastUpdated, lastUpdateInMinutes, lastUpdated: dbLastUpdated });
				return isInactive;
			}
		});

		this.conditionCard.registerArgumentAutocompleteListener('zone', async (query: string) => await handleZoneAutocomplete(query, this.zonesDb));
	}

	private async getOriginsData(zone: ExtendedZone, data: { [key: string]: Date } = {}) : Promise<{ [key: string]: Date }>{
		data[`homey:zone:${zone.id}`] = new Date(zone.activeLastUpdated);
		await Promise.all(zone.activeOrigins.map( async activeOrigin  => {
			if (activeOrigin.startsWith('homey:device:')) {
				const deviceId = activeOrigin.split('homey:device:')[1].split(':')[0];
				const capabilityId = activeOrigin.split(':')[3];
				const device = await this.homeyApi.devices.getDevice( { id: deviceId } );
				const capabilities = device.capabilitiesObj as Record<string, { lastUpdated?: string | null } | undefined>;
				const lastUpdatedValue = capabilities[capabilityId]?.lastUpdated;
				if (lastUpdatedValue != null) {
					const lastUpdated = new Date(lastUpdatedValue);
					data[activeOrigin] = lastUpdated;
				}
			} else if (activeOrigin.startsWith('homey:zone:')) {
				const zoneId = activeOrigin.split('homey:zone:')[1].split(':')[0];
				const zone = await this.homeyApi.zones.getZone( { id: zoneId } );
				data = await this.getOriginsData(zone, data);
			} else {
				this.log(`Active origin '${activeOrigin}' is not a device, skipping.`, { zone } );
			}
		}));

		return data;
	}
}
