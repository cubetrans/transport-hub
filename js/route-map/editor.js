import {
    createStation,
    findStation,
    removeStation,
    updateStation
} from "./station.js";

import {
    createLine,
    addStationToLine,
    removeStationFromLines
} from "./line.js";

import { renderMap } from "./renderer.js";


const state = {
    routeName: "새 노선",
    routeColor: "#0B3D91",
    stations: [],
    lines: [],
    selectedStationId: null,
    currentTool: "select",
    pendingLineStationIds: [],
    zoom: 1
};


const svg = document.getElementById("route-canvas");
const stationLayer = document.getElementById("station-layer");

const toolStatus = document.getElementById("tool-status");
const zoomValue = document.getElementById("zoom-value");

const routeNameInput = document.getElementById("route-name-input");
const routeColorInput = document.getElementById("route-color-input");
const routeColorValue = document.getElementById("route-color-value");

const stationProperty = document.getElementById("station-property");
const emptyProperty = document.getElementById("empty-property");

const stationNameInput = document.getElementById("station-name-input");
const stationTransferInput = document.getElementById("station-transfer-input");

const toolButtons = {
    select: document.getElementById("select-tool"),
    station: document.getElementById("station-tool"),
    line: document.getElementById("line-tool"),
    delete: document.getElementById("delete-tool")
};


function render() {
    renderMap(state);
    updatePropertyPanel();
}


function setTool(tool) {
    state.currentTool = tool;
    state.pendingLineStationIds = [];

    Object.entries(toolButtons).forEach(([name, button]) => {
        button.classList.toggle("active", name === tool);
    });

    const labels = {
        select: "선택 도구",
        station: "역 추가 도구",
        line: "노선 연결 도구",
        delete: "삭제 도구"
    };

    toolStatus.textContent = labels[tool];
}


function getSvgPoint(event) {
    const point = svg.createSVGPoint();

    point.x = event.clientX;
    point.y = event.clientY;

    const matrix = svg.getScreenCTM();

    return point.matrixTransform(matrix.inverse());
}


function addStationAtPoint(x, y) {
    const stationNumber = state.stations.length + 1;

    const station = createStation(
        `역 ${stationNumber}`,
        Math.round(x),
        Math.round(y)
    );

    state.stations.push(station);
    state.selectedStationId = station.id;

    render();
}


function selectStation(stationId) {
    state.selectedStationId = stationId;
    updatePropertyPanel();
    render();
}


function deleteSelectedStation() {
    if (!state.selectedStationId) {
        return;
    }

    const id = state.selectedStationId;

    state.stations = removeStation(state.stations, id);
    state.lines = removeStationFromLines(state.lines, id);
    state.selectedStationId = null;

    render();
}


function handleLineClick(stationId) {
    if (!state.pendingLineStationIds.includes(stationId)) {
        state.pendingLineStationIds.push(stationId);
    }

    if (state.pendingLineStationIds.length === 2) {
        const [first, second] = state.pendingLineStationIds;

        let line = state.lines[0];

        if (!line) {
            line = createLine(
                state.routeName,
                state.routeColor,
                []
            );

            state.lines.push(line);
        }

        addStationToLine(line, first);
        addStationToLine(line, second);

        state.pendingLineStationIds = [];

        render();
    }
}


function updatePropertyPanel() {
    const station = findStation(
        state.stations,
        state.selectedStationId
    );

    if (!station) {
        emptyProperty.classList.remove("hidden");
        stationProperty.classList.add("hidden");
        return;
    }

    emptyProperty.classList.add("hidden");
    stationProperty.classList.remove("hidden");

    stationNameInput.value = station.name;
    stationTransferInput.checked = station.transfer;
}


function applyStationProperties() {
    const station = findStation(
        state.stations,
        state.selectedStationId
    );

    if (!station) {
        return;
    }

    updateStation(station, {
        name: stationNameInput.value.trim() || "이름 없음",
        transfer: stationTransferInput.checked
    });

    render();
}


function updateRoute() {
    state.routeName = routeNameInput.value.trim() || "새 노선";
    state.routeColor = routeColorInput.value;

    routeColorValue.textContent =
        state.routeColor.toUpperCase();

    state.lines.forEach(line => {
        line.name = state.routeName;
        line.color = state.routeColor;
    });

    render();
}


function resetMap() {
    if (!confirm("현재 노선도를 모두 삭제할까요?")) {
        return;
    }

    state.routeName = "새 노선";
    state.routeColor = "#0B3D91";
    state.stations = [];
    state.lines = [];
    state.selectedStationId = null;
    state.pendingLineStationIds = [];

    routeNameInput.value = "새 노선";
    routeColorInput.value = "#0B3D91";
    routeColorValue.textContent = "#0B3D91";

    render();
}


function saveJson() {
    const data = {
        version: 1,
        routeName: state.routeName,
        routeColor: state.routeColor,
        stations: state.stations,
        lines: state.lines
    };

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.routeName || "route-map"}.json`;

    link.click();

    URL.revokeObjectURL(url);
}


function loadJson(file) {
    const reader = new FileReader();

    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);

            state.routeName = data.routeName || "불러온 노선";
            state.routeColor = data.routeColor || "#0B3D91";
            state.stations = Array.isArray(data.stations)
                ? data.stations
                : [];
            state.lines = Array.isArray(data.lines)
                ? data.lines
                : [];

            state.selectedStationId = null;

            routeNameInput.value = state.routeName;
            routeColorInput.value = state.routeColor;
            routeColorValue.textContent =
                state.routeColor.toUpperCase();

            render();

        } catch (error) {
            alert("JSON 파일을 불러오지 못했습니다.");
            console.error(error);
        }
    };

    reader.readAsText(file);
}


function exportSvg() {
    const clone = svg.cloneNode(true);

    clone.setAttribute(
        "xmlns",
        "http://www.w3.org/2000/svg"
    );

    clone.querySelectorAll(".station-group.selected")
        .forEach(group => group.classList.remove("selected"));

    const source = new XMLSerializer().serializeToString(clone);

    const blob = new Blob(
        [source],
        { type: "image/svg+xml;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.routeName || "route-map"}.svg`;

    link.click();

    URL.revokeObjectURL(url);
}


/* 역 클릭 */

stationLayer.addEventListener("click", event => {
    const group = event.target.closest(".station-group");

    if (!group) {
        return;
    }

    event.stopPropagation();

    const stationId = group.dataset.stationId;

    if (state.currentTool === "delete") {
        state.selectedStationId = stationId;
        deleteSelectedStation();
        return;
    }

    if (state.currentTool === "line") {
        handleLineClick(stationId);
        return;
    }

    selectStation(stationId);
});


/* 작업 영역 클릭 */

svg.addEventListener("click", event => {

    if (event.target.closest(".station-group")) {
        return;
    }

    if (state.currentTool !== "station") {
        return;
    }

    const point = getSvgPoint(event);

    addStationAtPoint(point.x, point.y);
});


/* 역 드래그 */

let dragging = false;
let dragStation = null;

stationLayer.addEventListener("pointerdown", event => {
    const group = event.target.closest(".station-group");

    if (!group || state.currentTool !== "select") {
        return;
    }

    event.preventDefault();

    dragging = true;
    dragStation = group.dataset.stationId;

    group.setPointerCapture?.(event.pointerId);
    group.classList.add("dragging");
});


window.addEventListener("pointermove", event => {

    if (!dragging || !dragStation) {
        return;
    }

    const station = findStation(
        state.stations,
        dragStation
    );

    if (!station) {
        return;
    }

    const point = getSvgPoint(event);

    station.x = Math.round(point.x);
    station.y = Math.round(point.y);

    render();
});


window.addEventListener("pointerup", () => {
    dragging = false;
    dragStation = null;
});


/* 도구 */

toolButtons.select.addEventListener(
    "click",
    () => setTool("select")
);

toolButtons.station.addEventListener(
    "click",
    () => setTool("station")
);

toolButtons.line.addEventListener(
    "click",
    () => setTool("line")
);

toolButtons.delete.addEventListener(
    "click",
    () => setTool("delete")
);


/* 속성 */

document.getElementById(
    "apply-station-btn"
).addEventListener(
    "click",
    applyStationProperties
);

document.getElementById(
    "delete-station-btn"
).addEventListener(
    "click",
    deleteSelectedStation
);


/* 노선 */

routeNameInput.addEventListener(
    "input",
    updateRoute
);

routeColorInput.addEventListener(
    "input",
    updateRoute
);


/* 파일 */

document.getElementById(
    "save-json-btn"
).addEventListener(
    "click",
    saveJson
);

document.getElementById(
    "load-json-input"
).addEventListener(
    "change",
    event => {
        const file = event.target.files[0];

        if (file) {
            loadJson(file);
        }
    }
);


/* 새로 만들기 */

document.getElementById(
    "new-map-btn"
).addEventListener(
    "click",
    resetMap
);


/* SVG */

document.getElementById(
    "export-svg-btn"
).addEventListener(
    "click",
    exportSvg
);


/* 확대 */

document.getElementById(
    "zoom-in-btn"
).addEventListener(
    "click",
    () => {
        state.zoom = Math.min(2, state.zoom + 0.1);

        svg.style.transform =
            `scale(${state.zoom})`;

        zoomValue.textContent =
            `${Math.round(state.zoom * 100)}%`;
    }
);


document.getElementById(
    "zoom-out-btn"
).addEventListener(
    "click",
    () => {
        state.zoom = Math.max(0.5, state.zoom - 0.1);

        svg.style.transform =
            `scale(${state.zoom})`;

        zoomValue.textContent =
            `${Math.round(state.zoom * 100)}%`;
    }
);


/* 초기화 */

setTool("select");
render();