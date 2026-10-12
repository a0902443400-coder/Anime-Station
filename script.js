// ========================================
// 0. Firebase 雲端設定 (npm install firebase)
// ========================================

const firebaseConfig = {
    // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzRYj5o3mchKTJ57KDkF8oX5VxlO2FmZ4",
  authDomain: "anime-station-263ca.firebaseapp.com",
  databaseURL: "https://anime-station-263ca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "anime-station-263ca",
  storageBucket: "anime-station-263ca.firebasestorage.app",
  messagingSenderId: "429246111621",
  appId: "1:429246111621:web:8c0e728f6cef8440ebaeec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========================================
// 1. 取得 HTML 元素
// ========================================

const numberInput = document.getElementById("anime-number");
const titleInput = document.getElementById("anime-title");
const ratingInput = document.getElementById("anime-rating");
const imageInput = document.getElementById("anime-image");
const addButton = document.getElementById("add-anime-button");
const animeList = document.getElementById("anime-list");
const searchInput = document.getElementById("search-anime");
const clearSearchButton = document.getElementById("clear-search");

let animeCollection = [];

// ========================================
// 2. 即時監聽雲端資料 (共編的核心！)
// ========================================
// 只要你或朋友任何人修改了資料，這裡會「自動」抓取最新資料並重新渲染畫面
db.collection("animes").onSnapshot((snapshot) => {
    animeCollection = [];
    snapshot.forEach((doc) => {
        animeCollection.push({
            id: doc.id, // Firestore 的專屬 ID
            ...doc.data()
        });
    });
    renderAnimeList();
}, (error) => {
    console.error("讀取雲端資料失敗：", error);
    alert("讀取雲端資料時發生問題。");
});

// ========================================
// 3. 新增動漫到雲端
// ========================================

if (addButton) {
    addButton.addEventListener("click", function () {
        const number = Number(numberInput.value);
        const title = titleInput.value.trim();
        const rating = Number(ratingInput.value);
        const imageUrl = imageInput.value.trim();

        if (numberInput.value.trim() === "" || isNaN(number) || number <= 0) {
            alert("請輸入大於 0 的觀看順序（可包含小數）！");
            return;
        }

        if (!title) {
            alert("請輸入動漫名稱！");
            return;
        }

        if (animeCollection.some(anime => anime.number === number)) {
            alert("這個觀看順序已經存在！");
            return;
        }

        if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
            alert("評分必須是 0～5 的整數！");
            return;
        }

        const newAnime = {
            number: number,
            title: title,
            rating: rating,
            image: imageUrl
        };

        // 寫入 Firestore 資料庫（雲端）
        db.collection("animes").add(newAnime)
            .then(() => {
                numberInput.value = "";
                titleInput.value = "";
                ratingInput.value = "0";
                imageInput.value = "";
            })
            .catch((error) => {
                console.error("新增失敗：", error);
                alert("新增失敗，請檢查網路連線。");
            });
    });
}

// ========================================
// 4. 顯示動漫清單
// ========================================

function renderAnimeList() {
    if (!animeList) return;

    animeList.innerHTML = "";

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    const sortedAnime = [...animeCollection].sort((a, b) => a.number - b.number);

    const filteredAnime = sortedAnime.filter(anime => {
        return (
            String(anime.title || "").toLowerCase().includes(keyword) ||
            String(anime.number).includes(keyword)
        );
    });

    if (filteredAnime.length === 0) {
        const message = document.createElement("p");
        message.className = "no-results";
        message.textContent = keyword ? "找不到符合的動漫 😢" : "目前還沒有收藏動漫，快來新增吧！";
        animeList.appendChild(message);
    }

    filteredAnime.forEach(function (anime) {
        const card = document.createElement("article");
        card.className = "anime-card";

        const image = document.createElement("img");
        image.alt = anime.title + "的封面";
        image.className = "anime-cover";

        if (anime.image) {
            image.onerror = function () {
                image.alt = anime.title + "（封面載入失敗）";
                image.style.display = "none";
            };
            image.src = anime.image;
        } else {
            image.alt = anime.title + "（尚未設定封面）";
            image.style.display = "none";
        }

        const number = document.createElement("p");
        number.textContent = "觀看順序：" + anime.number;

        const title = document.createElement("h3");
        title.textContent = anime.title;

        const ratingText = document.createElement("p");
        ratingText.textContent = anime.rating === 0
            ? "個人評分：尚未評分"
            : "個人評分：" + "⭐".repeat(anime.rating);

        card.appendChild(image);
        card.appendChild(number);
        card.appendChild(title);
        card.appendChild(ratingText);

        animeList.appendChild(card);
    });

    updateStatistics();
}

// ========================================
// 5. 編輯動漫 (依據觀看順序尋找並更新雲端)
// ========================================

function startEditAnime(number) {
    const anime = animeCollection.find(item => item.number === number);

    if (!anime) {
        alert("找不到這部動漫！");
        return;
    }

    const newNumber = prompt("請輸入觀看順序（可輸入小數）：", anime.number);
    if (newNumber === null) return;
    const parsedNumber = Number(newNumber);

    if (newNumber.trim() === "" || isNaN(parsedNumber) || parsedNumber <= 0) {
        alert("觀看順序必須是大於 0 的數字！");
        return;
    }

    if (animeCollection.some(item => item.number === parsedNumber && item.id !== anime.id)) {
        alert("這個觀看順序已經被其他動漫使用！");
        return;
    }

    const newTitle = prompt("請輸入動漫名稱：", anime.title);
    if (newTitle === null) return;
    if (!newTitle.trim()) {
        alert("動漫名稱不能空白！");
        return;
    }

    const newRating = prompt("請輸入評分（0～5，0 代表尚未評分）：", anime.rating);
    if (newRating === null) return;
    const parsedRating = Number(newRating);

    if (!Number.isInteger(parsedRating) || parsedRating < 0 || parsedRating > 5) {
        alert("評分必須是 0～5 的整數！");
        return;
    }

    const newImage = prompt("請輸入圖片網址（可留空）：", anime.image || "");
    if (newImage === null) return;

    // 更新雲端資料庫
    db.collection("animes").doc(anime.id).update({
        number: parsedNumber,
        title: newTitle.trim(),
        rating: parsedRating,
        image: newImage.trim()
    })
    .then(() => {
        alert("動漫資料修改成功！");
    })
    .catch((error) => {
        console.error("修改失敗：", error);
        alert("修改失敗，請稍後再試。");
    });
}

// ========================================
// 6. 刪除動漫 (依據觀看順序從雲端刪除)
// ========================================

function deleteAnime(number) {
    const anime = animeCollection.find(item => item.number === number);

    if (!anime) {
        alert("找不到這部動漫！");
        return;
    }

    const confirmed = confirm(`確定要刪除「${anime.title}」嗎？\n此操作無法直接復原。`);
    if (!confirmed) return;

    // 從 Firestore 刪除文件
    db.collection("animes").doc(anime.id).delete()
        .then(() => {
            console.log("刪除成功");
        })
        .catch((error) => {
            console.error("刪除失敗：", error);
            alert("刪除失敗，請稍後再試。");
        });
}

// ========================================
// 7. 搜尋與統計功能
// ========================================

if (searchInput) {
    searchInput.value = "";
    searchInput.addEventListener("input", renderAnimeList);
}

if (clearSearchButton) {
    clearSearchButton.addEventListener("click", function () {
        if (searchInput) {
            searchInput.value = "";
            renderAnimeList();
        }
    });
}

function updateStatistics() {
    const total = animeCollection.length;
    const ratedAnime = animeCollection.filter(anime => Number(anime.rating) > 0);
    const ratedCount = ratedAnime.length;

    const average = ratedCount > 0
        ? ratedAnime.reduce((sum, anime) => sum + Number(anime.rating), 0) / ratedCount
        : 0;

    const highest = ratedCount > 0
        ? Math.max(...ratedAnime.map(anime => Number(anime.rating)))
        : 0;

    const totalElement = document.getElementById("total-anime");
    const ratedElement = document.getElementById("rated-anime");
    const averageElement = document.getElementById("average-rating");
    const highestElement = document.getElementById("highest-rating");

    if (totalElement) totalElement.textContent = total + " 部";
    if (ratedElement) ratedElement.textContent = ratedCount + " 部";
    if (averageElement) averageElement.textContent = ratedCount > 0 ? average.toFixed(2) + " ⭐" : "尚無評分";
    if (highestElement) highestElement.textContent = ratedCount > 0 ? highest + " ⭐" : "尚無評分";
}

// ========================================
// 8. 網頁右下角管理選單
// ========================================

const managementPanel = document.createElement("div");
managementPanel.id = "management-panel";

const managementToggle = document.createElement("button");
managementToggle.type = "button";
managementToggle.id = "management-toggle";
managementToggle.textContent = "⚙️";
managementToggle.title = "動漫管理";

const editAnimeButton = document.createElement("button");
editAnimeButton.type = "button";
editAnimeButton.textContent = "✏️ 編輯動漫";
editAnimeButton.id = "manage-edit";

const deleteAnimeButton = document.createElement("button");
deleteAnimeButton.type = "button";
deleteAnimeButton.textContent = "🗑️ 刪除動漫";
deleteAnimeButton.id = "manage-delete";

const managementOptions = document.createElement("div");
managementOptions.id = "management-options";
managementOptions.style.display = "none";

managementOptions.appendChild(editAnimeButton);
managementOptions.appendChild(deleteAnimeButton);

managementPanel.appendChild(managementOptions);
managementPanel.appendChild(managementToggle);
document.body.appendChild(managementPanel);

managementToggle.addEventListener("click", function () {
    managementOptions.style.display = managementOptions.style.display === "none" ? "flex" : "none";
});

editAnimeButton.addEventListener("click", function () {
    const number = prompt("請輸入要編輯的動漫觀看順序（可輸入小數）：");
    if (number === null || number.trim() === "") return;
    const parsedNumber = Number(number);
    if (isNaN(parsedNumber) || parsedNumber <= 0) {
        alert("請輸入正確大於 0 的數字觀看順序！");
        return;
    }
    startEditAnime(parsedNumber);
    managementOptions.style.display = "none";
});

deleteAnimeButton.addEventListener("click", function () {
    const number = prompt("請輸入要刪除的動漫觀看順序（可輸入小數）：");
    if (number === null || number.trim() === "") return;
    const parsedNumber = Number(number);
    if (isNaN(parsedNumber) || parsedNumber <= 0) {
        alert("請輸入正確大於 0 的數字觀看順序！");
        return;
    }
    deleteAnime(parsedNumber);
    managementOptions.style.display = "none";
});