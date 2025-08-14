// ================= CẤU HÌNH GITHUB =================
const githubConfig = {
    USERNAME: "phamlong6677t-create",
    REPO: "TFLv2",
    TOKEN: "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",
    FILE_PATH: "game.json",
    get API_URL() {
        return `https://api.github.com/repos/${this.USERNAME}/${this.REPO}/contents/${this.FILE_PATH}`;
    }
};

// ================= BIẾN TOÀN CỤC =================
let currentGames = { "all": [] };
let currentTab = "all";

// ================= KHỞI TẠO =================
document.addEventListener('DOMContentLoaded', async () => {
    await loadGames();
    renderTabs();
    renderGames();
    setupEventListeners();
});

// ================= HÀM CHÍNH =================

// Tải dữ liệu từ GitHub
async function loadGames() {
    try {
        const response = await fetch(githubConfig.API_URL, {
            headers: { 'Authorization': `Bearer ${githubConfig.TOKEN}` }
        });

        if (response.ok) {
            const data = await response.json();
            const parsedData = JSON.parse(decodeURIComponent(escape(atob(data.content))));
            currentGames = parsedData;
        } else {
            console.warn("Không tải được dữ liệu từ GitHub, khởi tạo rỗng.");
            currentGames = { "all": [] };
        }
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        currentGames = { "all": [] };
    }
}

// Lưu dữ liệu lên GitHub
async function saveGames() {
    try {
        // Lấy SHA file hiện tại
        const shaResponse = await fetch(githubConfig.API_URL, {
            headers: { 'Authorization': `Bearer ${githubConfig.TOKEN}` }
        });
        const sha = shaResponse.ok ? (await shaResponse.json()).sha : null;

        const contentEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(currentGames))));

        const response = await fetch(githubConfig.API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${githubConfig.TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Cập nhật lúc ${new Date().toISOString()}`,
                content: contentEncoded,
                sha
            })
        });

        return response.ok;
    } catch (error) {
        console.error("Lỗi lưu dữ liệu:", error);
        return false;
    }
}

// Thêm tab mới
async function addTab(tabName) {
    if (!tabName.trim()) return false;
    if (!currentGames[tabName]) {
        currentGames[tabName] = [];
        if (await saveGames()) {
            renderTabs();
            return true;
        }
    }
    return false;
}

// Thêm game mới
async function addGame(gameData) {
    if (!gameData.title.trim() || !gameData.link.trim()) return false;

    if (!currentGames[gameData.tab]) {
        currentGames[gameData.tab] = [];
    }

    currentGames[gameData.tab].push(gameData);
    currentGames.all.push(gameData);

    if (await saveGames()) {
        renderGames();
        return true;
    }
    return false;
}

// ================= HÀM HIỂN THỊ =================
function renderTabs() {
    const tabContainer = document.getElementById('tabContainer');
    tabContainer.innerHTML = '';

    // Tab mặc định
    const allTab = document.createElement('div');
    allTab.className = 'tab' + (currentTab === "all" ? ' active' : '');
    allTab.dataset.tab = "all";
    allTab.textContent = "Tất cả";
    allTab.addEventListener('click', () => {
        currentTab = "all";
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        allTab.classList.add('active');
        renderGames();
    });
    tabContainer.appendChild(allTab);

    // Các tab khác
    Object.keys(currentGames).forEach(tab => {
        if (tab !== "all") {
            const tabElement = document.createElement('div');
            tabElement.className = 'tab' + (currentTab === tab ? ' active' : '');
            tabElement.dataset.tab = tab;
            tabElement.textContent = tab;
            tabElement.addEventListener('click', () => {
                currentTab = tab;
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tabElement.classList.add('active');
                renderGames();
            });
            tabContainer.appendChild(tabElement);
        }
    });
}

function renderGames() {
    const container = document.getElementById('gamesContainer');
    const gamesToShow = currentTab === 'all' ? currentGames.all : currentGames[currentTab] || [];

    if (gamesToShow.length === 0) {
        container.innerHTML = `<p>Không có game nào trong mục này.</p>`;
        return;
    }

    container.innerHTML = gamesToShow.map(game => `
        <div class="game-card">
            <h3>${game.title}</h3>
            <p>${game.description || ""}</p>
            <a href="${game.link}" target="_blank">Tải về</a>
        </div>
    `).join('');
}

// ================= XỬ LÝ SỰ KIỆN =================
function setupEventListeners() {
    const gameModal = document.getElementById('gameModal');
    const tabModal = document.getElementById('tabModal');

    // Mở modal thêm game
    document.getElementById('addGameBtn').addEventListener('click', () => {
        const tabSelect = document.getElementById('gameTab');
        tabSelect.innerHTML = Object.keys(currentGames)
            .filter(tab => tab !== "all")
            .map(tab => `<option value="${tab}">${tab}</option>`)
            .join('');
        gameModal.style.display = 'flex';
    });

    // Lưu game mới
    document.getElementById('saveGameBtn').addEventListener('click', async () => {
        const gameData = {
            title: document.getElementById('gameTitle').value,
            description: document.getElementById('gameDescription').value,
            link: document.getElementById('gameLink').value,
            tab: document.getElementById('gameTab').value
        };
        if (await addGame(gameData)) {
            gameModal.style.display = 'none';
        }
    });

    // Mở modal thêm tab
    document.getElementById('addTabBtn').addEventListener('click', () => {
        tabModal.style.display = 'flex';
    });

    // Lưu tab mới
    document.getElementById('saveTabBtn').addEventListener('click', async () => {
        const tabName = document.getElementById('tabName').value;
        if (await addTab(tabName)) {
            tabModal.style.display = 'none';
        }
    });

    // Đồng bộ dữ liệu
    document.getElementById('syncBtn').addEventListener('click', async () => {
        await loadGames();
        renderTabs();
        renderGames();
    });

    // Đóng modal khi click ngoài
    [gameModal, tabModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    });
}
