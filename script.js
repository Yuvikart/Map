'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class Workout {

    date = new Date();

    id = (Date.now() + "").slice(-10);

    Clicks = 0;

    constructor(distance, duration, coords) {

        this.distance = distance;
        this.duration = duration;
        this.coords = coords;

    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;

    }

    clicks() {
        this.Clicks++;
    }

}
// console.log(Date.now());
class Running extends Workout {
    type = 'running';
    constructor(distance, duration, coords, cadence) {
        super(distance, duration, coords)
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        this.Pace = this.duration / this.distance;
        return this.Pace
    }

}

class Cycling extends Workout {
    type = "cycling";
    constructor(distance, duration, coords, elevationGain) {
        super(distance, duration, coords)
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {

        this.speed = this.distance / (this.duration / 60);
        return this.speed;

    }

}


// const run1 = new Running(15, 120, [11, 77], 123);
// const cycy1 = new Cycling(40, 90, [11, 77], 530);

///console.log(run1, cycy1);

class App {
    #map;
    #mapEvent;
    #mapZoom = 11;
    #Workout = [];
    constructor() {
        this._getPosition();

        this._getLocalStorage();
        form.addEventListener('submit', this._newWorkout.bind(this));

        inputType.addEventListener('change', this._toggleElevationField);

        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPosition() {

        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
            alert(`Can't get Your Position`);
        })

    }
    _loadMap(Position) {

        console.log(this);
        const { longitude } = Position.coords;
        const { latitude } = Position.coords;

        //console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coords = [latitude, longitude];
        //console.log(coords);

        this.#map = L.map('map').setView(coords, this.#mapZoom);
        // console.log(map);
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));
        this.#Workout.forEach(work => {
            this._renderWorkoutMarker(work);

        });
    }
    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _hideFrom() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000);
    }

    _toggleElevationField() {

        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');

    }
    _newWorkout(e) {
        e.preventDefault();

        const validationInput = (...input) => input.every(inp => Number.isFinite(inp));
        const allPostive = (...input) => input.every(inp => inp > 0);
        // get value from input data
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        // check if data is valid 

        var Workout;

        // if workout is running create running  object

        if (type === "running") {

            const cadence = +inputCadence.value;

            if (!validationInput(distance, duration, cadence) ||
                !allPostive(distance, duration, cadence)) {
                return alert("Please Enter the valid Positive Number")
            }

            Workout = new Running(distance, duration, [lat, lng], cadence);

        }

        // if workout is Cycling create cycling object

        if (type === "cycling") {

            const elevation = +inputElevation.value;

            if (!validationInput(distance, duration, elevation) ||
                !allPostive(distance, duration)) {
                return alert("Please Enter the valid Positive Number")
            }

            Workout = new Cycling(distance, duration, [lat, lng], elevation);

        }

        this.#Workout.push(Workout);
        console.log(Workout);


        // render to map
        this._renderWorkoutMarker(Workout);
        // render workout list
        this._renderWorkoutList(Workout);
        // clear the form 
        this._hideFrom();


        this._setLocalStorage();

    }


    _renderWorkoutMarker(Workout) {

        L.marker(Workout.coords).addTo(this.#map)
            .bindPopup(
                L.popup({
                    mixWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${Workout.type}-popup`,
                })
            ).setPopupContent(`${Workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
                } ${Workout.description}`)
            .openPopup();
    }

    _renderWorkoutList(Workout) {

        let html = `<li class="workout workout--${Workout.type}" data-id="${Workout.id}">
        <h2 class="workout__title">${Workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${Workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
          <span class="workout__value">${Workout.distance}</span>
          <span class="workout__unit">km</span>
        </div >
    <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${Workout.duration}</span>
        <span class="workout__unit">min</span>
    </div>`;

        if (Workout.type === 'running') {

            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${Workout.Pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${Workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li> `

        }

        if (Workout.type === 'cycling') {

            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${Workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${Workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`

        }

        form.insertAdjacentHTML('afterend', html);

    }

    _moveToPopup(e) {
        const WorkoutEl = e.target.closest('.workout');

        if (!WorkoutEl) return;

        const workout = this.#Workout.find(work => work.id === WorkoutEl.dataset.id);


        this.#map.setView(workout.coords, this.#mapZoom, {
            animate: true,
            pan: {
                duration: 1,
            }
        });

        //workout.clicks();


    }

    _setLocalStorage() {

        localStorage.setItem('Workouts', JSON.stringify(this.#Workout));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem("Workouts"));


        if (!data) return;

        this.#Workout = data;

        this.#Workout.forEach(work => {
            this._renderWorkoutList(work);

        });

    }

    reset() {

        localStorage.removeItem('Workouts');
        location.reload();

    }


}

const app = new App();




