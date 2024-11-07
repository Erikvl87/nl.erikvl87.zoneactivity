import type Homey from "homey/lib/Homey";
import ZoneActivity from "../../app.mjs";

type ApiRequest = { homey: Homey & { app: ZoneActivity }; query: any, body: any, params: unknown };

class ZonesActivityListWidget {
	public async getZones({ homey, body }: ApiRequest): Promise<unknown> {
		return await homey.app.widgetZonesActivityList.getZones(body.zoneId, body.includeRoot, body.limit, body.sort);
	}

	public async log({ homey, body }: ApiRequest): Promise<void> {
		const message = `[${this.constructor.name}]: ${body[0]}`;
		const args = body.slice(1);
		homey.app.log(message, ...args);
	}

	public async getTimeAndLanguage({ homey }: ApiRequest): Promise<{ timezone: string, language: string }> {
		return await homey.app.getTimeAndLanguage();
	}
}

export default new ZonesActivityListWidget();