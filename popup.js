document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('nameInput');
    const saveBtn = document.getElementById('saveBtn');
    const status = document.getElementById('status');

    function detectNameFromPage(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    func: () => {
                        const small = document.querySelector('.navbar-text small');
                        const text = small?.childNodes[0]?.textContent.trim();
                        const cleaned = text?.replace(/^(\S+\s+\S+\s+)/, '').trim();
                        return cleaned || null;
                    }
                },
                results => {
                    const nameFromPage = results?.[0]?.result || '';
                    if (nameFromPage) {
                        nameInput.value = nameFromPage;
                        saveName(nameFromPage, true);
                    } else {
                        status.textContent = 'לא הצלחנו לזהות שם מהדף 😕';
                    }

                    if (callback) callback(nameFromPage);
                    closePopup();
                }
            );
        });
    }
    function saveName(name, detected = false) {
        chrome.storage.sync.set({ volunteerName: name }, () => {
            status.textContent = detected
                ? 'השם זוהה מהדף ונשמר ✅'
                : 'השם נשמר בהצלחה!';

            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: (volunteerName) => {
                        if (typeof window.checkSchedule === 'function') {
                            window.checkSchedule(volunteerName);
                        }
                    },
                    args: [name]
                });
            });

            closePopup();
        });
    }

    chrome.storage.sync.get('volunteerName', ({ volunteerName }) => {
        if (volunteerName) {
            nameInput.value = volunteerName;
        } else {
            detectNameFromPage(() => {});
        }
    });

    saveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name) {
            saveName(name);
        } else {
            detectNameFromPage((nameFromPage) => {
                if (!nameFromPage) {
                    status.textContent = 'לא הוזן שם ולא ניתן היה לזהות אחד מהדף.';
                }
            });
        }
    });

    document.getElementById('remindBtn')?.addEventListener('click', () => {
        chrome.storage.sync.get('volunteerName', ({ volunteerName }) => {
            if (!volunteerName) return;
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: (name) => {
                        window.checkSchedule?.(name);
                    },
                    args: [volunteerName]
                });
                closePopup();
            });
        });
    });

    function closePopup() {
        setTimeout(() => window.close(), 500);
    }
});
