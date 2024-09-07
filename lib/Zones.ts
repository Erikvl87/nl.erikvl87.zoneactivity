import { ExtendedZone } from "homey-api";
import { ArgumentAutocompleteResults } from "homey/lib/FlowCard";
import getIconForZone from "../utils/getIconForZone";

export default class Zones {
	private zones: Map<string, ExtendedZone> = new Map();
	private parentMap: Map<string, ExtendedZone[]> = new Map();
	private childMap: Map<string, ExtendedZone[]> = new Map();

	constructor(zones: { [key: string]: ExtendedZone; }) {
		const zoneArray = Object.values(zones);
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
	getAllParents(zoneId: string): ExtendedZone[] {
		return this.parentMap.get(zoneId) || [];
	}

	/**
	 * Get all children of a zone.
	 */
	getAllChildren(zoneId: string): ExtendedZone[] {
		const descendants: ExtendedZone[] = [];
		const addChildren = (id: string) : void => {
			const children = this.childMap.get(id) || [];
			children.forEach(child => {
				descendants.push(child);
				addChildren(child.id);
			});
		};

		addChildren(zoneId);
		return descendants;
	}

	public getZones(): ExtendedZone[] {
		return Array.from(this.zones.values());
	}

	/**
	 * Get a zone by its ID.
	 */
	getZone(zoneId: string): ExtendedZone | null {
		return this.zones.get(zoneId) || null;
	}
}
