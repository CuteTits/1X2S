const btn = document.getElementById("scroll-to-top");

window.addEventListener("scroll", () => {
  if (window.scrollY > 500) {
    btn.classList.add("show");
    btn.classList.remove("hide");
  } else {
    btn.classList.remove("show");
    btn.classList.add("hide");
  }
});

btn.addEventListener("click", () => {
  document.getElementById("section1").scrollIntoView({ behavior: "smooth" });
});