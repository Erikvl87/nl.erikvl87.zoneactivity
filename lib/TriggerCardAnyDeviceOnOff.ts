import { ExtendedDevice, ExtendedDeviceCapability, ExtendedHomeyAPIV3Local } from "homey-api";
import Homey from "homey/lib/Homey";
import { FlowCard, FlowCardTrigger } from "homey";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete";
import ZonesDb from "./ZonesDb";
import CustomError from "./CustomError";
import HomeyLib from "homey-lib";

export default class TriggerCardAnyDeviceTurnedOn {

	private static instance: TriggerCardAnyDeviceTurnedOn | null = null;

	triggerCard: FlowCardTrigger;

	syncDevicesTimeoutId: NodeJS.Timeout | undefined;

	capabilityInstances: Map<string, ExtendedDeviceCapability> = new Map();

	private constructor(private homey: Homey, private homeyApi: ExtendedHomeyAPIV3Local, private zonesDb: ZonesDb, private log: (...args: unknown[]) => void) {
		this.triggerCard = this.homey.flow.getTriggerCard('zone-any-device-on-off');
	}

	public static async initialize(homey: Homey, homeyApi: ExtendedHomeyAPIV3Local, zonesDb: ZonesDb, log: (...args: unknown[]) => void): Promise<void> {
		if (TriggerCardAnyDeviceTurnedOn.instance === null) {
			TriggerCardAnyDeviceTurnedOn.instance = new TriggerCardAnyDeviceTurnedOn(homey, homeyApi, zonesDb, log);
			await TriggerCardAnyDeviceTurnedOn.instance.setup();
		}
	}

	private deleteDeviceCapabilityObserver(device: ExtendedDevice): void {
		this.log('Removing capability instance for device.', { deviceId: device.id });
		this.capabilityInstances.get(device.id)?.destroy();
		this.capabilityInstances.delete(device.id);
	}

	/**
	 * Add a capability observer for the onoff capability of a device.
	 */
	private async addDeviceCapabilityObserver(device : ExtendedDevice): Promise<void> {
		this.log('Creating capability instance for device.', { deviceId: device.id, deviceName: device.name });

		const onOffInstance = device.makeCapabilityInstance('onoff', async value => {
			const zone = await this.zonesDb.getZone(device.zone);
			const tokens = {
				zone: zone?.name,
				deviceName: device.name,
				deviceClass: this.homey.__(device.class) ?? device.class,
				state: value
			};

			const state = {
				deviceId: device.id,
				deviceClass: device.class,
				deviceName: device.name,
				zone: device.zone,
				onoff: value
			};

			try {
				await this.triggerCard.trigger(tokens, state);
			} catch (error) {
				throw new CustomError(`Error triggering card '${this.triggerCard.id}'.`, { error, tokens, state });
			}
		});

		this.capabilityInstances.set(device.id, onOffInstance);
	}

	private async setup(): Promise<void> {
		// Destroy listeners on unload
		this.homey.on('unload', () => {
			this.capabilityInstances.forEach((capabilityInstance: ExtendedDeviceCapability, deviceId: string) => {
				capabilityInstance.destroy();
				this.capabilityInstances.delete(deviceId);
			});
		});

		const devices = await this.homeyApi.devices.getDevices();
		Object.values(devices).forEach(async device => await this.addDeviceCapabilityObserver(device));
		await this.homeyApi.devices.connect(); // Required to listen for the events.
		this.homeyApi.devices.on('device.create', async (device: ExtendedDevice) => {
			if (device.capabilities.includes('onoff'))
				await this.addDeviceCapabilityObserver(device)
		});

		this.homeyApi.devices.on('device.delete', (device: ExtendedDevice) => this.deleteDeviceCapabilityObserver(device));

		this.triggerCard.registerArgumentAutocompleteListener('zone', async (query: string) => await handleZoneAutocomplete(query, this.zonesDb));
		this.triggerCard.registerArgumentAutocompleteListener('deviceClass',
			async (query: string): Promise<FlowCard.ArgumentAutocompleteResults> => {
				const deviceClasses = HomeyLib.Device.getClasses();

				const results = [{
					name: this.homey.__('any_type') ?? "Any type",
					id: 'any_type',
				}];

				const languageCode = this.homey.i18n.getLanguage();
				results.push(...Object.entries(deviceClasses).map(([key, deviceClass]) => {
					return {
						name: deviceClass.title[languageCode] ?? deviceClass.title.en,
						description: deviceClass.description?.[languageCode] ?? deviceClass.description?.en,
						id: key,
					};
				}));

				return results.filter((result) => {
					return result.name.toLowerCase().includes(query.toLowerCase());
				});
			}
		);

		this.triggerCard.registerRunListener(async (args, state) => {
			if(args.zone.id !== state.zone) {
				if(args.includeDescendants === '1') {
					const childZones = await this.zonesDb.getAllChildren(args.zone.id);
					if (!childZones.some((zone) => zone.id === state.zone))
						return false;
				} else {
					return false;
				}
			}

			if (args.deviceClass.id !== 'any_type' && args.deviceClass.id !== state.deviceClass)
				return false;

			const stateToCheck = args.state === '1';
			if(state.onoff !== stateToCheck)
				return false;

			this.log(`Zone activity card triggered for zone '${args.zone.id}' because device '${state.deviceName}' was turned ${state.onoff ? 'on' : 'off'}.`);
			return true;
		});
	}
}
