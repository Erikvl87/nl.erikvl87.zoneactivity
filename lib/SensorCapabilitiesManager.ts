type SensorCapability = {
	id: string;
	friendlyName: string;
	units?: string;
}

export class SensorCapabilitiesManager {

	static readonly sensorCapabilities: {
		[key: string]: SensorCapability;
	} = {
			measure_battery: {
				id: "measure_battery",
				friendlyName: "Battery",
				units: "%"
			},
			measure_co: {
				id: "measure_co",
				friendlyName: "CO",
				units: "ppm"
			},
			measure_co2: {
				id: "measure_co2",
				friendlyName: "CO2",
				units: "ppm"
			},
			measure_current: {
				id: "measure_current",
				friendlyName: "Current",
				units: "A"
			},
			measure_dust: {
				id: "measure_dust",
				friendlyName: "Dust",
				units: "µg/m³"
			},
			measure_humidity: {
				id: "measure_humidity",
				friendlyName: "Humidity",
				units: "%"
			},
			measure_luminance: {
				id: "measure_luminance",
				friendlyName: "Luminance",
				units: "lux"
			},
			measure_noise: {
				id: "measure_noise",
				friendlyName: "Noise",
				units: "dB"
			},
			measure_pm25: {
				id: "measure_pm25",
				friendlyName: "PM2.5",
				units: "µg/m³"
			},
			measure_power: {
				id: "measure_power",
				friendlyName: "Power",
				units: "W"
			},
			measure_pressure: {
				id: "measure_pressure",
				friendlyName: "Pressure",
				units: "mbar"
			},
			measure_rain: {
				id: "measure_rain",
				friendlyName: "Rain",
				units: "mm"
			},
			measure_temperature: {
				id: "measure_temperature",
				friendlyName: "Temperature",
				units: "°C"
			},
			measure_ultraviolet: {
				id: "measure_ultraviolet",
				friendlyName: "UV",
				units: "uv"
			},
			measure_voltage: {
				id: "measure_voltage",
				friendlyName: "Voltage",
				units: "V"
			},
			measure_water: {
				id: "measure_water",
				friendlyName: "Water",
				units: "L"
			},
			measure_wind_angle: {
				id: "measure_wind_angle",
				friendlyName: "Wind Angle",
				units: "°"
			},
			measure_wind_strength: {
				id: "measure_wind_strength",
				friendlyName: "Wind Strength",
				units: "m/s"
			}
		};

	static getAllSensorCapabilities(): { [key: string]: SensorCapability } {
		return this.sensorCapabilities;
	}
}