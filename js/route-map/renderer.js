export function renderMap(state) {
    const lineLayer = document.getElementById("line-layer");
    const stationLayer = document.getElementById("station-layer");

    lineLayer.innerHTML = "";
    stationLayer.innerHTML = "";

    renderLines(state, lineLayer);
    renderStations(state, stationLayer);
}

function renderLines(state, layer) {
    for (const line of state.lines) {
        const points = line.stationIds
            .map(id => state.stations.find(station => station.id === id))
            .filter(Boolean);

        if (points.length < 2) {
            continue;
        }

        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );

        const d = points
            .map((point, index) =>
                `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
            )
            .join(" ");

        path.setAttribute("d", d);
        path.setAttribute("class", "line-path");
        path.setAttribute("stroke", line.color);
        path.setAttribute("stroke-width", "12");

        layer.appendChild(path);
    }
}

function renderStations(state, layer) {
    for (const station of state.stations) {

        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

        group.dataset.stationId = station.id;
        group.classList.add("station-group");

        if (station.id === state.selectedStationId) {
            group.classList.add("selected");
        }

        group.setAttribute(
            "transform",
            `translate(${station.x}, ${station.y})`
        );

        const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        circle.setAttribute("r", station.transfer ? "13" : "10");
        circle.setAttribute("class", "station-circle");

        if (station.transfer) {
            circle.classList.add("transfer");
        }

        const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        text.setAttribute("class", "station-label");
        text.setAttribute("x", "18");
        text.setAttribute("y", "6");
        text.textContent = station.name;

        group.appendChild(circle);
        group.appendChild(text);

        layer.appendChild(group);
    }
}