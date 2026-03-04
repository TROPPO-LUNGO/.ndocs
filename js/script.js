// script.js
(function () {
  const root = document.documentElement;
  const themeBtn = document.getElementById("toggleThemeBtn");
  const themeText = document.getElementById("themeText");
  const toast = document.getElementById("toast");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".panel"));
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  const glowBack = document.getElementById("cursorGlowBack");
  const glowCore = document.getElementById("cursorGlowCore");

  // =========================
  // Theme
  // =========================
  const savedTheme = localStorage.getItem("ops_theme");
  if (savedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
    themeText.textContent = "Gelap";
  } else {
    root.removeAttribute("data-theme");
    themeText.textContent = "Terang";
  }

  themeBtn.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
      localStorage.setItem("ops_theme", "light");
      themeText.textContent = "Terang";
      showToast("Tema terang aktif");
    } else {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("ops_theme", "dark");
      themeText.textContent = "Gelap";
      showToast("Tema gelap aktif");
    }
  });

  // =========================
  // Tabs
  // =========================
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabs.forEach((t) => {
        t.classList.toggle("active", t === btn);
        t.setAttribute("aria-selected", t === btn ? "true" : "false");
      });
      panels.forEach((p) => p.classList.toggle("show", p.dataset.panel === target));
      applySearch(searchInput.value.trim());
    });
  });

  // =========================
  // Copy buttons
  // =========================
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cmdBox = btn.closest(".cmd");
      const codeEl = cmdBox ? cmdBox.querySelector("pre code") : null;
      const toCopy = codeEl ? codeEl.textContent.trim() : "";

      try {
        await navigator.clipboard.writeText(toCopy);
        showToast("Disalin ke clipboard");
      } catch {
        showToast("Gagal copy (izin browser)");
      }
    });
  });

  // =========================
  // Search (filter + highlight)
  // =========================
  function applySearch(q) {
    const query = (q || "").toLowerCase();
    const activePanel = panels.find((p) => p.classList.contains("show"));
    if (!activePanel) return;

    // remove previous highlights
    activePanel.querySelectorAll("mark.__hl").forEach((m) => {
      m.replaceWith(document.createTextNode(m.textContent));
    });

    if (!query) {
      activePanel.querySelectorAll(".card, .step, .faq details, #servicesTable tbody tr").forEach((el) => {
        el.style.display = "";
      });
      return;
    }

    const filterTargets = activePanel.querySelectorAll(".card");
    filterTargets.forEach((card) => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query) ? "" : "none";
    });

    const rows = activePanel.querySelectorAll("#servicesTable tbody tr");
    rows.forEach((row) => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(query) ? "" : "none";
    });

    const walker = document.createTreeWalker(activePanel, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest(".toast")) return NodeFilter.FILTER_REJECT;
        if (parent.tagName === "SCRIPT" || parent.tagName === "STYLE") return NodeFilter.FILTER_REJECT;
        if (parent.closest(".card") && parent.closest(".card").style.display === "none") return NodeFilter.FILTER_REJECT;
        return node.nodeValue.toLowerCase().includes(query) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      const val = node.nodeValue;
      const idx = val.toLowerCase().indexOf(query);
      if (idx < 0) return;
      const before = document.createTextNode(val.slice(0, idx));
      const match = document.createElement("mark");
      match.className = "__hl";
      match.textContent = val.slice(idx, idx + query.length);
      const after = document.createTextNode(val.slice(idx + query.length));
      node.replaceWith(before, match, after);
    });
  }

  searchInput.addEventListener("input", (e) => applySearch(e.target.value.trim()));
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    applySearch("");
    showToast("Pencarian dibersihkan");
  });

  // =========================
  // Toast
  // =========================
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1200);
  }

  // =========================
  // Cursor Glow (smooth follow)
  // =========================
  if (glowBack && glowCore) {
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let backX = mouseX, backY = mouseY;
  let coreX = mouseX, coreY = mouseY;
  let visible = false;

  const show = () => {
    if (visible) return;
    glowBack.style.opacity = "1";
    glowCore.style.opacity = "1";
    visible = true;
  };
  const hide = () => {
    glowBack.style.opacity = "0";
    glowCore.style.opacity = "0";
    visible = false;
  };

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    show();
  }, { passive: true });

  window.addEventListener("mouseleave", hide);

  window.addEventListener("mousedown", () => {
    // pulse, tapi tetap di belakang konten
    glowCore.animate([
      { transform: "translate(-50%, -50%) scale(1)" },
      { transform: "translate(-50%, -50%) scale(1.28)" },
      { transform: "translate(-50%, -50%) scale(1)" }
    ], { duration: 220, easing: "ease-out" });
  });

  function tick() {
    // backlight lebih lambat (lebih smooth dan besar)
    backX += (mouseX - backX) * 0.10;
    backY += (mouseY - backY) * 0.10;

    // core lebih cepat (lebih responsif)
    coreX += (mouseX - coreX) * 0.22;
    coreY += (mouseY - coreY) * 0.22;

    glowBack.style.left = backX + "px";
    glowBack.style.top = backY + "px";

    glowCore.style.left = coreX + "px";
    glowCore.style.top = coreY + "px";

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
})();