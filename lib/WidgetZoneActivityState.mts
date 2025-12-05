import { ExtendedHomeyAPIV3Local, ExtendedZone } from "homey-api";
import Homey from "homey/lib/Homey";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete.mjs";
import ZonesDb from "./ZonesDb.mjs";
import getIconForZone, { getZoneImageSource } from "./../utils/getIconForZone.mjs";
import { Widget } from "homey";

export default class WidgetZoneActivityState {

	private static instance: WidgetZoneActivityState | null = null;

	widget: Widget;

	private constructor(private homey: Homey, private homeyApi: ExtendedHomeyAPIV3Local, private zonesDb: ZonesDb, private log: (...args: unknown[]) => void, private error: (...args: unknown[]) => void) {
		this.widget = this.homey.dashboards.getWidget('zone-activity-state');
	}

	public static async initialize(homey: Homey, homeyApi: ExtendedHomeyAPIV3Local, zonesDb: ZonesDb, log: (...args: unknown[]) => void, error: (...args: unknown[]) => void): Promise<WidgetZoneActivityState> {
		if (WidgetZoneActivityState.instance === null) {
			WidgetZoneActivityState.instance = new WidgetZoneActivityState(homey, homeyApi, zonesDb, log, error);
			await WidgetZoneActivityState.instance.setup();
		}
		return WidgetZoneActivityState.instance;
	}

	private async setup(): Promise<void> {
		this.widget.registerSettingAutocompleteListener('zone', async (query: string) => await handleZoneAutocomplete(query, this.zonesDb));

		this.homeyApi.zones.on('zone.update', async (zone: ExtendedZone) => this.homey.api.realtime(`refresh-widget-zone-activity-state-${zone.id}`, await this.transformZone(zone)));
		this.homeyApi.zones.on('zone.delete', async (zone: ExtendedZone) => this.homey.api.realtime(`refresh-widget-zone-activity-state-${zone.id}`, null));
	}

	public async getZone(zoneId: string): Promise<unknown> {
		const zone = await this.zonesDb.getZone(zoneId);
		if (zone === null)
			return null;

		return await this.transformZone(zone);
	}

	private async transformZone(zone: ExtendedZone): Promise<unknown> {
		const result = {
			id: zone.id,
			iconSrc: await getZoneImageSource(zone.icon),
			icon: getIconForZone(zone.icon),
			name: zone.name,
			active: zone.active,
			activeLastUpdated: zone.activeLastUpdated,
		}

		return result;
	}
}

