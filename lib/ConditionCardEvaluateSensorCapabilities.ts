import { FlowCard, FlowCardCondition } from "homey";
import { ExtendedHomeyAPIV3Local } from "homey-api";
import Homey from "homey/lib/Homey";
import { SensorCapabilitiesManager } from "./SensorCapabilitiesManager";
import Zones from "./Zones";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete";

export default class ConditionCardEvaluateSensorCapabilities {
	private static instance: ConditionCardEvaluateSensorCapabilities | null = null;
	conditionCard: FlowCardCondition;

	private constructor(private homey: Homey, private homeyApi: ExtendedHomeyAPIV3Local, private log: (...args: unknown[]) => void) {
		this.conditionCard = this.homey.flow.getConditionCard('zone-evaluate-capability-values');
		this.setup();
	}

	public static initialize(homey: Homey, homeyApi: ExtendedHomeyAPIV3Local, log: (...args: unknown[]) => void): void {
		if (ConditionCardEvaluateSensorCapabilities.instance === null) {
			ConditionCardEvaluateSensorCapabilities.instance = new ConditionCardEvaluateSensorCapabilities(homey, homeyApi, log);
		}
	}

	private setup(): void {
		try {
			this.conditionCard.registerArgumentAutocompleteListener('zone', (query: string) => handleZoneAutocomplete(query, this.homeyApi));
			this.conditionCard.registerArgumentAutocompleteListener('capability',
				async (query: string): Promise<FlowCard.ArgumentAutocompleteResults> => {
					const deviceClasses = SensorCapabilitiesManager.getAllSensorCapabilities();

					const results = [...Object.values(deviceClasses).map((capability) => {
						return {
							name: this.homey.__(capability.id) ?? capability.friendlyName,
							id: capability.id,
						};
					})];

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
				const capability = args.capability.id;
				this.log(`Checking sensors in zone '${args.zone.id}' with capability '${capability}'.`);
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
					device.capabilities.includes(capability) &&
					device.capabilitiesObj[capability] !== null &&
					typeof device.capabilitiesObj[capability].value === 'number'
				);

				this.log(`Checking ${devicesToCheck.length} devices in zone '${zone.name}' with capability '${capability}'.`, { devicesToCheck: devicesToCheck.map(device => device.name) });

				if (devicesToCheck.length === 0) {
					this.log(`No devices with capability '${capability}' found in zone '${zone.name}'.`, { args, zone });
					// Throwing this error will make sure that the flow card will not be triggered if there are no devices in the zone.
					throw new Error(`No devices found in zone '${zone.name}' with capability '${capability}'.`);
				}

				const equation = args.equation;
				const otherValue = args.value;
				return devicesToCheck.some(device => {
					const value = device.capabilitiesObj[capability].value as number;
					switch (equation) {
					case 'equals': {
						const result = value === otherValue;
						this.log(`Device '${device.name}' has value '${value}' for capability '${capability}' which is ${result ? 'equal' : 'not equal'} to '${otherValue}'.`, { device: device.name, args });
						return result;
					}
					case 'is-greater-than': {
						const result = value > otherValue;
						this.log(`Device '${device.name}' has value '${value}' for capability '${capability}' which is ${result ? 'greater' : 'not greater'} than '${otherValue}'.`, { device: device.name, args });
						return result;
					}
					case 'is-less-than': {
						const result = value < otherValue;
						this.log(`Device '${device.name}' has value '${value}' for capability '${capability}' which is ${result ? 'less' : 'not less'} than '${otherValue}'.`, { device: device.name, args });
						return result;
					}
					default:
						throw new Error(`Unknown equation '${equation}'.`);
					}
				});

			});
		} catch (error) {
			this.log('Error registering run listener:', error);
		}
	}
}
