"use strict";

/*
 * ==========================================
 * 교통덕후 허브 - 버스 타이핑 게임
 * ==========================================
 *
 * 개발용 API 직접 호출 버전
 *
 * 인증키는 아래 SERVICE_KEY 한 곳에만 입력.
 * 모든 API가 같은 키를 사용합니다.
 */

// ==========================================
// API 설정
// ==========================================

const SERVICE_KEY = "9ff4edca97180ac0b72351ed1e1c997faaaf570edb6b63d05cf2325d9ceacbf0";

const TAGO_BASE_URL = "https://apis.data.go.kr/1613000";


// ==========================================
// DOM
// ==========================================

const regionSelect =
    document.getElementById("region-select");

const routeInput =
    document.getElementById("route-input");

const difficultySelect =
    document.getElementById("difficulty-select");

const searchRouteButton =
    document.getElementById("search-route-button");

const startGameButton =
    document.getElementById("start-game-button");

const routeResults =
    document.getElementById("route-results");

const apiError =
    document.getElementById("api-error");

const currentRouteElement =
    document.getElementById("current-route");

const gameCountElement =
    document.getElementById("game-count");

const timerElement =
    document.getElementById("timer");

const progressFill =
    document.getElementById("progress-fill");

const questionText =
    document.getElementById("question-text");

const typingInput =
    document.getElementById("typing-input");

const submitAnswerButton =
    document.getElementById("submit-answer-button");

const feedbackMessage =
    document.getElementById("feedback-message");

const scoreElement =
    document.getElementById("score");

const accuracyElement =
    document.getElementById("accuracy");

const cpmElement =
    document.getElementById("cpm");

const comboElement =
    document.getElementById("combo");


// ==========================================
// 상태
// ==========================================

const state = {
    routes: [],
    selectedRoute: null,

    stops: [],
    questions: [],

    currentIndex: 0,

    score: 0,
    correctCount: 0,
    answerCount: 0,
    combo: 0,

    startedAt: null,
    timerId: null,

    gameStarted: false,

    // 한글 IME composition 상태
    isComposing: false
};


// ==========================================
// 공공데이터 API 공통 호출
// ==========================================

async function callTagoApi(path, params = {}) {

    if (
        !SERVICE_KEY ||
        SERVICE_KEY === "여기에_공공데이터포털_인증키"
    ) {
        throw new Error(
            "bustyping.js의 SERVICE_KEY에 공공데이터포털 인증키를 입력해주세요."
        );
    }

    const url =
        new URL(`${TAGO_BASE_URL}/${path}`);

    url.searchParams.set(
        "serviceKey",
        SERVICE_KEY
    );

    url.searchParams.set(
        "_type",
        "json"
    );

    Object.entries(params).forEach(
        ([key, value]) => {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                url.searchParams.set(
                    key,
                    value
                );
            }

        }
    );

    const response =
        await fetch(url);

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    const data =
        await response.json();

    const responseHeader =
        data?.response?.header;

    if (
        responseHeader &&
        responseHeader.resultCode &&
        responseHeader.resultCode !== "00"
    ) {
        throw new Error(
            responseHeader.resultMsg ||
            "공공데이터 API 요청에 실패했습니다."
        );
    }

    return data;
}


// ==========================================
// TAGO 응답에서 item 배열 추출
// ==========================================

function getItems(data) {

    const items =
        data?.response?.body?.items?.item;

    if (!items) {
        return [];
    }

    return Array.isArray(items)
        ? items
        : [items];
}


// ==========================================
// 버스 노선 검색
// ==========================================

async function searchRoutes() {

    const cityCode =
        regionSelect.value;

    const routeNo =
        routeInput.value.trim();

    if (!cityCode) {
        throw new Error(
            "지역을 선택해주세요."
        );
    }

    if (!routeNo) {
        throw new Error(
            "노선 번호를 입력해주세요."
        );
    }

    /*
     * TAGO 버스노선정보 서비스
     */
    const data =
        await callTagoApi(
            "BusRouteInfoInqireService/getRouteNoList",
            {
                cityCode,
                routeNo,
                pageNo: 1,
                numOfRows: 100
            }
        );

    return getItems(data);
}


// ==========================================
// 선택 노선의 경유 정류장
// ==========================================

async function loadRouteStops(route) {

    const cityCode =
        regionSelect.value;

    const routeId =
        route.routeid ||
        route.routeId;

    if (!routeId) {
        throw new Error(
            "선택한 노선에서 routeId를 찾을 수 없습니다."
        );
    }

    /*
     * 국토교통부_버스노선별 경유정류장
     */
    const data =
        await callTagoApi(
            "BusRouteInfoInqireService/getRouteAcctoThrghSttnList",
            {
                cityCode,
                routeId,
                pageNo: 1,
                numOfRows: 500
            }
        );

    const items =
        getItems(data);

    return items.sort(
        (a, b) =>
            Number(
                a.ord ||
                a.nodeord ||
                0
            )
            -
            Number(
                b.ord ||
                b.nodeord ||
                0
            )
    );
}


// ==========================================
// HTML escape
// ==========================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ==========================================
// API 오류 표시
// ==========================================

function showError(message) {

    apiError.textContent =
        message;

    apiError.classList.remove(
        "hidden"
    );
}


function clearError() {

    apiError.textContent = "";

    apiError.classList.add(
        "hidden"
    );
}


// ==========================================
// 노선 검색
// ==========================================

searchRouteButton.addEventListener(
    "click",
    async () => {

        clearError();

        const region =
            regionSelect.value;

        const routeNo =
            routeInput.value.trim();

        if (!region) {
            showError(
                "지역을 선택해주세요."
            );

            return;
        }

        if (!routeNo) {
            showError(
                "노선 번호를 입력해주세요."
            );

            routeInput.focus();

            return;
        }

        searchRouteButton.disabled =
            true;

        searchRouteButton.textContent =
            "검색 중...";

        routeResults.classList.remove(
            "hidden"
        );

        routeResults.innerHTML =
            `<div class="loading-message">
                노선을 검색하고 있습니다...
             </div>`;

        try {

            const routes =
                await searchRoutes();

            state.routes =
                routes;

            renderRouteResults(
                routes
            );

        } catch (error) {

            console.error(error);

            showError(
                error.message
            );

            routeResults.innerHTML =
                `<div class="empty-message">
                    노선을 불러오지 못했습니다.
                 </div>`;

        } finally {

            searchRouteButton.disabled =
                false;

            searchRouteButton.textContent =
                "노선 검색";

        }

    }
);


// ==========================================
// 검색 결과 렌더링
// ==========================================

function renderRouteResults(
    routes
) {

    if (!routes.length) {

        routeResults.innerHTML =
            `<div class="empty-message">
                검색 결과가 없습니다.
             </div>`;

        return;
    }

    const title =
        document.createElement("div");

    title.className =
        "route-results-title";

    title.textContent =
        `검색 결과 ${routes.length}건`;

    const list =
        document.createElement("div");

    list.className =
        "route-list";

    routes.forEach(
        (route, index) => {

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.className =
                "route-item";

            const routeNo =
                route.routeno ||
                route.routeNo ||
                "노선번호 없음";

            const routeType =
                route.routetp ||
                route.routeTp ||
                "유형 미상";

            const start =
                route.startnodenm ||
                route.startNodeNm ||
                "기점 정보 없음";

            const end =
                route.endnodenm ||
                route.endNodeNm ||
                "종점 정보 없음";

            button.innerHTML = `
                <div class="route-item-top">
                    <span class="route-number">
                        ${escapeHtml(routeNo)}
                    </span>

                    <span class="route-type">
                        ${escapeHtml(routeType)}
                    </span>
                </div>

                <div class="route-item-bottom">
                    ${escapeHtml(start)}
                    →
                    ${escapeHtml(end)}
                </div>
            `;

            button.addEventListener(
                "click",
                () => selectRoute(
                    routes[index],
                    button
                )
            );

            list.appendChild(
                button
            );
        }
    );

    routeResults.innerHTML = "";

    routeResults.appendChild(
        title
    );

    routeResults.appendChild(
        list
    );
}


// ==========================================
// 노선 선택
// ==========================================

async function selectRoute(
    route,
    button
) {

    document
        .querySelectorAll(".route-item")
        .forEach(
            item => item.classList.remove(
                "selected"
            )
        );

    button.classList.add(
        "selected"
    );

    clearError();

    questionText.textContent =
        "정류장 정보를 불러오는 중...";

    startGameButton.disabled =
        true;

    try {

        const stops =
            await loadRouteStops(
                route
            );

        if (!stops.length) {
            throw new Error(
                "이 노선의 정류장 정보를 찾지 못했습니다."
            );
        }

        const questions =
            buildQuestions(
                stops
            );

        if (!questions.length) {
            throw new Error(
                "게임에 사용할 정류장이 없습니다."
            );
        }

        state.selectedRoute =
            route;

        state.stops =
            stops;

        state.questions =
            questions;

        state.currentIndex =
            0;

        state.gameStarted =
            false;

        const routeNo =
            route.routeno ||
            route.routeNo ||
            "노선";

        currentRouteElement.textContent =
            `${routeNo}번`;

        gameCountElement.textContent =
            `0 / ${questions.length}`;

        questionText.textContent =
            `정류장 ${questions.length}개 준비 완료`;

        startGameButton.disabled =
            false;

        startGameButton.textContent =
            "게임 시작";

    } catch (error) {

        console.error(error);

        showError(
            error.message
        );

        questionText.textContent =
            "정류장을 불러오지 못했습니다.";
    }
}


// ==========================================
// 문제 생성
// ==========================================

function buildQuestions(
    stops
) {

    let questions =
        stops
            .map(stop => {

                const name =
                    stop.nodenm ||
                    stop.nodeNm ||
                    stop.nodeNmKor ||
                    "";

                const sequence =
                    Number(
                        stop.ord ||
                        stop.nodeord ||
                        0
                    );

                return {
                    name: String(name).trim(),
                    sequence
                };

            })
            .filter(
                stop =>
                    stop.name.length > 0
            )
            .sort(
                (a, b) =>
                    a.sequence -
                    b.sequence
            );


    const difficulty =
        difficultySelect.value;


    /*
     * 쉬움:
     * 정류장의 50%만 사용
     *
     * 보통:
     * 전체
     *
     * 어려움:
     * 전체
     *
     * 덕후:
     * 전체 + 중복 정류장도 유지
     */

    if (
        difficulty === "easy" &&
        questions.length > 10
    ) {

        const selected = [];

        for (
            let i = 0;
            i < questions.length;
            i += 2
        ) {
            selected.push(
                questions[i]
            );
        }

        questions =
            selected;
    }


    /*
     * 동일 이름의 연속 중복 정류장은
     * 게임에서 불필요하므로 보통/어려움에서 제거.
     */

    if (
        difficulty === "normal" ||
        difficulty === "hard"
    ) {

        questions =
            questions.filter(
                (item, index, array) =>
                    index === 0 ||
                    item.name !==
                    array[index - 1].name
            );
    }


    return questions;
}


// ==========================================
// 게임 시작
// ==========================================

startGameButton.addEventListener(
    "click",
    () => {

        if (
            !state.questions.length
        ) {
            showError(
                "먼저 노선을 선택해주세요."
            );

            return;
        }

        startGame();
    }
);


function startGame() {

    stopTimer();

    state.currentIndex =
        0;

    state.score =
        0;

    state.correctCount =
        0;

    state.answerCount =
        0;

    state.combo =
        0;

    state.startedAt =
        Date.now();

    state.gameStarted =
        true;

    typingInput.disabled =
        false;

    submitAnswerButton.disabled =
        false;

    scoreElement.textContent =
        "0";

    accuracyElement.textContent =
        "100%";

    cpmElement.textContent =
        "0";

    comboElement.textContent =
        "0";

    timerElement.textContent =
        "00:00";

    feedbackMessage.textContent =
        "";

    feedbackMessage.className =
        "feedback-message";

    showCurrentQuestion();

    startTimer();

    typingInput.focus();
}


// ==========================================
// 현재 문제 표시
// ==========================================

function showCurrentQuestion() {

    const question =
        state.questions[
            state.currentIndex
        ];

    if (!question) {

        finishGame();

        return;
    }

    gameCountElement.textContent =
        `${state.currentIndex + 1} / ${state.questions.length}`;

    progressFill.style.width =
        `${
            (
                state.currentIndex /
                state.questions.length
            ) * 100
        }%`;

    typingInput.value =
        "";

    questionText.innerHTML =
        colorizeText(
            question.name,
            ""
        );

    feedbackMessage.textContent =
        "";

    feedbackMessage.className =
        "feedback-message";

    typingInput.focus();
}


// ==========================================
// 정답 제출
// ==========================================

submitAnswerButton.addEventListener(
    "click",
    submitAnswer
);


typingInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            /*
             * 한글 조합 중 Enter가 눌린 경우
             * 게임 제출을 실행하지 않습니다.
             */
            if (state.isComposing) {
                return;
            }

            event.preventDefault();

            submitAnswer();
        }

    }
);


function submitAnswer() {

    if (!state.gameStarted) {
        return;
    }

    if (state.isComposing) {
        return;
    }

    const question =
        state.questions[
            state.currentIndex
        ];

    if (!question) {
        return;
    }

    const answer =
        typingInput.value.trim();

    state.answerCount++;


    const correct =
        answer ===
        question.name.trim();


    if (correct) {

        state.correctCount++;

        state.combo++;

        state.score +=
            100 +
            state.combo * 10;

        feedbackMessage.textContent =
            "정답!";

        feedbackMessage.className =
            "feedback-message correct";

    } else {

        state.combo =
            0;

        feedbackMessage.textContent =
            `오답 · 정답: ${question.name}`;

        feedbackMessage.className =
            "feedback-message incorrect";

    }


    updateStats();

    state.currentIndex++;


    setTimeout(
        () => {

            showCurrentQuestion();

        },
        180
    );
}


// ==========================================
// 한글 IME
// ==========================================

typingInput.addEventListener(
    "compositionstart",
    () => {

        state.isComposing =
            true;

    }
);


typingInput.addEventListener(
    "compositionend",
    () => {

        state.isComposing =
            false;

        updateTypingPreview();

    }
);


typingInput.addEventListener(
    "input",
    () => {

        if (state.isComposing) {
            return;
        }

        updateTypingPreview();

    }
);


// ==========================================
// 실시간 입력 표시
// ==========================================

function updateTypingPreview() {

    if (!state.gameStarted) {
        return;
    }

    const question =
        state.questions[
            state.currentIndex
        ];

    if (!question) {
        return;
    }

    questionText.innerHTML =
        colorizeText(
            question.name,
            typingInput.value
        );
}


// ==========================================
// 글자별 색상
// ==========================================

function colorizeText(
    target,
    typed
) {

    const targetCharacters =
        [...target];

    const typedCharacters =
        [...typed];


    return targetCharacters
        .map(
            (character, index) => {

                const typedCharacter =
                    typedCharacters[index];


                let className =
                    "typing-pending";


                if (
                    typedCharacter !== undefined
                ) {

                    if (
                        typedCharacter ===
                        character
                    ) {
                        className =
                            "typing-correct";
                    } else {
                        className =
                            "typing-incorrect";
                    }

                }


                return `
                    <span class="${className}">
                        ${escapeHtml(character)}
                    </span>
                `;

            }
        )
        .join("");
}


// ==========================================
// 통계
// ==========================================

function updateStats() {

    scoreElement.textContent =
        state.score.toLocaleString();


    const accuracy =
        state.answerCount === 0
            ? 100
            : (
                state.correctCount /
                state.answerCount
            ) * 100;


    accuracyElement.textContent =
        `${accuracy.toFixed(1)}%`;


    comboElement.textContent =
        String(
            state.combo
        );


    const elapsedMinutes =
        (
            Date.now() -
            state.startedAt
        ) / 60000;


    /*
     * 실제 CPM을 계산할 때
     * 정답 개수가 아니라 실제 입력 글자 수를
     * 사용하는 것이 더 정확합니다.
     *
     * 일단 기본 버전에서는 정답 수 기반으로 표시.
     */
    const cpm =
        elapsedMinutes > 0
            ? Math.round(
                state.correctCount /
                elapsedMinutes
            )
            : 0;


    cpmElement.textContent =
        String(cpm);
}


// ==========================================
// 타이머
// ==========================================

function startTimer() {

    stopTimer();

    state.timerId =
        setInterval(
            () => {

                if (!state.startedAt) {
                    return;
                }

                const elapsed =
                    Date.now() -
                    state.startedAt;

                timerElement.textContent =
                    formatTime(
                        elapsed
                    );

                updateStats();

            },
            250
        );
}


function stopTimer() {

    if (state.timerId) {

        clearInterval(
            state.timerId
        );

        state.timerId =
            null;
    }
}


function formatTime(
    milliseconds
) {

    const totalSeconds =
        Math.floor(
            milliseconds / 1000
        );

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        totalSeconds %
        60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
    );
}


// ==========================================
// 게임 종료
// ==========================================

function finishGame() {

    state.gameStarted =
        false;

    stopTimer();

    typingInput.disabled =
        true;

    submitAnswerButton.disabled =
        true;

    progressFill.style.width =
        "100%";

    gameCountElement.textContent =
        `${state.questions.length} / ${state.questions.length}`;

    questionText.textContent =
        "게임 종료!";

    feedbackMessage.textContent =
        `최종 점수 ${state.score.toLocaleString()}점`;

    feedbackMessage.className =
        "feedback-message";

    updateStats();
}


// ==========================================
// Enter 검색
// ==========================================

routeInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            searchRouteButton.click();
        }

    }
);


// ==========================================
// 초기 상태
// ==========================================

typingInput.disabled =
    true;

submitAnswerButton.disabled =
    true;

startGameButton.disabled =
    true;
