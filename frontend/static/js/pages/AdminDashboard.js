const form = document.getElementById("my-form");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  let input = document.getElementById("search-form");
  let bookName = input.value;

  const validPattern = /^(?!.* {2})[a-zA-Z0-9 ]+$/;
  if (bookName.length == 0)
  {
    alert("Error : the value is Empty");
  }
  else if(bookName.length <=3 || !validPattern.test(bookName))
  {
    alert("Error: Inavlid Book Name ")
  }
  else
  {
    console.log(bookName);
    input.value = ""
  }
});

const addMemoBtn = document.getElementById("AddMemo");

addMemoBtn.addEventListener("click", () => {
  const thirdNote = document.querySelector(".note-3");
  const thirdComment = document.querySelector(".comment-3");

 
  if (thirdNote.style.display !== "none" && thirdNote.textContent.trim() !== "") {
    const confirmDelete = confirm("The third memo will be deleted. Do you want to continue?");
    if (!confirmDelete) {
      alert("Operation cancelled.");
      return;
    }
  }

  const memoText = prompt("Enter a new memo (maximum 12 words):");

  if (memoText && memoText.trim() !== "") {
 
    const wordCount = memoText.trim().split(/\s+/).length;
    if (wordCount > 12) {
      alert("The memo cannot exceed 12 words.");
      return;
    }

   
    thirdNote.textContent = `"${memoText}"`;
    thirdNote.style.display = "block";

    const now = new Date();
    thirdComment.textContent = now.toLocaleTimeString() + " — Current User";
    thirdComment.style.display = "block";

    alert("Memo added successfully.");
  } else {
    alert("The memo cannot be empty.");
  }
});
window.addEventListener("DOMContentLoaded", () => {
  // Section 1
  const catalog = document.querySelector(".catalog-size .content");
  catalog.textContent = 12000 + Math.floor(Math.random() * 200);

  const users = document.querySelector(".activ-users .content");
  users.textContent = 3000 + Math.floor(Math.random() * 500);

  const reviews = document.querySelector(".Reviews .content");
  reviews.textContent = 8000 + Math.floor(Math.random() * 1000);

  // Section 3 (Footer)
  const borrowed = document.querySelector(".sec-3 div:nth-child(1) .class-content");
  borrowed.textContent = 1000 + Math.floor(Math.random() * 300);

  const retention = document.querySelector(".sec-3 div:nth-child(2) .class-content");
  retention.textContent = (90 + Math.floor(Math.random() * 6)) + "%";

  const rating = document.querySelector(".sec-3 div:nth-child(3) .class-content");
  rating.textContent = (4.5 + Math.random() * 0.5).toFixed(1);

  const storage = document.querySelector(".sec-3 div:nth-child(4) .class-content");
  storage.textContent = (50 + Math.floor(Math.random() * 21)) + "%";
});
