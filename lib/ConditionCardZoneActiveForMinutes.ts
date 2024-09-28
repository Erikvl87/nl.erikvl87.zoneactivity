import { ExtendedHomeyAPIV3Local } from "homey-api";
import Homey from "homey/lib/Homey";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete";
import { FlowCardCondition } from "homey";
import ZonesDb from "./ZonesDb";

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
			const zone = await this.zonesDb.getZone(args.zone.id);
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

		this.conditionCard.registerArgumentAutocompleteListener('zone', async (query: string) => await handleZoneAutocomplete(query, this.zonesDb));
	}
}
