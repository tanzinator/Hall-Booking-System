//mongo username mongonishadh and password- ZiS6fNl1fPP2A4bp


//Step 1: Import Core Modules
const express = require('express');
const path = require('path');

//Step 2: Import other dependencies and npm install them --save
const bodyParser = require('body-parser');
var passport = require('passport');
var session = require('cookie-session');
var flash = require('connect-flash');
const app = express();
const cron = require("node-cron");
var nodemailer = require("nodemailer");

require('./utils/passport')(passport); // pass passport for configuration

var venue_search_controller = require('./controllers/venue_search_controller');

var receipt_controller = require('./controllers/receipt_controller');



app.set('view engine', 'ejs');
app.set('views', 'views');



app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'MarutiMandirSecret',
    resave: true,
    saveUninitialized: true
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


app.use('/', venue_search_controller);
app.use('/receipt', receipt_controller)

app.get('/tncs',(req,res,next)=>{
  return res.render('tnc');
});

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "marutimandirdavorlim@gmail.com",
      pass: "crwtvizsvgvblhom"
    }
  });

  // sending emails at periodic intervals
  cron.schedule("5 8 * * 0", function(){
    console.log("---------------------");
    console.log("Running Cron Job");
    let mailOptions = {
      from: "marutimandirdavorlim@gmail.com",
      to: "bhushanshirwaikar@gmail.com",
      subject: `Email Active Trial`,
      text: `Please Ignore This Communication`
    };
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        throw error;
      } else {
        console.log("Email successfully sent!");
      }
    });
  });





app.listen(3000, function (req, res) {
    console.log("Server Started In Port 8000");
});