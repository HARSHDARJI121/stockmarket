// Handle hamburger menu toggle
document.getElementById('hamburger').addEventListener('click', function() {
    document.getElementById('mobile-menu').style.display = 'block';
});

// Handle close menu
document.getElementById('close-menu').addEventListener('click', function() {
    document.getElementById('mobile-menu').style.display = 'none';
});

// Wait until the document is ready to ensure the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-button.right');
    const prevButton = document.querySelector('.carousel-button.left');
    
    let currentIndex = 0;
    const totalSlides = slides.length;
    const slideWidth = slides[0].offsetWidth; // Get width dynamically

    // Function to move slides
    const moveToSlide = (index) => {
        if (index >= totalSlides) {
            currentIndex = 0; // Reset to first slide
        } else if (index < 0) {
            currentIndex = totalSlides - 1; // Go to last slide
        } else {
            currentIndex = index;
        }

        track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
    };

    // Next Button
    nextButton.addEventListener('click', () => {
        moveToSlide(currentIndex + 1);
    });

    // Previous Button
    prevButton.addEventListener('click', () => {
        moveToSlide(currentIndex - 1);
    });

    // Auto slide every 3 seconds
    setInterval(() => {
        moveToSlide(currentIndex + 1);
    }, 3000);
});

