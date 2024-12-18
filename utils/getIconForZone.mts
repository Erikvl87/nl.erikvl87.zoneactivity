const cache: { [key: string]: string } = {};

function getZoneImagePath(t: string): string {
	return `https://my.homey.app/img/zones/${t}`;
}

async function getZoneImageSource(iconName: string): Promise<string | null> {
	if (cache[iconName]) {
		return cache[iconName];
	}
	const url = getIconForZone(iconName);
	try {
		const response = await fetch(url);
		if (!response.ok || !response.headers.get('content-type')?.includes('image/svg+xml')) {
			throw new Error('Invalid response while fetching icon');
		}
		const svgSource = await response.text();
		cache[iconName] = svgSource;
		return svgSource;
	} catch (_error) {
		return null;
	}
}

export default function getIconForZone(iconName: string): string {
	switch (iconName) {
	case 'firstFloor':
		return getZoneImagePath('first-floor.svg');
	case 'groundFloor':
		return getZoneImagePath('ground-floor.svg');
	case 'officeBuildings':
		return getZoneImagePath('office-buildings.svg');
	case 'singleFloor':
		return getZoneImagePath('single-floor.svg');
	case 'topFloor':
		return getZoneImagePath('top-floor.svg');
	case 'home':
		return getZoneImagePath('home.svg');
	case 'stairs-down':
	case 'basement':
		return getZoneImagePath('basement.svg');
	case 'stairs-up':
	case 'floor':
		return getZoneImagePath('floor.svg');
	case 'roof':
	case 'attic':
		return getZoneImagePath('attic.svg');
	case 'roofSolar':
		return getZoneImagePath('roof_solar_panels.svg');
	case 'garage':
		return getZoneImagePath('garage.svg');
	case 'pool':
		return getZoneImagePath('pool.svg');
	case 'garden':
		return getZoneImagePath('garden.svg');
	case 'gardenShed':
		return getZoneImagePath('garden_shed.svg');
	case 'terrace':
		return getZoneImagePath('terrace.svg');
	case 'carport':
		return getZoneImagePath('carport.svg');
	case 'hallway':
		return getZoneImagePath('hallway.svg');
	case 'living':
	case 'livingRoom':
		return getZoneImagePath('living_room.svg');
	case 'kitchen':
		return getZoneImagePath('kitchen.svg');
	case 'diningRoom':
		return getZoneImagePath('dining_room.svg');
	case 'bedroomSingle':
		return getZoneImagePath('bedroom.svg');
	case 'bed':
	case 'bedroomDouble':
		return getZoneImagePath('master_bedroom.svg');
	case 'bedroomKids':
		return getZoneImagePath('kinder_room.svg');
	case 'shower':
	case 'bathroom':
		return getZoneImagePath('bathroom.svg');
	case 'office':
		return getZoneImagePath('office.svg');
	case 'gym':
		return getZoneImagePath('gym.svg');
	case 'toilet':
		return getZoneImagePath('toilet.svg');
	case 'entrance':
		return getZoneImagePath('entrance_front_door.svg');
	case 'books':
	case 'studyRoom':
		return getZoneImagePath('study_room.svg');
	case 'gameRoom':
		return getZoneImagePath('game_room.svg');
	case 'utilitiesRoom':
		return getZoneImagePath('utilities_room.svg');
	case 'recreationRoom':
		return getZoneImagePath('recreation_room.svg');
	case 'tipi':
		return getZoneImagePath('tipi_tent.svg');
	case 'wardrobe':
		return getZoneImagePath('wardrobe.svg');
	case 'doorClosed':
		return getZoneImagePath('door-closed.svg');
	case 'lounge':
		return getZoneImagePath('lounge-chair.svg');
	case 'fuseBox':
		return getZoneImagePath('lightning-bolt.svg');
	case 'laundryRoom':
		return getZoneImagePath('laundry-basket.svg');
	case 'phone':
		return getZoneImagePath('phone.svg');
	case 'coffeeMachine':
		return getZoneImagePath('coffee-machine.svg');
	case 'drinks':
		return getZoneImagePath('drinks.svg');
	case 'pantry':
		return getZoneImagePath('pantry.svg');
	case 'suitcase':
		return getZoneImagePath('suitcase.svg');
	case 'door':
		return getZoneImagePath('door.svg');
	case 'toothbrush':
		return getZoneImagePath('toothbrush.svg');
	case 'sink':
		return getZoneImagePath('sink.svg');
	case 'default':
	default:
		return getZoneImagePath('hallway_door.svg');
	}
}

export { getZoneImageSource };
