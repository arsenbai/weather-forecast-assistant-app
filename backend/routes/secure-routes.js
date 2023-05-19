const express = require('express');
const passport = require('passport');
const router = express.Router();
const axios = require("axios");
const moment = require('moment-timezone');
const {weatherapi_API_key} = require("../config.json");
const UserModel = require("../model/userModel")

router.get(
    '/profile',
    async (req, res, next) => {

        try {
            // Find the document with the user's email
            const document = await UserModel.findOne({ email: req.user.email });
            
            if (document) {

                res.json({
                    message: 'You made it to the secure route - profile',
                    user: document,
                    token: req.query.secret_token
                })

            } else {
                console.log('Document not found');
            }

        } catch (error) {
            console.error('Error rendering profile:', error);
        }

    }
)


// Endpoint to compare current time with API hourly timestamps and filter relevant timestamps
router.get('/filterforecast/:cityname', async (req, res, next) => {
    try {
        const currentMoment = Math.floor(Date.now() / 1000); // in seconds
        
        axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${weatherapi_API_key}&q=${req.params.cityname}&days=2`)
        .then(response => {
            
            // get city, country and timezone name from API
            const cityNameFromApi = response.data.location.name
            const countryNameFromApi = response.data.location.country
            const timezoneName = response.data.location.tz_id
          
            // get an array of hourly forecast from API
            const hourlyForecastObjectsInArray = response.data.forecast.forecastday[0].hour
      
            // compare timestamps of each element and assign category ('past' | 'now' | 'future')
            let arrRaw = [];
            hourlyForecastObjectsInArray.map((item, idx) => {
                const itemEpoch = item.time_epoch; // exract epoch time from each item of array
              
                let itemCategory;
                if (itemEpoch < currentMoment) {
                    itemCategory = 'past';
                } else if (itemEpoch === currentMoment) {
                    itemCategory = 'now';
                } else {
                    itemCategory = 'future';
                }
              
                // extract HH:MM from epoch time of each element
                const itemDateObj = new Date(itemEpoch * 1000); // convert epoch to milliseconds and JS Date type
                const localTime = moment.tz(itemDateObj, timezoneName);
                let localHour = localTime.hour();
                let localMinute = localTime.minute();
  
                // add single digit hours/minutes with a leading zero
                if (localHour < 10) {
                    localHour = '0' + localHour;
                }
                if (localMinute < 10) {
                    localMinute = '0' + localMinute;
                }
                let localHourMinutes = localHour + ':' + localMinute;
      
                arrRaw.push({
                    "id": idx,
                    "localTime": item.time,
                    "will_it_rain": item.will_it_rain,
                    "chance_of_rain": item.chance_of_rain,
                    "local_hh_mm": `${localHourMinutes}`,
                    "category": itemCategory,
                    "condition_text": item.condition.text,
                    "condition_icon": item.condition.icon
                })
            })
  
            const arrItWillRain = arrRaw.filter(el => (el.will_it_rain > 0 && (el.category == 'future' || el.category == 'now')));
            const arrRainIsHighlyProbable = arrRaw.filter(el => (el.chance_of_rain > 70 && (el.category == 'future' || el.category == 'now')));
            const arrRainIsProbable = arrRaw.filter(el => (el.chance_of_rain < 71 && el.chance_of_rain > 49 && (el.category == 'future' || el.category == 'now')));
      
  
            let maxChanceOfRain = 0;
            let conditionText = "";
            let conditionIcon = "";
            arrRaw.map(item => {
                if (item.chance_of_rain > maxChanceOfRain) {
                    maxChanceOfRain = item.chance_of_rain;
                    conditionText = item.condition_text;
                    conditionIcon = item.condition_icon;
                }
            })
  
  
            if (arrItWillRain.length == 0 && arrRainIsProbable.length > 0) {
                res.status(200).send(`<div><p>🌦 There is a good chance of rain in ${cityNameFromApi} (${countryNameFromApi}).</p><p>Chance of rain: ${maxChanceOfRain}%</p><p>${conditionText}</p><img src="https:${conditionIcon}" alt="condition-icon"></div><div>${(maxChanceOfRain > 50) ? `☔ We strongly recommend taking an umbrella today. The rain is expected at ${arrRainIsProbable[0]["local_hh_mm"]}`:``}</div><br><br><div>${JSON.stringify(arrRainIsProbable)}</div>`)
            } else if (arrItWillRain.length > 0) {
                res.status(200).send(`<div><p>⛈ Rain is very likely to occur in ${cityNameFromApi} (${countryNameFromApi}).</p><p>Chance of rain: ${maxChanceOfRain}%</p><p>${conditionText}</p><img src="https:${conditionIcon}" alt="condition-icon"></div><div>☔ You will need an umbrella today at ${arrRainIsHighlyProbable[0]["local_hh_mm"]}.</div><br><br><div>${JSON.stringify(arrRainIsHighlyProbable)}</div>`)
            } else if (arrItWillRain.length == 0 && arrRainIsProbable.length == 0) {
                 res.status(200).send(`<div><p>Rain is not expected in ${cityNameFromApi} (${countryNameFromApi}) today.</p><p>Chance of rain: ${maxChanceOfRain}%</p><p>Current weather: ${arrRaw.filter(el => (el.category == 'future' || el.category == 'now'))[0]["condition_text"]}</p><img src="https:${arrRaw.filter(el => (el.category == 'future' || el.category == 'now'))[0]["condition_icon"]}" alt="condition-icon"></div><br><br><div>${JSON.stringify(arrRaw.filter(el => (el.chance_of_rain > 0 && (el.category == 'future' || el.category == 'now'))))}</div>`)
            } else {
                res.send(`Error in API management.`)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



router.post(
    '/subscription-switch',
    async (req, res, next) => {

        try {
            // Find the document with the specified email
            const document = await UserModel.findOne({ email: req.user.email });
            
            if (document) {
                // switch boolean value of the found document
                document.isSubscribed = !document.isSubscribed;
          
                // Save the updated document
                await document.save();

                console.log(`${document.isSubscribed ? "Subscribed" : "Unsubscribed"} successfully`);
                res.json({
                    message: `${document.isSubscribed ? "Subscribed" : "Unsubscribed"} successfully`,
                    user: document
                });
            } else {
                console.log('Document not found');
            }

        } catch (error) {
            console.error('Error updating document:', error);
        }

    }
);




router.post(
    '/update-city',
    async (req, res, next) => {

        // const {email, city} = req.body;
        const {city} = req.body;
        try {
            // Find the document with the specified email
            // const document = await UserModel.findOne({ email });
            const document = await UserModel.findOne(req.user);
            
            if (document) {
                // Update the city value of the found document
                document.city = city;
          
                // Save the updated document
                await document.save();

                console.log('Document updated successfully');
                res.json({
                    message: 'Updated successfully',
                    user: document
                });
            } else {
                console.log('Document not found');
                res.json({
                    message: 'Updated failed.',
                    user: document
                })
            }

        } catch (error) {
            console.error('Error updating document:', error);
        }

    }
);



module.exports = router;