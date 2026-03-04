// ==UserScript==
// @name         Ollama VRAM Checker (Customizable)
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Shows recommended VRAM. customizable GPU limit via the extension menu.
// @author       codesft
// @match        https://ollama.com/*
// @icon         https://ollama.com/public/icon-32x32.png
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  const CONTEXT_OVERHEAD = 1.2; // 20% buffer

  let userVramLimit = parseFloat(GM_getValue('gpu_vram_gb', 0));

  GM_registerMenuCommand("Set GPU VRAM Limit (GB)", () => {
    const input = prompt(
      "Enter your GPU VRAM in GB",
      userVramLimit
    );

    if (input !== null) {
      const val = parseFloat(input);
      if (!isNaN(val) && val >= 0) {
        GM_setValue('gpu_vram_gb', val);
        userVramLimit = val;
        alert(`VRAM limit set to ${val}GB. Reloading page...`);
        location.reload();
      } else {
        alert("Invalid number. Please enter a valid number (e.g., 12, 16, 24).");
      }
    }
  });
  function parseSize(sizeStr) {
    const cleanStr = sizeStr.trim().toUpperCase();
    let val = parseFloat(cleanStr);

    if (cleanStr.includes('GB')) {
      return val;
    } else if (cleanStr.includes('MB')) {
      return val / 1024;
    }
    return 0;
  }

  function formatVRAM(gb) {
    return gb < 1 ? `${(gb * 1024).toFixed(0)}MB` : `${gb.toFixed(1)}GB`;
  }

  function addVramChips() {
    const rows = document.querySelectorAll(
      '.group.px-4.py-3.sm\\:grid.sm\\:grid-cols-12'
    );

    rows.forEach((row) => {
      if (row.dataset.vramProcessed) return;

      const nameContainer = row.querySelector('span.col-span-6');
      const pTags = row.querySelectorAll('p.col-span-2');
      const sizeTag = pTags[0];

      if (nameContainer && sizeTag) {
        const sizeText = sizeTag.innerText;
        const requiredGB = parseSize(sizeText);

        if (requiredGB > 0) {
          const recommendedGB = requiredGB * CONTEXT_OVERHEAD;

          let chipClass = 'ml-2 inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10';

          if (userVramLimit > 0 && recommendedGB > userVramLimit) {
             chipClass = 'ml-2 inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10';
          }

          const chip = document.createElement('span');
          chip.className = chipClass;
          chip.style.whiteSpace = 'nowrap';
          chip.title = `Weights: ${requiredGB.toFixed(1)}GB | Buffer: ~20%`;
          chip.innerText = `VRAM: ${formatVRAM(recommendedGB)}`;

          nameContainer.appendChild(chip);
          row.dataset.vramProcessed = 'true';
        }
      }
    });
  }

  addVramChips();

  const observer = new MutationObserver((mutations) => {
    addVramChips();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
