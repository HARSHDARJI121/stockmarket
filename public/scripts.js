// Handle hamburger menu toggle
document.getElementById('hamburger').addEventListener('click', function() {
    document.getElementById('mobile-menu').style.display = 'block';
});

// Handle close menu
document.getElementById('close-menu').addEventListener('click', function() {
    document.getElementById('mobile-menu').style.display = 'none';
});

let currentIndex = 0;
const images = document.querySelectorAll('.slider img');

function changeSlide(direction) {
    images[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + direction + images.length) % images.length;
    images[currentIndex].classList.add('active');
}

// Optional: Auto-slide functionality
setInterval(() => {
    changeSlide(1);
}, 5000); // Change slide every 5 seconds
