document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("container")
    container.style.width = `${window.outerWidth}px`
    container.style.height = `${window.outerHeight}px`

    let __process__header__buttons = document.querySelectorAll(".__process__header__button");
    __process__header__buttons.forEach((__process__button) => {
        __process__button.onclick = () => __process__click(__process__button);
    })

    updateSlider();
    
    API.hasLoaded();
});

window.send = function (data) {
    return window.API.toMain(data)
}

API.onLoaded((event, data) => {
    data.games.forEach(game => {
        __create__process__header(game.game, game.exe)
    })
});