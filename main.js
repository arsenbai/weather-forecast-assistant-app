const express = require("express");
const axios = require("axios");
const {weatherapi_API_key, openweathermap_API_key, tomorrow_io_API_key} = require("./config.json");

const app = express();

app.use(express.json());
app.use(express.static('public'));


// EXAMPLE: https://api.weatherapi.com/v1/forecast.json?key={API_KEY}}&q=Astana&days=1
// get latitude, longitude here and then use it below
app.get("/weatherapi/:cityname", (req, res, next) => {
    axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${weatherapi_API_key}&q=${req.params.cityname}&days=2`)
    .then(response => {
        const resData = response.data;

        // city name from API
        const cityNameFromApi = response.data.location.name

        // forecast date (basically tommorow forecase)
        const dateForForecastInUnixEpoch = resData.forecast.forecastday[1].date_epoch;
        const dateForForecastInString = new Date(dateForForecastInUnixEpoch * 1000).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});
        
        // maxtemp_c
        const maxtemp_c = resData.forecast.forecastday[1].day.maxtemp_c
        
        // mintemp_c
        const mintemp_c = resData.forecast.forecastday[1].day.mintemp_c
        
        // avgtemp_c
        const avgtemp_c = resData.forecast.forecastday[1].day.avgtemp_c
        
        // maxwind_kph
        const maxwind_kph = resData.forecast.forecastday[1].day.maxwind_kph
        

        // RAIN
        // daily_will_it_rain (Will it will rain or not: 1 = Yes 0 = No)
        const daily_will_it_rain = resData.forecast.forecastday[1].day.daily_will_it_rain   
        // daily_chance_of_rain (Chance of rain as percentage)
        const daily_chance_of_rain = resData.forecast.forecastday[1].day.daily_chance_of_rain


        // SNOW
        // daily_will_it_snow (Will it snow or not: 1 = Yes 0 = No)
        const daily_will_it_snow = resData.forecast.forecastday[1].day.daily_will_it_snow
        // daily_will_it_snow (Chance of snow as percentage)
        const daily_chance_of_snow = resData.forecast.forecastday[1].day.daily_chance_of_snow

        // CONDITION (Text + Icon)
        // conditionText
        const conditionText = resData.forecast.forecastday[1].day.condition.text
        // conditionIcon
        const conditionIcon = resData.forecast.forecastday[1].day.condition.icon

        // UV Index
        const uvIndex = resData.forecast.forecastday[1].day.uv


        // console.log(JSON.stringify(resData, null, 4));
        res.send(
            `<head>
                <link rel="stylesheet" type="text/css" href="/main.css">
            </head>
            <h1>Info from weatherapi.com</h1>
            <div>You searched for city name: <a class="redtext">${req.params.cityname}</a></div>

            <h2>${cityNameFromApi}</h2>
            <div>Forecast for <a class="redtext">${dateForForecastInString}</a></div>
            <div>Max temp will be <a class="orangetext">${maxtemp_c}℃</a></div>
            <div>Min temp: <a class="bluetext">${mintemp_c}℃</a></div>            
            <br>
            <div>Chance of rain: ${daily_chance_of_rain}%</div>
            <div>Will it rain? ${(daily_will_it_rain === 1) ? 'Yes, it will rain.' : 'No, it won\'t.'}</div>
            <br>
            <div>Chance of snow: ${daily_chance_of_snow}%</div>
            <div>Will it snow? ${(daily_chance_of_snow === 1) ? 'Yes, it will snow.' : 'No, it won\'t.'}</div>

            <h2>Conditions</h2>
            <div>${conditionText}</div>
            <img src="${conditionIcon}" alt="weather condition icon">

            <br>
            <h2>UV Index</h2>
            <div>${cityNameFromApi}'s UV index: ${uvIndex}</div>
            <br>
            <div>
                <table>
                <thead>
                    <tr>
                    <th>UV Index</th>
                    <th>Exposure Level</th>
                    <th>Recommended Protection</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td>0 - 2</td>
                    <td>Low</td>
                    <td>No protection required</td>
                    </tr>
                    <tr>
                    <td>3 - 5</td>
                    <td>Moderate</td>
                    <td>Wear a hat and sunglasses and apply sunscreen</td>
                    </tr>
                    <tr>
                    <td>6 - 7</td>
                    <td>High</td>
                    <td>Wear a hat and sunglasses, apply sunscreen, and seek shade during peak hours</td>
                    </tr>
                    <tr>
                    <td>8 - 10</td>
                    <td>Very High</td>
                    <td>Wear a hat and sunglasses, apply sunscreen, and avoid sun exposure during peak hours</td>
                    </tr>
                    <tr>
                    <td>11+</td>
                    <td>Extreme</td>
                    <td>Wear a hat and sunglasses, apply sunscreen, and avoid all sun exposure during peak hours</td>
                    </tr>
                </tbody>
                </table>

            </div>`)
    })
    .catch(err => {
        console.error(err)
        res.send(
            `<head>
                <link rel="stylesheet" type="text/css" href="/main.css">
            </head>
            <h1>Error at axios</h1><div class="redtext">"${req.params.cityname}" is not found via API</div>`)
    })


})


// FORM: https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={APIkey}&units=metric
app.get("/openweathermap/:cityname", (req, res, next) => {
    axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${weatherapi_API_key}&q=${req.params.cityname}&days=2`)
    .then(response => {
        const resData = response.data;

        // city latitude and longtitue from API
        const citylat = resData.location.lat
        const citylon = resData.location.lon

        // request info from OpenWeatherMapOrg
        axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${citylat}&lon=${citylon}&cnt=6&appid=${openweathermap_API_key}&units=metric`)
        .then(response => {
            const resData = response.data;

            const listData = resData.list
            let objData;
            if (listData.length > 5) {
                objData = listData[5]
            } else {
                objData = listData[listData.length - 1]
            }

            const dtOfInfo = objData.dt
            const dateForForecastInString = new Date(dtOfInfo * 1000).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});
            
            const cityNameFromOpenWeatherMapOrg = resData.city.name;

            const maxtemp_c = objData.main.temp_max;
            const mintemp_c = objData.main.temp_min;
            const weatherMain = objData.weather[0].main;
            const weatherDesc = objData.weather[0].description;

            res.send(
                `<head>
                    <link rel="stylesheet" type="text/css" href="/main.css">
                </head>
                <h1>Info from openweathermap.org</h1>
                <div>You searched for city name: <a class="redtext">${req.params.cityname}</a></div>
    
                <h2>${cityNameFromOpenWeatherMapOrg}</h2>
                <div>Forecast for <a class="redtext">${dateForForecastInString}</a> (<a class="redtext">${objData.dt_txt.slice(-8)}</a>)</div>
                <br>
                <div>Max temp will be <a class="orangetext">${maxtemp_c}℃</a></div>
                <div>Min temp: <a class="bluetext">${mintemp_c}℃</a></div>            
                <br>
                <div>weatherMain: ${weatherMain}</div>
                <div>weatherDesc: ${weatherDesc}</div>
                <br>`)
        })
        .catch(err => {
            console.error(err)
            res.send(
                `<head>
                    <link rel="stylesheet" type="text/css" href="/main.css">
                </head>
                <h1>Error at axios</h1><div class="redtext">"${req.params.cityname}" is not found via openweathermap API using latitude (${citylat}) and longtitue (${citylon})</div>`)
        })
    })
    .catch(err => {
        console.error(err)
        res.send(
            `<head>
                <link rel="stylesheet" type="text/css" href="/main.css">
            </head>
            <h1>Error at axios</h1><div class="redtext">"${req.params.cityname}" is not found via weatherapi.com API</div>`)
    })
})




const PORT = 8000;

app.listen(PORT, () => {
    console.log(`Server is running on portal ${PORT}`)
})






// I will analyze this API info as well: https://api.tomorrow.io/v4/weather/forecast?location=astana&timesteps=1d&apikey={API_KEY}



/* I will use node-cron for scheduled email notification:
https://www.npmjs.com/package/node-cron
*/