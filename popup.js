// DOM Elements
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// LocalStorage Elements
const savedKeySelect = document.getElementById("savedKeySelect");
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

// Toast
const toast = document.getElementById("toast");

// Storage Keys
const STORAGE_KEYS = "savedStorageKeys";
const STORAGE_ENDPOINTS = "savedEndpoints";

// Current fetched data (for property selector)
let currentFetchedData = null;
let currentMatchedKey = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  loadSavedKeysDropdown(true); // true = auto fetch if there's a saved key
  loadSavedEndpoints();
  updateBodyVisibility();
});

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

// ==================== LocalStorage Functions ====================

// When dropdown selection changes
savedKeySelect.addEventListener("change", () => {
  const selectedValue = savedKeySelect.value;
  if (selectedValue) {
    storageKeyInput.value = selectedValue;
  }
});

// Delete selected key from dropdown
deleteSelectedKeyBtn.addEventListener("click", async () => {
  const selectedValue = savedKeySelect.value;
  if (!selectedValue) {
    showToast("กรุณาเลือก Key ก่อน", true);
    return;
  }

  const result = await chrome.storage.local.get(STORAGE_KEYS);
  const keys = result[STORAGE_KEYS] || [];
  const filtered = keys.filter((k) => k !== selectedValue);
  await chrome.storage.local.set({ [STORAGE_KEYS]: filtered });
  loadSavedKeysDropdown();
  storageKeyInput.value = "";
  showToast("ลบ Key เรียบร้อย");
});

// Save current key to dropdown
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
    loadSavedKeysDropdown();
    savedKeySelect.value = key;
    showToast("บันทึก Key เรียบร้อย");
  } else {
    showToast("Key นี้มีอยู่แล้ว", true);
  }
});

// Load saved keys into dropdown
async function loadSavedKeysDropdown(autoFetch = false) {
  const result = await chrome.storage.local.get(STORAGE_KEYS);
  const keys = result[STORAGE_KEYS] || [];

  // Clear existing options except the first one
  savedKeySelect.innerHTML = '<option value="">-- เลือกหรือพิมพ์ใหม่ --</option>';

  keys.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    savedKeySelect.appendChild(option);
  });

  // Auto-select first key and fetch if autoFetch is true
  if (autoFetch && keys.length > 0) {
    savedKeySelect.value = keys[0];
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
  const endpoint = apiEndpointInput.value.trim();

  if (!endpoint) {
    showToast("กรุณาใส่ Endpoint URL", true);
    return;
  }

  // Validate URL
  try {
    new URL(endpoint);
  } catch {
    showToast("URL ไม่ถูกต้อง", true);
    return;
  }

  // Parse headers
  let headers = {};
  const headersText = apiHeadersInput.value.trim();
  if (headersText) {
    try {
      headers = JSON.parse(headersText);
    } catch {
      showToast("Headers JSON ไม่ถูกต้อง", true);
      return;
    }
  }

  // Parse body
  let body = null;
  if (method !== "GET" && method !== "DELETE") {
    const bodyText = apiBodyInput.value.trim();
    if (bodyText) {
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
