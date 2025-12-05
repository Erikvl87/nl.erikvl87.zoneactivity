import { ExtendedHomeyAPIV3Local, ExtendedZone } from "homey-api";
import type Homey from "homey/lib/Homey";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete.mjs";
import ZonesDb from "./ZonesDb.mjs";
import getIconForZone, { getZoneImageSource } from "./../utils/getIconForZone.mjs";
import { Widget } from "homey";

export default class WidgetZonesActivityList {

	private static instance: WidgetZonesActivityList | null = null;

	widget: Widget;

	private constructor(private homey: Homey, private homeyApi: ExtendedHomeyAPIV3Local, private zonesDb: ZonesDb, private log: (...args: unknown[]) => void, private error: (...args: unknown[]) => void) {
		this.widget = this.homey.dashboards.getWidget('zones-activity-list');
	}

	public static async initialize(homey: Homey, homeyApi: ExtendedHomeyAPIV3Local, zonesDb: ZonesDb, log: (...args: unknown[]) => void, error: (...args: unknown[]) => void): Promise<WidgetZonesActivityList> {
		if (WidgetZonesActivityList.instance === null) {
			WidgetZonesActivityList.instance = new WidgetZonesActivityList(homey, homeyApi, zonesDb, log, error);
			await WidgetZonesActivityList.instance.setup();
		}
		return WidgetZonesActivityList.instance;
	}

	private async setup(): Promise<void> {
		this.widget.registerSettingAutocompleteListener('zone', async (query: string) => await handleZoneAutocomplete(query, this.zonesDb));
		this.homeyApi.zones.on('zone.create', async (_zone: ExtendedZone) => this.homey.api.realtime(`refresh-widget-zones-activity-list`, {}));
		this.homeyApi.zones.on('zone.update', async (_zone: ExtendedZone) => this.homey.api.realtime(`refresh-widget-zones-activity-list`, {}));
		this.homeyApi.zones.on('zone.delete', async (_zone: ExtendedZone) => this.homey.api.realtime(`refresh-widget-zones-activity-list`, {}));
	}

	public async getZones(zoneId: string, includeRoot: boolean, limit: number, sort: string): Promise<unknown> {
		const zone = await this.zonesDb.getZone(zoneId);
		if (!zone)
			return [];

		let descendantZones = await this.zonesDb.getAllChildren(zoneId);
		if (includeRoot)
			descendantZones = [zone, ...descendantZones];

		const activeZones = descendantZones.filter(zone => zone.active);
		const inactiveZones = descendantZones.filter(zone => !zone.active);
		let sortedZones: ExtendedZone[] = [];
		if (sort === "activity") {
			activeZones.sort((a, b) => new Date(b.activeLastUpdated).getTime() - new Date(a.activeLastUpdated).getTime());
			inactiveZones.sort((a, b) => new Date(b.activeLastUpdated).getTime() - new Date(a.activeLastUpdated).getTime());
			sortedZones = [...activeZones, ...inactiveZones].slice(0, limit);
		} else {
			sortedZones = [...descendantZones].slice(0, limit);
		}
		
		const transformedZones = await Promise.all(sortedZones.map(zone => this.transformZone(zone)));
		return transformedZones;
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

