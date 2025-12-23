// DOM Elements
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// Pin Button (only exists in popup, not in sidepanel)
const pinBtn = document.getElementById("pinBtn");

// LocalStorage Elements
const savedKeysList = document.getElementById("savedKeysList");
const deleteSelectedKeyBtn = document.getElementById("deleteSelectedKey");
const storageKeyInput = document.getElementById("storageKey");
const getStorageBtn = document.getElementById("getStorage");
const getAllStorageBtn = document.getElementById("getAllStorage");
const copyStorageBtn = document.getElementById("copyStorage");
const storageResult = document.getElementById("storageResult");
const storageResultLabel = document.getElementById("storageResultLabel");
const saveCurrentKeyBtn = document.getElementById("saveCurrentKey");

// Property Selector Elements
const propertySelectorDiv = document.getElementById("propertySelector");
const propertySelect = document.getElementById("propertySelect");
const copySelectedPropertyBtn = document.getElementById("copySelectedProperty");

// API Elements
const apiMethodSelect = document.getElementById("apiMethod");
const apiEndpointInput = document.getElementById("apiEndpoint");
const apiHeadersInput = document.getElementById("apiHeaders");
const apiBodyInput = document.getElementById("apiBody");
const bodyGroup = document.getElementById("bodyGroup");
const sendApiBtn = document.getElementById("sendApi");
const copyApiBtn = document.getElementById("copyApi");
const apiResult = document.getElementById("apiResult");
const apiStatusText = document.getElementById("apiStatusText");
const saveCurrentEndpointBtn = document.getElementById("saveCurrentEndpoint");
const savedEndpointsContainer = document.getElementById("savedEndpoints");

// Postman Import Elements
const postmanFileInput = document.getElementById("postmanFileInput");
const importPostmanBtn = document.getElementById("importPostmanBtn");

// Collection Runner Elements
const collectionRunner = document.getElementById("collectionRunner");
const collectionNameEl = document.getElementById("collectionName");
const runnerStats = document.getElementById("runnerStats");

const runAllBtn = document.getElementById("runAllBtn");
const clearResultsBtn = document.getElementById("clearResultsBtn");
const requestListEl = document.getElementById("requestList");
const runnerSummary = document.getElementById("runnerSummary");
const summaryTotal = document.getElementById("summaryTotal");
const summaryPassed = document.getElementById("summaryPassed");
const summaryFailed = document.getElementById("summaryFailed");
const summaryTime = document.getElementById("summaryTime");
const summaryAvg = document.getElementById("summaryAvg");
const summarySlowest = document.getElementById("summarySlowest");

// Postman parsed data
let postmanRequests = [];
let postmanTestScripts = [];
let runResults = [];

// Toast
const toast = document.getElementById("toast");

// Storage Keys
const STORAGE_KEYS = "savedStorageKeys";
const STORAGE_ENDPOINTS = "savedEndpoints";
const STORAGE_THEME = "selectedTheme";
const STORAGE_DEFAULT_THEME = "defaultTheme";
const STORAGE_VARIABLES = "userVariables";

// Theme Selector
const themeSelect = document.getElementById("themeSelect");

// Current fetched data (for property selector)
let currentFetchedData = null;
let currentMatchedKey = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initTabs();
  initPinButton();
  loadVariables();
  initApiModes();
  initSidebar();
  loadSavedKeysDatalist(true); // true = auto fetch if there's a saved key
  loadSavedEndpoints();
  updateBodyVisibility();
});

// Initialize Pin Button (open as side panel)
function initPinButton() {
  if (pinBtn) {
    pinBtn.addEventListener("click", async () => {
      try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Open side panel
        await chrome.sidePanel.open({ tabId: tab.id });
        
        // Close popup
        window.close();
      } catch (error) {
        showToast("ไม่สามารถเปิด Side Panel ได้: " + error.message, true);
      }
    });
  }
}

// ==================== Theme Management ====================

// Initialize theme from storage
async function initTheme() {
  try {
    const result = await chrome.storage.local.get([STORAGE_THEME, STORAGE_DEFAULT_THEME]);
    const defaultTheme = result[STORAGE_DEFAULT_THEME] || "cyberpunk";
    const savedTheme = result[STORAGE_THEME] || defaultTheme;
    applyTheme(savedTheme);
    if (themeSelect) {
      themeSelect.value = savedTheme;
    }
    // Update default button state after loading
    setTimeout(updateDefaultButtonState, 100);
  } catch (error) {
    console.error("Failed to load theme:", error);
    applyTheme("cyberpunk");
  }
}

// Apply theme to document
function applyTheme(themeName) {
  document.documentElement.setAttribute("data-theme", themeName);
  document.body.setAttribute("data-theme", themeName);
}

// Theme change event listener
if (themeSelect) {
  themeSelect.addEventListener("change", async () => {
    const selectedTheme = themeSelect.value;
    applyTheme(selectedTheme);
    
    try {
      await chrome.storage.local.set({ [STORAGE_THEME]: selectedTheme });
      updateDefaultButtonState();
      showToast(`เปลี่ยนเป็น ${getThemeDisplayName(selectedTheme)}`);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  });
}

// Get display name for theme
function getThemeDisplayName(themeName) {
  const names = {
    "cyberpunk": "Cyberpunk",
    "minimal": "Minimal",
    "fantasy-forest": "Fantasy Forest",
    "low-poly-forest": "Low-poly Forest",
    "black": "Black",
    "purple": "Purple",
    "tokyo-night-storm": "Tokyo Night Storm"
  };
  return names[themeName] || themeName;
}

// Set Default Theme Button
const setDefaultThemeBtn = document.getElementById("setDefaultTheme");

// Update default button state
async function updateDefaultButtonState() {
  if (!setDefaultThemeBtn || !themeSelect) return;
  
  try {
    const result = await chrome.storage.local.get(STORAGE_DEFAULT_THEME);
    const defaultTheme = result[STORAGE_DEFAULT_THEME] || "cyberpunk";
    
    if (themeSelect.value === defaultTheme) {
      setDefaultThemeBtn.classList.add("is-default");
      setDefaultThemeBtn.title = "Theme นี้เป็น Default แล้ว";
    } else {
      setDefaultThemeBtn.classList.remove("is-default");
      setDefaultThemeBtn.title = "ตั้งเป็น Default";
    }
  } catch (error) {
    console.error("Failed to check default theme:", error);
  }
}

// Set Default Theme event listener
if (setDefaultThemeBtn) {
  setDefaultThemeBtn.addEventListener("click", async () => {
    if (!themeSelect) return;
    
    const currentTheme = themeSelect.value;
    try {
      await chrome.storage.local.set({ [STORAGE_DEFAULT_THEME]: currentTheme });
      updateDefaultButtonState();
      showToast(`ตั้ง ${getThemeDisplayName(currentTheme)} เป็น Default`);
    } catch (error) {
      console.error("Failed to set default theme:", error);
      showToast("ไม่สามารถตั้ง Default ได้", true);
    }
  });
}

// Initialize Unpin Button (close side panel)
const unpinBtn = document.getElementById("unpinBtn");
if (unpinBtn) {
  unpinBtn.addEventListener("click", () => {
    // Close the side panel window
    window.close();
  });
}


// Tab Switching
function initTabs() {
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;

      // Update active tab button
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update active tab content
      tabContents.forEach((content) => {
        content.classList.remove("active");
        if (content.id === `${tabId}-tab`) {
          content.classList.add("active");
        }
      });
    });
  });
}

// ==================== Variables Management ====================

// In-memory variables store
let userVariables = {};

// Initialize Variables
// Initialize Variables (Load only)
async function loadVariables() {
  try {
    const result = await chrome.storage.local.get(STORAGE_VARIABLES);
    userVariables = result[STORAGE_VARIABLES] || {};
    renderSidebarVariables();
  } catch (error) {
    console.error("Failed to load variables:", error);
    userVariables = {};
  }
}

// Save variables to storage
async function saveVariables() {
  try {
    await chrome.storage.local.set({ [STORAGE_VARIABLES]: userVariables });
  } catch (error) {
    console.error("Failed to save variables:", error);
  }
}

// Substitute variables in text
function substituteVariables(text) {
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return userVariables[varName] !== undefined ? userVariables[varName] : match;
  });
}

// ==================== API Mode Management ====================

function initApiModes() {
  const modeBtns = document.querySelectorAll(".mode-btn");
  const importMode = document.getElementById("importMode");
  const manualMode = document.getElementById("manualMode");

  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      
      // Update active button
      modeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Show/hide modes
      if (mode === "import") {
        if (importMode) importMode.style.display = "block";
        if (manualMode) manualMode.style.display = "none";
      } else {
        if (importMode) importMode.style.display = "none";
        if (manualMode) manualMode.style.display = "block";
      }
    });
  });
}

// ==================== Settings Sidebar ====================

function initSidebar() {
  const toggleBtn = document.getElementById("toggleSettings");
  const sidebar = document.getElementById("settingsSidebar");
  const closeBtn = document.getElementById("closeSidebar");
  const addBtn = document.getElementById("sidebarAddBtn");
  const addForm = document.getElementById("sidebarAddForm");
  const saveBtn = document.getElementById("sidebarSaveVar");
  const cancelBtn = document.getElementById("sidebarCancelVar");
  const nameInput = document.getElementById("sidebarVarName");
  const valueInput = document.getElementById("sidebarVarValue");
  const sidebarThemeSelect = document.getElementById("sidebarThemeSelect");

  // Toggle sidebar
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      const isVisible = sidebar.style.display !== "none";
      sidebar.style.display = isVisible ? "none" : "flex";
      toggleBtn.classList.toggle("active", !isVisible);
      if (!isVisible) {
        renderSidebarVariables();
        // Sync theme select with main theme
        if (sidebarThemeSelect && themeSelect) {
          sidebarThemeSelect.value = themeSelect.value;
        }
      }
    });
  }

  // Close sidebar
  if (closeBtn && sidebar && toggleBtn) {
    closeBtn.addEventListener("click", () => {
      sidebar.style.display = "none";
      toggleBtn.classList.remove("active");
    });
  }

  // Sidebar theme change
  if (sidebarThemeSelect) {
    sidebarThemeSelect.addEventListener("change", async () => {
      const selectedTheme = sidebarThemeSelect.value;
      applyTheme(selectedTheme);
      // Sync main theme selector
      if (themeSelect) themeSelect.value = selectedTheme;
      try {
        await chrome.storage.local.set({ [STORAGE_THEME]: selectedTheme });
        showToast(`เปลี่ยนเป็น ${getThemeDisplayName(selectedTheme)}`);
      } catch (error) {
        console.error("Failed to save theme:", error);
      }
    });
  }
  // Add button
  if (addBtn && addForm) {
    addBtn.addEventListener("click", () => {
      addForm.style.display = "flex";
      addBtn.style.display = "none";
      nameInput?.focus();
    });
  }

  // Cancel add
  if (cancelBtn && addForm && addBtn) {
    cancelBtn.addEventListener("click", () => {
      addForm.style.display = "none";
      addBtn.style.display = "block";
      if (nameInput) nameInput.value = "";
      if (valueInput) valueInput.value = "";
    });
  }

  // Save variable
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const name = nameInput?.value.trim();
      const value = valueInput?.value.trim();
      
      if (!name) {
        showToast("กรุณาใส่ชื่อ Variable", true);
        return;
      }

      userVariables[name] = value;
      await saveVariables();
      renderSidebarVariables();
      renderVariablesList();
      
      addForm.style.display = "none";
      addBtn.style.display = "block";
      if (nameInput) nameInput.value = "";
      if (valueInput) valueInput.value = "";
      
      showToast(`เพิ่ม {{${name}}} แล้ว`);
    });
  }
}

// Render sidebar variables list
function renderSidebarVariables() {
  const listEl = document.getElementById("sidebarVariablesList");
  if (!listEl) return;

  const vars = Object.entries(userVariables);
  
  if (vars.length === 0) {
    listEl.innerHTML = '<p class="empty-sidebar">ยังไม่มี Variables<br>กด + Add เพื่อเพิ่ม</p>';
    return;
  }

  listEl.innerHTML = vars.map(([name, value]) => `
    <div class="sidebar-var-item" data-name="${name}">
      <span class="var-name">{{${name}}}</span>
      <span class="var-value" title="${value}">${value || '(empty)'}</span>
      <button class="btn btn-icon sidebar-var-edit" title="แก้ไข">✏️</button>
      <button class="btn btn-icon sidebar-var-delete" title="ลบ">🗑️</button>
    </div>
  `).join("");

  // Delete event
  listEl.querySelectorAll(".sidebar-var-delete").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const item = e.target.closest(".sidebar-var-item");
      const name = item.dataset.name;
      delete userVariables[name];
      await saveVariables();
      renderSidebarVariables();
      renderVariablesList();
      showToast(`ลบ {{${name}}} แล้ว`);
    });
  });

  // Edit event
  listEl.querySelectorAll(".sidebar-var-edit").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const item = e.target.closest(".sidebar-var-item");
      const name = item.dataset.name;
      const currentValue = userVariables[name] || "";
      const newValue = prompt(`แก้ไขค่า {{${name}}}:`, currentValue);
      if (newValue !== null) {
        userVariables[name] = newValue;
        saveVariables();
        renderSidebarVariables();
        renderVariablesList();
        showToast(`อัปเดต {{${name}}} แล้ว`);
      }
    });
  });
}

// ==================== LocalStorage Functions ====================

// Delete current key from saved list
deleteSelectedKeyBtn.addEventListener("click", async () => {
  const currentKey = storageKeyInput.value.trim();
  if (!currentKey) {
    showToast("กรุณาใส่หรือเลือก Key ก่อน", true);
    return;
  }

  const result = await chrome.storage.local.get(STORAGE_KEYS);
  const keys = result[STORAGE_KEYS] || [];
  
  if (!keys.includes(currentKey)) {
    showToast("Key นี้ไม่ได้บันทึกไว้", true);
    return;
  }
  
  const filtered = keys.filter((k) => k !== currentKey);
  await chrome.storage.local.set({ [STORAGE_KEYS]: filtered });
  loadSavedKeysDatalist();
  storageKeyInput.value = "";
  showToast("ลบ Key เรียบร้อย");
});

// Save current key to datalist
saveCurrentKeyBtn.addEventListener("click", async () => {
  const key = storageKeyInput.value.trim();
  if (!key) {
    showToast("กรุณาใส่ชื่อ Key ก่อน", true);
    return;
  }

  const result = await chrome.storage.local.get(STORAGE_KEYS);
  const keys = result[STORAGE_KEYS] || [];

  if (!keys.includes(key)) {
    keys.push(key);
    await chrome.storage.local.set({ [STORAGE_KEYS]: keys });
    loadSavedKeysDatalist();
    showToast("บันทึก Key เรียบร้อย");
  } else {
    showToast("Key นี้มีอยู่แล้ว", true);
  }
});

// Load saved keys into datalist
async function loadSavedKeysDatalist(autoFetch = false) {
  const result = await chrome.storage.local.get(STORAGE_KEYS);
  const keys = result[STORAGE_KEYS] || [];

  // Clear existing options
  if (savedKeysList) {
    savedKeysList.innerHTML = '';
    keys.forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      savedKeysList.appendChild(option);
    });
  }

  // Auto-select first key and fetch if autoFetch is true
  if (autoFetch && keys.length > 0) {
    storageKeyInput.value = keys[0];
    // Trigger fetch automatically
    getStorageBtn.click();
  }
}

// Fetch storage value
getStorageBtn.addEventListener("click", async () => {
  const searchKey = storageKeyInput.value.trim() || savedKeySelect.value;
  if (!searchKey) {
    showToast("กรุณาเลือกหรือใส่ชื่อ Key", true);
    return;
  }

  // Reset property selector
  propertySelectorDiv.style.display = "none";
  currentFetchedData = null;
  currentMatchedKey = null;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (searchTerm) => {
        // First try exact match
        const exactValue = localStorage.getItem(searchTerm);
        if (exactValue !== null) {
          try {
            return {
              found: true,
              matchType: "exact",
              key: searchTerm,
              value: JSON.parse(exactValue),
              isJson: true,
            };
          } catch {
            return {
              found: true,
              matchType: "exact",
              key: searchTerm,
              value: exactValue,
              isJson: false,
            };
          }
        }

        // If no exact match, search for partial matches
        const matches = [];
        const searchLower = searchTerm.toLowerCase();

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.toLowerCase().includes(searchLower)) {
            const value = localStorage.getItem(key);
            try {
              matches.push({ key, value: JSON.parse(value), isJson: true });
            } catch {
              matches.push({ key, value, isJson: false });
            }
          }
        }

        if (matches.length === 0) {
          return { found: false, searchTerm };
        } else if (matches.length === 1) {
          return {
            found: true,
            matchType: "partial",
            key: matches[0].key,
            value: matches[0].value,
            isJson: matches[0].isJson,
          };
        } else {
          return {
            found: true,
            matchType: "multiple",
            matches: matches,
          };
        }
      },
      args: [searchKey],
    });

    const data = result[0].result;
    if (!data.found) {
      storageResult.textContent = `❌ ไม่พบ key ที่มี "${searchKey}" ใน localStorage`;
      storageResult.classList.add("error");
      storageResult.classList.remove("success");
      storageResultLabel.textContent = "ผลลัพธ์";
    } else if (data.matchType === "multiple") {
      // Multiple matches found - let user choose
      const output = {};
      data.matches.forEach((m) => {
        output[m.key] = m.value;
      });
      storageResult.textContent = JSON.stringify(output, null, 2);
      storageResult.classList.remove("error");
      storageResult.classList.add("success");
      storageResultLabel.textContent = `🔍 พบ ${data.matches.length} keys ที่ตรงกัน`;
      
      // Store for potential property selection
      currentFetchedData = output;
      showPropertySelector(output);
    } else {
      // Single match (exact or partial)
      const prefix = data.matchType === "partial" ? `🔍 พบ key: ${data.key}` : `📦 ${data.key}`;
      storageResultLabel.textContent = prefix;
      
      const output = data.isJson
        ? JSON.stringify(data.value, null, 2)
        : data.value;
      storageResult.textContent = output;
      storageResult.classList.remove("error");
      storageResult.classList.add("success");

      // Store data and show property selector if it's an object
      currentMatchedKey = data.key;
      currentFetchedData = data.value;
      
      if (data.isJson && typeof data.value === "object" && data.value !== null) {
        showPropertySelector(data.value);
      }
    }
  } catch (error) {
    storageResult.textContent = `❌ Error: ${error.message}`;
    storageResult.classList.add("error");
    storageResult.classList.remove("success");
    storageResultLabel.textContent = "ผลลัพธ์";
  }
});

// Show property selector with available properties
function showPropertySelector(data) {
  if (!data || typeof data !== "object") return;

  // Clear existing options
  propertySelect.innerHTML = '<option value="__ALL__">📦 แสดงทั้งหมด</option>';

  // Get all keys from the object
  const keys = Object.keys(data);
  
  keys.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    
    // Show preview of value
    let preview = "";
    const val = data[key];
    if (typeof val === "string") {
      preview = val.length > 30 ? val.substring(0, 30) + "..." : val;
    } else if (typeof val === "object") {
      preview = "[Object]";
    } else {
      preview = String(val);
    }
    
    option.textContent = `${key}: ${preview}`;
    propertySelect.appendChild(option);
  });

  propertySelectorDiv.style.display = "block";

  // Default to access_token if it exists
  if (keys.includes("access_token")) {
    propertySelect.value = "access_token";
    // Trigger change event to update display
    propertySelect.dispatchEvent(new Event("change"));
  }
}

// When property selection changes
propertySelect.addEventListener("change", () => {
  const selectedProp = propertySelect.value;
  
  if (!currentFetchedData) return;
  
  if (selectedProp === "__ALL__") {
    storageResult.textContent = JSON.stringify(currentFetchedData, null, 2);
    storageResultLabel.textContent = currentMatchedKey ? `📦 ${currentMatchedKey}` : "📦 ทั้งหมด";
  } else {
    const value = currentFetchedData[selectedProp];
    const output = typeof value === "object" 
      ? JSON.stringify(value, null, 2) 
      : String(value);
    storageResult.textContent = output;
    storageResultLabel.textContent = `🎯 ${selectedProp}`;
  }
});

// Copy selected property
copySelectedPropertyBtn.addEventListener("click", () => {
  const selectedProp = propertySelect.value;
  
  if (!currentFetchedData) {
    showToast("ไม่มีข้อมูลให้ copy", true);
    return;
  }
  
  let textToCopy;
  if (selectedProp === "__ALL__") {
    textToCopy = JSON.stringify(currentFetchedData, null, 2);
  } else {
    const value = currentFetchedData[selectedProp];
    textToCopy = typeof value === "object" 
      ? JSON.stringify(value, null, 2) 
      : String(value);
  }
  
  copyToClipboard(textToCopy, copySelectedPropertyBtn);
});

// Get all storage
getAllStorageBtn.addEventListener("click", async () => {
  // Reset property selector
  propertySelectorDiv.style.display = "none";
  currentFetchedData = null;
  currentMatchedKey = null;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const storage = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          try {
            storage[key] = JSON.parse(value);
          } catch {
            storage[key] = value;
          }
        }
        return storage;
      },
    });

    const data = result[0].result;
    if (Object.keys(data).length === 0) {
      storageResult.textContent = "❌ localStorage ว่างเปล่า";
      storageResult.classList.add("error");
      storageResult.classList.remove("success");
      storageResultLabel.textContent = "ผลลัพธ์";
    } else {
      storageResult.textContent = JSON.stringify(data, null, 2);
      storageResult.classList.remove("error");
      storageResult.classList.add("success");
      storageResultLabel.textContent = `📦 ทั้งหมด (${Object.keys(data).length} keys)`;
      
      currentFetchedData = data;
      showPropertySelector(data);
    }
  } catch (error) {
    storageResult.textContent = `❌ Error: ${error.message}`;
    storageResult.classList.add("error");
    storageResult.classList.remove("success");
    storageResultLabel.textContent = "ผลลัพธ์";
  }
});

copyStorageBtn.addEventListener("click", () => {
  const text = storageResult.textContent;
  if (text && text !== "รอผลลัพธ์...") {
    copyToClipboard(text, copyStorageBtn);
  }
});

// ==================== API Functions ====================

apiMethodSelect.addEventListener("change", updateBodyVisibility);

function updateBodyVisibility() {
  const method = apiMethodSelect.value;
  bodyGroup.style.display =
    method === "GET" || method === "DELETE" ? "none" : "block";
}

sendApiBtn.addEventListener("click", async () => {
  const method = apiMethodSelect.value;
  let endpoint = apiEndpointInput.value.trim();

  if (!endpoint) {
    showToast("กรุณาใส่ Endpoint URL", true);
    return;
  }

  // Substitute variables in endpoint
  endpoint = substituteVariables(endpoint);

  // Validate URL
  try {
    new URL(endpoint);
  } catch {
    showToast("URL ไม่ถูกต้อง (ตรวจสอบ Variables)", true);
    return;
  }

  // Parse headers with variable substitution
  let headers = {};
  let headersText = apiHeadersInput.value.trim();
  if (headersText) {
    headersText = substituteVariables(headersText);
    try {
      headers = JSON.parse(headersText);
    } catch {
      showToast("Headers JSON ไม่ถูกต้อง", true);
      return;
    }
  }

  // Parse body with variable substitution
  let body = null;
  if (method !== "GET" && method !== "DELETE") {
    let bodyText = apiBodyInput.value.trim();
    if (bodyText) {
      bodyText = substituteVariables(bodyText);
      try {
        body = JSON.parse(bodyText);
      } catch {
        showToast("Body JSON ไม่ถูกต้อง", true);
        return;
      }
    }
  }

  // Send request
  sendApiBtn.disabled = true;
  sendApiBtn.textContent = "⏳ กำลังส่ง...";
  apiResult.textContent = "กำลังส่ง request...";
  apiResult.classList.remove("error", "success");

  try {
    const fetchOptions = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const startTime = Date.now();
    const response = await fetch(endpoint, fetchOptions);
    const endTime = Date.now();
    const duration = endTime - startTime;

    let responseData;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Update status
    const statusBadge = response.ok
      ? `<span class="status-badge status-success">${response.status} OK</span>`
      : `<span class="status-badge status-error">${response.status} Error</span>`;

    apiStatusText.innerHTML = `ผลลัพธ์ (${duration}ms) ${statusBadge}`;

    // Display result
    const output =
      typeof responseData === "object"
        ? JSON.stringify(responseData, null, 2)
        : responseData;

    apiResult.textContent = output;
    apiResult.classList.toggle("error", !response.ok);
    apiResult.classList.toggle("success", response.ok);
  } catch (error) {
    apiStatusText.innerHTML =
      'ผลลัพธ์ <span class="status-badge status-error">Error</span>';
    apiResult.textContent = `❌ Error: ${error.message}`;
    apiResult.classList.add("error");
    apiResult.classList.remove("success");
  } finally {
    sendApiBtn.disabled = false;
    sendApiBtn.textContent = "🚀 ส่ง Request";
  }
});

copyApiBtn.addEventListener("click", () => {
  const text = apiResult.textContent;
  if (text && text !== "รอผลลัพธ์..." && !text.startsWith("กำลัง")) {
    copyToClipboard(text, copyApiBtn);
  }
});

saveCurrentEndpointBtn.addEventListener("click", async () => {
  const method = apiMethodSelect.value;
  const endpoint = apiEndpointInput.value.trim();
  const headers = apiHeadersInput.value.trim();
  const body = apiBodyInput.value.trim();

  if (!endpoint) {
    showToast("กรุณาใส่ Endpoint URL ก่อน", true);
    return;
  }

  const saved = {
    method,
    endpoint,
    headers,
    body,
    id: Date.now(),
  };

  const result = await chrome.storage.local.get(STORAGE_ENDPOINTS);
  const endpoints = result[STORAGE_ENDPOINTS] || [];

  // Check if endpoint already exists
  const exists = endpoints.some(
    (e) => e.endpoint === endpoint && e.method === method
  );
  if (exists) {
    showToast("Endpoint นี้มีอยู่แล้ว", true);
    return;
  }

  endpoints.push(saved);
  await chrome.storage.local.set({ [STORAGE_ENDPOINTS]: endpoints });
  loadSavedEndpoints();
  showToast("บันทึก Endpoint เรียบร้อย");
});

async function loadSavedEndpoints() {
  const result = await chrome.storage.local.get(STORAGE_ENDPOINTS);
  const endpoints = result[STORAGE_ENDPOINTS] || [];

  if (endpoints.length === 0) {
    savedEndpointsContainer.innerHTML =
      '<div class="empty-list">ยังไม่มี Endpoint ที่บันทึกไว้</div>';
    return;
  }

  savedEndpointsContainer.innerHTML = endpoints
    .map(
      (ep) => `
    <div class="saved-item" data-id="${ep.id}">
      <span class="saved-item-text">
        <strong>[${ep.method}]</strong> ${escapeHtml(ep.endpoint)}
      </span>
      <button class="saved-item-delete" data-delete-id="${ep.id}">✕</button>
    </div>
  `
    )
    .join("");

  // Add click handlers
  savedEndpointsContainer.querySelectorAll(".saved-item").forEach((item) => {
    item.addEventListener("click", async (e) => {
      if (!e.target.classList.contains("saved-item-delete")) {
        const id = parseInt(item.dataset.id);
        const result = await chrome.storage.local.get(STORAGE_ENDPOINTS);
        const endpoints = result[STORAGE_ENDPOINTS] || [];
        const ep = endpoints.find((e) => e.id === id);

        if (ep) {
          apiMethodSelect.value = ep.method;
          apiEndpointInput.value = ep.endpoint;
          apiHeadersInput.value = ep.headers || "";
          apiBodyInput.value = ep.body || "";
          updateBodyVisibility();
        }
      }
    });
  });

  savedEndpointsContainer
    .querySelectorAll(".saved-item-delete")
    .forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const idToDelete = parseInt(btn.dataset.deleteId);
        const result = await chrome.storage.local.get(STORAGE_ENDPOINTS);
        const endpoints = result[STORAGE_ENDPOINTS] || [];
        const filtered = endpoints.filter((ep) => ep.id !== idToDelete);
        await chrome.storage.local.set({ [STORAGE_ENDPOINTS]: filtered });
        loadSavedEndpoints();
        showToast("ลบ Endpoint เรียบร้อย");
      });
    });
}

// ==================== Utility Functions ====================

function copyToClipboard(text, button) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalText = button.textContent;
      button.textContent = "✅ Copied!";
      button.classList.add("copied");
      showToast("คัดลอกเรียบร้อย");

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("copied");
      }, 1500);
    })
    .catch(() => {
      showToast("ไม่สามารถคัดลอกได้", true);
    });
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ==================== Postman Import Functions ====================

// Import button click handler
if (importPostmanBtn) {
  importPostmanBtn.addEventListener("click", () => {
    postmanFileInput.click();
  });
}

// File input change handler
if (postmanFileInput) {
  postmanFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      handlePostmanImport(file);
    }
  });
}

// Handle Postman file import
async function handlePostmanImport(file) {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    
    if (!json.item || !Array.isArray(json.item)) {
      showToast("ไฟล์ไม่ใช่ Postman Collection", true);
      return;
    }
    
    const name = json.info?.name || "Imported Collection";
    postmanRequests = parsePostmanCollection(json.item);
    runResults = [];
    
    if (postmanRequests.length === 0) {
      showToast("ไม่พบ requests ใน collection", true);
      return;
    }
    
    renderCollectionRunner(name);
    showToast(`Import สำเร็จ: ${postmanRequests.length} requests`);
  } catch (error) {
    console.error("Postman import error:", error);
    showToast("ไม่สามารถอ่านไฟล์ได้", true);
  }
}

// Parse Postman collection items (recursive for folders)
function parsePostmanCollection(items, prefix = "") {
  let requests = [];
  
  items.forEach((item) => {
    if (item.item && Array.isArray(item.item)) {
      const folderName = prefix ? `${prefix}/${item.name}` : item.name;
      requests = requests.concat(parsePostmanCollection(item.item, folderName));
    } else if (item.request) {
      const request = item.request;
      const name = prefix ? `${prefix}/${item.name}` : item.name;
      
      let url = typeof request.url === "string" ? request.url : request.url?.raw || "";
      
      let headers = {};
      if (request.header && Array.isArray(request.header)) {
        request.header.forEach(h => {
          if (h.key && !h.disabled) headers[h.key] = h.value || "";
        });
      }
      
      if (request.auth?.type === "bearer" && request.auth.bearer) {
        const tokenObj = request.auth.bearer.find(b => b.key === "token");
        if (tokenObj) headers["Authorization"] = `Bearer ${tokenObj.value}`;
      }
      
      let body = request.body?.raw || "";
      
      // Parse test scripts
      let testScript = "";
      if (item.event && Array.isArray(item.event)) {
        const testEvent = item.event.find(e => e.listen === "test");
        if (testEvent?.script?.exec) {
          testScript = testEvent.script.exec.join("\n");
        }
      }
      
      requests.push({
        name, method: request.method || "GET", url, headers, body, testScript
      });
    }
  });
  
  return requests;
}

// Render Collection Runner UI
function renderCollectionRunner(collectionName) {
  if (!collectionRunner || !requestListEl) return;
  
  if (collectionNameEl) collectionNameEl.textContent = `📁 ${collectionName}`;
  if (runnerStats) runnerStats.textContent = `${postmanRequests.length} requests`;
  
  requestListEl.innerHTML = "";
  postmanRequests.forEach((req, index) => {
    const item = document.createElement("div");
    item.className = "request-item";
    item.id = `request-${index}`;
    
    // Build auth options
    const authOptions = ['None', 'Bearer', 'Basic', 'API Key'].map(type => 
      `<option value="${type.toLowerCase().replace(' ', '-')}" ${type === 'Bearer' ? 'selected' : ''}>${type}</option>`
    ).join('');
    
    // Get current values from request
    const urlValue = req.url || '';
    const headersValue = req.headers ? JSON.stringify(req.headers, null, 2) : '{}';
    const bodyValue = req.body ? JSON.stringify(req.body, null, 2) : '{}';
    
    item.innerHTML = `
      <div class="request-row">
        <div class="request-info">
          <button class="btn-expand" data-index="${index}" title="ขยาย/ย่อ">▶</button>
          <span class="request-method method-${req.method.toLowerCase()}">${req.method}</span>
          <span class="request-name" title="${req.name}">${req.name}</span>
        </div>
        <div class="request-actions">
          <span class="request-time" id="time-${index}"></span>
          <span class="request-status" id="status-${index}"></span>
          <button class="btn-run-single" data-index="${index}">▶ Run</button>
        </div>
      </div>
      <!-- Expandable Editor Panel -->
      <div class="request-editor" id="editor-${index}" style="display: none;">
        <div class="editor-tabs">
          <button class="editor-tab active" data-tab="url" data-index="${index}">🔗 URL</button>
          <button class="editor-tab" data-tab="auth" data-index="${index}">🔑 Auth</button>
          <button class="editor-tab" data-tab="headers" data-index="${index}">📋 Headers</button>
          <button class="editor-tab" data-tab="body" data-index="${index}">📦 Body</button>
        </div>
        
        <div class="editor-content" id="content-${index}">
          <!-- URL Tab -->
          <div class="editor-panel active" data-panel="url">
            <label>Endpoint URL</label>
            <input type="text" class="editor-url-input" data-index="${index}" 
                   value="${urlValue}" placeholder="{{baseUrl}}/api/endpoint">
            <p class="editor-hint">💡 ใช้ {{variable}} ได้</p>
          </div>
          
          <!-- Auth Tab -->
          <div class="editor-panel" data-panel="auth">
            <label>Authorization Type</label>
            <select class="editor-auth-type" data-index="${index}">
              ${authOptions}
            </select>
            <label>Token / Value</label>
            <input type="text" class="editor-auth-value" data-index="${index}"
                   placeholder="{{token}}" value="">
          </div>
          
          <!-- Headers Tab -->
          <div class="editor-panel" data-panel="headers">
            <label>Headers (JSON)</label>
            <textarea class="editor-headers" data-index="${index}" rows="4"
                      placeholder='{"Content-Type": "application/json"}'>${headersValue}</textarea>
          </div>
          
          <!-- Body Tab -->
          <div class="editor-panel" data-panel="body">
            <label>Body (JSON)</label>
            <textarea class="editor-body" data-index="${index}" rows="5"
                      placeholder='{"key": "value"}'>${bodyValue}</textarea>
          </div>
        </div>
      </div>
      <div class="test-results" id="tests-${index}" style="display: none;"></div>
    `;
    requestListEl.appendChild(item);
  });
  
  // Add expand/collapse handlers
  requestListEl.querySelectorAll(".btn-expand").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = e.target.dataset.index;
      const editor = document.getElementById(`editor-${index}`);
      const isExpanded = editor.style.display !== "none";
      editor.style.display = isExpanded ? "none" : "block";
      e.target.textContent = isExpanded ? "▶" : "▼";
      e.target.classList.toggle("expanded", !isExpanded);
    });
  });
  
  // Add editor tab handlers
  requestListEl.querySelectorAll(".editor-tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
      const tabName = e.target.dataset.tab;
      const index = e.target.dataset.index;
      const content = document.getElementById(`content-${index}`);
      
      // Update active tab
      content.parentElement.querySelectorAll(".editor-tab").forEach(t => t.classList.remove("active"));
      e.target.classList.add("active");
      
      // Show panel
      content.querySelectorAll(".editor-panel").forEach(p => p.classList.remove("active"));
      content.querySelector(`[data-panel="${tabName}"]`).classList.add("active");
    });
  });
  
  // Add click handlers for single run buttons
  requestListEl.querySelectorAll(".btn-run-single").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      executeRequest(index);
    });
  });
  
  collectionRunner.style.display = "block";
  if (runnerSummary) runnerSummary.style.display = "none";
}

// Execute a single request
async function executeRequest(index) {
  const req = postmanRequests[index];
  if (!req) return null;
  
  const itemEl = document.getElementById(`request-${index}`);
  const timeEl = document.getElementById(`time-${index}`);
  const statusEl = document.getElementById(`status-${index}`);
  const testsEl = document.getElementById(`tests-${index}`);
  
  // Mark as running
  if (itemEl) itemEl.className = "request-item running";
  if (statusEl) statusEl.textContent = "⏳";
  
  // Substitute variables in URL
  let url = substituteVariables(req.url);
  
  const startTime = performance.now();
  
  try {
    const options = {
      method: req.method,
      headers: { "Content-Type": "application/json", ...req.headers }
    };
    
    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
      options.body = req.body;
    }
    
    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    let responseData;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    // Run tests
    const testResults = runPostmanTests(req.testScript, response, responseData);
    const allPassed = testResults.every(t => t.passed);
    
    // Update UI
    if (timeEl) timeEl.textContent = `${duration}ms`;
    if (statusEl) statusEl.textContent = allPassed ? "✅" : "❌";
    if (itemEl) itemEl.className = `request-item ${allPassed ? "passed" : "failed"}`;
    
    // Show test results
    if (testsEl && testResults.length > 0) {
      testsEl.style.display = "block";
      testsEl.innerHTML = testResults.map(t => `
        <div class="test-item">
          <span class="test-icon">${t.passed ? "✅" : "❌"}</span>
          <span class="test-name">${t.name}</span>
        </div>
      `).join("");
    }
    
    return { success: true, duration, status: response.status, testResults, passed: allPassed };
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    if (timeEl) timeEl.textContent = `${duration}ms`;
    if (statusEl) statusEl.textContent = "❌";
    if (itemEl) itemEl.className = "request-item failed";
    
    return { success: false, duration, error: error.message, testResults: [], passed: false };
  }
}

// Parse and run Postman tests (simplified)
function runPostmanTests(testScript, response, responseData) {
  if (!testScript) return [];
  
  const results = [];
  
  // Parse pm.test() calls
  const testRegex = /pm\.test\s*\(\s*["'](.+?)["']\s*,\s*function/g;
  let match;
  
  while ((match = testRegex.exec(testScript)) !== null) {
    const testName = match[1];
    let passed = true;
    
    // Check for status code tests
    if (testScript.includes("pm.response.to.have.status(200)") || 
        testScript.includes("status(200)")) {
      passed = response.status === 200;
    } else if (testScript.includes("pm.response.to.have.status(201)")) {
      passed = response.status === 201;
    } else if (testScript.includes("pm.response.to.have.status")) {
      // Try to extract status code
      const statusMatch = testScript.match(/status\((\d+)\)/);
      if (statusMatch) passed = response.status === parseInt(statusMatch[1]);
    }
    
    results.push({ name: testName, passed });
  }
  
  return results;
}

// Run All Requests
if (runAllBtn) {
  runAllBtn.addEventListener("click", async () => {
    if (postmanRequests.length === 0) {
      showToast("ไม่มี requests ให้รัน", true);
      return;
    }
    
    runAllBtn.disabled = true;
    runAllBtn.textContent = "⏳ Running...";
    runResults = [];
    
    const totalStart = performance.now();
    let passed = 0, failed = 0;
    let slowestTime = 0, slowestName = "";
    
    for (let i = 0; i < postmanRequests.length; i++) {
      const result = await executeRequest(i);
      if (result) {
        runResults.push({ ...result, name: postmanRequests[i].name });
        if (result.passed) passed++; else failed++;
        if (result.duration > slowestTime) {
          slowestTime = result.duration;
          slowestName = postmanRequests[i].name;
        }
      }
      // Small delay between requests
      await new Promise(r => setTimeout(r, 100));
    }
    
    const totalTime = Math.round(performance.now() - totalStart);
    const avgTime = Math.round(totalTime / postmanRequests.length);
    
    // Update summary
    if (summaryTotal) summaryTotal.textContent = `${postmanRequests.length} requests`;
    if (summaryPassed) summaryPassed.textContent = passed;
    if (summaryFailed) summaryFailed.textContent = failed;
    if (summaryTime) summaryTime.textContent = `${totalTime}ms`;
    if (summaryAvg) summaryAvg.textContent = `${avgTime}ms`;
    if (summarySlowest) summarySlowest.textContent = slowestName ? `${slowestName} (${slowestTime}ms)` : "-";
    if (runnerSummary) runnerSummary.style.display = "block";
    
    runAllBtn.disabled = false;
    runAllBtn.textContent = "🚀 Run All";
    showToast(`เสร็จ: ${passed}/${postmanRequests.length} passed`);
  });
}

// Clear Results
if (clearResultsBtn) {
  clearResultsBtn.addEventListener("click", () => {
    runResults = [];
    renderCollectionRunner(collectionNameEl?.textContent?.replace("📁 ", "") || "Collection");
    showToast("ล้างผลลัพธ์แล้ว");
  });
}

// Legacy function for backward compatibility
function populatePostmanRequests(requests, collectionName) {
  renderCollectionRunner(collectionName);
}

function loadPostmanRequest(request) {
  if (apiMethodSelect) {
    apiMethodSelect.value = request.method;
    updateBodyVisibility();
  }
  if (apiEndpointInput) apiEndpointInput.value = request.url;
  if (apiHeadersInput) {
    const headersStr = Object.keys(request.headers).length > 0 
      ? JSON.stringify(request.headers, null, 2) : "";
    apiHeadersInput.value = headersStr;
  }
  if (apiBodyInput) apiBodyInput.value = request.body;
  showToast(`โหลด: ${request.name}`);
}
