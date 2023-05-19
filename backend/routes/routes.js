const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const {jwtSignKey} = require("../config.json");
const UserModel = require('../model/userModel');

const router = express.Router();


router.post(
  '/signup',
  passport.authenticate('signup', { session: false }),
  async (req, res, next) => {
    res.json({
      message: 'Signup successful',
      user: req.user
    });
  }
);

router.post(
    '/login',
    async (req, res, next) => {
        passport.authenticate(
            'login',
            async (err, user, info) => {
                try {
                    if (err || !user) {
                        const error = new Error('An error occurred.');
            
                        return next(error);
                    }

                    req.login(
                        user, 
                        { session: false },
                        async (error) => {
                            if (error) return next(error);

                            const body = { _id: user._id, email: user.email };
                            const token = jwt.sign({ user: body }, jwtSignKey);
            
                            return res.json({ token });
                        }
                    );
                } catch (error) {
                    return next(error);
                }
            }
        )(req, res, next);
    }
);

router.get(
    '/listtimezonesfromjson',
    async (req, res, next) => {
        const tzJsonTable = require("../draft_files/tz-table.json");
        const startingStringInLowerCase = req.query.startingwith.toLowerCase();
        const arrTimezonesFromJSON = []
        tzJsonTable.map(item => {
            if (item.Timezone.slice(0, startingStringInLowerCase.length).toLowerCase() == startingStringInLowerCase) {
                arrTimezonesFromJSON.push(item.Timezone)
            }
        })
        const longString = arrTimezonesFromJSON.join(',');
        res.status(200).send(longString)
    }
)










/**
 * Find all documents from the 'users' collection
 * @returns Array of users
 */
async function getAllUsers() {
    try {
        const users = await UserModel.find({}).exec();
        return users
    } catch (error) {
        console.error('Error retrieving documents:', error);
        // Handle the error
        return []
    }
}



router.get('/emailByCities', async function(req, res) {

    try {

        let usersObjsArray = [];
        let subsObjects = {};

        const usersArray = getAllUsers();
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

  

module.exports = router;