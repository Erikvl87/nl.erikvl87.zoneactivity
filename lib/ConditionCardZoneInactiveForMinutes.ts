import { ExtendedHomeyAPIV3Local } from "homey-api";
import Homey from "homey/lib/Homey";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete";
import { FlowCardCondition } from "homey";
import ZonesDb from "./ZonesDb";

/**
 * Deprecated.
 */
export default class ConditionCardZoneInactiveForMinutes {
	private static instance: ConditionCardZoneInactiveForMinutes | null = null;
	conditionCard: FlowCardCondition;

	private constructor(private homey: Homey, private homeyApi: ExtendedHomeyAPIV3Local, private zonesDb: ZonesDb, private log: (...args: unknown[]) => void) {
		this.conditionCard = this.homey.flow.getConditionCard('zone-inactive-for-minutes');
	}

	public static async initialize(homey: Homey, homeyApi: ExtendedHomeyAPIV3Local, zonesDb: ZonesDb, log: (...args: unknown[]) => void): Promise<void> {
		if (ConditionCardZoneInactiveForMinutes.instance === null) {
			ConditionCardZoneInactiveForMinutes.instance = new ConditionCardZoneInactiveForMinutes(homey, homeyApi, zonesDb, log);
			await ConditionCardZoneInactiveForMinutes.instance.setup();
		}
	}

	private async setup(): Promise<void> {
		try {
			this.conditionCard.registerRunListener(async (args, _state) => {
				const zone = await this.zonesDb.getZone(args.zone.id);
				if (zone == null)
					throw new Error(`Zone with id '${args.zone.id}' not found.`);

				const now = new Date();
				const isInactive = zone.activeLastUpdated === null ? true
					: zone.active ? false : (now.getTime() - new Date(zone.activeLastUpdated).getTime()) >= args.minutes * 60 * 1000;

				this.log(`Zone '${zone.name}' is considered ${isInactive ? 'inactive' : 'active'}.`, { args, zone });
				return isInactive;
			});
		} catch (error) {
			this.log('Error registering run listener:', error);
		}

		try {
			this.conditionCard.registerArgumentAutocompleteListener('zone', async (query: string) => await handleZoneAutocomplete(query, this.zonesDb));
		}
		catch (error) {
			this.log('Error updating condition card arguments:', error);
		}
	}
}
