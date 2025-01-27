document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("container")
    container.style.width = `${window.outerWidth}px`
    container.style.height = `${window.outerHeight}px`

    let __process__header__buttons = document.querySelectorAll(".__process__header__button");
    __process__header__buttons.forEach((__process__button) => {
        __process__button.onclick = () => __process__click(__process__button);
    })

    document.querySelectorAll(`.__process__header`).forEach(header => {
        let name = header.attributes["data-name"].value;
        let __process__header__name = document.createElement("p");
        __process__header__name.innerText = name;
        __process__header__name.classList.add("__process__header__name");
        // __process__header__name.classList.add("__active");
        __process__header__name.classList.add(header.id);
        document.getElementById("__process__header__extra").append(__process__header__name);
    })
});

window.send = function (data) {
    return window.API.toMain(data)
}