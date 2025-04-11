function showPopup(message) {
    const div = document.createElement('div');
    div.innerHTML = message;
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ffc;
        color: #333;
        padding: 15px;
        border: 1px solid #aaa;
        z-index: 10000;
        font-size: 16px;
        max-width: 300px;
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 10000);
}

function showNameInputPopup() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #ccc;
        padding: 20px;
        z-index: 10000;
        font-family: sans-serif;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        border-radius: 10px;
        text-align: center;
    `;

    wrapper.innerHTML = `
        <h3>הזן את שמך:</h3>
        <input id="volunteerNameInput" type="text" style="padding: 10px; width: 80%; font-size: 16px;" />
        <br><br>
        <button id="saveNameBtn" style="padding: 8px 16px; font-size: 16px;">שמור</button>
    `;

    document.body.appendChild(wrapper);

    document.getElementById('saveNameBtn').addEventListener('click', () => {
        const name = document.getElementById('volunteerNameInput').value.trim();
        if (name) {
            chrome.storage.sync.set({ volunteerName: name }, () => {
                showPopup("השם נשמר: " + name);
                wrapper.remove();
                checkSchedule(name);
            });
        }
    });
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
        const links = [...dates].map(date =>
            `<a href="#table_shifts" onclick="document.querySelector('[data-date=\\'${date}\\']').scrollIntoView({ behavior: 'smooth', block: 'center' })">${date}</a>`
        );
        showPopup(`יש לך משמרות עתידיות בתאריך:<br>${links.join('<br>')}`);
    }
}

chrome.storage.sync.get('volunteerName', ({ volunteerName }) => {
    if (!volunteerName) {
        showNameInputPopup();
    } else {
        checkSchedule(volunteerName);

        // מלא את ה-input אם קיים
        const interval = setInterval(() => {
            const input = document.getElementById('volunteerNameInput');
            if (input) {
                input.value = volunteerName;
                clearInterval(interval);
            }
        }, 200);
    }
});
