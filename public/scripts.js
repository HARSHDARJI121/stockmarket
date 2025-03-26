// Handle hamburger menu toggle
document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobile-menu");
    const closeMenu = document.getElementById("close-menu");

    if (hamburger && mobileMenu) {
        hamburger.addEventListener("click", function () {
            mobileMenu.style.display = "block";
        });
    }

    if (closeMenu && mobileMenu) {
        closeMenu.addEventListener("click", function () {
            mobileMenu.style.display = "none";
        });
    }

    // Carousel functionality
    const track = document.querySelector(".carousel-track");
    const slides = track ? Array.from(track.children) : [];
    const nextButton = document.querySelector(".carousel-button.right");
    const prevButton = document.querySelector(".carousel-button.left");

    let currentIndex = 0;
    const totalSlides = slides.length;
    
    if (totalSlides > 0) {
        const updateSlideWidth = () => slides[0].offsetWidth || 0;
        let slideWidth = updateSlideWidth();

        const moveToSlide = (index) => {
            if (!track) return;
            if (index >= totalSlides) {
                currentIndex = 0;
            } else if (index < 0) {
                currentIndex = totalSlides - 1;
            } else {
                currentIndex = index;
            }
            track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
        };

        if (nextButton) {
            nextButton.addEventListener("click", () => moveToSlide(currentIndex + 1));
        }

        if (prevButton) {
            prevButton.addEventListener("click", () => moveToSlide(currentIndex - 1));
        }

        // Auto slide every 3 seconds
        setInterval(() => moveToSlide(currentIndex + 1), 3000);

        // Update slide width on window resize (for responsiveness)
        window.addEventListener("resize", () => {
            slideWidth = updateSlideWidth();
            moveToSlide(currentIndex);
        });
    }
});
