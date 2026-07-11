const assetVersion = "20260712-0113";

const puzzleImages = [
  {
    src: "hapiba-01.webp",
    caption: "画像 1",
  },
  {
    src: "hapiba-02.webp",
    caption: "画像 2",
  },
  {
    src: "hapiba-03.webp",
    caption: "画像 3",
  },
  {
    src: "hapiba-04.webp",
    caption: "画像 4",
  },
  {
    src: "hapiba-05.webp",
    caption: "画像 5",
  },
];

const correctCode = "6N8Y5ABXAAMI2BR";
const successImageSrc = "clear.webp";

const puzzleGrid = document.getElementById("puzzleGrid");
const answerSection = document.getElementById("answerSection");
const answerPlaceholder = document.getElementById("answerPlaceholder");
const answerForm = document.getElementById("answerForm");
const codeEntry = document.querySelector(".code-entry");
const codeGrid = document.getElementById("codeGrid");
const codeInput = document.getElementById("codeInput");
const clearModal = document.getElementById("clearModal");
const clearModalClose = document.getElementById("clearModalClose");
const clearImage = document.getElementById("clearImage");
const clearFallback = document.getElementById("clearFallback");

puzzleImages.forEach((item, index) => {
  const card = document.createElement("article");
  card.className = "puzzle-card";

  const media = item.src
    ? createImage(item.src, item.caption)
    : createPlaceholder(index + 1);

  card.append(media);
  puzzleGrid.append(card);
});

const codeCells = Array.from({ length: correctCode.length }, (_, index) => {
  const cell = document.createElement("span");
  cell.className = "code-cell";
  cell.setAttribute("aria-label", `${index + 1}文字目`);

  codeGrid.append(cell);
  return cell;
});

const codeSlots = Array.from({ length: correctCode.length }, () => "");
const codeStatuses = Array.from({ length: correctCode.length }, () => "");
const lockedCodeSlots = Array.from({ length: correctCode.length }, () => false);
let activeCodeIndex = 0;
let hasJudged = false;
let showWrongStatuses = false;
let composingCode = "";

codeInput.addEventListener("pointerdown", handleCodePointerDown);
codeInput.addEventListener("beforeinput", handleCodeBeforeInput);
codeInput.addEventListener("input", handleCodeInput);
codeInput.addEventListener("compositionstart", handleCodeCompositionStart);
codeInput.addEventListener("compositionupdate", handleCodeCompositionUpdate);
codeInput.addEventListener("compositionend", handleCodeInput);
codeInput.addEventListener("keydown", handleCodeKeydown);
codeInput.addEventListener("paste", handleCodePaste);
codeInput.addEventListener("focus", handleCodeFocus);
codeInput.addEventListener("blur", handleCodeBlur);
codeEntry.addEventListener("click", focusCodeInput);

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  judgeAnswer();
});

let answerSectionTop = 0;

setAnswerSectionTop();
updateFixedViewportOffset();
updateAnswerPosition();

window.addEventListener("scroll", handleViewportScroll, { passive: true });
window.addEventListener("resize", handleViewportResize);
window.addEventListener("load", () => {
  setAnswerSectionTop();
  updateFixedViewportOffset();
  updateAnswerPosition();
});

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleVisualViewportChange);
  window.visualViewport.addEventListener("scroll", handleVisualViewportChange);
}

function createImage(src, alt) {
  const img = document.createElement("img");
  img.className = "puzzle-card__image";
  img.src = assetUrl(src);
  img.alt = alt;
  return img;
}

function setAnswerSectionTop() {
  const wasFixed = answerSection.classList.contains("is-fixed");

  if (wasFixed) {
    answerSection.classList.remove("is-fixed");
    answerPlaceholder.hidden = true;
  }

  answerSectionTop = answerSection.getBoundingClientRect().top + window.scrollY;
  answerPlaceholder.style.height = `${answerSection.offsetHeight + 22}px`;

  if (wasFixed) {
    updateAnswerPosition();
  }
}

function updateAnswerPosition() {
  const keepFixedForInput = isCodeInputActive() && answerSection.classList.contains("is-fixed");
  const shouldFix = keepFixedForInput || window.scrollY >= answerSectionTop;
  answerSection.classList.toggle("is-fixed", shouldFix);
  answerPlaceholder.hidden = !shouldFix;
}

function handleViewportScroll() {
  updateFixedViewportOffset();
  updateAnswerPosition();
}

function handleViewportResize() {
  updateFixedViewportOffset();

  if (!isCodeInputActive()) {
    setAnswerSectionTop();
  }

  updateAnswerPosition();
}

function handleVisualViewportChange() {
  updateFixedViewportOffset();
  updateAnswerPosition();
}

function updateFixedViewportOffset() {
  const viewportTop = window.visualViewport ? window.visualViewport.offsetTop : 0;
  answerSection.style.setProperty("--answer-fixed-top", `${Math.max(0, viewportTop)}px`);
}

function isCodeInputActive() {
  return document.activeElement === codeInput;
}

function createPlaceholder(number) {
  const placeholder = document.createElement("div");
  placeholder.className = "puzzle-card__placeholder";
  placeholder.textContent = `画像 ${number} を追加`;
  return placeholder;
}

function handleCodePointerDown(event) {
  event.preventDefault();
  showWrongStatuses = false;
  activeCodeIndex = getEditableCodeIndex(getCodeIndexFromPoint(event.clientX, event.clientY));
  focusCodeInput();
  renderCodeCells();
}

function handleCodeBeforeInput(event) {
  if (event.isComposing) {
    return;
  }

  if (event.inputType && event.inputType.startsWith("delete")) {
    event.preventDefault();
    showWrongStatuses = false;
    deleteSelectedCode(event.inputType);
    return;
  }

  if (!event.data || event.inputType === "insertFromPaste") {
    return;
  }

  const value = normalizeCode(event.data);

  if (!value) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  insertCodeCharacters(value);
}

function handleCodeInput(event) {
  if (event.isComposing) {
    showWrongStatuses = false;
    updateComposingCode(codeInput.value);
    return;
  }

  const value = normalizeCode(codeInput.value || event.data || "");
  showWrongStatuses = false;
  composingCode = "";

  if (value) {
    insertCodeCharacters(value);
    return;
  }

  codeInput.value = "";
  renderCodeCells();
}

function handleCodeCompositionStart() {
  showWrongStatuses = false;
  composingCode = "";
  renderCodeCells();
}

function handleCodeCompositionUpdate(event) {
  updateComposingCode(event.data || codeInput.value);
}

function handleCodeKeydown(event) {
  if (event.isComposing) {
    showWrongStatuses = false;
    updateComposingCode(codeInput.value);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    judgeAnswer();
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete") {
    event.preventDefault();
    deleteSelectedCode(event.key === "Delete" ? "deleteContentForward" : "deleteContentBackward");
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    const previousIndex = findPreviousEditableIndex(activeCodeIndex - 1);
    activeCodeIndex = previousIndex === -1 ? activeCodeIndex : previousIndex;
    renderCodeCells();
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    const nextIndex = findNextEditableIndex(activeCodeIndex + 1);
    activeCodeIndex = nextIndex === -1 ? correctCode.length : nextIndex;
    renderCodeCells();
  }
}

function handleCodePaste(event) {
  event.preventDefault();
  showWrongStatuses = false;
  insertCodeCharacters(event.clipboardData.getData("text"));
}

function handleCodeFocus() {
  showWrongStatuses = false;
  updateFixedViewportOffset();
  updateAnswerPosition();
  renderCodeCells();
}

function handleCodeBlur() {
  updateFixedViewportOffset();
  updateAnswerPosition();
  renderCodeCells();
}

function focusCodeInput() {
  try {
    codeInput.focus({ preventScroll: true });
  } catch (_) {
    codeInput.focus();
  }
}

function judgeAnswer() {
  hasJudged = true;
  showWrongStatuses = true;
  const isPerfect = codeSlots.every((character, index) => character === correctCode[index]);

  codeSlots.forEach((character, index) => {
    codeStatuses[index] = character === correctCode[index] ? "correct" : "wrong";
    lockedCodeSlots[index] = character === correctCode[index];
  });
  renderCodeCells();

  if (isPerfect) {
    showSuccessImage();
  }
}

function showSuccessImage() {
  clearImage.hidden = true;
  clearFallback.hidden = true;
  clearModal.hidden = false;

  const image = new Image();
  image.onload = () => {
    clearImage.src = assetUrl(successImageSrc);
    clearImage.hidden = false;
  };
  image.onerror = () => {
    clearFallback.hidden = false;
  };
  image.src = assetUrl(successImageSrc);
}

clearModalClose.addEventListener("click", closeClearModal);

clearModal.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-modal")) {
    closeClearModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !clearModal.hidden) {
    closeClearModal();
  }
});

function closeClearModal() {
  clearModal.hidden = true;
}

function insertCodeCharacters(value) {
  const characters = normalizeCode(value).split("");
  composingCode = "";

  characters.forEach((character) => {
    const targetIndex = findNextEditableIndex(activeCodeIndex);

    if (targetIndex === -1) {
      return;
    }

    activeCodeIndex = targetIndex;

    if (setCodeSlot(activeCodeIndex, character)) {
      const nextIndex = findNextEditableIndex(activeCodeIndex + 1);
      activeCodeIndex = nextIndex === -1 ? correctCode.length : nextIndex;
    }
  });

  activeCodeIndex = Math.min(activeCodeIndex, correctCode.length);
  codeInput.value = "";
  renderCodeCells();
}

function deleteSelectedCode(inputType) {
  composingCode = "";

  if (inputType === "deleteContentForward") {
    const targetIndex = findNextEditableIndex(activeCodeIndex);

    if (targetIndex !== -1) {
      activeCodeIndex = targetIndex;
      setCodeSlot(targetIndex, "");
    }

    renderCodeCells();
    return;
  }

  const targetIndex = activeCodeIndex === correctCode.length ? correctCode.length - 1 : activeCodeIndex;
  const editableTargetIndex = getEditableCodeIndex(targetIndex);

  if (editableTargetIndex !== -1 && codeSlots[editableTargetIndex]) {
    activeCodeIndex = editableTargetIndex;
    setCodeSlot(activeCodeIndex, "");
  } else {
    const previousIndex = findPreviousEditableIndex(targetIndex - 1);

    if (previousIndex !== -1) {
      activeCodeIndex = previousIndex;
      setCodeSlot(activeCodeIndex, "");
    }
  }

  renderCodeCells();
}

function setCodeSlot(index, character) {
  if (isLockedCodeIndex(index)) {
    return false;
  }

  const nextCharacter = normalizeCode(character).slice(0, 1);

  if (codeSlots[index] === nextCharacter) {
    return true;
  }

  codeSlots[index] = nextCharacter;

  if (!hasJudged) {
    codeStatuses[index] = "";
    return true;
  }

  codeStatuses[index] = nextCharacter === correctCode[index] ? "correct" : "wrong";
  lockedCodeSlots[index] = nextCharacter === correctCode[index];
  return true;
}

function isLockedCodeIndex(index) {
  return index >= 0 && index < correctCode.length && lockedCodeSlots[index];
}

function findNextEditableIndex(startIndex) {
  for (let index = Math.max(0, startIndex); index < correctCode.length; index += 1) {
    if (!isLockedCodeIndex(index)) {
      return index;
    }
  }

  return -1;
}

function findPreviousEditableIndex(startIndex) {
  for (let index = Math.min(startIndex, correctCode.length - 1); index >= 0; index -= 1) {
    if (!isLockedCodeIndex(index)) {
      return index;
    }
  }

  return -1;
}

function getEditableCodeIndex(index) {
  if (index < 0) {
    return -1;
  }

  if (index >= correctCode.length) {
    return findPreviousEditableIndex(correctCode.length - 1);
  }

  if (!isLockedCodeIndex(index)) {
    return index;
  }

  const nextIndex = findNextEditableIndex(index + 1);

  if (nextIndex !== -1) {
    return nextIndex;
  }

  return findPreviousEditableIndex(index - 1);
}

function getCodeIndexFromPoint(x, y) {
  let closestIndex = 0;
  let closestDistance = Infinity;

  codeCells.forEach((cell, index) => {
    const rect = cell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(centerX - x, centerY - y);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function renderCodeCells() {
  const composingCharactersByIndex = getComposingCharactersByIndex();
  const lastComposingIndex = getLastComposingIndex(composingCharactersByIndex);
  const visibleActiveIndex = lastComposingIndex === -1
    ? Math.min(activeCodeIndex, correctCode.length - 1)
    : lastComposingIndex;

  codeCells.forEach((cell, index) => {
    const isComposingCell = composingCharactersByIndex.has(index);
    const visibleCharacter = isComposingCell ? composingCharactersByIndex.get(index) : codeSlots[index];
    const isCorrectCell = hasJudged && visibleCharacter === correctCode[index];

    cell.textContent = visibleCharacter;
    cell.classList.toggle("is-composing", isComposingCell);
    cell.classList.toggle("is-correct", isCorrectCell);
    cell.classList.toggle(
      "is-wrong",
      showWrongStatuses && !isComposingCell && !isCorrectCell && codeStatuses[index] === "wrong",
    );
    cell.classList.toggle("is-active", document.activeElement === codeInput && index === visibleActiveIndex);
  });
}

function updateComposingCode(value) {
  composingCode = normalizeCode(value);
  renderCodeCells();
}

function getComposingCharactersByIndex() {
  const composingCharactersByIndex = new Map();
  let searchIndex = activeCodeIndex;

  composingCode.split("").forEach((character) => {
    const targetIndex = findNextEditableIndex(searchIndex);

    if (targetIndex === -1) {
      return;
    }

    composingCharactersByIndex.set(targetIndex, character);
    searchIndex = targetIndex + 1;
  });

  return composingCharactersByIndex;
}

function getLastComposingIndex(composingCharactersByIndex) {
  let lastIndex = -1;

  composingCharactersByIndex.forEach((_, index) => {
    lastIndex = index;
  });

  return lastIndex;
}

function normalizeCode(value) {
  return value.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function assetUrl(src) {
  return `${src}?v=${assetVersion}`;
}
