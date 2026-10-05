/* =========================================================
   Jeopardy — main script
   Requires: jQuery, Axios, Lodash (loaded in index.html)
   ========================================================= */

"use strict";

/* ---------- Config ---------- */
const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;
const API_BASE = "https://rithm-jeopardy.herokuapp.com/api";
const CATEGORY_FETCH_COUNT = 100; // how many to pull before sampling
const MAX_ATTEMPTS = 5; // retries to gather 6 usable categories

/* ---------- App State ---------- */
let categories = []; // [{ title, clues: [{question, answer, showing}] }, ...]

/* =========================================================
   API helpers
   ========================================================= */

/** Get random category IDs from the API. */
async function getCategoryIds() {
  const url = `${API_BASE}/categories?count=${CATEGORY_FETCH_COUNT}`;
  const res = await axios.get(url);
  const all = Array.isArray(res.data) ? res.data : [];

  // Pick more than we need (to survive filtering) then trim later
  const sampled = _.sampleSize(all, Math.min(all.length, NUM_CATEGORIES * 3));
  return sampled.map((c) => c.id);
}

/** Get full data for one category: { title, clues: [{question, answer, showing}] } */
async function getCategory(catId) {
  const url = `${API_BASE}/category?id=${catId}`;
  const res = await axios.get(url);
  const data = res.data || { title: "Unknown", clues: [] };

  // Clean clues (ensure both question and answer exist)
  const validClues = (Array.isArray(data.clues) ? data.clues : []).filter(
    (c) => c && c.question && c.answer
  );

  // Randomly pick up to the required number
  const chosen = _.sampleSize(
    validClues,
    Math.min(NUM_QUESTIONS_PER_CAT, validClues.length)
  );

  const clues = chosen.map((c) => ({
    // keep as-is so simple markup (e.g., <i>...</i>) can render
    question: String(c.question),
    answer: String(c.answer),
    showing: null,
  }));

  return { title: String(data.title || "Category"), clues };
}

/* =========================================================
   Rendering
   ========================================================= */

/** Build the board UI from global `categories`. */
function fillTable() {
  const $thead = $("#jeopardy thead").empty();
  const $tbody = $("#jeopardy tbody").empty();

  // ----- Header row: category titles -----
  const $trHead = $("<tr>");
  for (const cat of categories) {
    $trHead.append($("<th>").text(cat.title));
  }
  $thead.append($trHead);

  // ----- Body: 5 rows × 6 columns of "?" -----
  for (let r = 0; r < NUM_QUESTIONS_PER_CAT; r++) {
    const $tr = $("<tr>");
    for (let c = 0; c < categories.length; c++) {
      const $td = $("<td>")
        .text("?")
        .attr("data-cat-idx", c)
        .attr("data-clue-idx", r)
        .attr("tabindex", "0"); // keyboard focus
      $tr.append($td);
    }
    $tbody.append($tr);
  }
}

/* =========================================================
   Interaction
   ========================================================= */

/** On cell click: null -> question -> answer -> (stop) */
function handleClick(evt) {
  const $td = $(evt.currentTarget);
  const cIdx = Number($td.attr("data-cat-idx"));
  const qIdx = Number($td.attr("data-clue-idx"));
  const clue = categories?.[cIdx]?.clues?.[qIdx];
  if (!clue) return;

  if (clue.showing === null) {
    // show question
    clue.showing = "question";
    $td
      .html(clue.question) // use .html() so <i>...</i> renders
      .removeClass("cell-answer")
      .addClass("cell-question");
  } else if (clue.showing === "question") {
    // show answer
    clue.showing = "answer";
    $td
      .html(clue.answer) // use .html() for API-provided markup
      .removeClass("cell-question")
      .addClass("cell-answer");
  } else {
    // already showing answer -> ignore
  }
}

/** Keyboard accessibility: Enter/Space acts like click. */
function handleKeydown(evt) {
  if (evt.key === "Enter" || evt.key === " ") {
    evt.preventDefault();
    $(evt.currentTarget).trigger("click");
  }
}

/* =========================================================
   Loading UX
   ========================================================= */

function showLoadingView() {
  $("#jeopardy thead, #jeopardy tbody").empty();
  $("#restart").prop("disabled", true).text("Loading…");
  $("#loading").show().attr("aria-busy", "true");
}

function hideLoadingView() {
  $("#loading").hide().attr("aria-busy", "false");
  $("#restart").prop("disabled", false).text("Restart");
}

/* =========================================================
   Orchestration
   ========================================================= */

/** Fetch enough categories so each has at least 5 clues. */
async function gatherUsableCategories() {
  const result = [];
  let attempts = 0;

  while (result.length < NUM_CATEGORIES && attempts < MAX_ATTEMPTS) {
    attempts += 1;

    const ids = await getCategoryIds();
    const catObjs = await Promise.allSettled(ids.map(getCategory));

    for (const p of catObjs) {
      if (p.status !== "fulfilled") continue;
      const cat = p.value;
      const hasEnough = (cat.clues?.length || 0) >= NUM_QUESTIONS_PER_CAT;
      const duplicate = result.some((r) => r.title === cat.title);
      if (hasEnough && !duplicate) {
        result.push(cat);
        if (result.length === NUM_CATEGORIES) break;
      }
    }
  }

  return result;
}

/** Start / Restart the game. */
async function setupAndStart() {
  try {
    showLoadingView();
    categories = await gatherUsableCategories();

    if (categories.length < NUM_CATEGORIES) {
      throw new Error("Could not load enough categories. Try again.");
    }

    fillTable();
  } catch (err) {
    console.error(err);
    alert("Failed to load Jeopardy data. Please try again.");
  } finally {
    hideLoadingView();
  }
}

/* =========================================================
   Wiring (on page load)
   ========================================================= */

$(function () {
  $("#restart").on("click", setupAndStart);
  $("#jeopardy").on("click", "td", handleClick);
  $("#jeopardy").on("keydown", "td", handleKeydown);
});
