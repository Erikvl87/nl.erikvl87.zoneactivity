import { HomeyAPIV3Local } from 'homey-api';

declare module 'homey-api' {

	class ExtendedZone extends HomeyAPIV3Local.ManagerZones.Zone {
		name: string;
		parent: string;
		icon: string;
		active: boolean;
		activeLastUpdated: string;
	}

	class ExtendedManagerZones extends HomeyAPIV3Local.ManagerZones {
		getZones(): Promise<{ [key: string]: ExtendedZone; }>;
		getZone(args: { id: string; }): Promise<ExtendedZone>;
	}

	export class ExtendedHomeyAPIV3Local extends HomeyAPIV3Local {

		// manager: HomeyAPIV3Local.Manager;
		// alarms: HomeyAPIV3Local.ManagerAlarms;
		// api: HomeyAPIV3Local.ManagerApi;
		// apps: HomeyAPIV3Local.ManagerApps;
		// arp: HomeyAPIV3Local.ManagerArp;
		// ble: HomeyAPIV3Local.ManagerBLE;
		// backup: HomeyAPIV3Local.ManagerBackup;
		// clock: HomeyAPIV3Local.ManagerClock;
		// cloud: HomeyAPIV3Local.ManagerCloud;
		// coprocessor: HomeyAPIV3Local.ManagerCoprocessor;
		// cron: HomeyAPIV3Local.ManagerCron;
		// database: HomeyAPIV3Local.ManagerDatabase;
		// devices: HomeyAPIV3Local.ManagerDevices;
		// devkit: HomeyAPIV3Local.ManagerDevkit;
		// discovery: HomeyAPIV3Local.ManagerDiscovery;
		// drivers: HomeyAPIV3Local.ManagerDrivers;
		// energy: HomeyAPIV3Local.ManagerEnergy;
		// experiments: HomeyAPIV3Local.ManagerExperiments;
		// flow: HomeyAPIV3Local.ManagerFlow;
		// flowToken: HomeyAPIV3Local.ManagerFlowToken;
		// geolocation: HomeyAPIV3Local.ManagerGeolocation;
		// googleAssistant: HomeyAPIV3Local.ManagerGoogleAssistant;
		// i18n: HomeyAPIV3Local.ManagerI18n;
		// icons: HomeyAPIV3Local.ManagerIcons;
		// images: HomeyAPIV3Local.ManagerImages;
		// insights: HomeyAPIV3Local.ManagerInsights;
		// ledring: HomeyAPIV3Local.ManagerLedring;
		// logic: HomeyAPIV3Local.ManagerLogic;
		// matter: HomeyAPIV3Local.ManagerMatter;
		// mobile: HomeyAPIV3Local.ManagerMobile;
		// notifications: HomeyAPIV3Local.ManagerNotifications;
		// presence: HomeyAPIV3Local.ManagerPresence;
		// rf: HomeyAPIV3Local.ManagerRF;
		// safety: HomeyAPIV3Local.ManagerSafety;
		// satellites: HomeyAPIV3Local.ManagerSatellites;
		// security: HomeyAPIV3Local.ManagerSecurity;
		// sessions: HomeyAPIV3Local.ManagerSessions;
		// system: HomeyAPIV3Local.ManagerSystem;
		// thread: HomeyAPIV3Local.ManagerThread;
		// update: HomeyAPIV3Local.ManagerUpdates;
		// users: HomeyAPIV3Local.ManagerUsers;
		// virtualDevice: HomeyAPIV3Local.ManagerVirtualDevice;
		// weather: HomeyAPIV3Local.ManagerWeather;
		// webserver: HomeyAPIV3Local.ManagerWebserver;
		// zigbee: HomeyAPIV3Local.ManagerZigbee;
		// zones: HomeyAPIV3Local.ManagerZones;
		// zwave: HomeyAPIV3Local.ManagerZwave
		zones: ExtendedManagerZones; // Overwrite the zones property with the ExtendedManagerZones class

	}
}
