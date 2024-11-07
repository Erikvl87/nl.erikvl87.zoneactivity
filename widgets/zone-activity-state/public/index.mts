import type Homey from 'homey/lib/HomeyWidget'

declare global {
	interface Window {
		onHomeyReady: (homey: Homey) => Promise<void>;
	}
}

type Zone = { id: string; name: string; iconSrc?: string; active?: boolean; activeLastUpdated: string; };
let zone: Zone;

class WidgetScript {
	private homey: Homey;
	private settings: { zone: { id: string; }; };
	private language: string | undefined;
	private timezone: string | undefined;
	private showTimestamp : boolean = false;

	constructor(homey: Homey) {
		this.homey = homey;
		this.settings = homey.getSettings() as { zone: { id: string; }; };
		this.updateZoneStatus = this.updateZoneStatus.bind(this);
	}

	public async onHomeyReady(): Promise<void> {
		await this.log('Initializing widget.', { widgetInstanceId: this.homey.getWidgetInstanceId(), settings: this.settings });
		await this.homey.api('GET', '/getTimeAndLanguage')
			.then((response) => {
				const { timezone, language } = response as { timezone: string; language: string };
				this.timezone = timezone;
				this.language = language;
			});
		if (this.settings.zone.id) {
			await this.homey.api('GET', `/getZone?widgetInstanceId=${this.homey.getWidgetInstanceId()}&zoneId=${this.settings.zone.id}`, {})
				.then(async (result) => {
					const zoneResult = result as Zone;
					if(zoneResult !== null) {
						await this.setZone(zoneResult);
						setInterval(this.updateZoneStatus, 1000);
						this.homey.on(`refresh-widget-zone-activity-state-${this.settings.zone.id}`, (updateResult: Zone) => this.setZone(updateResult));
						const statusElement = document.getElementById('zone-status');
						statusElement!.onclick = () : void => {
							if(zone?.active === false && new Date(zone.activeLastUpdated).getTime() !== 0) {
								this.showTimestamp = !this.showTimestamp;
								this.homey.hapticFeedback();
								this.updateZoneStatus();
							}
						};
					}
					const zoneInfoElement = document.getElementById('zone-info');
					if (zoneInfoElement) {
						zoneInfoElement.style.display = 'flex';
					}
				})
				.catch(async (error: { message: any; }) => {
					this.renderError(this.homey.__('contact_dev'));
					await this.log('Error initializing widget.', { widgetInstanceId: this.homey.getWidgetInstanceId(), settings: this.settings, error: { message: error.message } });
				})
				.finally(() => {
					this.homey.ready();
				});
		} else {
			await this.log('No zone has been specified.', { widgetInstanceId: this.homey.getWidgetInstanceId(), settings: this.settings });
		}
	}

	private async updateZone(): Promise<void> {
		if (zone === null)
			return;

		document.getElementById('zone-name')!.textContent = zone.name;
		const zoneIconElement = document.getElementById('zone-icon');
		const statusElement = document.getElementById('zone-status');
		const pulseElement = document.getElementById('pulse');
		const pulseBackground = document.getElementById('pulse-background');
		statusElement!.style.display = 'block';

		if (zone.iconSrc) {
			const svgContent = encodeURIComponent(zone.iconSrc);
			zoneIconElement!.style.webkitMask = `url("data:image/svg+xml,${svgContent}") no-repeat center`;
			zoneIconElement!.style.mask = `url("data:image/svg+xml,${svgContent}") no-repeat center`;
			zoneIconElement!.style.backgroundColor = 'var(--homey-text-color)';
		} else {
			zoneIconElement!.style.backgroundColor = 'transparent';
			await this.log('No icon found for zone', zone);
		}

		if (zone.active) {
			statusElement!.classList.add('active', 'homey-text-small');
			statusElement!.classList.remove('homey-text-small-light');
			zoneIconElement!.classList.add('active');
			pulseElement!.style.display = 'block';
			pulseBackground!.style.display = 'block';
		} else {
			statusElement!.classList.remove('active', 'homey-text-small');
			statusElement!.classList.add('homey-text-small-light');
			zoneIconElement!.classList.remove('active');
			pulseElement!.style.display = 'none';
			pulseBackground!.style.display = 'none';
		}

		this.updateZoneStatus();
	}

	private updateZoneStatus(): void {
		if (zone === null)
			return;

		const statusElement = document.getElementById('zone-status');

		if (zone.active) {
			statusElement!.textContent = this.homey.__('active');
		} else {
			const now = new Date();
			const timeDifference = now.getTime() - new Date(zone.activeLastUpdated).getTime();
			const secondsDifference = Math.max(0, Math.floor(timeDifference / 1000));
			const minutesDifference = Math.floor(secondsDifference / 60);
			const hoursDifference = Math.floor(minutesDifference / 60);

			let timeText;
			if (!this.showTimestamp && secondsDifference < 60) {
				timeText = `${secondsDifference} ${this.homey.__(secondsDifference === 1 ? 'second_ago' : 'seconds_ago')}`;
			} else if (!this.showTimestamp && minutesDifference < 60) {
				timeText = `${minutesDifference} ${this.homey.__(minutesDifference === 1 ? 'minute_ago' : 'minutes_ago')}`;
			} else if (!this.showTimestamp && hoursDifference < 24) {
				timeText = `${hoursDifference} ${this.homey.__(hoursDifference === 1 ? 'hour_ago' : 'hours_ago')}`;
			} else if (!this.showTimestamp && new Date(zone.activeLastUpdated ?? 0).getTime() === 0) {
				timeText = this.homey.__('never');
			} else {
				timeText = new Date(zone.activeLastUpdated).toLocaleString(this.language, { timeZone: this.timezone });
			}

			statusElement!.textContent = `${this.homey.__('last_active')}: ${timeText}`;
		}
	}

	private async setZone(result: Zone): Promise<void> {
		const previousZone = zone;
		zone = result;
		if(zone === null) {
			this.renderError(this.homey.__('zone_not_found'));
			return;
		}
		if (previousZone?.active !== zone.active || previousZone.name !== zone.name || previousZone?.iconSrc !== zone.iconSrc)
			await this.updateZone();
	}

	private renderError(message: string): void {
		document.getElementById('zone-info')!.style.display = 'none';
		document.getElementById('error-title')!.textContent = this.homey.__('widget_error');
		document.getElementById('error-message')!.textContent = message;
		document.getElementById('error')!.style.display = 'block';
	}

	private async log(...args: any[]): Promise<void> {
		await this.homey.api('POST', '/log', args);
	}
}

window.onHomeyReady = async (homey: Homey) : Promise<void> => await new WidgetScript(homey).onHomeyReady();