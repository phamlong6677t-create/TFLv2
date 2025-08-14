// ================= CẤU HÌNH GITHUB =================
const githubConfig = {
  username: "phamlong6677t-create",
  repo: "TFLv2",
  token: "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", // THAY THẾ BẰNG TOKEN THỰC
  path: "game.json",
  branch: "main",
  get apiUrl() {
    return `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.path}?ref=${this.branch}`;
  }
};

// ================= LỚP QUẢN LÝ DỮ LIỆU =================
class DataManager {
  constructor() {
    this.cachedData = null;
  }

  // Lấy dữ liệu từ GitHub
  async fetchData() {
    try {
      const response = await fetch(githubConfig.apiUrl, {
        headers: {
          'Authorization': `Bearer ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      this.cachedData = JSON.parse(atob(data.content.replace(/\s/g, '')));
      return this.cachedData;
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  }

  // Cập nhật dữ liệu lên GitHub
  async updateData(newData) {
    try {
      const current = await this.fetchData();
      const sha = await this.getFileSHA();

      const mergedData = this.deepMerge(current, newData);
      mergedData.metadata = {
        lastUpdated: new Date().toISOString(),
        version: this.incrementVersion(current.metadata.version),
        totalItems: this.countItems(mergedData)
      };

      const response = await fetch(githubConfig.apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubConfig.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Data update - ${new Date().toLocaleString()}`,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(mergedData)))),
          sha: sha,
          branch: githubConfig.branch
        })
      });

      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      console.error("Update error:", error);
      throw error;
    }
  }

  // ================= PHƯƠNG THỨC HỖ TRỢ =================
  async getFileSHA() {
    const response = await fetch(githubConfig.apiUrl, {
      headers: {
        'Authorization': `Bearer ${githubConfig.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const data = await response.json();
    return data.sha;
  }

  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], this.deepMerge(target[key], source[key]);
      }
    }
    return { ...target, ...source };
  }

  incrementVersion(version) {
    const parts = version.split('.');
    parts[2] = (parseInt(parts[2]) + 1;
    return parts.join('.');
  }

  countItems(data) {
    return (
      data.home.embedVideos.length +
      data.home.featuredGames.length +
      data.links.length
    );
  }

  // ================= THAO TÁC DỮ LIỆU =================
  async addVideo(videoData) {
    if (!videoData.url) throw new Error("Video URL is required");
    
    const newVideo = {
      id: `vid_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...videoData
    };

    return this.updateData({
      home: {
        embedVideos: [newVideo]
      }
    });
  }

  async addGame(gameData) {
    if (!gameData.title || !gameData.download) {
      throw new Error("Title and download URL are required");
    }

    const newGame = {
      id: `game_${Date.now()}`,
      createdAt: new Date().toISOString(),
      category: gameData.category || "uncategorized",
      ...gameData
    };

    return this.updateData({
      home: {
        featuredGames: [newGame]
      }
    });
  }

  async addLink(linkData) {
    if (!linkData.url || !linkData.title) {
      throw new Error("URL and title are required");
    }

    const newLink = {
      id: `link_${Date.now()}`,
      createdAt: new Date().toISOString(),
      icon: linkData.icon || "https://cdn-icons-png.flaticon.com/512/2965/2965300.png",
      ...linkData
    };

    return this.updateData({
      links: [newLink]
    });
  }
}

// ================= KHỞI TẠO & SỬ DỤNG =================
document.addEventListener('DOMContentLoaded', async () => {
  const dataManager = new DataManager();

  // Ví dụ sử dụng:
  try {
    // Thêm video mới
    await dataManager.addVideo({
      url: "https://www.youtube.com/embed/NEW_VIDEO_ID",
      title: "Video hướng dẫn mới",
      thumbnail: "https://i.ytimg.com/vi/NEW_VIDEO_ID/maxresdefault.jpg",
      duration: "10:25"
    });

    // Thêm game mới
    await dataManager.addGame({
      title: "Game Mobile Mới",
      download: "https://example.com/download/game.apk",
      image: "https://example.com/game-thumbnail.jpg",
      description: "Phiên bản mobile mới nhất",
      category: "game-mobile"
    });

    // Thêm link mới
    await dataManager.addLink({
      title: "Tài liệu hướng dẫn",
      url: "https://example.com/docs",
      category: "document"
    });

    console.log("Cập nhật dữ liệu thành công!");
  } catch (error) {
    console.error("Lỗi khi cập nhật:", error);
  }
});

// ================= UTILITY FUNCTIONS =================
function generateUniqueID(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function validateYouTubeUrl(url) {
  return /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(url);
}

function formatDate(date = new Date()) {
  return date.toISOString();
          }
