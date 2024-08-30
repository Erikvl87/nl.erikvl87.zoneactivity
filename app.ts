import Homey, { FlowCard } from 'homey';
import { HomeyAPI, ExtendedHomeyAPIV3Local } from 'homey-api';
import getIconForZone from './utils/getIconForZone';
import getPathForZone from './utils/getPathForZone';

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

		await this.updateConditionCardArg();
		await this.registerRunListener();
	}

	/**
	 * Register the run listener for the 'zone-inactive-for-minutes' condition card.
	 * @returns {Promise<void>} A promise that resolves when the listener has been registered.
	 */
	async registerRunListener(): Promise<void> {
		try {
			const conditionCard = this.homey.flow.getConditionCard('zone-inactive-for-minutes');
			conditionCard.registerRunListener(async (args, _state) => {
				const zone = await this.homeyApi.zones.getZone({ id: args.zone.id });
				if (zone == null)
					throw new Error(`Zone with id '${args.zone.id}' not found.`);

				const now = new Date();
				var isInactive = zone.activeLastUpdated === null ? true
					: zone.active ? false : (now.getTime() - new Date(zone.activeLastUpdated).getTime()) >= args.minutes * 60 * 1000;

				this.log(`Zone '${zone.name}' is considered ${isInactive ? 'inactive' : 'active'}.`, { args, zone });
				return isInactive;
			});
		} catch (error) {
			this.log('Error registering run listener:', error);
		}
	}

	/**
	 * Update the autocomplete suggestions for the 'zone' argument in the 'zone-inactive-for-minutes' condition card.
	 * @returns {Promise<void>} A promise that resolves when the autocomplete suggestions have been updated.
	 */
	async updateConditionCardArg(): Promise<void> {
		try {
			const conditionCard = this.homey.flow.getConditionCard('zone-inactive-for-minutes');
			conditionCard.registerArgumentAutocompleteListener('zone', async (query, _args) => {
				const zones = await this.homeyApi.zones.getZones();

				const results: FlowCard.ArgumentAutocompleteResults = Object.values(zones).map((zone) => ({
					name: zone.name,
					description: getPathForZone(zone.parent, zones),
					icon: getIconForZone(zone.icon),
					id: zone.id,
				})) || [];

				return results.filter((result) => {
					return result.name.toLowerCase().includes(query.toLowerCase());
				});
			});
		} catch (error) {
			this.log('Error updating condition card arguments:', error);
		}
	}

}

module.exports = ZoneActivity;
