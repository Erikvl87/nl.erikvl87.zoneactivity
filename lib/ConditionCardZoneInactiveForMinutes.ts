import { ExtendedHomeyAPIV3Local } from "homey-api";
import Homey from "homey/lib/Homey";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete";
import { FlowCardCondition } from "homey";

export default class ConditionCardZoneInactiveForMinutes {
	private static instance: ConditionCardZoneInactiveForMinutes | null = null;
	conditionCard: FlowCardCondition;

	private constructor(private homey: Homey, private homeyApi: ExtendedHomeyAPIV3Local, private log: (...args: unknown[]) => void) {
		this.conditionCard = this.homey.flow.getConditionCard('zone-inactive-for-minutes');
		this.setup();
	}

	public static initialize(homey: Homey, homeyApi: ExtendedHomeyAPIV3Local, log: (...args: unknown[]) => void): void {
		if (ConditionCardZoneInactiveForMinutes.instance === null) {
			ConditionCardZoneInactiveForMinutes.instance = new ConditionCardZoneInactiveForMinutes(homey, homeyApi, log);
		}
	}

	private setup(): void {
		try {
			this.conditionCard.registerRunListener(async (args, _state) => {
				const zone = await this.homeyApi.zones.getZone({ id: args.zone.id });
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
			this.conditionCard.registerArgumentAutocompleteListener('zone', (query: string) => handleZoneAutocomplete(query, this.homeyApi));
		}
		catch (error) {
			this.log('Error updating condition card arguments:', error);
		}
	}
}
