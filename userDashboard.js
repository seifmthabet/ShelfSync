document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Progress Bar Animation
    const progressBars = document.querySelectorAll('.progress-bar');
    setTimeout(() => {
        progressBars.forEach(bar => {
            const targetProgress = bar.getAttribute('data-progress');
            bar.style.width = `${targetProgress}%`;
        });
    }, 300); 

    // 2. Stat Counter Animation
    const animateValue = (element, start, end, duration) => {
        if (!element) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            element.innerHTML = Math.floor(progress * (end - start) + start).toString().padStart(2, '0');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    animateValue(document.getElementById("active-loans"), 0, 8, 1000);
    animateValue(document.getElementById("reviews-written"), 0, 24, 1500);
    animateValue(document.getElementById("available-credits"), 0, 12, 1200);

    // 3. Dynamic "Scholar's Note" Interaction (No Alerts)
    const renewBtn = document.getElementById("renew-btn");
    const dueCountSpan = document.getElementById("due-count");
    const noteDescription = document.querySelector(".scholar-note p");
    const activeLoansDesc = document.querySelector(".stat-card .stat-desc"); // The text under "08"

    if (renewBtn) {
        renewBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let dueCount = parseInt(dueCountSpan.innerText);
            
            if (dueCount > 0) {
                // Step 1: Show processing state
                renewBtn.innerText = "Renewing...";
                renewBtn.style.opacity = "0.7";
                renewBtn.style.pointerEvents = "none"; // Prevent double clicks
                
                // Step 2: Simulate network request delay (800ms)
                setTimeout(() => {
                    // Update Scholar Note UI
                    dueCountSpan.innerText = "0";
                    noteDescription.innerHTML = "All items have been successfully renewed.";
                    
                    // Update Button to new state
                    renewBtn.innerText = "View Ledger";
                    renewBtn.style.opacity = "1";
                    renewBtn.style.pointerEvents = "auto";
                    renewBtn.style.backgroundColor = "rgba(255,255,255,0.2)";
                    renewBtn.style.color = "var(--color-surface-lowest)";
                    
                    // Update the active loans text at the top of the dashboard
                    if (activeLoansDesc) {
                        activeLoansDesc.innerText = "0 books due this week";
                        activeLoansDesc.style.color = "var(--color-primary)"; // Highlight change
                    }
                }, 800);
            } else {
                // If already renewed, simulate navigating to the ledger
                const originalText = renewBtn.innerText;
                renewBtn.innerText = "Opening Ledger...";
                setTimeout(() => { 
                    renewBtn.innerText = originalText; 
                    // window.location.href = "/ledger"; // Uncomment to actually route
                }, 1000);
            }
        });
    }
});