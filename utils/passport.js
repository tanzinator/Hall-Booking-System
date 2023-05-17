// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var db = require('../utils/db_config');
var bcrypt = require('bcrypt');

module.exports = function (passport) {
    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        db.qb.where('id', id).get('user', function (err, results) {
            if (err) {
                console.log("ID:" + err);
            }
            done(err, results[0]);
        })
    });

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'username',
        passwordField: 'password',
        activeField: 'active',
        roleField: 'role_name',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
        function (req, username, password, done) {

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            db.qb.where("email", username).get('user', function (err, results) {
                console.log(results);
                console.log("above row object");
                if (err)
                    return done(err);
                if (results.length) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {

                    // if there is no user with that email
                    // create the user
                    var newUserMysql = {
                        'email': username,
                        'password': bcrypt.hashSync(password, bcrypt.genSaltSync(10)), // use the generateHash function in our user model
                        'active': 'YES',
                        'role_name': req.body.role_name,


                    }
                    db.qb.insert('user', newUserMysql, function (err, newResults) {
                        newUserMysql.id = newResults.insertId;
                        return done(null, newUserMysql);
                    });

                }
            })
        }))





    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-login',
        new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'username',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
            function (req, username, password, done) { // callback with email and password from our form
                db.qb.where('email', username).get('user', function (err, results) {
                    console.log(results)
                    if (err) {
                        console.log("TANAY" + err)
                        return done(err);
                    }
                    if (!results.length) {
                        return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                    }
                    // if the user is found but the password is wrong
                    if (!bcrypt.compareSync(password, results[0].password)) {

                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); /// create the loginMessage and save it to session as flashdata
                    }

                    // all is well, return successful user
                    return done(null, results[0]);

                })
            })
    );
};