const FASHU_AUTH_KEY = "fashu:demoAuth";
const FASHU_DEMO_USERNAME = "test";
const FASHU_DEMO_PASSWORD = "123456";

function buildTargetUrl(target, extraParams = {}) {
  const url = new URL(target, window.location.href);
  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return `${url.pathname}${url.search}${url.hash}`;
}

function isAuthenticated() {
  return localStorage.getItem(FASHU_AUTH_KEY) === "ok";
}

function markAuthenticated() {
  localStorage.setItem(FASHU_AUTH_KEY, "ok");
}

function clearAuthentication() {
  localStorage.removeItem(FASHU_AUTH_KEY);
}

function ensureIndexAccess() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("auth") === "ok") {
    markAuthenticated();
    params.delete("auth");
    const cleaned = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, cleaned);
  }

  if (!isAuthenticated()) {
    const current = window.location.pathname.split("/").pop() || "index.html";
    window.location.replace(buildTargetUrl("login.html", { next: current }));
    return false;
  }

  // 清理静态预览下可能影响恢复逻辑的缓存
  localStorage.removeItem("cosight:lastManusStep");
  localStorage.removeItem("cosight:pendingRequests");
  return true;
}

function ensureProtectedAccess() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("auth") === "ok") {
    markAuthenticated();
    params.delete("auth");
    const cleaned = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, cleaned);
  }

  if (!isAuthenticated()) {
    const current = window.location.pathname.split("/").pop() || "index.html";
    window.location.replace(buildTargetUrl("login.html", { next: current }));
    return false;
  }

  return true;
}

function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.replace("workspace.html");
    return true;
  }
  return false;
}

function logoutToLogin() {
  clearAuthentication();
  window.location.replace("login.html");
}

function initStandaloneLoginPage() {
  const nextUrl = new URLSearchParams(window.location.search).get("next") || "workspace.html";
  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");
  const submitButton = document.getElementById("login-submit-button");
  const feedback = document.getElementById("login-feedback");

  if (!usernameInput || !passwordInput || !submitButton) {
    return;
  }

  function setFeedback(message, type = "default") {
    if (!feedback) {
      return;
    }
    feedback.textContent = message;
    feedback.className = `login-feedback ${type}`;
  }

  function handleLogin() {
    const username = (usernameInput.value || "").trim();
    const password = (passwordInput.value || "").trim();

    if (!username || !password) {
      setFeedback("请输入账号和密码后再进入。", "error");
      return;
    }

    if (username !== FASHU_DEMO_USERNAME || password !== FASHU_DEMO_PASSWORD) {
      setFeedback(`测试账号错误，请使用账号 ${FASHU_DEMO_USERNAME}，密码 ${FASHU_DEMO_PASSWORD}。`, "error");
      return;
    }

    setFeedback("登录成功，正在进入法枢工作台...", "success");
    markAuthenticated();
    window.location.replace(buildTargetUrl(nextUrl, { auth: "ok" }));
  }

  submitButton.addEventListener("click", handleLogin);
  passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleLogin();
    }
  });
  usernameInput.addEventListener("input", () => setFeedback("请输入测试账号后登录。"));
  passwordInput.addEventListener("input", () => setFeedback("请输入测试账号后登录。"));
}

window.ensureIndexAccess = ensureIndexAccess;
window.ensureProtectedAccess = ensureProtectedAccess;
window.redirectIfAuthenticated = redirectIfAuthenticated;
window.initStandaloneLoginPage = initStandaloneLoginPage;
window.logoutToLogin = logoutToLogin;
window.isAuthenticated = isAuthenticated;
