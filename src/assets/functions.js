// const hourClock = document.querySelector('#__fullSizeClock__Clock.top')
// const minuteClock = document.querySelector('#__fullSizeClock__Clock.bottom')

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
//     if (hours.toString().length == 1) { hours = '0' + hours.toString() }
//     if (minutes.toString().length == 1) { minutes = '0' + minutes.toString() }
//     return [hours, minutes]
// }

let slider_index = 0;
let slider_process_width = 211;
let active_process_width = 360;

// let slider_process_width = 120;
// let active_process_width = 160;

const process_slider_element = document.getElementById('__process__slider')
let gameData = {}

/*
    MOVES THE SLIDER TO FOCUS ON THE ACTIVE PROCESS HEADER.
*/
function iterateToIndex(index) {
    // let transform = Math.max(index - 1, 0) * slider_process_width + active_process_width + ((index - 1) * 16 + 12) - 36
    // transform = index == 0 ? 0: Math.max(0, transform)
    let transform = Math.max(index - 1, 0) * slider_process_width + active_process_width - 16 * 8.3
    transform = index == 0 ? 16 : Math.max(0, transform)
    process_slider_element.style.marginLeft = `-${transform}px`

    let active = document.querySelector(`#__process__slider > .__active`);
    let target = document.querySelector(`#__process__header__${index}`)

    if (active && target) {
        let activeName = document.querySelector(`#__process__header__extra > .${active.id}`);
        let targetName = document.querySelector(`#__process__header__extra > .${target.id}`);

        if (activeName) activeName.classList.remove('__active');
        if (targetName) targetName.classList.add('__active');

        active.classList.remove('__active');
        target.classList.add('__active');
    }
}

/*
    CREATES A PROCESS HEADER USING INFORMATION GIVEN BY THE BACKEND.
*/
function __create__process__header(gameDat) {
    /*
        <div id='__process__header__0' class='__process__header' data-name='Helldivers 2'>
            <img src='./icons/image.png' alt='Helldivers 2'>
            <button class='__process__header__button'></button>
        </div>
    */

    const { name, exe, appid, accent, icon } = gameDat;

    const slider = document.querySelectorAll('.__process__header');
    const [r, g, b] = accent._rgb;
    const accentColorRGB = `rgba(${r}, ${g}, ${b})`;

    // Create the container for the process header
    const container = document.createElement('div');
    container.id = `__process__header__${slider.length}`;
    container.classList.add('__process__header');
    container.style.setProperty('--ACCENT-COLOR', accentColorRGB);
    if (slider.length === 0) container.classList.add('__active');
    container.setAttribute('data-name', name);
    container.setAttribute('data-appid', appid);

    // Create the process icon image
    const img = document.createElement('img');
    img.src = icon;
    img.alt = name;

    // Create the process button
    const button = document.createElement('button');
    button.classList.add('__process__header__button');
    button.onclick = () => __process__click(button);

    // Append the button and image to the container
    container.append(button, img);

    // Append the container to the slider
    document.getElementById('__process__slider').append(container);

    // Create the process name text
    const processName = document.createElement('p');
    processName.innerText = name;
    processName.classList.add('__process__header__name');
    if (slider.length === 0) processName.classList.add('__active');
    processName.classList.add(container.id);

    // Append the process name to the extra section
    document.getElementById('__process__header__extra').append(processName);
}

/*
    PROCESSES THE CLICK OF A HEADER.
*/
function __process__click(__process__header) {
    let id = __process__header.parentNode.id;
    id = id.split('__process__header__')[1];
    slider_index = id;
    updateSlider();
}

/*
    UPDATES THE SLIDER.
*/
function updateSlider() {
    iterateToIndex(slider_index);
}

let lastTimestamp = 0;
window.onkeydown = function (event) {
    if ((event.key == 'ArrowRight' || event.key == 'ArrowLeft') && (Date.now() - lastTimestamp) >= 150) {
        switch (event.key) {
            case ('ArrowLeft'):
                slider_index--;
                break;
            case ('ArrowRight'):
                slider_index++;
                break;
        }

        lastTimestamp = Date.now();

        slider_index = Math.max(
            0,
            Math.min(document.querySelectorAll('.__process__header').length - 1, slider_index)
        )

        updateSlider();
    } else if (event.key == 'Enter') {
        let process = document.querySelector(`#__process__header__${slider_index}`)
        API.launchProcess(process.getAttribute('data-appid'))
    }
}