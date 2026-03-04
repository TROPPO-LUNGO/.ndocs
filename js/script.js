// script.js
(function () {
  const root = document.documentElement;
  const themeBtn = document.getElementById("toggleThemeBtn");
  const toast = document.getElementById("toast");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".panel"));
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  // Theme (default: light)
  const savedTheme = localStorage.getItem("ops_theme");
  if (savedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
    themeBtn.textContent = "Tema: Gelap";
  } else {
    root.removeAttribute("data-theme");
    themeBtn.textContent = "Tema: Terang";
  }

  themeBtn.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
      localStorage.setItem("ops_theme", "light");
      themeBtn.textContent = "Tema: Terang";
      showToast("Tema terang aktif");
    } else {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("ops_theme", "dark");
      themeBtn.textContent = "Tema: Gelap";
      showToast("Tema gelap aktif");
    }
  });

  // Tabs
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabs.forEach((t) => {
        t.classList.toggle("active", t === btn);
        t.setAttribute("aria-selected", t === btn ? "true" : "false");
      });
      panels.forEach((p) => p.classList.toggle("show", p.dataset.panel === target));
      // reset search highlight on tab switch
      applySearch(searchInput.value.trim());
    });
  });

  // Copy buttons
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cmdBox = btn.closest(".cmd");
      const text = cmdBox ? cmdBox.innerText.replace(/^Terminal\s*/i, "").trim() : "";
      // better: copy only code content if exists
      const codeEl = cmdBox ? cmdBox.querySelector("pre code") : null;
      const toCopy = codeEl ? codeEl.textContent.trim() : text;

      try {
        await navigator.clipboard.writeText(toCopy);
        showToast("Disalin ke clipboard");
      } catch {
        showToast("Gagal copy (izin browser)");
      }
    });
  });

  // Search (filter + highlight)
  function applySearch(q) {
    const query = (q || "").toLowerCase();
    const activePanel = panels.find((p) => p.classList.contains("show"));
    if (!activePanel) return;

    // remove previous highlights
    activePanel.querySelectorAll("mark.__hl").forEach((m) => {
      const txt = document.createTextNode(m.textContent);
      m.replaceWith(txt);
    });

    // show everything if empty
    if (!query) {
      activePanel.querySelectorAll(".card, .step, .faq details, #servicesTable tbody tr").forEach((el) => {
        el.style.display = "";
      });
      return;
    }

    // elements to filter
    const filterTargets = activePanel.querySelectorAll(".card");
    filterTargets.forEach((card) => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query) ? "" : "none";
    });

    // additionally filter rows in services table (advanced)
    const rows = activePanel.querySelectorAll("#servicesTable tbody tr");
    rows.forEach((row) => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(query) ? "" : "none";
    });

    // highlight matches in visible area only
    const walker = document.createTreeWalker(activePanel, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        // skip scripts/styles/code blocks? keep code highlight allowed
        if (parent.closest(".toast")) return NodeFilter.FILTER_REJECT;
        if (parent.tagName === "SCRIPT" || parent.tagName === "STYLE") return NodeFilter.FILTER_REJECT;
        // ignore hidden cards
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

  // Toast
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1200);
  }

  // Set status pill (manual)
  const statusText = document.getElementById("statusText");
  statusText.textContent = "dokumen";

})();