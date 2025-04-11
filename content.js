function showPopup(message) {
    document.querySelectorAll('.mada-popup').forEach(p => p.remove());
    const div = document.createElement('div');
    div.className = 'mada-popup';
    div.innerHTML = `
        <div style="position: relative;">
            <button id="closePopupBtn" style="
                position: absolute;
                top: -15px;
                left: -15px;
                background: transparent;
                color: #333;
                border: none;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
            ">×</button>
            <div style="padding-left: 25px;">${message}</div>
        </div>
    `;
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ffc;
        color: #333;
        padding: 15px 20px;
        border: 1px solid #aaa;
        z-index: 10000;
        font-size: 16px;
        max-width: 300px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(div);

    document.getElementById('closePopupBtn').addEventListener('click', () => div.remove());

    setTimeout(() => {
        if (document.body.contains(div)) div.remove();
    }, 15000);
}

function extractNameFromSmallTag() {
    const smallTag = document.querySelector('.navbar-text small');
    if (smallTag) {
        const text = smallTag.textContent.trim();
        return text.replace(/^(\S+\s+){2}/, '').trim();
    }
    return '';
}

function checkSchedule(volunteerName) {
    const links = document.querySelectorAll('#table_shifts td a');
    const dates = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    links.forEach(link => {
        const nameInCell = link.textContent.trim();
        if (nameInCell.includes(volunteerName)) {
            const dateStr = link.getAttribute('data-date');
            if (dateStr) {
                const dateObj = new Date(dateStr);
                if (dateObj >= today) {
                    dates.add(dateStr);
                }
            }
        }
    });

    if (dates.size > 0) {
        const dateLinks = [...dates].map(date =>
            `<a href="#table_shifts" onclick="document.querySelector('[data-date=\\'${date}\\']').scrollIntoView({ behavior: 'smooth', block: 'center' })">${date}</a>`
        );
        showPopup(`יש לך משמרות עתידיות בתאריך:<br>${dateLinks.join('<br>')}`);
    }
}

chrome.storage.sync.get('volunteerName', ({ volunteerName }) => {
    if (!volunteerName) {
        const extracted = extractNameFromSmallTag();
        if (extracted) {
            chrome.storage.sync.set({ volunteerName: extracted }, () => {
                showPopup("השם זוהה אוטומטית ונשמר: " + extracted);
                checkSchedule(extracted);
            });
        }
    } else {
        checkSchedule(volunteerName);
        const interval = setInterval(() => {
            const input = document.getElementById('volunteerNameInput');
            if (input) {
                input.value = volunteerName;
                clearInterval(interval);
            }
        }, 200);
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.volunteerName) {
        const newName = changes.volunteerName.newValue;
        if (newName) {
            showPopup("השם התעדכן: " + newName);
            checkSchedule(newName);
        }
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        chrome.storage.sync.get('volunteerName', ({ volunteerName }) => {
            if (volunteerName) {
                checkSchedule(volunteerName);
            }
        });
    }
});
