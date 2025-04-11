document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('nameInput');
    const status = document.getElementById('status');
    const saveBtn = document.getElementById('saveBtn');
    chrome.storage.sync.get(['volunteerName'], (result) => {
        if (result.volunteerName) {
            input.value = result.volunteerName;
            status.textContent = `נשמר: ${result.volunteerName}`;
        }
    });
    saveBtn.addEventListener('click', () => {
        const name = input.value.trim();
        chrome.storage.sync.set({ volunteerName: name }, () => {
            status.textContent = `השם נשמר: ${name}`;
            input.value = name;
        });
    });
});
