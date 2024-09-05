import Homey from 'homey';
import generateGuid from '../../utils/generateGuid';
import { VirtualMotionDevice } from './device';

class VirtualMotionDriver extends Homey.Driver {
	/**
	 * onInit is called when the driver is initialized.
	 */
	async onInit(): Promise<void> {
		this.log(`${this.constructor.name} has been initialized`);
		this.registerCardListeners();
	}

	/**
	 * Registers all listeners for cards
	 */
	private registerCardListeners(): void {
		const actionCardTurnOnAlarm = this.homey.flow.getActionCard('turn-on-alarm');
		const actionCardTurnOffAlarm = this.homey.flow.getActionCard('turn-off-alarm');
		const actionCardTurnOffAlarmDelayed = this.homey.flow.getActionCard('turn-off-alarm-delayed');

		actionCardTurnOnAlarm.registerRunListener(async (args, _state) => {
			const device = args.device as VirtualMotionDevice;
			return await device.turnAlarmOn();
		});

		actionCardTurnOffAlarm.registerRunListener(async (args, _state) => {
			const device = args.device as VirtualMotionDevice;
			return await device.turnAlarmOff();
		});
		actionCardTurnOffAlarmDelayed.registerRunListener(async (args, _state) => {
			const device = args.device as VirtualMotionDevice;
			return await device.turnAlarmOffDelayed(args);
		});

		const actionCardTurnOnAlarmTemporarily = this.homey.flow.getActionCard('turn-on-alarm-temporarily');
		actionCardTurnOnAlarmTemporarily.registerRunListener(async (args, _state) => {
			const device = args.device as VirtualMotionDevice;
			return await device.turnAlarmOnTemporarily(args);
		});
	}

	/**
	 * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
	 * This should return an array with the data of devices that are available for pairing.
	 */
	async onPairListDevices(): Promise<Array<unknown>> {
		return [{
			name: 'Virtual motion trigger',
			data: {
				id: generateGuid()
			},
			settings: {
			}
		}]
	}
}

module.exports = VirtualMotionDriver;
