// ==UserScript==
// @name         Ollama Custom Install Button
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Adds a custom Install button to Ollama model lists with a Pull/Run modal
// @author       codesft
// @match        https://ollama.com/*
// @icon         https://ollama.com/public/icon-32x32.png
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
        .om-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.4); z-index: 10000;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(3px);
            opacity: 0; animation: fadeIn 0.2s forwards;
        }

        .om-modal {
            background: white; padding: 24px; border-radius: 12px;
            width: 500px; max-width: 90%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            font-family: inherit; border: 1px solid #e5e5e5;
            transform: scale(0.95); animation: scaleUp 0.2s forwards;
        }

        .om-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .om-title { font-size: 1.25rem; font-weight: 600; color: #171717; }

        .om-section { margin-bottom: 20px; }
        .om-label {
            font-size: 0.75rem; font-weight: 700; color: #525252;
            text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: block;
        }

        .om-code-box {
            display: flex; align-items: stretch;
            background: #f5f5f5; border: 1px solid #e5e5e5; border-radius: 6px;
            overflow: hidden; transition: border-color 0.2s;
        }
        .om-code-box:hover { border-color: #d4d4d4; }

        .om-code {
            flex-grow: 1; padding: 12px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.9rem; color: #262626; overflow-x: auto; white-space: nowrap;
        }

        .om-copy-btn {
            background: white; border: none; border-left: 1px solid #e5e5e5;
            padding: 0 16px; cursor: pointer; color: #525252; font-weight: 500; font-size: 0.875rem;
            transition: all 0.2s;
        }
        .om-copy-btn:hover { background: #fafafa; color: #000; }
        .om-copy-btn:active { background: #f0f0f0; }

        .om-close-btn {
            width: 100%; padding: 10px; border-radius: 6px;
            background: #171717; color: white; border: none;
            font-weight: 500; cursor: pointer; transition: background 0.2s;
        }
        .om-close-btn:hover { background: #404040; }

        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes scaleUp { to { transform: scale(1); } }
    `;
    document.head.appendChild(style);

    function openInstallModal(modelName) {
        document.body.style.overflow = 'hidden';

        const overlay = document.createElement('div');
        overlay.className = 'om-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'om-modal';

        const cmdPull = `ollama pull ${modelName}`;
        const cmdRun = `ollama run ${modelName}`;

        modal.innerHTML = `
            <div class="om-header">
                <div class="om-title">Install ${modelName}</div>
            </div>

            <!-- Pull Command -->
            <div class="om-section">
                <div class="om-code-box">
                    <div class="om-code">${cmdPull}</div>
                    <button class="om-copy-btn" data-clipboard-text="${cmdPull}">Copy</button>
                </div>
            </div>

            <!-- Run Command -->
            <div class="om-section">
                <div class="om-code-box">
                    <div class="om-code">${cmdRun}</div>
                    <button class="om-copy-btn" data-clipboard-text="${cmdRun}">Copy</button>
                </div>
            </div>

            <button class="om-close-btn">Close</button>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      
        const closeModal = () => {
            document.body.style.overflow = '';
            overlay.remove();
        };

        overlay.addEventListener('click', (e) => {
            if(e.target === overlay) closeModal();
        });

        modal.querySelector('.om-close-btn').addEventListener('click', closeModal);

        modal.querySelectorAll('.om-copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-clipboard-text');
                navigator.clipboard.writeText(text).then(() => {
                    const original = btn.innerText;
                    btn.innerText = "Copied!";
                    btn.style.color = "#16a34a";
                    setTimeout(() => {
                        btn.innerText = original;
                        btn.style.color = "";
                    }, 2000);
                });
            });
        });
    }


    function addInstallButtons() {
        const rows = document.querySelectorAll('.group.px-4.py-3.sm\\:grid.sm\\:grid-cols-12');

        rows.forEach(row => {
            if (row.dataset.installBtnAdded) return;

            const nameContainer = row.querySelector('span.col-span-6');
            if (!nameContainer) return;
        
            const input = row.querySelector('input.command');
            const modelName = input ? input.value : null;

            if (modelName) {
                const btn = document.createElement('button');
                btn.title = "Open Install Options";

                btn.className = 'hidden group-hover:inline-flex ml-2 text-neutral-500 hover:text-blue-600 items-center transition-colors';

                btn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px; height:18px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                `;

                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openInstallModal(modelName);
                };


                nameContainer.appendChild(btn);
                row.dataset.installBtnAdded = 'true';
            }
        });
    }

    addInstallButtons();

    const observer = new MutationObserver((mutations) => {
        addInstallButtons();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
