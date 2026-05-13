import { validators } from "../utils/validators.js";
import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";
import { booksService } from "../services/booksService.js";
import { ReviewsService } from "../services/reviewsService.js";

let selectedValue = 0;
let isDraftMode = false;
let bookId = null;

const form = domHelper.query(".review-form");
const submitBtn = domHelper.query(".primary-btn");
const draftBtn = domHelper.query(".secondary-btn");
const stars = domHelper.queryAll(".rating span");

function setActiveButton(active) {
  if (!submitBtn || !draftBtn) return;
  if (active === "draft") {
    isDraftMode = true;
    submitBtn.classList.remove("active-btn");
    submitBtn.classList.add("inactive-btn");
    draftBtn.classList.remove("inactive-btn");
    draftBtn.classList.add("active-btn");
  } else {
    isDraftMode = false;
    draftBtn.classList.remove("active-btn");
    draftBtn.classList.add("inactive-btn");
    submitBtn.classList.remove("inactive-btn");
    submitBtn.classList.add("active-btn");
  }
}

setActiveButton("submit");

if (draftBtn) {
  domHelper.on(draftBtn, "click", () => {
    setActiveButton("draft");
  });
}

if (submitBtn) {
  domHelper.on(submitBtn, "click", () => {
    setActiveButton("submit");
  });
}

stars.forEach((star) => {
  domHelper.on(star, "click", () => {
    selectedValue = Number(star.dataset.value);
    stars.forEach((s) => domHelper.removeClass(s, "active"));
    stars.forEach((s) => {
      if (Number(s.dataset.value) <= selectedValue) {
        domHelper.addClass(s, "active");
      }
    });
  });
});

const textarea = domHelper.query("#critique");
const counter = domHelper.query("#counter");

if (textarea && counter) {
  domHelper.on(textarea, "input", () => {
    const words = textarea.value.trim().split(/\s+/).filter((w) => w.length > 0);
    counter.textContent = `${words.length} / 2000 words`;
  });
}

async function loadBookPanel() {
  const params = new URLSearchParams(window.location.search);
  bookId = params.get("bookId") || params.get("id");
  if (!bookId) {
    return;
  }
  try {
    const book = await booksService.getBookById(bookId);
    const titleEl = document.querySelector(".book-panel .book-info h3");
    const authorEl = document.querySelector(".book-panel .author-year");
    const imgEl = document.querySelector(".book-panel .book-image");
    if (titleEl) titleEl.textContent = book.title || "Book";
    if (authorEl) authorEl.textContent = `${book.author || ""} • ${book.year || ""}`;
    if (imgEl && book.cover) imgEl.src = book.cover;
  } catch (e) {
    console.warn("Could not load book for review panel", e);
  }
}

if (form) {
  domHelper.on(form, "submit", async (e) => {
  e.preventDefault();

  const data = domHelper.getFormData(form);
  data.rating = selectedValue;

  if (isDraftMode) {
    data.isDraft = true;
    localStorage.setItem("review_draft", JSON.stringify(data));
    alert("Draft saved.");
    return;
  }

  if (!Auth.isAuthenticated()) {
    alert("Please log in to submit a review.");
    window.location.href = "loginPage.html";
    return;
  }

  if (!bookId) {
    alert("Open this page from a book (missing book id).");
    window.location.href = "searchBooks.html";
    return;
  }

  const errors = validators.validateForm(data, {
    headline: [validators.rules.required("Headline"), validators.rules.minLength(5, "Headline")],
    critique: [validators.rules.required("Critique"), validators.rules.minLength(20, "Critique")],
    rating: [validators.rules.rating()],
  });

  if (Object.keys(errors).length > 0) {
    alert(Object.values(errors)[0] || "Please fix the form.");
    return;
  }

  try {
    await ReviewsService.submitReview({
      book_id: bookId,
      rating: selectedValue,
      headline: data.headline,
      comment: data.critique,
    });
    alert("Review submitted. It will appear after librarian approval.");
    localStorage.removeItem("review_draft");
    domHelper.clearForm(form);
    selectedValue = 0;
    stars.forEach((s) => domHelper.removeClass(s, "active"));
    setActiveButton("submit");
    window.location.href = `bookDetails.html?id=${encodeURIComponent(bookId)}`;
  } catch (err) {
    alert(err?.message || "Submit failed.");
  }
  });
}

domHelper.ready(() => {
  loadBookPanel();
});
