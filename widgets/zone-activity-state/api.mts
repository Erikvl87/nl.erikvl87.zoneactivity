
import ZoneActivity from "../../app.mjs";
import Homey from "homey/lib/Homey";

type ApiRequest = { homey: Homey & { app: ZoneActivity }; query: any, body: any, params: unknown };

class ZoneActivityStateWidget {
	public async getZone({ homey, query }: ApiRequest) : Promise<unknown> {
		return await homey.app.widgetZoneActivityState.getZone(query.zoneId);
	}

	public async log({ homey, body }: ApiRequest) : Promise<void> {
		const message = `[${this.constructor.name}]: ${body[0]}`;
		const args = body.slice(1);
		homey.app.log(message, ...args);
	}

	public async getTimeAndLanguage({ homey }: ApiRequest): Promise<{ timezone: string, language: string }> {
		return await homey.app.getTimeAndLanguage();
	}
}

export default new ZoneActivityStateWidget();