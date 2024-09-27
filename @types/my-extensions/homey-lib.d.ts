declare module 'homey-lib' {
	interface ITranslationObject {
		en: string;
		nl: string;
		de: string;
		fr: string;
		it: string;
		sv: string;
		no: string;
		es: string;
		da: string;
		ru: string;
		pl: string;
		ko: string;
		[key: string]: string;
	}

	interface IDeviceClass {
		title: ITranslationObject;
		description: ITranslationObject;
		virtualTitle?: ITranslationObject;
		minCompatibility?: string;
		virtualTitle?: ITranslationObject;
		allowedVirtual?: string[];
	}

	interface ICapability {
		title: ITranslationObject;
		desc?: ITranslationObject;
		type: string;
		gettable: boolean
		settable: boolean;
		insights?: boolean;
		insightsTitleTrue?: ITranslationObject;
		insightsTitleFalse?: ITranslationObject;
		uiComponent: string;
		minCompatibility?: string;
	}

	interface IDeviceClasses {
		[key: string]: IDeviceClass;
	}

	interface ICapabilities {
		[key: string]: ICapability;
	}

	export class HomeyLib {
		static getLocales(): unknown;
		static getCategories(): unknown;
		static getPermissions(): unknown;
		static getBrandColor(): unknown;
	}

	export class Device {
		static getClasses(): IDeviceClasses;
		static getClass(id: string): IDeviceClass;
		static getCapabilities(): ICapability;
	}

	export class Capability {
		static getCapabilities(): ICapabilities;
		static getCapability(id: string): ICapability;
		static hasCapability(id: string): boolean;
	}

	export class Signal {
		// Define Signal class methods and properties if available
	}

	export class Media {
		static getCodecs(): unknown;
	}

	export class Energy {
		static getCurrencies(): unknown;
		static getBatteries(): unknown;
	}

	export function getDeviceClasses(): Record<string, unknown>;
	export function getDeviceClass(id: string): unknown;

	export function getCapabilities(): unknown;
	export function getCapability(id: string): unknown;
	export function hasCapability(id: string): boolean;

	export function getAppLocales(): unknown;
	export function getAppCategories(): unknown;
	export function getAppPermissions(): unknown;
	export function getAppBrandColor(): unknown;

	export function getMediaCodecs(): unknown;

	export function getCurrencies(): unknown;
	export function getBatteries(): unknown;
}