"use strict";

// ======================================
// TypeFlow — Typing Speed Tester
// ======================================

const passages = [
    "Success is not always about greatness. It is about consistency. Consistent hard work leads to success. Greatness will come naturally when you keep moving forward and never stop learning from your mistakes.",

    "Programming is the art of solving problems through logical thinking. Every challenge teaches something new, and every mistake provides an opportunity to improve your understanding of the world around you.",

    "Technology continues to transform the way people learn, communicate, and work. Building useful applications requires creativity, patience, problem solving, and a willingness to experiment with new ideas.",

    "The secret to getting ahead is getting started. Small improvements made every day can create remarkable results over time. Focus on progress rather than perfection and celebrate every achievement.",

    "Learning a new skill takes time and practice. Stay curious, ask questions, explore different approaches, and never be afraid to make mistakes. Every expert was once a beginner who refused to give up.",

    "A great developer does more than write code. They understand problems, communicate clearly, collaborate with others, and build solutions that make life easier for the people who use their software.",

    "Reading expands your imagination and helps you understand different perspectives. A few pages each day can improve your vocabulary, strengthen your concentration, and introduce you to ideas you may never have considered.",

    "Discipline is choosing what matters most over what feels easiest in the moment. Build good habits, protect your time, and keep your attention on the goals that will make a difference in your future."
];

const STORAGE_KEY = "typeflow_personal_best";

const wpmElement = document.querySelector("#wpm");
const accuracyElement = document.querySelector("#accuracy");
const timeLeftElement = document.querySelector("#timeLeft");
const errorsElement = document.querySelector("#errors");

const passageElement = document.querySelector("#passage");
const passageContainer = document.querySelector("#passageContainer");
const typingInput = document.querySelector("#typingInput");

const testStatus = document.querySelector("#testStatus");
const restartButton = document.querySelector("#restartButton");
const newPassageButton = document.querySelector("#newPassageButton");
const tryAgainButton = document.querySelector("#tryAgainButton");

const resultsPanel = document.querySelector("#resultsPanel");
const finalWpmElement = document.querySelector("#finalWpm");
const finalAccuracyElement = document.querySelector("#finalAccuracy");
const finalErrorsElement = document.querySelector("#finalErrors");
const personalBestElement = document.querySelector("#personalBest");

const currentYearElement = document.querySelector("#currentYear");

const durationButtons = document.querySelectorAll(".duration-button");

let selectedDuration = 60;
let timeLeft = selectedDuration;
let timer = null;

let testStarted = false;
let testFinished = false;

let currentPassage = "";
let previousPassageIndex = -1;
let bestWpm = loadPersonalBest();


// ======================================
// Personal Best Storage
// ======================================

function loadPersonalBest() {
    try {
        const saved = Number(localStorage.getItem(STORAGE_KEY));

        return Number.isFinite(saved) && saved >= 0 ? saved : 0;
    } catch (error) {
        console.error("Unable to read personal best:", error);
        return 0;
    }
}

function savePersonalBest(value) {
    try {
        localStorage.setItem(STORAGE_KEY, String(value));
        return true;
    } catch (error) {
        console.error("Unable to save personal best:", error);
        return false;
    }
}


// ======================================
// Passage Selection
// ======================================

function choosePassage() {
    if (passages.length === 1) {
        return passages[0];
    }

    let index;

    do {
        index = Math.floor(Math.random() * passages.length);
    } while (index === previousPassageIndex);

    previousPassageIndex = index;

    return passages[index];
}

function renderPassage() {
    passageElement.replaceChildren();

    const fragment = document.createDocumentFragment();

    for (const character of currentPassage) {
        const span = document.createElement("span");

        span.textContent = character;

        fragment.append(span);
    }

    passageElement.append(fragment);

    updatePassageHighlight();
}


// ======================================
// Test Reset
// ======================================

function resetTest(newPassage = false) {
    clearInterval(timer);
    timer = null;

    testStarted = false;
    testFinished = false;

    timeLeft = selectedDuration;

    if (newPassage || !currentPassage) {
        currentPassage = choosePassage();
    }

    typingInput.value = "";
    typingInput.disabled = false;

    resultsPanel.hidden = true;

    wpmElement.textContent = "0";
    accuracyElement.textContent = "100%";
    timeLeftElement.textContent = String(timeLeft);
    errorsElement.textContent = "0";

    testStatus.textContent = "Click the typing area to begin.";

    renderPassage();

    typingInput.focus();
}


// ======================================
// Start Timer
// ======================================

function startTest() {
    if (testStarted || testFinished) {
        return;
    }

    testStarted = true;
    testStartTimestamp = Date.now();

    testStatus.textContent = "Test in progress...";

    const startedAt = Date.now();

    timer = setInterval(() => {
        const elapsedSeconds = Math.floor(
            (Date.now() - startedAt) / 1000
        );

        timeLeft = Math.max(
            0,
            selectedDuration - elapsedSeconds
        );

        timeLeftElement.textContent = String(timeLeft);

        updateStatistics();

        if (timeLeft <= 0) {
            finishTest();
        }
    }, 100);
}


// ======================================
// Calculate Typing Statistics
// ======================================

function calculateStatistics() {
    const typedText = typingInput.value;
    const typedLength = typedText.length;

    let correctCharacters = 0;
    let incorrectCharacters = 0;

    for (let index = 0; index < typedLength; index++) {
        if (typedText[index] === currentPassage[index]) {
            correctCharacters++;
        } else {
            incorrectCharacters++;
        }
    }

    const elapsedSeconds = testStarted
        ? Math.max(
            1,
            (Date.now() -
                (selectedDuration - timeLeft) * 1000 -
                performance.now()) / 1000
        )
        : 0;

    // Use the countdown for a stable elapsed-time calculation.
    const elapsed = Math.max(
        0,
        selectedDuration - timeLeft
    );

    const actualElapsed = testStarted
        ? Math.max(1, elapsed || (Date.now() - testStartTimestamp) / 1000)
        : 0;

    const wpm = actualElapsed > 0
        ? Math.round((correctCharacters / 5) / (actualElapsed / 60))
        : 0;

    const accuracy = typedLength > 0
        ? Math.round((correctCharacters / typedLength) * 100)
        : 100;

    return {
        typedLength,
        correctCharacters,
        incorrectCharacters,
        wpm,
        accuracy
    };
}

let testStartTimestamp = 0;


// ======================================
// Live Statistics
// ======================================

function updateStatistics() {
    const typedText = typingInput.value;

    let correctCharacters = 0;
    let incorrectCharacters = 0;

    for (let index = 0; index < typedText.length; index++) {
        if (typedText[index] === currentPassage[index]) {
            correctCharacters++;
        } else {
            incorrectCharacters++;
        }
    }

    const elapsedSeconds = testStarted
        ? Math.max(
            1,
            (Date.now() - testStartTimestamp) / 1000
        )
        : 0;

    const wpm = elapsedSeconds > 0
        ? Math.round(
            (correctCharacters / 5) / (elapsedSeconds / 60)
        )
        : 0;

    const accuracy = typedText.length > 0
        ? Math.round(
            (correctCharacters / typedText.length) * 100
        )
        : 100;

    wpmElement.textContent = String(wpm);
    accuracyElement.textContent = `${accuracy}%`;
    errorsElement.textContent = String(incorrectCharacters);

    updatePassageHighlight();
}


// ======================================
// Highlight Correct and Incorrect Text
// ======================================

function updatePassageHighlight() {
    const spans = passageElement.querySelectorAll("span");
    const typedText = typingInput.value;

    spans.forEach((span, index) => {
        span.classList.remove("correct", "incorrect", "current");

        if (index < typedText.length) {
            if (typedText[index] === currentPassage[index]) {
                span.classList.add("correct");
            } else {
                span.classList.add("incorrect");
            }
        }

        if (index === typedText.length && !testFinished) {
            span.classList.add("current");
        }
    });
}


// ======================================
// Finish Test
// ======================================

function finishTest() {
    if (testFinished) {
        return;
    }

    clearInterval(timer);
    timer = null;

    testFinished = true;
    testStarted = false;

    typingInput.disabled = true;

    const typedText = typingInput.value;

    let correctCharacters = 0;
    let incorrectCharacters = 0;

    for (let index = 0; index < typedText.length; index++) {
        if (typedText[index] === currentPassage[index]) {
            correctCharacters++;
        } else {
            incorrectCharacters++;
        }
    }

    const elapsedSeconds = Math.max(
        1,
        (Date.now() - testStartTimestamp) / 1000
    );

    const finalWpm = Math.round(
        (correctCharacters / 5) / (elapsedSeconds / 60)
    );

    const finalAccuracy = typedText.length > 0
        ? Math.round(
            (correctCharacters / typedText.length) * 100
        )
        : 100;

    const isNewRecord = finalWpm > bestWpm;

    if (isNewRecord) {
        bestWpm = finalWpm;
        savePersonalBest(bestWpm);
    }

    finalWpmElement.textContent = String(finalWpm);
    finalAccuracyElement.textContent = `${finalAccuracy}%`;
    finalErrorsElement.textContent = String(incorrectCharacters);

    personalBestElement.textContent = isNewRecord
        ? `New personal best: ${bestWpm} WPM!`
        : `Personal best: ${bestWpm} WPM`;

    testStatus.textContent = "Test completed!";

    resultsPanel.hidden = false;

    updatePassageHighlight();

    resultsPanel.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


// ======================================
// Input Handling
// ======================================

typingInput.addEventListener("focus", () => {
    if (!testStarted && !testFinished) {
        testStatus.textContent = "Start typing to begin the timer.";
    }
});

typingInput.addEventListener("input", () => {
    if (testFinished) {
        return;
    }

    if (typingInput.value.length > currentPassage.length) {
        typingInput.value = typingInput.value.slice(
            0,
            currentPassage.length
        );
    }

    if (!testStarted && typingInput.value.length > 0) {
        testStartTimestamp = Date.now();
        startTest();
    }

    updateStatistics();

    if (
        typingInput.value.length >= currentPassage.length
    ) {
        finishTest();
    }
});


// ======================================
// Duration Controls
// ======================================

durationButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const duration = Number(button.dataset.duration);

        if (![30, 60, 120].includes(duration)) {
            return;
        }

        selectedDuration = duration;

        durationButtons.forEach((item) => {
            item.classList.toggle(
                "active",
                item === button
            );
        });

        resetTest(false);
    });
});


// ======================================
// Buttons
// ======================================

restartButton.addEventListener("click", () => {
    resetTest(false);
});

newPassageButton.addEventListener("click", () => {
    resetTest(true);
});

tryAgainButton.addEventListener("click", () => {
    resetTest(false);
});

passageContainer.addEventListener("click", () => {
    if (!testFinished) {
        typingInput.focus();
    }
});


// ======================================
// Initialize
// ======================================

currentYearElement.textContent = String(
    new Date().getFullYear()
);

resetTest(true);