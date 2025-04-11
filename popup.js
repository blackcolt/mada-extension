document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('nameInput');
    const saveBtn = document.getElementById('saveBtn');
    const status = document.getElementById('status');

    function detectNameFromPage(callback) {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.scripting.executeScript(
                {
                    target: {tabId: tabs[0].id},
                    func: () => {
                        const small = document.querySelector('.navbar-text small');
                        if (!small) return null;
                        const text = small.childNodes[0]?.textContent.trim();
                        const match = text?.match(/לילה טוב (.+)/);
                        return match && match[1] ? match[1].trim() : null;
                    }
                },
                results => {
                    const nameFromPage = results?.[0]?.result || '';
                    if (nameFromPage) {
                        nameInput.value = nameFromPage;
                        chrome.storage.sync.set({volunteerName: nameFromPage});
                        status.textContent = 'השם זוהה מהדף ונשמר ✅';
                    } else {
                        status.textContent = 'לא הצלחנו לזהות שם מהדף 😕';
                    }
                    if (callback) callback(nameFromPage);
                    closePopup();
                }
            );
        });
    }

    chrome.storage.sync.get('volunteerName', ({volunteerName}) => {
        if (volunteerName) {
            nameInput.value = volunteerName;
        } else {
            detectNameFromPage(() => {
            });
        }
    });

    saveBtn.addEventListener('click', () => {
        let name = nameInput.value.trim();
        if (!name) {
            detectNameFromPage((nameFromPage) => {
                if (!nameFromPage) {
                    status.textContent = 'לא הוזן שם ולא ניתן היה לזהות אחד מהדף.';
                }
            });
            return;
        }

        chrome.storage.sync.set({volunteerName: name}, () => {
            status.textContent = 'השם נשמר בהצלחה!';
            chrome.storage.sync.set({volunteerName: name}, () => {
                status.textContent = 'השם נשמר בהצלחה!';
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    chrome.scripting.executeScript({
                        target: {tabId: tabs[0].id},
                        func: (volunteerName) => {
                            if (typeof window.checkSchedule === 'function') {
                                window.checkSchedule(volunteerName);
                            }
                        },
                        args: [name],
                    });
                });
                closePopup();
            });
        });
    });
});
document.getElementById('remindBtn').addEventListener('click', () => {
    chrome.storage.sync.get('volunteerName', ({volunteerName}) => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                func: (name) => {
                    window.checkSchedule?.(name);
                },
                args: [volunteerName],
            });
            closePopup();
        });
    });
});

const closePopup = () => {
    setInterval(() => {
        window.close();
    }, 500);
}
