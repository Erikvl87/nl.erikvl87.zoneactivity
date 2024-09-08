import Homey from 'homey';
import { HomeyAPI, ExtendedHomeyAPIV3Local } from 'homey-api';
import ConditionCardAnyDeviceTurnedOn from './lib/ConditionCardAnyDeviceTurnedOn';
import ConditionCardZoneInactiveForMinutes from './lib/ConditionCardZoneInactiveForMinutes';
import ConditionCardEvaluateSensorCapabilities from './lib/ConditionCardEvaluateSensorCapabilities';

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

		ConditionCardAnyDeviceTurnedOn.initialize(this.homey, this.homeyApi, this.log);
		ConditionCardZoneInactiveForMinutes.initialize(this.homey, this.homeyApi, this.log);
		ConditionCardEvaluateSensorCapabilities.initialize(this.homey, this.homeyApi, this.log);
	}
}

module.exports = ZoneActivity;
