/**
 * 
 * GOAL - Notify Subscribers via email if rain is expected within hours at their cities
 * 
 * 
 * Schedule process using node-cron for each hour weather check;
 * Check all cities' hourly forecast at external API
 * 
 * Database for user data storage: MongoDB
 * 
*/

const express = require('express');
const axios = require("axios");
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');



mongoose.connect('mongodb://127.0.0.1:27017/weather-assistant-app-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('error', error => console.log(error) );
mongoose.Promise = global.Promise;

require('./middlewares/auth');

const routes = require('./routes/routes');
const secureRoute = require('./routes/secure-routes');


const app = express();

// Allow requests from a specific origin (replace with your client's URL)
const corsOptions = {
  // origin: 'http://localhost:5173'
  origin: '*'
};

// Enable CORS with the specified options
app.use(cors(corsOptions));


app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);

app.use(express.json());



// Plug in the JWT strategy as a middleware so only verified users can access this route.
app.use('/user', passport.authenticate('jwt', { session: false }), secureRoute);


// Handle errors
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({ error: err });
});


// Start the server
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`)
})





// SCHEDULED SENDING

// Use node-cron
// to schedule code below each hour
// checking all cities' hourly forecast
// if it will certainly rain - send an notification via email to all emails in subscription of that city



const cron = require('node-cron');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
const UserModel = require('./model/userModel');
const { weatherapi_API_key, gmail_psswrd} = require('./config.json')

/**
 * Find all documents from the 'users' MongoDB collection whose 'isSubscribed' field is set to true
 * @returns Array of users
 */
async function getAllUsersWithActiveSub() {
  try {
      const users = await UserModel.find({isSubscribed: true}).exec();
      return users
  } catch (error) {
      console.error('Error retrieving documents:', error);
      // Handle the error
      return []
  }
}


// DISCLAIMER:
// Для тестирования настроил cron на срабатывание через каждые 5 минут

cron.schedule('0 * * * *', async () => {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'arsen.baiseupov@gmail.com',
        pass: gmail_psswrd,
      },
  });


  let usersObjsArray = [];
  let subsObjects = {};

  const usersArray = getAllUsersWithActiveSub();
  (await usersArray).forEach((user, idx) => {
    usersObjsArray[idx] = user;
    let tempCity = user.city

    if (tempCity in subsObjects) {
    } else {
      subsObjects[tempCity] = []
    }

    subsObjects[tempCity].push(user.email)

  });



  const cityNamesArr = Object.keys(subsObjects);
  const emailGroupsByCity = []

  cityNamesArr.forEach((cityName, index) => {
    const tempArrSubs = subsObjects[cityName];
    const tempEmailsList = tempArrSubs.join(',');
    emailGroupsByCity[index] = tempEmailsList;
  })



  /**
  * Console.log for debuging:
  */

  // console.log(cityNamesArr)
  // console.log(emailGroupsByCity)


  cityNamesArr.forEach((cityNameForURL, idx) => {
    const currentMoment = Math.floor(Date.now() / 1000); // current moment in seconds Epoch time
    let messageBodyInHtml = "";
        
    axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${weatherapi_API_key}&q=${cityNameForURL}&days=2`)
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

      const arrayOfFutureHours = arrRaw.filter(el => (el.category == 'future' || el.category == 'now'));
      const numberOfFutureHoursLeftToday = arrayOfFutureHours.length;
      const nextLocalHourMuniteString = arrayOfFutureHours[0]["local_hh_mm"];


      const arrItWillRain = arrRaw.filter(el => (el.will_it_rain > 0 && (el.category == 'future' || el.category == 'now')));
      const arrRainIsHighlyProbable = arrRaw.filter(el => (el.chance_of_rain > 70 && (el.category == 'future' || el.category == 'now')));
      const arrRainIsProbable = arrRaw.filter(el => (el.chance_of_rain < 71 && el.chance_of_rain > 49 && (el.category == 'future' || el.category == 'now')));


      let maxChanceOfRain = 0;
      let weatherConditionText = "";
      let weatherConditionIcon = "";
      arrRaw.map(item => {
        if (item.chance_of_rain > maxChanceOfRain) {
          maxChanceOfRain = item.chance_of_rain;
          weatherConditionText = item.condition_text;
          weatherConditionIcon = item.condition_icon;
        }
      })


      if (arrItWillRain.length == 0 && arrRainIsProbable.length > 0) {
        
        messageBodyInHtml = `<div><p>🌦 There is a good chance of rain in ${cityNameFromApi} (${countryNameFromApi}).</p><p>Chance of rain: ${maxChanceOfRain}%</p><p>${weatherConditionText}</p><img src="https:${weatherConditionIcon}" alt="condition-icon"></div><div>${(maxChanceOfRain > 50) ? `☔ We strongly recommend taking an umbrella today. The rain is expected at ${arrRainIsProbable[0]["local_hh_mm"]}`:``}</div>`
      
      } else if (arrItWillRain.length > 0) {


        // CASE: It will certainly rain
        messageBodyInHtml = `<h1>Weather Assistant App Summary for ${cityNameForURL}</h1><div><p>⛈ Rain is very likely to occur in ${cityNameFromApi} (${countryNameFromApi}).</p><p>Chance of rain: ${maxChanceOfRain}%</p><p>${weatherConditionText}</p><img src="https:${weatherConditionIcon}" alt="condition-icon"></div><div>☔ You will need an umbrella today at ${arrRainIsHighlyProbable[0]["local_hh_mm"]}.</div>`
        
        
        // send mail only 3 times a day if it will certainly rain
        if (numberOfFutureHoursLeftToday > 2 && (nextLocalHourMuniteString === "08:00" || nextLocalHourMuniteString === "13:00" || nextLocalHourMuniteString === "19:00")) {
          
          let mailOptions = {
            from: 'arsen.baiseupov@gmail.com',
            bcc: emailGroupsByCity[idx],
            subject: `Weather Assistant App Summary for ${cityNameForURL}`,
            html: messageBodyInHtml,
          };
  
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log(`Email sent to subs of <${cityNameForURL}>: ` + info.response);
            }
          });

        }



      } else if (arrItWillRain.length == 0 && arrRainIsProbable.length == 0) {
        messageBodyInHtml = `<div><p>Rain is not expected in ${cityNameFromApi} (${countryNameFromApi}) today.</p><p>Chance of rain: ${maxChanceOfRain}%</p><p>Current weather: ${arrRaw.filter(el => (el.category == 'future' || el.category == 'now'))[0]["condition_text"]}</p><img src="https:${arrRaw.filter(el => (el.category == 'future' || el.category == 'now'))[0]["condition_icon"]}" alt="condition-icon"></div>`
      } else {
        messageBodyInHtml = `Error in API management.`
        console.log(messageBodyInHtml)
      }

      /**
       * TEMPORARY PART FOR TEST ONLY
       * 
       * Steps for testing:
       * 1. Comment lines above for `mailOptions` and `transporter.sendMail(....)`
       * 2. Change cron code from `00 * * * *` to `5 * * * *`
       * 
       * ---- START of TEST CODE -----
      */

      // send mail with defined transport object

      if (numberOfFutureHoursLeftToday > 2) {
        
        // let mailOptions = {
        //   from: 'arsen.baiseupov@gmail.com',
        //   bcc: emailGroupsByCity[idx],
        //   subject: `Weather Assistant App Summary for ${cityNameForURL}`,
        //   html: messageBodyInHtml,
        // };
  
        // transporter.sendMail(mailOptions, function (error, info) {
        //   if (error) {
        //     console.log(error);
        //   } else {
        //     console.log(`Email sent to subs of <${cityNameForURL}>: ` + info.response);
        //   }
        // });

      }


      /**
       * To end testing comment the test code and reverse "steps for testing" above.
       * ---- END of TEST CODE -----
      */



    })
    .catch(err => {
      console.error(err)
  })
  })

}, {
  scheduled: true,
  timezone: "Asia/Almaty"
});






/**
 * Route for debuging
 */

app.get('/emailByCities', async function(req, res) {

  try {

      let usersObjsArray = [];
      let subsObjects = {};

      const usersArray = getAllUsersWithActiveSub();
      (await usersArray).forEach((user, idx) => {
          usersObjsArray[idx] = user;
          let tempCity = user.city


          if (tempCity in subsObjects) {
          } else {

              subsObjects[tempCity] = []
          }

          subsObjects[tempCity].push(user.email)

      });



      const cityNamesArr = Object.keys(subsObjects);
      const emailGroupsByCity = []

      cityNamesArr.forEach((cityName, index) => {
          const tempArrSubs = subsObjects[cityName];
          const tempEmailsList = tempArrSubs.join(',');
          emailGroupsByCity[index] = tempEmailsList;
      })

      console.log(cityNamesArr)
      console.log(emailGroupsByCity)


      res.json(subsObjects);


  } catch (error) {
      throw error
  }
})

