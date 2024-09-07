import Homey, { FlowCard } from 'homey';
import { HomeyAPI, ExtendedHomeyAPIV3Local } from 'homey-api';
import Zones from './lib/Zones';
import { DeviceClassManager } from './lib/DeviceClassManager';
import getAutocompleteResultsForZone from './utils/getAutocompleteResultsForZone';

class ZoneActivity extends Homey.App {
	/**
	 * The Homey Web API.
	 * @see https://athombv.github.io/node-homey-api/HomeyAPIV3Local.html
	 */
	homeyApi!: ExtendedHomeyAPIV3Local;

	/**
	 * Initialize the Zone Activity app.
	 * @returns {Promise<void>} A promise that resolves when the app has been initialized.
	 */
	async onInit(): Promise<void> {
		this.log('Zone Activity has been initialized');

		this.homeyApi = await HomeyAPI.createAppAPI({
			homey: this.homey,
		});

		await this.updateArgsConditionCards();
		await this.registerRunListeners();
	}

	/**
	 * Register the run listener for the 'zone-inactive-for-minutes' condition card.
	 * @returns {Promise<void>} A promise that resolves when the listener has been registered.
	 */
	async registerRunListeners(): Promise<void> {
		try {
			const conditionCard = this.homey.flow.getConditionCard('zone-inactive-for-minutes');
			conditionCard.registerRunListener(async (args, _state) => {
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
			const conditionCard = this.homey.flow.getConditionCard('zone-any-device-turned-on');
			conditionCard.registerRunListener(async (args, _state) => {
				this.log(`Checking devices in zone '${args.zone.id}' with class '${args.deviceType.id}'.`);
				const zones = new Zones(await this.homeyApi.zones.getZones());
				const zone = zones.getZone(args.zone.id);

				if (zone == null)
					throw new Error(`Zone with id '${args.zone.id}' not found.`);

				const zonesToCheck = [ zone ];
				if(args.includeDescendants === "1")
					zonesToCheck.push(...zones.getAllChildren(zone.id));

				const allDevices = await this.homeyApi.devices.getDevices();
				const devicesToCheck = Object.values(allDevices).filter(device => 
					zonesToCheck.some(zone => device.zone === zone.id) &&
					(args.deviceType.id === 'any_type' || device.class === args.deviceType.id) &&
					device.capabilities.includes('onoff') &&
					device.capabilitiesObj['onoff']
				);

				this.log(`Checking ${devicesToCheck.length} devices in zone '${zone.name}' with class '${args.deviceType.id}' with the onoff capability.`, { devicesToCheck: devicesToCheck.map(device => device.name)});

				if(devicesToCheck.length === 0) {
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

	/**
	 * Update the autocomplete suggestions for the 'zone' argument in the 'zone-inactive-for-minutes' condition card.
	 * @returns {Promise<void>} A promise that resolves when the autocomplete suggestions have been updated.
	 */
	async updateArgsConditionCards(): Promise<void> {
		try {
			const handleZoneAutocomplete = async (query: string): Promise<FlowCard.ArgumentAutocompleteResults> => {
				const zones = new Zones(await this.homeyApi.zones.getZones());
				const results = getAutocompleteResultsForZone(zones);

				return results.filter((result) => {
					return result.name.toLowerCase().includes(query.toLowerCase());
				});
			};

			const cardZoneInactiveForMinutes = this.homey.flow.getConditionCard('zone-inactive-for-minutes');
			const cardZoneDevicesTurnedOn = this.homey.flow.getConditionCard('zone-any-device-turned-on');
			cardZoneInactiveForMinutes.registerArgumentAutocompleteListener('zone', handleZoneAutocomplete);
			cardZoneDevicesTurnedOn.registerArgumentAutocompleteListener('zone', handleZoneAutocomplete);
			cardZoneDevicesTurnedOn.registerArgumentAutocompleteListener('deviceType',
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

module.exports = ZoneActivity;
