const btn = document.getElementById("scrollToTopBtn");
window.addEventListener("scroll", () => {
if (window.scrollY > 300) {
    btn.style.display = "block";
} else {
    btn.style.display = "none";
}
});
btn.addEventListener("click", () => {
document.getElementById("section1").scrollIntoView({ behavior: "smooth" });
});