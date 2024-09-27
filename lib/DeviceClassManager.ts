type DeviceClass = {
	id: string;
	friendlyName: string;
}

export class DeviceClassManager {

	static readonly deviceClasses: {
		[key: string]: DeviceClass;
	} = {
			amplifier: {
				id: "amplifier",
				friendlyName: "Amplifier"
			},
			blinds: {
				id: "blinds",
				friendlyName: "Blinds"
			},
			button: {
				id: "button",
				friendlyName: "Button"
			},
			camera: {
				id: "camera",
				friendlyName: "Camera"
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
			speaker: {
				id: "speaker",
				friendlyName: "Speaker"
			},
			solarpanel: {
				id: "solarpanel",
				friendlyName: "Solar Panel"
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
			windowcoverings: {
				id: "windowcoverings",
				friendlyName: "Window Coverings"
			},
			airconditioning: {
				id: "airconditioning",
				friendlyName: "Air Conditioning"
			},
			bicycle: {
				id: "bicycle",
				friendlyName: "Bicycle"
			},
			battery: {
				id: "battery",
				friendlyName: "Battery"
			},
			car: {
				id: "car",
				friendlyName: "Car"
			},
			boiler: {
				id: "boiler",
				friendlyName: "Boiler"
			},
			dehumidifier: {
				id: "dehumidifier",
				friendlyName: "Dehumidifier"
			},
			dishwasher: {
				id: "dishwasher",
				friendlyName: "Dishwasher"
			},
			diffuser: {
				id: "diffuser",
				friendlyName: "Diffuser"
			},
			evcharger: {
				id: "evcharger",
				friendlyName: "EV Charger"
			},
			dryer: {
				id: "dryer",
				friendlyName: "Dryer"
			},
			cooktop: {
				id: "cooktop",
				friendlyName: "Cooktop"
			},
			faucet: {
				id: "faucet",
				friendlyName: "Faucet"
			},
			fireplace: {
				id: "fireplace",
				friendlyName: "Fireplace"
			},
			freezer: {
				id: "freezer",
				friendlyName: "Freezer"
			},
			fridge_and_freezer: {
				id: "fridge_and_freezer",
				friendlyName: "Fridge and Freezer"
			},
			fridge: {
				id: "fridge",
				friendlyName: "Fridge"
			},
			gameconsole: {
				id: "gameconsole",
				friendlyName: "Game Console"
			},
			grill: {
				id: "grill",
				friendlyName: "Grill"
			},
			heatpump: {
				id: "heatpump",
				friendlyName: "Heat Pump"
			},
			hood: {
				id: "hood",
				friendlyName: "Hood"
			},
			humidifier: {
				id: "humidifier",
				friendlyName: "Humidifier"
			},
			mediaplayer: {
				id: "mediaplayer",
				friendlyName: "Media Player"
			},
			airtreatment: {
				id: "airtreatment",
				friendlyName: "Air Treatment"
			},
			lawnmower: {
				id: "lawnmower",
				friendlyName: "Lawnmower"
			},
			mop: {
				id: "mop",
				friendlyName: "Mop"
			},
			oven: {
				id: "oven",
				friendlyName: "Oven"
			},
			multicooker: {
				id: "multicooker",
				friendlyName: "Multi-cooker"
			},
			airpurifier: {
				id: "airpurifier",
				friendlyName: "Air Purifier"
			},
			petfeeder: {
				id: "petfeeder",
				friendlyName: "Pet Feeder"
			},
			scooter: {
				id: "scooter",
				friendlyName: "Scooter"
			},
			radiator: {
				id: "radiator",
				friendlyName: "Radiator"
			},
			settopbox: {
				id: "settopbox",
				friendlyName: "Set-top Box"
			},
			shutterblinds: {
				id: "shutterblinds",
				friendlyName: "Shutter Blinds"
			},
			fryer: {
				id: "fryer",
				friendlyName: "Fryer"
			},
			smokealarm: {
				id: "smokealarm",
				friendlyName: "Smoke Alarm"
			},
			vehicle: {
				id: "vehicle",
				friendlyName: "Vehicle"
			},
			washer: {
				id: "washer",
				friendlyName: "Washer"
			},
			airfryer: {
				id: "airfryer",
				friendlyName: "Air Fryer"
			},
			washer_and_dryer: {
				id: "washer_and_dryer",
				friendlyName: "Washer and Dryer"
			},
			waterpurifier: {
				id: "waterpurifier",
				friendlyName: "Water Purifier"
			},
			waterheater: {
				id: "waterheater",
				friendlyName: "Water Heater"
			},
			oven_and_microwave: {
				id: "oven_and_microwave",
				friendlyName: "Oven and Microwave"
			},
			microwave: {
				id: "microwave",
				friendlyName: "Microwave"
			},
			watervalve: {
				id: "watervalve",
				friendlyName: "Water Valve"
			},
			sprinkler: {
				id: "sprinkler",
				friendlyName: "Sprinkler"
			},
			siren: {
				id: "siren",
				friendlyName: "Siren"
			},
			networkrouter: {
				id: "networkrouter",
				friendlyName: "Network Router"
			}
		};

	static getAllDeviceClasses(): { [key: string]: DeviceClass } {
		return this.deviceClasses;
	}
}