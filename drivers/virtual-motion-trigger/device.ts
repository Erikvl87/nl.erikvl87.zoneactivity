import Homey from 'homey';

export class VirtualMotionDevice extends Homey.Device {
	scheduledTurnOffTimeoutId: NodeJS.Timeout | undefined;
	triggerCardAlarmChanged = this.homey.flow.getDeviceTriggerCard('alarm-changed');

	/**
	 * onInit is called when the device is initialized.
	 */
	async onInit(): Promise<void> {
		this.log(`${this.constructor.name} has been initialized`);
		this.registerMaintenanceListeners();
		await this.registerCapabilityListeners();

		// Recover scheduled turn-off of the motion alarm if the device was restarted.
		const now = new Date();
		const storedTurnOffAt = new Date(await this.getStoreValue("turn-off-alarm-at"));
		if (storedTurnOffAt > now) {
			this.log('Recovered a scheduled turn-off for the motion alarm', { storedTurnOffAt });
			setTimeout(async () => {
				await this.toggleMotionAlarm({ alarm_motion: false, logSuffix: "by a recovered timer in the store" }).catch(this.error);
			}, storedTurnOffAt.getTime() - now.getTime());
		}
	}

	/**
	 * Registers all listeners for capabilities.
	 */
	private async registerCapabilityListeners(): Promise<void> {
		this.registerCapabilityListener("onoff", async (value) => {
			const isMotionDetected = await this.getCapabilityValue('alarm_motion') ?? false;
			if (!value && isMotionDetected)
				await this.toggleMotionAlarm({ alarm_motion: false, logSuffix: "because the device was turned off" }).catch(this.error);
			this.log("Capability onoff was set to", value);
		});
	}

	/**
	 * Registers all listeners for maintenance buttons.
	 */
	private registerMaintenanceListeners(): void {
		this.registerCapabilityListener('button.turn_on_motion_alarm', async (_args, _state) =>
			await this.toggleMotionAlarm({ alarm_motion: true, logSuffix: "manually", forced: true }).catch(this.error));
		this.registerCapabilityListener('button.turn_off_motion_alarm', async (_args, _state) =>
			await this.toggleMotionAlarm({ alarm_motion: false, logSuffix: "manually", forced: true }).catch(this.error));
	}

	/**
	 * Toggles the motion alarm on or off.
	 */
	private async toggleMotionAlarm(options: { alarm_motion: boolean, logSuffix?: string, forced?: boolean, clearTimer?: boolean }): Promise<void> {
		const { alarm_motion, logSuffix, forced = false, clearTimer = true } = options;

		if (clearTimer)
			clearTimeout(this.scheduledTurnOffTimeoutId);

		const isTurnedOn = await this.getCapabilityValue('onoff') ?? true;
		if (!isTurnedOn && !forced) {
			throw new Error(`The device is turned off`);
		}

		const oldValue = await this.getCapabilityValue('alarm_motion') ?? false;

		if(oldValue === alarm_motion) {
			this.log(`The motion alarm is already ${alarm_motion ? 'activated' : 'deactivated'}`);
			return;
		}

		this.log(
			logSuffix
				? `The motion alarm is ${alarm_motion ? 'activated' : 'deactivated'} ${logSuffix}`
				: `The motion alarm is ${alarm_motion ? 'activated' : 'deactivated'}`);

		await this.setCapabilityValue('alarm_motion', alarm_motion);
		await this.triggerCardAlarmChanged.trigger(this, {}, { alarm_motion });
	}

	/**
	 * onAdded is called when the user adds the device, called just after pairing.
	 */
	async onAdded(): Promise<void> {
		this.log('Device added', { name: this.getName(), data: await this.getData() })
		await this.setCapabilityValue('alarm_motion', false);
		await this.setCapabilityValue('onoff', true);
	}

	/**
	 * onDeleted is called when the user deleted the device.
	 */
	async onDeleted(): Promise<void> {
		this.log(`${this.constructor.name} has been deleted`);
	}

	/**
	 * Turns the motion alarm on.
	 */
	public async turnAlarmOn(): Promise<void> {
		return await this.toggleMotionAlarm({ alarm_motion: true, logSuffix: "by a flow card" });
	}

	/**
	 * Turns the motion alarm off.
	 */
	public async turnAlarmOff(): Promise<void> {
		return this.toggleMotionAlarm({ alarm_motion: false, logSuffix: "by a flow card" });
	}

	/**
	 * Turns the motion alarm off delayed.
	 */
	public async turnAlarmOffDelayed(args: { seconds: number }): Promise<void> {
		const seconds = args.seconds;
		const TurnOffAt = new Date(Date.now() + (seconds * 1000));
		const storedTurnOffAt = new Date(this.getStoreValue("turn-off-alarm-at"));
		if (storedTurnOffAt > TurnOffAt) {
			this.log('The motion alarm is already scheduled to turn off at a later time', { TurnOffAt, storedTurnOffAt });
			return;
		}

		await this.setStoreValue("turn-off-alarm-at", TurnOffAt).catch(this.error);
		this.scheduledTurnOffTimeoutId = setTimeout(async () =>
			await this.toggleMotionAlarm(
				{ alarm_motion: false, logSuffix: "by a timer in a flow card", clearTimer: false }
			).catch(this.error), seconds * 1000);
	}

	/**
	 * Turns the motion alarm on temporarily.
	 */
	public async turnAlarmOnTemporarily(args: { seconds: number }): Promise<void> {
		await this.toggleMotionAlarm({ alarm_motion: true, logSuffix: "by a flow card" });
		const seconds = args.seconds;
		this.log(`The motion alarm is activated temporarily for ${seconds} seconds by a flow`);
		const TurnOffAt = new Date(Date.now() + (seconds * 1000));
		const storedTurnOffAt = new Date(this.getStoreValue("turn-off-alarm-at"));
		if (storedTurnOffAt > TurnOffAt) {
			this.log('The motion alarm is already scheduled to turn off at a later time', { TurnOffAt, storedTurnOffAt });
			return;
		}

		await this.setStoreValue("turn-off-alarm-at", TurnOffAt).catch(this.error);
		this.scheduledTurnOffTimeoutId = setTimeout(async () =>
			await this.toggleMotionAlarm(
				{ alarm_motion: false, logSuffix: "by a timer in a flow card", clearTimer: false }
			).catch(this.error), seconds * 1000);
	}
}

module.exports = VirtualMotionDevice;
