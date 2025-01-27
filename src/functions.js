// const hourClock = document.querySelector("#__fullSizeClock__Clock.top")
// const minuteClock = document.querySelector("#__fullSizeClock__Clock.bottom")

// setInterval(() => {
//     const hoursAndMinutes = getHoursAndMinutes()
//     hourClock.innerText = hoursAndMinutes[0]
//     minuteClock.innerText = hoursAndMinutes[1]
// }, 500)

// function getHoursAndMinutes() {
//     const timestamp = Date.now()
//     const date = new Date(timestamp)
//     let hours = date.getHours()
//     let minutes = date.getMinutes()
//     if (hours.toString().length == 1) { hours = "0" + hours.toString() }
//     if (minutes.toString().length == 1) { minutes = "0" + minutes.toString() }
//     return [hours, minutes]
// }

let slider_index = 0;
let slider_process_width = 140;
let active_process_width = 190;

const process_slider_element = document.getElementById("__process__slider")

function iterateToIndex(index) {
    let transform = Math.max(index - 1, 0) * slider_process_width + active_process_width + ((index - 1) * 16 + 12) - 36
    transform = index == 0 ? 0 : Math.max(0, transform)
    process_slider_element.style.marginLeft = `-${transform}px`

    let active = document.querySelector(`#__process__slider > .__active`);
    let target = document.querySelector(`#__process__header__${index}`)

    if (active && target) {
        let activeName = document.querySelector(`#__process__header__extra > .${active.id}`);
        let targetName = document.querySelector(`#__process__header__extra > .${target.id}`);
        
        if (activeName) activeName.classList.remove("__active");
        if (targetName) targetName.classList.add("__active");

        active.classList.remove("__active");
        target.classList.add("__active");
    }
}

function __process__click(__process__header) {
    let id = __process__header.parentNode.id;
    id = id.split("__process__header__")[1];
    slider_index = id;
    updateSlider();
}

function updateSlider() {
    iterateToIndex(slider_index);
}

let lastTimestamp = 0;
window.onkeydown = function (event) {
    if ((event.key == "ArrowRight" || event.key == "ArrowLeft") && (Date.now() - lastTimestamp) >= 150) {
        switch (event.key) {
            case ("ArrowLeft"):
                slider_index--;
                break;
            case ("ArrowRight"):
                slider_index++;
                break;
        }

        lastTimestamp = Date.now();

        slider_index = Math.max(
            0,
            Math.min(document.querySelectorAll(".__process__header").length - 1, slider_index)
        )
    
        updateSlider();
    }
}