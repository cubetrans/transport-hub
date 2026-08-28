export function createStation(name, x, y) {
    return {
        id: crypto.randomUUID(),
        name,
        x,
        y,
        type: "station",
        transfer: false
    };
}

export function findStation(stations, id) {
    return stations.find(station => station.id === id) || null;
}

export function removeStation(stations, id) {
    return stations.filter(station => station.id !== id);
}

export function updateStation(station, data) {
    station.name = data.name;
    station.transfer = data.transfer;

    return station;
}