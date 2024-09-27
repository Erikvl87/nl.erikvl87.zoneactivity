import { ExtendedHomeyAPIV3Local, ExtendedZone } from "homey-api";

export default class ZonesDb {

	private static instance: ZonesDb | null = null;

	private zones: Map<string, ExtendedZone> = new Map();
	private parentMap: Map<string, ExtendedZone[]> = new Map();
	private childMap: Map<string, ExtendedZone[]> = new Map();
	private isUpdating: boolean = false;

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
		await this.homeyApi.zones.connect();
		this.homeyApi.zones.on('zone.create', async (_zone: ExtendedZone) => await this.compute());
		this.homeyApi.zones.on('zone.update', async (_zone: ExtendedZone) => await this.compute());
		this.homeyApi.zones.on('zone.delete', async (_zone: ExtendedZone) => await this.compute());
		await this.compute();
	}

	private async compute(): Promise<void> {
		this.isUpdating = true;
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
	async getAllParents(zoneId: string): Promise<ExtendedZone[]> {
		while (this.isUpdating) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		return this.parentMap.get(zoneId) || [];
	}

	/**
	 * Get all children of a zone.
	 */
	async getAllChildren(zoneId: string): Promise<ExtendedZone[]> {
		while (this.isUpdating) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		const descendants: ExtendedZone[] = [];
		const addChildren = (id: string): void => {
			const children = this.childMap.get(id) || [];
			children.forEach(child => {
				descendants.push(child);
				addChildren(child.id);
			});
		};

		addChildren(zoneId);
		return descendants;
	}

	public async getZones(): Promise<ExtendedZone[]> {
		while (this.isUpdating) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		return Array.from(this.zones.values());
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
}