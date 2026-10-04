import { ExtendedHomeyAPIV3Local } from "homey-api";
import Homey from "homey/lib/Homey";
import { FlowCardTrigger } from "homey";
import handleZoneAutocomplete from "../utils/handleZoneAutocomplete.mjs";
import handleIgnoredZonesAutocomplete, { getSelectedZoneIds } from "../utils/handleIgnoredZonesAutocomplete.mjs";
import getZoneActivityIgnoringZones from "../utils/getZoneActivityIgnoringZones.mjs";
import ZonesDb from "./ZonesDb.mjs";

type TriggerArgs = { zone: { id: string }, minutes: number, state: string, exclude?: { id?: string, ids?: string[] } };

type Watcher = {
	satisfied: boolean | null,
	since: number | null,
	timeoutId: ReturnType<typeof setTimeout> | null,
};

// setTimeout overflows above a signed 32-bit number of milliseconds.
const MAX_TIMEOUT_MS = 2147483647;

// Zone activity changes arrive as a cascade of updates (room, floor, house, ...): evaluate once per cascade.
const EVALUATE_DELAY_MS = 1000;

export default class TriggerCardZoneBecameActiveForMinutes {
	private static instance: TriggerCardZoneBecameActiveForMinutes | null = null;
	triggerCard: FlowCardTrigger;

	/**
	 * State per distinct set of arguments, so Flows asking the same question share one evaluation.
	 */
	private watchers: Map<string, Watcher> = new Map();
	private evaluateTimeoutId: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Evaluations run one after another: two at the same time could both see the answer change and trigger twice.
	 */
	private evaluation: Promise<void> = Promise.resolve();

	private constructor(private homey: Homey, private homeyApi: ExtendedHomeyAPIV3Local, private zonesDb: ZonesDb, private log: (...args: unknown[]) => void) {
		this.triggerCard = this.homey.flow.getTriggerCard('zone-became-active-for-minutes');
	}

	public static async initialize(homey: Homey, homeyApi: ExtendedHomeyAPIV3Local, zonesDb: ZonesDb, log: (...args: unknown[]) => void): Promise<void> {
		if (TriggerCardZoneBecameActiveForMinutes.instance === null) {
			TriggerCardZoneBecameActiveForMinutes.instance = new TriggerCardZoneBecameActiveForMinutes(homey, homeyApi, zonesDb, log);
			await TriggerCardZoneBecameActiveForMinutes.instance.setup();
		}
	}

	private async setup(): Promise<void> {
		this.triggerCard.registerRunListener(async (args, state) => this.getKey(args) === state.key);
		this.triggerCard.registerArgumentAutocompleteListener('zone', async (query: string) => await handleZoneAutocomplete(query, this.zonesDb));
		this.triggerCard.registerArgumentAutocompleteListener('exclude', async (query: string, args) => await handleIgnoredZonesAutocomplete(query, args, this.homey, this.zonesDb));

		// Fired when a Flow using this card is saved, enabled or deleted.
		this.triggerCard.on('update', () => this.scheduleEvaluation());
		this.homeyApi.zones.on('zone.update', () => this.scheduleEvaluation());

		// Clear timers on unload
		this.homey.on('unload', () => {
			if (this.evaluateTimeoutId !== null)
				clearTimeout(this.evaluateTimeoutId);
			this.watchers.forEach(watcher => {
				if (watcher.timeoutId !== null)
					clearTimeout(watcher.timeoutId);
			});
			this.watchers.clear();
		});

		await this.queueEvaluation();
	}

	private getKey(args: TriggerArgs): string {
		const ignoredZoneIds = getSelectedZoneIds(args.exclude).sort();
		return [args.zone?.id, args.state, Number(args.minutes) || 0, ignoredZoneIds.join(',')].join('|');
	}

	private scheduleEvaluation(): void {
		if (this.evaluateTimeoutId !== null)
			return;

		this.evaluateTimeoutId = setTimeout(async () => {
			this.evaluateTimeoutId = null;
			await this.queueEvaluation();
		}, EVALUATE_DELAY_MS);
	}

	private async queueEvaluation(): Promise<void> {
		this.evaluation = this.evaluation
			.then(() => this.evaluate())
			.catch(error => this.log('Failed to evaluate the zone activity trigger.', error));
		await this.evaluation;
	}

	private async evaluate(): Promise<void> {
		const argumentValues: TriggerArgs[] = await this.triggerCard.getArgumentValues();
		const argsByKey = new Map(argumentValues.map(args => [this.getKey(args), args]));

		// Forget questions that no Flow asks anymore.
		this.watchers.forEach((watcher, key) => {
			if (argsByKey.has(key))
				return;
			if (watcher.timeoutId !== null)
				clearTimeout(watcher.timeoutId);
			this.watchers.delete(key);
		});

		for (const [key, args] of argsByKey) {
			try {
				await this.evaluateWatcher(key, args);
			} catch (error) {
				this.log(`Failed to evaluate the zone activity trigger for zone '${args.zone?.id}'.`, { args, error });
			}
		}
	}

	private async evaluateWatcher(key: string, args: TriggerArgs): Promise<void> {
		const watcher = this.watchers.get(key) ?? { satisfied: null, since: null, timeoutId: null };
		this.watchers.set(key, watcher);
		if (watcher.timeoutId !== null) {
			clearTimeout(watcher.timeoutId);
			watcher.timeoutId = null;
		}

		const wasSatisfied = watcher.satisfied;
		const { active, since: readSince } = await this.getActivity(args);
		if (active !== (args.state === 'active')) {
			watcher.satisfied = false;
			watcher.since = null;
			return;
		}

		// A selection stays active while any of its zones is active. When the zone that has been active the longest
		// becomes inactive, the moment read from the other zones moves forward, although the selection never stopped
		// being active. Keep the earlier moment, so the trigger does not fire a second time.
		const since = args.state === 'active' && watcher.since !== null ? Math.min(watcher.since, readSince) : readSince;
		const holdMs = (Number(args.minutes) || 0) * 60 * 1000;
		const now = Date.now();

		watcher.since = since;
		watcher.satisfied = now - since >= holdMs;

		if (!watcher.satisfied) {
			// Nothing has to change for the hold to be reached, so wake up for it.
			const delay = Math.min(Math.max(since + holdMs - now, 0) + 100, MAX_TIMEOUT_MS);
			watcher.timeoutId = setTimeout(async () => await this.queueEvaluation(), delay);
			return;
		}

		// Only trigger when the answer changes from no to yes. A state that was already reached when the app started
		// or the Flow was saved (wasSatisfied === null) is not announced.
		if (wasSatisfied === false) {
			this.log(`Zone '${args.zone.id}' has been ${args.state} for ${args.minutes} minutes, triggering.`, { args, since: new Date(since) });
			await this.triggerCard.trigger({}, { key });
		}
	}

	private async getActivity(args: TriggerArgs): Promise<{ active: boolean, since: number }> {
		const zone = await this.homeyApi.zones.getZone({ id: args.zone.id });
		if (zone == null)
			throw new Error(`Zone with id '${args.zone.id}' not found.`);

		const ignoredZoneIds = getSelectedZoneIds(args.exclude);
		if (ignoredZoneIds.length > 0) {
			const { active, since } = await getZoneActivityIgnoringZones(zone, ignoredZoneIds, this.homeyApi, this.zonesDb);
			return { active, since: since.getTime() };
		}

		const since = zone.activeLastUpdated == null ? 0 : new Date(zone.activeLastUpdated).getTime();
		return { active: zone.activeLastUpdated !== null && zone.active, since };
	}
}
