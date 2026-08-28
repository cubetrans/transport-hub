export function createLine(name, color, stationIds = []) {
    return {
        id: crypto.randomUUID(),
        name,
        color,
        stationIds
    };
}

export function addStationToLine(line, stationId) {
    if (!line.stationIds.includes(stationId)) {
        line.stationIds.push(stationId);
    }
}

export function removeStationFromLines(lines, stationId) {
    return lines.map(line => ({
        ...line,
        stationIds: line.stationIds.filter(id => id !== stationId)
    }));
}