import { ExtendedHomeyAPIV3Local } from "homey-api";
import Homey from "homey/lib/Homey";
import Zones from "./Zones";
import { DeviceClassManager } from "./DeviceClassManager";
import { FlowCard, FlowCardCondition } from "homey";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete";

export default class ConditionCardAnyDeviceTurnedOn {
	
	private static instance: ConditionCardAnyDeviceTurnedOn | null = null;

	conditionCard: FlowCardCondition;

	private constructor(private homey: Homey, private homeyApi: ExtendedHomeyAPIV3Local, private log: (...args: unknown[]) => void) {
		this.conditionCard = this.homey.flow.getConditionCard('zone-any-device-turned-on');
		this.setup();
		this.onCardTriggeredAnyDeviceTurnedOn();
	}

	public static initialize(homey: Homey, homeyApi: ExtendedHomeyAPIV3Local, log: (...args: unknown[]) => void): void {
		if (ConditionCardAnyDeviceTurnedOn.instance === null) {
			ConditionCardAnyDeviceTurnedOn.instance = new ConditionCardAnyDeviceTurnedOn(homey, homeyApi, log);
		}
	}

	private setup(): void {
		try {
			this.conditionCard.registerRunListener(async (args, _state) => {
				this.log(`Checking devices in zone '${args.zone.id}' with class '${args.deviceType.id}'.`);
				const zones = new Zones(await this.homeyApi.zones.getZones());
				const zone = zones.getZone(args.zone.id);

				if (zone == null)
					throw new Error(`Zone with id '${args.zone.id}' not found.`);

				const zonesToCheck = [zone];
				if (args.includeDescendants === "1")
					zonesToCheck.push(...zones.getAllChildren(zone.id));

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

	private onCardTriggeredAnyDeviceTurnedOn(): void {
		try {
			

			this.conditionCard.registerArgumentAutocompleteListener('zone', (query: string) => handleZoneAutocomplete(query, this.homeyApi));
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
	}
}
