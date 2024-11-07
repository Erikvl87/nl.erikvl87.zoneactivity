import type Homey from 'homey/lib/HomeyWidget'

type Zone = { id: string; name: string; iconSrc?: string; active: boolean; activeLastUpdated: string; };

declare global {
	interface Window {
		onHomeyReady: (homey: Homey) => Promise<void>;
	}
}

class WidgetScript {
	private zones = new Map();
	private list: HTMLElement;
	private template: HTMLElement;
	private homey: Homey;
	private settings: {
		sort: string;
		includeRoot: boolean;
		limit: number; zone: { id: string; };
	};
	private language: string | undefined;
	private timezone: string | undefined;
	private initialZoneCount: number = 0;
	private showTimestampMap = new Map<string, boolean>();

	constructor(homey: Homey) {
		this.homey = homey;
		this.list = document.getElementById('zones-list')!;
		this.template = document.getElementById('zone-template')!;
		this.settings = homey.getSettings() as { sort: string; includeRoot: boolean; limit: number; zone: { id: string; }; };
		this.updateAllZoneStatus = this.updateAllZoneStatus.bind(this);
	}

	public async onHomeyReady(): Promise<void> {
		await this.log('Initializing widget.', { widgetInstanceId: this.homey.getWidgetInstanceId(), settings: this.settings });
		await this.homey.api('GET', '/getTimeAndLanguage')
			.then((response) => {
				const { timezone, language } = response as { timezone: string; language: string };
				this.timezone = timezone;
				this.language = language;
			});

		await this.getZones()
			.then(() => {
				if(this.zones.size !== 0) {
					this.initialZoneCount = this.zones.size;
					setInterval(this.updateAllZoneStatus, 1000);
					const widgetMargins = (16 * 2) + 5;
					const itemsHeight = 48 * this.zones.size;
					const itemsMargins = 8 * (this.zones.size - 1);
					const height = widgetMargins + itemsHeight + itemsMargins;
					this.homey.ready({ height });
					this.homey.on(`refresh-widget-zones-activity-list`, async () => {
						await this.getZones();
					});
				} else {
					this.homey.ready();
				}
			});
	}

	private async updateZone(zone: Zone, zoneElement: HTMLElement): Promise<void> {
		zoneElement.querySelector('#zone-name')!.textContent = zone.name;
		const zoneIconElement = zoneElement.querySelector('#zone-icon') as HTMLElement;
		const statusElement = zoneElement.querySelector('#zone-status') as HTMLElement;
		const pulseElement = zoneElement.querySelector('#pulse') as HTMLElement;
		const pulseBackground = zoneElement.querySelector('#pulse-background') as HTMLElement;
		statusElement.style.display = 'block';

		if (zone.iconSrc) {
			const svgContent = encodeURIComponent(zone.iconSrc);
			zoneIconElement.style.webkitMask = `url("data:image/svg+xml,${svgContent}") no-repeat center`;
			zoneIconElement.style.mask = `url("data:image/svg+xml,${svgContent}") no-repeat center`;
			zoneIconElement.style.backgroundColor = 'var(--homey-text-color)';
		} else {
			zoneIconElement.style.backgroundColor = 'transparent';
			await this.log('No icon found for zone', zone);
		}

		if (zone.active) {
			statusElement.classList.add('active', 'homey-text-small');
			statusElement.classList.remove('homey-text-small-light');
			zoneIconElement.classList.add('active');
			pulseElement.style.display = 'block';
			pulseBackground.style.display = 'block';
		} else {
			statusElement.classList.remove('active', 'homey-text-small');
			statusElement.classList.add('homey-text-small-light');
			zoneIconElement.classList.remove('active');
			pulseElement.style.display = 'none';
			pulseBackground.style.display = 'none';
		}

		statusElement.onclick = () : void => {
			if(zone.active === false && new Date(zone.activeLastUpdated).getTime() !== 0) {
				const currentShowTimestamp = this.showTimestampMap.get(zone.id) || false;
				this.showTimestampMap.set(zone.id, !currentShowTimestamp);
				this.homey.hapticFeedback();
				this.updateZoneStatus(zone, statusElement);
			}
		};

		this.updateZoneStatus(zone, statusElement);
	}

	private updateAllZoneStatus(): void {
		this.zones.forEach(zone => {
			this.updateZoneStatus(zone, zone.element.querySelector('#zone-status'));
		});
	}

	private updateZoneStatus(zone: Zone, statusElement: HTMLElement): void {
		if (zone.active) {
			statusElement.textContent = this.homey.__('active');
		} else {
			const now = new Date();
			const timeDifference = now.getTime() - new Date(zone.activeLastUpdated).getTime();
			const secondsDifference = Math.max(0, Math.floor(timeDifference / 1000));
			const minutesDifference = Math.floor(secondsDifference / 60);
			const hoursDifference = Math.floor(minutesDifference / 60);

			const showTimestamp = this.showTimestampMap.get(zone.id) || false;
			let timeText;
			if (!showTimestamp && secondsDifference < 60) {
				timeText = `${secondsDifference} ${this.homey.__(secondsDifference === 1 ? 'second_ago' : 'seconds_ago')}`;
			} else if (!showTimestamp && minutesDifference < 60) {
				timeText = `${minutesDifference} ${this.homey.__(minutesDifference === 1 ? 'minute_ago' : 'minutes_ago')}`;
			} else if (!showTimestamp && hoursDifference < 24) {
				timeText = `${hoursDifference} ${this.homey.__(hoursDifference === 1 ? 'hour_ago' : 'hours_ago')}`;
			} else if (!showTimestamp && new Date(zone.activeLastUpdated).getTime() === 0) {
				timeText = this.homey.__('never');
			} else {
				timeText = new Date(zone.activeLastUpdated).toLocaleString(this.language, { timeZone: this.timezone });
			}

			statusElement.textContent = `${this.homey.__('last_active')}: ${timeText}`;
		}
	}

	private async getZones(): Promise<void> {
		return this.homey.api('POST', `/getZones`, {
			zoneId: this.settings.zone.id,
			limit: this.settings.limit,
			includeRoot: this.settings.includeRoot,
			sort: this.settings.sort
		})
			.then(async (result: unknown) => {
				const zones = result as Zone[];
				if (zones.length === 0) {
					this.renderError(this.homey.__('zone_not_found'));
					return;
				}

				const newZones = new Map();
				const existingZoneIds = new Set(this.zones.keys());

				for (const zone of zones) {
					const existingZone = this.zones.get(zone.id);
					if (existingZone) {
						const hasChanged = existingZone.active !== zone.active ||
							existingZone.activeLastUpdated !== zone.activeLastUpdated || 
							existingZone.name !== zone.name ||
							existingZone.iconSrc !== zone.iconSrc;

						if (hasChanged) {
							await this.updateZone(zone, existingZone.element);
						}
						newZones.set(zone.id, { ...zone, element: existingZone.element });
						existingZoneIds.delete(zone.id);
					} else {
						const item = this.template.cloneNode(true) as HTMLElement;
						item.removeAttribute('id');
						await this.updateZone(zone, item);
						this.list.appendChild(item);
						newZones.set(zone.id, { ...zone, element: item });
					}
					// Preserve showTimestamp state
					if (this.showTimestampMap.has(zone.id)) {
						this.showTimestampMap.set(zone.id, this.showTimestampMap.get(zone.id)!);
					} else {
						this.showTimestampMap.set(zone.id, false);
					}
				}

				// Remove zones that are no longer in the result
				existingZoneIds.forEach(id => {
					const zone = this.zones.get(id);
					if (zone) {
						this.list.removeChild(zone.element);
					}
				});

				this.zones.clear();
				newZones.forEach((value, key) => this.zones.set(key, value));
				const orderedElements = Array.from(newZones.values()).map(zone => zone.element);
				orderedElements.forEach(element => this.list.appendChild(element));

				if (this.zones.size > this.initialZoneCount) {
					document.querySelector('.homey-widget')?.classList.add('scrollable');
				} else {
					document.querySelector('.homey-widget')?.classList.remove('scrollable');
				}
			})
			.catch(async (error) => {
				this.renderError(this.homey.__('contact_dev'));
				await this.log('Error retrieving zones', { widgetInstanceId: this.homey.getWidgetInstanceId(), settings: this.settings, error: { message: error.message } });
				this.homey.ready();
			});
	}

	private renderError(message: string): void {
		document.getElementById('zones-list')!.style.display = 'none';
		document.getElementById('error-title')!.textContent = this.homey.__('widget_error');
		document.getElementById('error-message')!.textContent = message;
		document.getElementById('error')!.style.display = 'block';
	}

	private async log(...args: any[]): Promise<void> {
		await this.homey.api('POST', '/log', args);
	}
}

window.onHomeyReady = async (homey: Homey): Promise<void> => await new WidgetScript(homey).onHomeyReady();