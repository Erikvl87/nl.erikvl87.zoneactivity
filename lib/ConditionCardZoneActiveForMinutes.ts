import { ExtendedHomeyAPIV3Local } from "homey-api";
import Homey from "homey/lib/Homey";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete";
import { FlowCardCondition } from "homey";

export default class ConditionCardZoneActiveForMinutes {
	private static instance: ConditionCardZoneActiveForMinutes | null = null;
	conditionCard: FlowCardCondition;

	private constructor(private homey: Homey, private homeyApi: ExtendedHomeyAPIV3Local, private log: (...args: unknown[]) => void) {
		this.conditionCard = this.homey.flow.getConditionCard('zone-active-for-minutes');
		this.setup();
	}

	public static initialize(homey: Homey, homeyApi: ExtendedHomeyAPIV3Local, log: (...args: unknown[]) => void): void {
		if (ConditionCardZoneActiveForMinutes.instance === null) {
			ConditionCardZoneActiveForMinutes.instance = new ConditionCardZoneActiveForMinutes(homey, homeyApi, log);
		}
	}

	private setup(): void {
		try {
			this.conditionCard.registerRunListener(async (args, _state) => {
				const zone = await this.homeyApi.zones.getZone({ id: args.zone.id });
				if (zone == null)
					throw new Error(`Zone with id '${args.zone.id}' not found.`);

				const now = new Date();
				const checkIsActive = args.state === 'active';

				if(checkIsActive) {
					const isZoneActive = (zone.activeLastUpdated !== null && zone.active);
					const activeForGivenMinutes = (now.getTime() - new Date(zone.activeLastUpdated).getTime()) >= args.minutes * 60 * 1000;
					const isActive = isZoneActive && activeForGivenMinutes;
					this.log(`Zone '${zone.name}' is considered ${isActive ? 'active' : 'inactive'}.`, { args, zone });
					return isActive;

				} else {
					const isZoneInactive = !(zone.activeLastUpdated === null ? false : zone.active);
					const lastUpdatedWithinGivenMinutes = (now.getTime() - new Date(zone.activeLastUpdated).getTime()) >= args.minutes * 60 * 1000;
					const isInactive = isZoneInactive && lastUpdatedWithinGivenMinutes;
					this.log(`Zone '${zone.name}' is considered ${isInactive ? 'inactive' : 'active'}.`, { args, zone });
					return isInactive;
				}
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
