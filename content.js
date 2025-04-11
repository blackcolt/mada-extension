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
    const small = document.querySelector('.navbar-text small');
    const text = small?.childNodes[0]?.textContent.trim();
    const cleaned = text?.replace(/^(\S+\s+\S+\s+)/, '').trim();
    return cleaned || null;
}

function checkSchedule(volunteerName) {
    const links = document.querySelectorAll('#table_shifts td a');
    const today = new Date();
    const futureDates = new Set();

    today.setHours(0, 0, 0, 0);

    links.forEach(link => {
        const cellName = link.textContent.trim();
        const dateStr = link.getAttribute('data-date');
        if (cellName.includes(volunteerName) && dateStr) {
            if (new Date(dateStr) >= today)
                futureDates.add(dateStr);
        }
    });
    if (futureDates.size > 0) {
        const dateLinks = [...futureDates].map(date =>
            `<a href="#table_shifts" onclick="document.querySelector('[data-date=\\'${date}\\']').scrollIntoView({ behavior: 'smooth', block: 'center' })">${date}</a>`
        );
        showPopup(`יש לך משמרות עתידיות בתאריך:<br>${dateLinks.join('<br>')}`);
    }
}

chrome.storage.sync.get('volunteerName', ({ volunteerName }) => {
    if (volunteerName) {
        checkSchedule(volunteerName);
    } else {
        const extractedName = extractNameFromSmallTag();
        if (extractedName) {
            chrome.storage.sync.set({ volunteerName: extractedName }, () => {
                showPopup(`השם זוהה אוטומטית ונשמר: ${extractedName}`);
                checkSchedule(extractedName);
            });
        }
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
