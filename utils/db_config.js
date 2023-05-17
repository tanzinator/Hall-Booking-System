/*My Sql Database Connection*/
var mysql = require('mysql');
var nqb = require('node-querybuilder');

var db_settings = {
	host: 'maruti.cwslc2braqwi.ap-south-1.rds.amazonaws.com',
	user: 'admin',
	password: '6UfTELp9R3r4lZLMIuqj',
	database: 'maruti_mandir_venue'
};
/*var db_settings = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'maruti_mandir_venue'
};*/

//     database:'covidav',
//     host:'localhost',
//     user:'root',
//     password:'Nishadh!23'

var qb = new nqb(db_settings, 'mysql', 'single');
var connect;
//var qb = require('node-querybuilder').QueryBuilder(db_settings, 'mysql', 'single');

function handleDisconnect() {
	connect = mysql.createConnection(db_settings);
	connect.connect(function (err) {              // The server is either down
		if (err) {                                     // or restarting (takes a while sometimes).
			console.log('error when connecting to db:', err);
			setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
		}                                     // to avoid a hot loop, and to allow our node script to
	});                                     // process asynchronous requests in the meantime.
	// If you're also serving http, display a 503 error.
	connect.on("err", function (err) {


		if (err.code == "PROTOCOL_CONNECTION_LOST") {
			handleDisconnect();
		}
		else {                                      // connnection idle timeout (the wait_timeout
			throw err;                                  // server variable configures this)
		}

	});
}

handleDisconnect();

module.exports.qb = qb;

/*Base Url*/
var base_url = 'https://localhost:8000/';
module.exports.base_url = base_url;


//var mysql = require('mysql');

/*var db_settings = {
	host: 'us-cdbr-iron-east-02.cleardb.net',
	user: 'b925987b32e5af',
	password: '44f7fa8d',
	database: 'heroku_6c45bd4f8ce0063'
};*/



//module.exports.qb = qb;

