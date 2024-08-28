const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const locationButton = document.getElementById("locationButton");
const recentCitiesList = document.getElementById("recentCities")

const apiKey = '293233d25115220564de3021ab470ecd';

/*----------displaying default city------*/
const defaultCity = 'India';
getWeather(defaultCity);

/*-----Click event listener for searchButton----*/
searchButton.addEventListener("click", () => {
    const cityName = searchInput.value.trim();
    if(cityName){
        getWeather(cityName);
        searchInput.value = "";
    }
});

/*-----Click event listener for locationButton----*/
locationButton.addEventListener("click", getLocationWeather);

/*-------Event listener to select recent searched city-----*/
searchInput.addEventListener("change", () => {
    const cityName = searchInput.value.trim();
    if(cityName){
        addCityToRecentSearches(cityName);
        getWeather(cityName);
        searchInput.value = "";
    }
});

/*-----Function to get weather data-----*/
function getWeather(cityName){
    if (!cityName) return;
    const apiUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}`;
    fetch(apiUrl)
    .then(response =>{
        if(!response.ok){
            if(response.status === '404'){
                alert('city not found');
            }else{
                alert('error retrieving city data');
            }
        }
        return response.json();
    })
    .then(data => {
        if(data.length === 0){
            alert('City not found');
            return;
        }
        const {name, lat, lon} = data[0];
        getWeatherDeatils(name, lat, lon);
    })
    .catch(error =>{
        console.error('Fetch error:', error);
        alert('An error occurred while fetching the weather data.');
    }
    );   
}
getWeather();

/*-------function to get weather data details using latitude and longitude----------*/
function getWeatherDeatils(cityName, lat, lon){
    const apiUrlDetails = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    fetch(apiUrlDetails)
    .then(response =>{
        if(!response.ok){
            alert("Error retrieving weather data");
            throw new Error('Error retrieving weather data')
        }
        return response.json()
    })
    .then(data => {
        if(!data.list || data.list.length === 0){
            alert('No weather data available');
            return;
        }

        /*--------To display data in current weather section------*/
        const currentWeather = data.list[0];
        const currentDate = new Date(currentWeather.dt_txt);
        const day = currentDate.toLocaleString('en-US', { weekday: 'long'});
        const formattedDate = currentDate.toLocaleDateString('en-US');

        document.getElementById("day").innerHTML = day;
        document.getElementById("date").innerHTML = formattedDate;
        document.getElementById("cityName").innerHTML = cityName;
        document.getElementById("temperature").innerHTML = `${Math.round((currentWeather.main.temp-273.15).toFixed(2))}°C`;
        document.getElementById("description").innerHTML = currentWeather.weather[0].description;
        document.getElementById("precipitation").innerHTML = `${Math.round(currentWeather.pop * 100)} %`;
        document.getElementById("humidity").innerHTML = `${currentWeather.main.humidity} %`;
        document.getElementById("wind").innerHTML = `${Math.round(currentWeather.wind.speed)} m/s`
        
        const iconCode = currentWeather.weather[0].icon;
        const imgWidth = 100;
        const imgHeight = 100;
        document.getElementById("icon").innerHTML = `<img src="http://openweathermap.org/img/wn/${iconCode}.png" alt="Weather Icon" width="${imgWidth}" height="${imgHeight}">`;


        /*---------To display data in 5 day weather forecast section-------*/
        let daysProcessed = 0;
        let lastProcessedDate = '';

        for (let i = 0; i < data.list.length && daysProcessed < 5; i++){ 
            const forecast = data.list[i];
            const date = new Date(forecast.dt_txt);
            const currentDate = date.toLocaleDateString('en-US');

            const today = new Date().toLocaleDateString('en-US');
            if(currentDate === today){
                continue;
            }

            if(currentDate !== lastProcessedDate){
                lastProcessedDate = currentDate;
                daysProcessed++;

                const day = date.toLocaleDateString('en-US', { weekday: 'long' });
                const formattedDate = date.toLocaleDateString('en-US');

                document.getElementById(`day${daysProcessed}`).innerHTML = day
                document.getElementById(`date${daysProcessed}`).innerHTML = formattedDate;
                document.getElementById(`temperature${daysProcessed}`).innerHTML = `${Math.round((forecast.main.temp - 273.15).toFixed(2))} °C`;
                document.getElementById(`humidity${daysProcessed}`).innerHTML = `${forecast.main.humidity} %`;
                document.getElementById(`wind${daysProcessed}`).innerHTML = `${Math.round(forecast.wind.speed)} m/s`;

                const iconForecastCode = forecast.weather[0].icon;
                document.getElementById(`icon${daysProcessed}`).innerHTML = `<img src="http://openweathermap.org/img/wn/${iconForecastCode}.png" alt="Weather Icon"">`;
            }
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        alert('An error occured while fetching weather data')
    });
}

/*-------function to get weather data using current location------*/
function getLocationWeather(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const reverseGeocodeUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;

            fetch(reverseGeocodeUrl)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0){
                    const cityName = data[0].name;
                    getWeatherDeatils(cityName, lat, lon);
                }else{
                    alert('Unable to retrieve city name for your location.');
                }
            })
            .catch(error => {
                alert('Error retrieving location data:', error)
            });
        }, () => {
            alert('Unable to retrieve your location.');
        });
    }else{
        alert('Geolocation is not supported by your browser');
    }
}

/*-----Function to add to recent searched cities in local storage------*/
function addCityToRecentSearches(cityName){
    let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
    if (!recentCities.includes(cityName)){
        recentCities.unshift(cityName);
        if (recentCities.length > 5){
            recentCities.pop();
        }
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
        updateRecentCitiesDropdown();
    }
}

/*------Function to update recent searched city in dropdown------*/
function updateRecentCitiesDropdown(){
    recentCitiesList.innerHTML = '';
    const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
    recentCities.forEach(cityName => {
        const option = document.createElement('option');
        option.value = cityName;
        recentCitiesList.appendChild(option);
    })
}
updateRecentCitiesDropdown();