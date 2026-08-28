/* =========================================
   교통덕후 허브 - Home JS
   ========================================= */

const searchInput = document.getElementById("main-search");
const searchButton = document.getElementById("search-button");

function performSearch() {
    const keyword = searchInput.value.trim();

    if (!keyword) {
        searchInput.focus();
        return;
    }

    alert(`"${keyword}" 검색 기능은 준비 중입니다.`);
}

searchButton.addEventListener("click", performSearch);

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        performSearch();
    }
});