const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const UserModel = require('../model/userModel');


passport.use(
    'signup',
    new localStrategy(
        // {usernameField: 'email', cityField: 'city', passwordField: 'password'},
        {usernameField: 'email', passwordField: 'password', passReqToCallback: true},
        async (req, email, password, done) => {
            try {
                const user = await UserModel.create({ email, city: req.body.city, isSubscribed: true, password });

                return done(null, user);
            } catch (error) {
                done(error);
            }
        }
    )
);


passport.use(
    'login',
    new localStrategy(
        {usernameField: 'email', passwordField: 'password'},
        async (email, password, done) => {
            try {
                const user = await UserModel.findOne({ email });
    
                if (!user) {
                    return done(null, false, { message: 'User not found' });
                }
    
                const validate = await user.isValidPassword(password);
    
                if (!validate) {
                    return done(null, false, { message: 'Wrong Password' });
                }
    
                return done(null, user, { message: 'Logged in Successfully' });
            } catch (error) {
                return done(error);
            }
        }
    )
);



// verify the JWT tokens haven’t been manipulated and are valid

const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const {jwtSignKey} = require("../config.json");

passport.use(
    new JWTstrategy(
        {
            secretOrKey: jwtSignKey,
            jwtFromRequest: ExtractJWT.fromUrlQueryParameter('secret_token')
        },
        async (token, done) => {
            try {
                return done(null, token.user);
            } catch (error) {
                done(error);
            }
        }
    )
);