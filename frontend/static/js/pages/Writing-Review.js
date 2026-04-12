import { validators } from "../utils/validators.js";
import { domHelper } from "../utils/domHelper.js";

// ================= STATE =================
let selectedValue = 0;
let isDraftMode = false;

// ================= ELEMENTS =================
const form = domHelper.query(".review-form");
const submitBtn = domHelper.query(".primary-btn");
const draftBtn = domHelper.query(".secondary-btn");
const stars = domHelper.queryAll(".rating span");

// ================= INIT BUTTON STATE =================
function setActiveButton(active) {
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

// أول تحميل
setActiveButton("submit");

// ================= BUTTON EVENTS =================
domHelper.on(draftBtn, "click", () => {
    setActiveButton("draft");
});

domHelper.on(submitBtn, "click", () => {
    setActiveButton("submit");
});

// ================= STAR RATING =================
stars.forEach(star => {
    domHelper.on(star, "click", () => {
        selectedValue = Number(star.dataset.value);

        stars.forEach(s => domHelper.removeClass(s, "active"));

        stars.forEach(s => {
            if (Number(s.dataset.value) <= selectedValue) {
                domHelper.addClass(s, "active");
            }
        });
    });
});

// ================= WORD COUNT =================
const textarea = domHelper.query("#critique");
const counter = domHelper.query("#counter");

domHelper.on(textarea, "input", () => {
    const words = textarea.value.trim().split(/\s+/).filter(w => w.length > 0);
    counter.textContent = `${words.length} / 2000 words`;
});

// ================= FORM SUBMIT =================
domHelper.on(form, "submit", (e) => {
    e.preventDefault();

    const data = domHelper.getFormData(form);
    data.rating = selectedValue;

    // 🟡 لو Draft → احفظ على طول
    if (isDraftMode) {
        data.isDraft = true;
        localStorage.setItem("review_draft", JSON.stringify(data));

        console.log("Draft Saved:", data);
        alert("Draft saved 📝");
        return;
    }

    // 🟢 لو Submit عادي → Validation
    const errors = validators.validateForm(data, {
        headline: [
            validators.rules.required("Headline"),
            validators.rules.minLength(5, "Headline")
        ],
        critique: [
            validators.rules.required("Critique"),
            validators.rules.minLength(20, "Critique")
        ],
        rating: [
            validators.rules.rating()
        ]
    });

    if (Object.keys(errors).length > 0) {
        console.log("Errors:", errors);
        alert("Something Wrong ❌");
        return;
    }

    console.log("Form Data:", data);
    alert("Review submitted ✅");

    localStorage.removeItem("review_draft");
    domHelper.clearForm(form);

    selectedValue = 0;
    stars.forEach(s => domHelper.removeClass(s, "active"));

    setActiveButton("submit");
});
