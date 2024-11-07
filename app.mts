import Homey from 'homey';
import { HomeyAPI, ExtendedHomeyAPIV3Local } from 'homey-api';
import { Log } from 'homey-log';
import ConditionCardAnyDeviceTurnedOn from './lib/ConditionCardAnyDeviceTurnedOn.mjs';
import ConditionCardZoneInactiveForMinutes from './lib/ConditionCardZoneInactiveForMinutes.mjs';
import ConditionCardEvaluateSensorCapabilities from './lib/ConditionCardEvaluateSensorCapabilities.mjs';
import ConditionCardZoneActiveForMinutes from './lib/ConditionCardZoneActiveForMinutes.mjs';
import TriggerCardAnyDeviceTurnedOn from './lib/TriggerCardAnyDeviceOnOff.mjs';
import ZonesDb from './lib/ZonesDb.mjs';

export default class ZoneActivity extends Homey.App {
	/**
	 * The Homey Web API.
	 * @see https://athombv.github.io/node-homey-api/HomeyAPIV3Local.html
	 */
	homeyApi!: ExtendedHomeyAPIV3Local;
	homeyLog?: Log;

	/**
	 * Initialize the Zone Activity app.
	 * @returns {Promise<void>} A promise that resolves when the app has been initialized.
	 */
	override async onInit(): Promise<void> {
		this.homeyLog = new Log({ homey: this.homey });
		this.log(`${this.constructor.name} has been initialized`);

		this.homeyApi = await HomeyAPI.createAppAPI({
			homey: this.homey,
		});

		const zonesDb = await ZonesDb.initialize(this.homeyApi, this.log);
		await ConditionCardAnyDeviceTurnedOn.initialize(this.homey, this.homeyApi, zonesDb, this.log);
		await ConditionCardZoneInactiveForMinutes.initialize(this.homey, this.homeyApi, zonesDb, this.log); // Deprecated
		await ConditionCardZoneActiveForMinutes.initialize(this.homey, this.homeyApi, zonesDb, this.log);
		await ConditionCardEvaluateSensorCapabilities.initialize(this.homey, this.homeyApi, zonesDb, this.log);
		await TriggerCardAnyDeviceTurnedOn.initialize(this.homey, this.homeyApi, zonesDb, this.log, this.error);
	}
}