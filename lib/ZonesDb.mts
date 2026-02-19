import { ExtendedHomeyAPIV3Local, ExtendedZone } from "homey-api";

export default class ZonesDb {

	private static instance: ZonesDb | null = null;

	private zones: Map<string, ExtendedZone> = new Map();
	private parentMap: Map<string, ExtendedZone[]> = new Map();
	private childMap: Map<string, ExtendedZone[]> = new Map();
	private lastUpdated: Date | null = null;
	private isUpdating: boolean = false;
	private reconnectIntervalId: ReturnType<typeof setInterval> | null = null;

	private constructor(private homeyApi: ExtendedHomeyAPIV3Local, private log: (...args: unknown[]) => void) {

	}

	public static async initialize(homeyApi: ExtendedHomeyAPIV3Local, log: (...args: unknown[]) => void): Promise<ZonesDb> {
		if (ZonesDb.instance === null) {
			ZonesDb.instance = new ZonesDb(homeyApi, log);
			await ZonesDb.instance.setup();
		}

		return ZonesDb.instance;
	}

	private async setup(): Promise<void> {
		this.log('Initializing ZonesDb and connecting to zones API...');
		await this.homeyApi.zones.connect();
		this.log('Connected to zones API. Setting up event listeners and computing initial zones database...');
		const callback = async (eventName: string, _zone: ExtendedZone): Promise<void> => {
			this.log(`Received event '${eventName}' for zone '${_zone.name}' (id: ${_zone.id}). Updating zones database...`, { eventName, zone: _zone });
			await this.compute();
		};

		this.homeyApi.zones.on('zone.create', async (_zone: ExtendedZone) => callback('zone.create', _zone));
		this.homeyApi.zones.on('zone.update', async (_zone: ExtendedZone) => callback('zone.update', _zone));
		this.homeyApi.zones.on('zone.delete', async (_zone: ExtendedZone) => callback('zone.delete', _zone));
		await this.compute();
		this.startPeriodicReconnect();
	}

	/**
	 * WORKAROUND: Periodically reconnects to the zones manager to prevent
	 * stale connections that some users experience after long periods.
	 * This method should be removed once the root cause is identified and fixed.
	 */
	private startPeriodicReconnect(): void {
		const RECONNECT_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes
		this.reconnectIntervalId = setInterval(async () => {
			try {
				this.log('[Workaround] Periodically reconnecting to zones API to prevent stale connections...');
				await this.homeyApi.zones.connect();
				this.log('[Workaround] Successfully reconnected to zones API.');
			} catch (error) {
				this.log('[Workaround] Failed to reconnect to zones API:', error);
			}
		}, RECONNECT_INTERVAL_MS);
	}

	private async compute(): Promise<void> {
		this.isUpdating = true;
		this.lastUpdated = new Date();
		const zones = await this.homeyApi.zones.getZones();
		const zoneArray = Object.values(zones);
		this.zones.clear();
		this.parentMap.clear();
		this.childMap.clear();
		zoneArray.forEach(zone => this.zones.set(zone.id, zone));
		zoneArray.forEach(zone => {
			this.precomputeParents(zone);
			if (zone.parent) {
				if (!this.childMap.has(zone.parent)) {
					this.childMap.set(zone.parent, []);
				}
				this.childMap.get(zone.parent)?.push(zone);
			}
		});
		this.isUpdating = false;
	}

	private precomputeParents(zone: ExtendedZone): void {
		const parents: ExtendedZone[] = [];
		let currentZone = zone;

		while (currentZone && currentZone.parent) {
			const parentZone = this.zones.get(currentZone.parent);
			if (parentZone) {
				parents.push(parentZone);
				currentZone = parentZone;
			} else {
				break;
			}
		}

		this.parentMap.set(zone.id, parents);
	}

	/**
	 * Get all parent zones of a zone.
	 */
	public async getAllParents(zoneId: string): Promise<ExtendedZone[]> {
		while (this.isUpdating) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		return this.parentMap.get(zoneId) || [];
	}

	/**
	 * Get all children of a zone.
	 */
	public async getAllChildren(zoneId: string): Promise<ExtendedZone[]> {
		while (this.isUpdating) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		const descendants: ExtendedZone[] = [];
		const addChildren = (id: string): void => {
			const children = this.childMap.get(id) || [];
			children.sort((a, b) => a.name.localeCompare(b.name));
			children.forEach(child => {
				descendants.push(child);
				addChildren(child.id);
			});
		};

		addChildren(zoneId);
		return descendants;
	}

	public async getAllZones(): Promise<ExtendedZone[]> {
		while (this.isUpdating) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		const sortedZones: ExtendedZone[] = [];
		const addZoneAndChildren = (zone: ExtendedZone): void => {
			sortedZones.push(zone);
			const children = this.childMap.get(zone.id) || [];
			children.sort((a, b) => a.name.localeCompare(b.name));
			children.forEach(addZoneAndChildren);
		};

		const rootZones = Array.from(this.zones.values()).filter(zone => !zone.parent);
		rootZones.sort((a, b) => a.name.localeCompare(b.name));
		rootZones.forEach(addZoneAndChildren);

		return sortedZones;
	}

	public async getZones(zoneIds: string[]): Promise<ExtendedZone[]> {
		while (this.isUpdating) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		return zoneIds.map(zoneId => this.zones.get(zoneId)).filter(zone => zone !== undefined) as ExtendedZone[];
	}

	/**
	 * Get a zone by its ID.
	 */
	public async getZone(zoneId: string): Promise<ExtendedZone | null> {
		while (this.isUpdating) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		return this.zones.get(zoneId) || null;
	}

	/**
	 * Get all direct children of a zone.
	 */
	public async getDirectChildren(zoneId: string): Promise<ExtendedZone[]> {
		while (this.isUpdating) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		return this.childMap.get(zoneId) || [];
	}

	public async getLastUpdated(): Promise<Date | null> {
		while (this.isUpdating) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		return this.lastUpdated;
	}
}