type DeviceClass = {
	id: string;
	friendlyName: string;
}

export class DeviceClassManager {

	static readonly deviceClasses: {
		[key: string]: DeviceClass;
	} = {
			accelerometer: {
				id: "accelerometer",
				friendlyName: "Accelerometer"
			},
			amplifier: {
				id: "amplifier",
				friendlyName: "Amplifier"
			},
			button: {
				id: "button",
				friendlyName: "Button"
			},
			coffeemachine: {
				id: "coffeemachine",
				friendlyName: "Coffee Machine"
			},
			curtain: {
				id: "curtain",
				friendlyName: "Curtain"
			},
			doorbell: {
				id: "doorbell",
				friendlyName: "Doorbell"
			},
			fan: {
				id: "fan",
				friendlyName: "Fan"
			},
			garagedoor: {
				id: "garagedoor",
				friendlyName: "Garage Door"
			},
			heater: {
				id: "heater",
				friendlyName: "Heater"
			},
			homealarm: {
				id: "homealarm",
				friendlyName: "Home Alarm"
			},
			kettle: {
				id: "kettle",
				friendlyName: "Kettle"
			},
			light: {
				id: "light",
				friendlyName: "Light"
			},
			lock: {
				id: "lock",
				friendlyName: "Lock"
			},
			motionsensor: {
				id: "motionsensor",
				friendlyName: "Motion Sensor"
			},
			other: {
				id: "other",
				friendlyName: "Other"
			},
			remote: {
				id: "remote",
				friendlyName: "Remote"
			},
			sensor: {
				id: "sensor",
				friendlyName: "Sensor"
			},
			socket: {
				id: "socket",
				friendlyName: "Socket"
			},
			solarpanel: {
				id: "solarpanel",
				friendlyName: "Solar Panel"
			},
			speaker: {
				id: "speaker",
				friendlyName: "Speaker"
			},
			sunshade: {
				id: "sunshade",
				friendlyName: "Sunshade"
			},
			thermostat: {
				id: "thermostat",
				friendlyName: "Thermostat"
			},
			tv: {
				id: "tv",
				friendlyName: "TV"
			},
			vacuumcleaner: {
				id: "vacuumcleaner",
				friendlyName: "Vacuum Cleaner"
			},
			vibration: {
				id: "vibration",
				friendlyName: "Vibration Sensor"
			},
			washer: {
				id: "washer",
				friendlyName: "Washer"
			},
			windowcoverings: {
				id: "windowcoverings",
				friendlyName: "Window Coverings"
			}
		};

	static getAllDeviceClasses(): { [key: string]: DeviceClass } {
		return this.deviceClasses;
	}
}