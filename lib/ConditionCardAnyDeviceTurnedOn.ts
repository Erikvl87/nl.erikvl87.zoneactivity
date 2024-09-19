import { ExtendedHomeyAPIV3Local } from "homey-api";
import Homey from "homey/lib/Homey";
import { DeviceClassManager } from "./DeviceClassManager";
import { FlowCard, FlowCardCondition } from "homey";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete";
import ZonesDb from "./ZonesDb";

export default class ConditionCardAnyDeviceTurnedOn {
	
	private static instance: ConditionCardAnyDeviceTurnedOn | null = null;

	conditionCard: FlowCardCondition;

	private constructor(private homey: Homey, private homeyApi: ExtendedHomeyAPIV3Local, private zonesDb: ZonesDb, private log: (...args: unknown[]) => void) {
		this.conditionCard = this.homey.flow.getConditionCard('zone-any-device-turned-on');
	}

	public static async initialize(homey: Homey, homeyApi: ExtendedHomeyAPIV3Local, zonesDb: ZonesDb, log: (...args: unknown[]) => void): Promise<void> {
		if (ConditionCardAnyDeviceTurnedOn.instance === null) {
			ConditionCardAnyDeviceTurnedOn.instance = new ConditionCardAnyDeviceTurnedOn(homey, homeyApi, zonesDb, log);
			await ConditionCardAnyDeviceTurnedOn.instance.setup();
		}
	}

	private async setup(): Promise<void> {
		try {
			this.conditionCard.registerArgumentAutocompleteListener('zone', async (query: string) => await handleZoneAutocomplete(query, this.zonesDb));
			this.conditionCard.registerArgumentAutocompleteListener('deviceType',
				async (query: string): Promise<FlowCard.ArgumentAutocompleteResults> => {
					const deviceClasses = DeviceClassManager.getAllDeviceClasses();

					const results = [{
						name: this.homey.__('any_type') ?? "Any type",
						id: 'any_type',
					}];

					results.push(...Object.values(deviceClasses).map((deviceClass) => {
						return {
							name: this.homey.__(deviceClass.id) ?? deviceClass.friendlyName,
							id: deviceClass.id,
						};
					}));

					return results.filter((result) => {
						return result.name.toLowerCase().includes(query.toLowerCase());
					});
				}
			);
		} catch (error) {
			this.log('Error updating condition card arguments:', error);
		}

		try {
			this.conditionCard.registerRunListener(async (args, _state) => {
				this.log(`Checking devices in zone '${args.zone.id}' with class '${args.deviceType.id}'.`);
				
				const zone = await this.zonesDb.getZone(args.zone.id);

				if (zone == null)
					throw new Error(`Zone with id '${args.zone.id}' not found.`);

				const zonesToCheck = [zone];
				if (args.includeDescendants === "1")
					zonesToCheck.push(...await this.zonesDb.getAllChildren(zone.id));

				const allDevices = await this.homeyApi.devices.getDevices();
				const devicesToCheck = Object.values(allDevices).filter(device =>
					zonesToCheck.some(zone => device.zone === zone.id) &&
					(args.deviceType.id === 'any_type' || device.class === args.deviceType.id) &&
					device.capabilities.includes('onoff') &&
					device.capabilitiesObj['onoff'] !== null
				);

				this.log(`Checking ${devicesToCheck.length} devices in zone '${zone.name}' with class '${args.deviceType.id}' with the onoff capability.`, { devicesToCheck: devicesToCheck.map(device => device.name) });

				if (devicesToCheck.length === 0) {
					this.log(`No devices with class '${args.deviceType.id}' found in zone '${zone.name}'.`, { args, zone });
					// Throwing this error will make sure that the flow card will not be triggered if there are no devices in the zone.
					throw new Error(`No devices found in zone '${zone.name}' with class '${args.deviceType.id}'.`);
				}

				return devicesToCheck.some(device => device.capabilitiesObj['onoff'].value === true);
			});
		} catch (error) {
			this.log('Error registering run listener:', error);
		}
	}
}
