var express = require("express");
var db = require("../utils/db_config");
var app = express();
var bodyParser = require("body-parser");
var nodemailer = require("nodemailer");
var passport = require("passport");
var path = require("path");
var instance = require("../utils/razorpay");
var callbackController = require("./callbackController");
const fs = require("fs");
const { createInvoice } = require("./pdfinvoice");
const { getDefaultSettings } = require("http2");
const { type } = require("os");
module.exports = app;
app.use(bodyParser.json());

var adminEmail = [];

var successId;

app.post("/marutiwebhook", callbackController.eventListener);

//RECEIPT

app.get("/create_receipt", function (req, res) {
  const sql = "select max(receipt_id) as receipt_id from receipt_details";
  const serviceSql = "select * from services";
  db.qb.query(sql, function (err, receiptResponse) {
    db.qb.query(serviceSql, function (err, serviceResponse) {
      var receiptId;
      console.log("TTTT" + receiptResponse[0]["receipt_id"]);
      if (receiptResponse[0]["receipt_id"] == null) {
        receiptId = 1;
      } else if (receiptResponse[0]["receipt_id"] != null) {
        receiptId = receiptResponse[0]["receipt_id"] + 1;
      }
      var data = {
        receiptId: receiptId,
        servicesList: serviceResponse
      };
      res.render("receipt_home", data);
    });
  });
});

app.get("/", function (req, res) {
  const sql = "select * from venues";
  db.qb.query(sql, function (err, venuesResponse) {
    //console.log("TTTT" + venuesResponse[0]['receipt_id'])
    var data = {
      venuesResponse: venuesResponse
    };
    res.render("index", data);
  });
});

app.get("/booking-success", function (req, res) {
  if (req.query.success_id == successId) {
    res.render("booking_success");
  } else {
    res.redirect("/");
  }
});

app.get("/getImage/:img_name", (req, res) => {
  res.sendFile(path.join(__dirname, "../uploads/" + req.params.img_name));
});

app.get("/bookingDetails/:venues_id", (req, res) => {
  const venuesql =
    "select * from venues where venue_id=" + req.params.venues_id;

  db.qb.query(venuesql, function (err, venueResponse) {
    var data = {
      venues: venueResponse
    };
    res.render("booking_details", data);
  });
});

//validate date
app.post("/validateDate", (req, res) => {
  var formattedDatesArray = req.body.dateArray;
  console.log(formattedDatesArray);
  // var requestedDate = req.body.requested_date;
  /* console.log(req.body.requested_date)
     var inpDate = req.body.requested_date.split("/")
     m = inpDate[1]
     d = inpDate[0]
     y = inpDate[2]
     var requestedDate = (new Date(y + "-" + m + "-" + d)).toISOString()
     console.log(req.body.venue_name)*/

  var getDatequery =
    "select * from venue_bookings where booking_status='Paid' and venue_name='" +
    req.body.venue_name +
    "'";
  db.qb.query(getDatequery, function (er, dateRes) {
    var bookedDateArray = [];
    if (dateRes.length > 0) {
      dateRes.forEach(function (element) {
        var bookingDate = new Date(element.booking_date + 1000 * 60 * 60 * 5.5);
        bookedDateArray.push(bookingDate);
        getFormattedDateArray(bookedDateArray, formattedDatesArray);
      });
    }
    res.send({ blockedDatesArray: formattedDatesArray });
  });
});

app.post("/getBlockedDates", function (req, res) {
  var formattedDatesArray = [];

  console.log("BLOCKED DATE called");
  console.log("ded" + req.body.venue_name);
  const dateBlockingsql =
    "select * from venue_blockings where approval_status='ABL' and venue_name='" +
    req.body.venue_name +
    "'";
  db.qb.query(dateBlockingsql, function (err, dateBlockRes) {

    var dateArray = [];
    //parse from and to dates to add to blocking dates array
    if (typeof dateBlockRes != "undefined" || dateBlockRes.length > 0) {
      dateBlockRes.forEach(function (element) {
        var endDate = new Date(element.to_date + 1000 * 60 * 60 * 5.5);
        var fromDate = new Date(element.from_date + 1000 * 60 * 60 * 5.5);
        getDates(fromDate, endDate, dateArray);
      });
      getFormattedDateArray(dateArray, formattedDatesArray);
      //console.log(formattedDatesArray.toString())
    }
    res.send({ datesArray: formattedDatesArray });
  });
});

function getFormattedDateArray(dateArr, formattedDatesArray) {
  if (dateArr.length > 0) {
    for (var i = 0; i < dateArr.length; i++) {
      var month = dateArr[i].getMonth() + 1 + "";
      var day = dateArr[i].getDate() + "";
      var year = dateArr[i].getFullYear() + "";
      month = checkZero(month);
      day = checkZero(day);
      year = checkZero(year);
      var a = (day + "/" + month + "/" + year).toString();
      if (!formattedDatesArray.includes(a)) {
        formattedDatesArray.push(a);
      }
    }
  }
}

function checkZero(data) {
  if (data.length == 1) {
    data = "0" + data;
  }
  return data;
}

function getDates(from_date, to_date, dateArray) {
  var currentDate = from_date;
  while (currentDate <= to_date) {
    dateArray.push(currentDate);
    currentDate = currentDate.addDays(1);
  }
}

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

//submit boooking
app.post("/submitBooking", (req, res) => {
  var maxBookingId;
  var inpDate = req.body.booking_date.split("/");
  m = inpDate[1];
  d = inpDate[0];
  y = inpDate[2];
  var bookingDate = new Date(y + "-" + m + "-" + d).toISOString();
  console.log(bookingDate + "BOOKINGDATE");
  //console.log(new Date().getMilliseconds())
  var bookingIdSql = "select max(booking_id) as booking_id from venue_bookings";
  db.qb.query(bookingIdSql, function (err, bookRes) {
    console.log(typeof bookRes[0]["booking_id"] + " maxbookingid");
    if (bookRes[0]["booking_id"] === null) {
      maxBookingId = 1;
    } else {
      maxBookingId = bookRes[0]["booking_id"] + 1;
    }

    //var bookingId = randomString(16, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
    var insertBooking = {
      booking_id: maxBookingId,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      mobile_number: req.body.mobile_number,
      aadhar: req.body.aadhar,
      pan: req.body.pan,
      billing_address: req.body.billing_address,
      gstin: req.body.gstin,
      booking_date: bookingDate.split("T")[0],
      occasion_type: req.body.occasion_type,
      venue_name: req.body.venue_name,
      original_amount: req.body.price,
      email: req.body.email,
      approved_amount: 0,
      approved_by: "",
      discount: 0,
      booking_status: "Awaiting Approval"
    };
    db.qb.insert("venue_bookings", insertBooking, function (err, results) {
      if (err) {
        console.log("booking date", bookingDate);
        console.log(err);
      }
      if (!err) {
        var getAdminEmailSql = "select email from user where active='YES'";

        db.qb.query(getAdminEmailSql, function (adminReq, adminEmailRes) {
          console.log("EMAILRES" + adminEmailRes);

          //Extract Email
          adminEmailRes.forEach(function (element) {
            adminEmail.push(element.email);
          });
          //adminEmail.push(req.body.email);

          var adminEmailText =
            "<p>Dear Sir/Madam,<br><br>Booking Id " +
            "<b>" +
            maxBookingId +
            "</b>" +
            " is generated.<br>Please visit the below link to approve the booking : https://marutimandir.com/admin/login <br><br>PLEASE NOTE THAT THIS IS A COMPUTER GENERATED REPORT </p>";
          var userEmailText =
            "<p>Dear Sir/Madam,<br><br>Booking Request for Hall " +
            "<b>" +
            req.body.venue_name +
            "</b>" +
            " on " +
            "<b>" +
            req.body.booking_date +
            "</b>" +
            " has been successfully submitted. You will receive a payment link shortly.<br><br>" +
            "Please use the Booking Id " +
            "<b>" +
            maxBookingId +
            "</b>" +
            " for further communication.<br><br>PLEASE NOTE THAT THIS IS A COMPUTER GENERATED REPORT";

          //nodemailer
          var transporter = nodemailer.createTransport({
            service: `gmail`,
            auth: {
              user: `marutimandirdavorlim@gmail.com`,
              pass: `crwtvizsvgvblhom` 
            }
          });
          mailOptionsAdmin = {
            from: '"Hall Booking" <marutimandirdavorlim@gmail.com> ',
            to: adminEmail,
            cc: 'marutimandirdavorlim@gmail.com',
            subject: "Hall Booking",
            html: adminEmailText
          };
          mailOptions = {
            from: '"Hall Booking" <marutimandirdavorlim@gmail.com> ',
            to: req.body.email,
            cc: 'marutimandirdavorlim@gmail.com',
            subject: "Hall Booking",
            html: userEmailText
          };
          //admin
          transporter.sendMail(mailOptionsAdmin, function (err, info) {
            if (err) {
              console.log("Failed to send mail" + err);
            } else console.log(info + "Mail sent sucessfully");
          });
          //user
          transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
              console.log("Failed to send mail" + err);
            } else console.log(info + "Mail sent sucessfully");
          });
        });
      }
    });
  });
  successId = generateID(4);
  res.redirect("/booking-success/?success_id=" + successId);
});

function generateID(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

//ADMIN

app.get("/admin/home", (req, res) => {
  if (checkUserAuthentication(req, res)) {
    var bookingSql = "select * from venue_bookings order by booking_id desc";

    db.qb.query(bookingSql, function (err, bookingRes) {
      var data = {
        bookingList: bookingRes,
        message: req.flash("approvalStatus"),
        olderDateMessage: req.flash("olderDate"),
        blockBooking: req.flash("blockBooking"),
        cashPayment: req.flash("cashPayment"),
        adhocRequest: req.flash("adhocRequest")
      };
      res.render("view_booking_table", data);
    });
  }
});

app.get("/admin/login", (req, res) => {
  res.render("admin_login", { message: req.flash("loginMessage") });
});

app.get("/admin/signup", (req, res) => {
  res.render("admin_register", { message: req.flash("loginMessage") });
});

app.post(
  "/admin/login",
  passport.authenticate("local-login", {
    successRedirect: "/admin/home", // redirect to the secure profile section
    failureRedirect: "/admin/login", // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  })
);

app.post(
  "/admin/signup",
  passport.authenticate("local-signup", {
    successRedirect: "/admin/home", // redirect to the secure profile section
    failureRedirect: "/admin/signup", // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  })
);

app.get("/admin/logout", function (req, res) {
  req.logout();
  res.redirect("/admin/login");
});

//view booking id
app.get("/admin/booking_id/:id", (req, res) => {
  if (checkUserAuthentication(req, res)) {
    var role_name = req.user.role_name;
    var bookingId = req.params.id;
    console.log(bookingId);
    var approveDisable, discountDisable;
    var cancelBooking = false;

    var approvalDetailsSql =
      "select * from approval_details where email='" +
      req.user.email +
      "'" +
      "and booking_id ='" +
      bookingId +
      "'";

    if (typeof bookingId != "undefined") {
      var bookingSql =
        "select * from venue_bookings where booking_id='" + bookingId + "'";

      db.qb.query(bookingSql, function (err, bookingres) {
        console.log("DATE NOW " + new Date(Date.now() + 1000 * 60 * 60 * 5.5));

        if (
          bookingres[0]["booking_date"] <
          new Date(Date.now() + 1000 * 60 * 60 * 5.5)
        ) {
          //req.flash('olderDate', 'Selected Booking is of a past date. Please select another booking')
          //res.redirect('/admin/home')
          approveDisable = true;
          discountDisable = true;
        } else {
          db.qb.query(approvalDetailsSql, function (err, approvalres) {
            if (err) {
              console.log(err + " APPROVAL STATUS ERR");
            }
            if (approvalres.length > 0) {
              approveDisable = true;
              discountDisable = true;
            } else if (approvalres.length == 0) {
              if (
                bookingres[0]["booking_status"] == "AD2" ||
                bookingres[0]["booking_status"] == "A2" ||
                bookingres[0]["booking_status"] == "Paid" ||
                bookingres[0]["booking_status"] == "Cancelled"
              ) {
                approveDisable = true;
                discountDisable = true;
              }
              if (
                bookingres[0]["booking_status"] == "A1" ||
                bookingres[0]["booking_status"] == "AD1"
              ) {
                approveDisable = false;
                discountDisable = true;
              }
              if (bookingres[0]["booking_status"] == "Awaiting Approval") {
                approveDisable = false;
                discountDisable = false;
              }
            }
          });
        }
        setTimeout(function () {
          console.log(approveDisable)
          console.log(discountDisable)
          var data = {
            bookingListById: bookingres[0],
            approveDisable: approveDisable,
            discountDisable: discountDisable,
            cancelBooking: cancelBooking,
            role_name: role_name
          };
          console.log(bookingres[0].discount_recommended_by);
          res.render("view_booking_record", data);
        }, 2000)
      });
    }
  }
});

//approve booking

app.post("/admin/approve_booking", (req, res) => {
  if (checkUserAuthentication(req, res)) {
    var bookingId = req.body.booking_id;
    var adminEmailId = req.user.email;
    var discount = parseInt(req.body.discount);
    var approval_status = req.body.approval_status;

    var today = new Date();
    var approvalDate = new Date(
      Date.now() + 1000 * 60 * 60 * 5.5
    ).toISOString();
    console.log("APPOVAL DATE " + approvalDate);

    console.log(approval_status);

    var getBookingSql =
      "select * from venue_bookings where booking_id='" + bookingId + "'";

    var getAdminEmailSql = "select email from user where active='YES'";

    db.qb.query(getAdminEmailSql, function (adminReq, adminEmailRes) {
      db.qb.query(getBookingSql, function (err, bookingRes) {
        var updatedStatus;
        if (!err) {
          if (typeof bookingRes != "undefined") {
            if (approval_status == "Awaiting Approval") {
              if (discount > 0) {
                updatedStatus = "AD1";
              } else if (discount <= 0) {
                updatedStatus = "A1";
              }
            } else if (approval_status == "A1") {
              updatedStatus = "A2";
              console.log("here");
              sendPaymentLink(bookingRes);
              //payment code here
            } else if (approval_status == "AD1") {
              updatedStatus = "AD2";
              sendPaymentLink(bookingRes);
              //payment code here
            }
          }

          console.log(today + "TODAY");
          var statusUpdate = {
            booking_status: updatedStatus,
            discount: discount,
            approved_amount: parseInt(req.body.total_amount),
            discount_recommended_by: req.body.discount_rec,
            approved_by: adminEmailId
          };

          //approval details insert
          var approvalDetails = {
            booking_id: bookingId,
            email: adminEmailId,
            venue_name: req.body.venue_name,
            from_state: approval_status,
            to_state: updatedStatus,
            approval_type: "Hall-Booking",
            approval_date: approvalDate.split("T")[0]
          };

          //booking status update
          db.qb.update(
            "venue_bookings",
            statusUpdate,
            { booking_id: bookingId },
            function (err, rr) { }
          );

          //Extract Email
          adminEmailRes.forEach(function (element) {
            adminEmail.push(element.email);
          });

          //nodemailer after each approval
          var adminEmailText =
            "<p>Dear Sir/Madam, <br> Booking Id " +
            "<b>" +
            bookingId +
            "</b>" +
            " has been approved by " +
            "<b>" +
            adminEmailId +
            "</b>" +
            " and approval status has been changed from " +
            "<b>" +
            approval_status +
            "</b>" +
            " to " +
            "<b>" +
            updatedStatus +
            "</b>" +
            "<br><br>Please visit the below link: https://marutimandir.com/admin/login <br><br>PLEASE NOTE THAT THIS IS A COMPUTER GENERATED REPORT </p>";

          var transporter = nodemailer.createTransport({
            service: `gmail`,
            auth: {
              user: `marutimandirdavorlim@gmail.com`,
              pass: `crwtvizsvgvblhom`
            }
          });
          mailOptionsAdmin = {
            from: '"Approval Status" <marutimandirdavorlim@gmail.com> ',
            cc: 'marutimandirdavorlim@gmail.com',
            to: adminEmail,
            subject: "Approval Status",
            html: adminEmailText
          };
          //admin
          transporter.sendMail(mailOptionsAdmin, function (err, info) {
            if (err) {
              console.log("Failed to send mail" + err);
            } else console.log(info + " Approve Mail sent sucessfully");
          });

          db.qb.insert("approval_details", approvalDetails, function (
            err,
            r
          ) { });

          req.flash(
            "approvalStatus",
            "Approval Status changed from " +
            bookingRes[0]["booking_status"] +
            " to " +
            updatedStatus
          );
          res.redirect("/admin/home");
        }
      });
    });
  }
});
function checkUserAuthentication(req, res) {
  if (req.user) {
    return true;
  } else {
    res.redirect("/admin/login");
  }
}

app.get("/admin/view_approvals", function (req, res) {
  console.log(req.user);
  if (checkUserAuthentication(req, res)) {
    console.log("BBBBB");
    var approvalSql =
      "select * from approval_details order by approval_date desc";
    db.qb.query(approvalSql, (err, approvalRes) => {
      var data = {
        approvalList: approvalRes
      };
      res.render("view_approval_history", data);
    });
  }
});

app.get("/admin/view_my_approvals", function (req, res) {
  if (checkUserAuthentication(req, res)) {
    var approvalSql =
      "select * from approval_details where email='" + req.user.email + "'";
    db.qb.query(approvalSql, (err, approvalRes) => {
      var data = {
        approvalList: approvalRes
      };
      res.render("view_approval_history", data);
    });
  }
});

//create venue blocking
app.get("/admin/block-bookings", function (req, res) {
  if (checkUserAuthentication(req, res)) {
    var venueSql = "select * from venues";
    db.qb.query(venueSql, function (err, venRes) {
      var data = {
        venueList: venRes,
        message: req.flash("blockcheckErr")
      };
      res.render("view_create_venue_blocking", data);
    });
  }
});
//REPORTS Code
app.get("/admin/reports", (req, res, next) => {
  if (checkUserAuthentication(req, res)) {
    res.render("reports_home");
  }
});

app.post("/admin/reports", (req, res, next) => {
  if (checkUserAuthentication(req, res)) {
    const fromDate = new Date(req.body.fromDate).getTime();
    const toDate = new Date(req.body.toDate).getTime();

    const sql =
      "SELECT * FROM payments WHERE issuedat BETWEEN " +
      fromDate +
      " AND " +
      toDate;
    db.qb.query(sql, (err, resp) => {
      if (err) {
        console.log(err);
      }
      return res.render("view_report", {
        data: resp,
        fromDate: req.body.fromDate,
        toDate: req.body.toDate
      });
    });
  }
});
//REPORTS Code ends here

app.post("/admin/insert_block_booking", function (req, res) {
  if (checkUserAuthentication(req, res)) {
    var fromDate = req.body.from_date.split("/");
    var toDate = req.body.to_date.split("/");
    fm = fromDate[1];
    fd = fromDate[0];
    fy = fromDate[2];
    tm = toDate[1];
    td = toDate[0];
    ty = toDate[2];
    var finalFromDate = new Date(fy + "-" + fm + "-" + fd).toISOString();
    var finalToDate = new Date(ty + "-" + tm + "-" + td).toISOString();

    //check if a blocking with start and end date already exists
    var blockchecksql =
      "select * from venue_blockings where venue_name='" +
      req.body.venue_name +
      "' and approval_status='ABL' and from_date='" +
      finalFromDate +
      "' and to_date='" +
      finalToDate +
      "'";

    var insertBlockingData = {
      venue_name: req.body.venue_name,
      from_date: finalFromDate.split("T")[0],
      to_date: finalToDate.split("T")[0],
      reason: req.body.reason,
      requested_by: req.user.email,
      approved_by: "",
      approval_status: "Awaiting Approval"
    };

    db.qb.query(blockchecksql, function (err, blockcheckRes) {
      if (blockcheckRes.length > 0) {
        req.flash(
          "blockcheckErr",
          "There already exists a date blocking from " +
          req.body.from_date +
          " to " +
          req.body.to_date
        );
        res.redirect("/admin/block-bookings");
      } else {
        db.qb.insert("venue_blockings", insertBlockingData, (err, blockRes) => {
          if (err) {
            console.log("ERROR WHILE INSERTING VENUE_BLOCKING " + err);
          } else {
            var getAdminEmailSql = "select email from user where active='YES'";
            db.qb.query(getAdminEmailSql, function (adminReq, adminEmailRes) {
              console.log("EMAILRES" + adminEmailRes);

              //Extract Email
              adminEmailRes.forEach(function (element) {
                adminEmail.push(element.email);
              });
              var adminEmailText =
                "<p>Dear Sir/Madam, <br> Request for Blocking Hall " +
                "<b>" +
                req.body.venue_name +
                "</b>" +
                " has been been submitted by " +
                "<b>" +
                req.user.email +
                "</b>" +
                " from " +
                "<b>" +
                req.body.from_date +
                "</b>" +
                " to " +
                "<b>" +
                req.body.to_date +
                "</b>" +
                "<br><br>Please visit the below link:https://marutimandir.com/admin/login" +
                "<br><br>PLEASE NOTE THAT THIS IS A COMPUTER GENERATED REPORT </p>";
              var subject = "Request for Blocking Hall";
              var mailType = "Request for Blocking Hall";

              processNodeMailer(adminEmailText, subject, mailType);
            });
          }
        });
        req.flash(
          "blockBooking",
          "Request for blocking " +
          req.body.venue_name +
          " from " +
          req.body.from_date +
          " to " +
          req.body.to_date +
          " has been successfully submitted and awaiting approval."
        );
        res.redirect("/admin/home");
      }
    });
  }
});

app.get("/admin/view_blocked_bookings", function (req, res) {
  if (checkUserAuthentication(req, res)) {
    var venueBlockingsSql =
      "select * from venue_blockings order by blocking_date desc";
    db.qb.query(venueBlockingsSql, function (err, blockRes) {
      var data = {
        blockingList: blockRes
      };
      res.render("view_blocking_history", data);
    });
  }
});

app.get("/admin/blocked_record/:block_id", function (req, res) {
  if (checkUserAuthentication(req, res)) {
    var blocking_id = req.params.block_id;
    const bookingsql =
      "select * from venue_blockings where id=" + parseInt(blocking_id);
    db.qb.query(bookingsql, function (err, bookingResponse) {
      var approveDisable = false;
      if (
        bookingResponse[0]["requested_by"] == req.user.email ||
        bookingResponse[0]["approved_by"] != ""
      ) {
        approveDisable = true;
      }
      var data = {
        blockingList: bookingResponse[0],
        approveDisable: approveDisable,
        role_name: req.user.role_name
      };
      console.log(req.user.role_name);
      res.render("view_blocked_record", data);
    });
  }
});

//Approve Blocking
app.post("/admin/approve_blocking", function (req, res) {
  if (checkUserAuthentication(req, res)) {
    var statusUpdate = {
      approved_by: req.user.email,
      approval_status: "ABL"
    };

    //insert approval history
    var approvalDate = new Date(
      Date.now() + 1000 * 60 * 60 * 5.5
    ).toISOString();
    var approval_history = {
      email: req.user.email,
      booking_id: "NA",
      venue_name: req.body.venue_name,
      from_state: req.body.approval_status,
      to_state: "ABL",
      approval_type: "Hall-Blocking",
      approval_date: approvalDate.split("T")[0]
    };

    db.qb.insert("approval_details", approval_history, function (err, appRes) {
      if (err) {
        console.log("ERROR INSERTING APPROVAL DATA ", err);
      } else {
        //blocking status update
        db.qb.update(
          "venue_blockings",
          statusUpdate,
          { id: parseInt(req.body.id) },
          function (err, rr) { }
        );

        var getAdminEmailSql = "select email from user where active='YES'";
        db.qb.query(getAdminEmailSql, function (adminReq, adminEmailRes) {
          console.log("EMAILRES" + adminEmailRes);

          //Extract Email
          adminEmailRes.forEach(function (element) {
            adminEmail.push(element.email);
          });

          var adminEmailText =
            "<p>Dear Sir/Madam, <br> Request for blocking hall " +
            "<b>" +
            req.body.venue_name +
            "</b>" +
            " has been been been approved by " +
            "<b>" +
            req.user.email +
            "<br><br>PLEASE NOTE THAT THIS IS A COMPUTER GENERATED REPORT </p>";
          var subject = "Blocking Approval";
          var mailType = "Blocking Approval";

          processNodeMailer(adminEmailText, subject, mailType);
        });
      }
    });

    req.flash(
      "approvalStatus",
      "Approval Status changed from " + req.body.approval_status + " to ABL"
    );
    res.redirect("/admin/home");
  }
});

//Cancel Booking
app.get("/admin/cancel_booking/:booking_id", function (req, res) {
  if (checkUserAuthentication(req, res)) {
    var bookingId = req.params.booking_id;
    var bookingSql =
      "select * from venue_bookings where booking_id=" + parseInt(bookingId);
    db.qb.query(bookingSql, function (err, bookRes) {
      var data = {
        bookingListById: bookRes[0],
        role_name: req.user.role_name
      };
      res.render("view_cancel_booking", data);
    });
  }
});

app.post("/admin/cancel_booking", (req, res) => {
  if (checkUserAuthentication(req, res)) {
    var bookingId = req.body.booking_id;

    //insert approval history
    var approvalDate = new Date(
      Date.now() + 1000 * 60 * 60 * 5.5
    ).toISOString();
    var approval_history = {
      email: req.user.email,
      booking_id: bookingId,
      venue_name: req.body.venue_name,
      from_state: req.body.approval_status,
      to_state: "Cancelled",
      approval_type: "Booking-Cancelled",
      approval_date: approvalDate.split("T")[0]
    };
    db.qb.insert("approval_details", approval_history, function (err, appRes) {
      if (err) {
        console.log("ERROR INSERTING APPROVAL DATA ", err);
      }
      var updateVenueBooking = {
        booking_status: "Cancelled"
      };
      db.qb.update(
        "venue_bookings",
        updateVenueBooking,
        { booking_id: bookingId },
        function (err, rr) { }
      );

      //mailer code
      var getAdminEmailSql = "select email from user where active='YES'";
      db.qb.query(getAdminEmailSql, function (adminReq, adminEmailRes) {
        console.log("EMAILRES" + adminEmailRes);

        //Extract Email
        adminEmailRes.forEach(function (element) {
          adminEmail.push(element.email);
        });

        var adminEmailText =
          "<p>Dear Sir/Madam, <br> Booking Id " +
          "<b>" +
          bookingId +
          "</b>" +
          " has been cancelled by " +
          "<b>" +
          req.user.email +
          "</b>" +
          " and approval status has been changed from " +
          "<b>" +
          req.body.approval_status +
          "</b>" +
          " to " +
          "<b>" +
          "Cancelled" +
          "</b>" +
          "<br><br>PLEASE NOTE THAT THIS IS A COMPUTER GENERATED REPORT </p>";
        var subject = "Booking Cancelled";
        var mailType = "Cancellation";

        processNodeMailer(adminEmailText, subject, mailType);
      });
    });

    req.flash(
      "approvalStatus",
      "Approval Status changed from " +
      req.body.approval_status +
      " to Cancelled"
    );
    res.redirect("/admin/home");
  }
});

// Cash Payment

app.get("/admin/record-cash-payment/:booking_id", (req, res) => {
  if (checkUserAuthentication(req, res)) {
    var bookingId = req.params.booking_id;
    var cashSql =
      "select * from venue_bookings where booking_id=" + parseInt(bookingId);
    db.qb.query(cashSql, function (err, cashRes) {
      var data = {
        bookingListById: cashRes[0],
        role_name: req.user.role_name
      };
      res.render("view_create_cash_payment", data);
    });
  }
});

app.post("/admin/insert_cash_payment", (req, res) => {
  if (checkUserAuthentication(req, res)) {
    var bookingId = req.body.booking_id;
    console.log(req.body.payment_date);
    var inpDate = req.body.payment_date.split("/");
    m = inpDate[1];
    d = inpDate[0];
    y = inpDate[2];
    var cashDate = new Date(y + "-" + m + "-" + d).toISOString();
    console.log(cashDate);

    //insert cash history
    var cash_history = {
      booking_id: bookingId,
      customer_name: req.body.customer_name,
      approved_amount: req.body.amount,
      received_by: req.body.received_by,
      received_from: req.body.received_from,
      executed_by: req.user.email,
      reference_no: req.body.reference_no,
      cash_payment_date: cashDate.split("T")[0]
    };
    db.qb.insert("cash_payments", cash_history, function (err, appRes) {
      if (err) {
        console.log("ERROR INSERTING CASH DATA ", err);
      }
      var updateVenueBooking = {
        booking_status: "Paid"
      };
      db.qb.update(
        "venue_bookings",
        updateVenueBooking,
        { booking_id: bookingId },
        function (err, rr) { }
      );

      //mailer code
      var getAdminEmailSql = "select email from user where active='YES'";
      db.qb.query(getAdminEmailSql, function (adminReq, adminEmailRes) {
        console.log("EMAILRES" + adminEmailRes);

        //Extract Email
        adminEmailRes.forEach(function (element) {
          adminEmail.push(element.email);
        });

        var adminEmailText =
          "<p>Dear Sir/Madam, <br><br>Payment of " +
          "<b>" +
          parseInt(req.body.amount) +
          "</b>" +
          " for Booking Id " +
          "<b>" +
          bookingId +
          "</b>" +
          " has been recieved " +
          "<br><br>PLEASE NOTE THAT THIS IS A COMPUTER GENERATED REPORT </p>";
        var subject = "Payment Received";
        var mailType = "Cash Payment";

        processNodeMailer(adminEmailText, subject, mailType);

        generateInvoiceForCashPayment(bookingId, res);

        req.flash(
          "cashPayment",
          "Payment of " +
          req.body.amount +
          " for Booking Id " +
          bookingId +
          " has been successfully received "
        );
        res.redirect("/admin/home");
      });
    });
  }
});

app.get("/admin/view_cash_payments", (req, res) => {
  var cashsql = "select * from cash_payments";
  db.qb.query(cashsql, (err, result) => {
    var data = {
      cashList: result
    };
    res.render("view_cash_payments", data);
  });
});

function generateInvoiceForCashPayment(bookingId, res) {
  var sql2 =
    "SELECT * FROM venue_bookings WHERE booking_id=" + parseInt(bookingId);
  db.qb.query(sql2, (err, result) => {
    if (err) {
      return res.sendStatus(301);
    } else {
      var customerGST;
      if (
        typeof result[0].gstin === "undefined" ||
        result[0].gstin.length !== 15
      ) {
        customerGST = "";
      } else {
        customerGST = result[0].gstin;
      }

      var getBookingFromPaymentSql =
        "select * from payments where bookingid=" + parseInt(bookingId);
      db.qb.query(getBookingFromPaymentSql, (err, bookRes) => {
        console.log(bookRes[0]);
        if (!err) {
          const invoiceStruct = {
            shipping: {
              name: result[0].first_name + " " + result[0].last_name
              // address: obj.payload.invoice.entity.customer_details.billing_address,
              // city: "Panaji",
              // state: "Goa",
              // country: "India",
              // postal_code: 403002
            },
            items: [
              {
                item: "Hall Booking Charges",
                description: "Hall Booking Charges",
                quantity: 1,
                amount: parseInt(result[0]["approved_amount"]) / 1.18
              }
            ],
            subtotal: (parseInt(result[0]["approved_amount"]) * 100) / 1.18,
            CGST: (9 * parseInt(result[0]["approved_amount"])) / 1.18,
            SGST: (9 * parseInt(result[0]["approved_amount"])) / 1.18,
            paid: 100 * parseInt(result[0]["approved_amount"]),
            invoice_nr: bookRes[0]["paymentid"],
            bookingId: bookingId,
            customerGST: customerGST
          };

          setTimeout(
            createInvoice,
            3000,
            invoiceStruct,
            bookRes[0]["paymentid"] + ".pdf"
          );
          //PDF Invoice Gen End

          //Invoice Mail Send Start
          setTimeout(delayedNodeMailer, 3000, result, bookRes, res);
          function delayedNodeMailer(result, bookRes, res) {
            //console.log('response0', result[0], 'obj', obj, 'res', res);
            var transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: "marutimandirdavorlim@gmail.com",
                pass: "crwtvizsvgvblhom"
              }
            });

            var mailOptions = {
              from: "marutimandirdavorlim@gmail.com",
              to: result[0].email,
              cc: 'marutimandirdavorlim@gmail.com',
              subject: "Maruti Mandir Hall Booking Invoice",
              text: `Dear Sir/Madam,\nPlease find attached the invoice towards Hall Booking Charges.\n\n\nAUTOGENERATED EMAIL`,
              attachments: {
                path: bookRes[0]["paymentid"] + ".pdf"
              }
            };

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error);
                return res.sendStatus(300);
              } else {
                console.log("Email sent: " + info.response);
                //const invoiceStatus = 'Invoice Issued'
                const newInvoiceId = bookRes[0]["paymentid"];
                var payAmount = parseInt(result[0]["approved_amount"]);
                var paidAt = new Date().getTime() - 5.5 * 3600 * 1000;
                var tax = 0.18 * (payAmount / 1.18);
                sql =
                  "UPDATE payments SET status='Invoice Issued', amountpaid=" +
                  payAmount +
                  ",paidat=" +
                  paidAt +
                  " WHERE paymentid='" +
                  newInvoiceId +
                  "'";
                db.qb.query(sql, (err, resp) => {
                  if (err) {
                    console.log(
                      "Unable to update invocice status",
                      newInvoiceId + err
                    );
                    return res.sendStatus(300);
                  }
                  if (!err) {
                    console.log("Invoice Status Updated");

                    fs.unlink("./" + newInvoiceId + ".pdf", err => {
                      if (err) {
                        console.log("File Delete Error", err);
                        return;
                      } else {
                        var updateApprovalStatus =
                          "update venue_bookings set booking_status='Paid' where booking_id=" +
                          parseInt(bookingId);
                        db.qb.query(updateApprovalStatus, function (
                          err,
                          venBookUpdate
                        ) {
                          if (err) {
                            console.log("update booking status error", err);
                            return;
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        }
      });
    }
  });
}

//ADHOC REQUESTS

app.get("/admin/adhoc_request", (req, res) => {
  if (checkUserAuthentication(req, res)) {
    const venuesql = "select * from venues";
    db.qb.query(venuesql, function (err, venueResponse) {
      var data = {
        venues: venueResponse
      };
      res.render("view_create_adhoc_request", data);
    });
  }
});

app.post("/admin/insert_adhoc_request", (req, res) => {
  var bookingDate = req.body.from_date.split("/");
  fm = bookingDate[1];
  fd = bookingDate[0];
  fy = bookingDate[2];
  var finalFromDate = new Date(fy + "-" + fm + "-" + fd).toISOString();

  var insertAdhoc = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    mobile_number: req.body.mobile_number,
    billing_address: req.body.billing_address,
    booking_date: finalFromDate.split("T")[0],
    occasion_type: req.body.occasion_type,
    venue_name: req.body.venue_name,
    email: req.body.email,
    booking_status: "Adhoc"
  };

  db.qb.insert("adhoc_requests", insertAdhoc, function (err, appRes) {
    if (!err) {
      //mailer code
      var getAdminEmailSql = "select email from user where active='YES'";
      db.qb.query(getAdminEmailSql, function (adminReq, adminEmailRes) {
        console.log("EMAILRES" + adminEmailRes);

        //Extract Email
        adminEmailRes.forEach(function (element) {
          adminEmail.push(element.email);
        });

        var adminEmailText =
          "<p>Dear Sir/Madam, <br><br> Adhoc Request for Hall " +
          "<b>" +
          req.body.venue_name +
          "</b>" +
          " on " +
          req.body.from_date +
          " has been successfully submitted " +
          "<br><br>PLEASE NOTE THAT THIS IS A COMPUTER GENERATED REPORT </p>";
        var subject = "Adhoc Request";
        var mailType = "Adhoc Request";

        processNodeMailer(adminEmailText, subject, mailType);
      });
      req.flash(
        "adhocRequest",
        "Adhoc Request for Hall " +
        req.body.venue_name +
        " on " +
        req.body.from_date +
        " has been successfully submitted "
      );
      res.redirect("/admin/home");
    }
  });
});

app.get("/admin/view_adhoc", (req, res) => {
  if (checkUserAuthentication(req, res)) {
    const adhocsql = "select * from adhoc_requests";
    db.qb.query(adhocsql, function (err, venueResponse) {
      var data = {
        adhoclist: venueResponse
      };
      res.render("view_adhoc_requests", data);
    });
  }
});

//Private Methods/Functions

function processNodeMailer(adminEmailText, subject, mailType) {
  var transporter = nodemailer.createTransport({
    service: `gmail`,
    auth: {
      user: `marutimandirdavorlim@gmail.com`,
      pass: `crwtvizsvgvblhom`
    }
  });

  mailOptionsAdmin = {
    from: subject + " <marutimandirdavorlim@gmail.com> ",
    to: adminEmail,
    cc: 'marutimandirdavorlim@gmail.com',
    subject: subject,
    html: adminEmailText
  };

  //admin
  transporter.sendMail(mailOptionsAdmin, function (err, info) {
    if (err) {
      console.log("Failed to send mail" + err);
    } else console.log(info + mailType + " Mail sent sucessfully");
  });
}

function sendPaymentLink(bookingRes) {
  console.log("payment link");
  console.log("booking res", bookingRes[0]);
  var newAmount;
  if(parseInt(bookingRes[0].approved_amount)<1){
    newAmount=1
  }
  else newAmount=parseInt(bookingRes[0].approved_amount);
  instance.invoices
    .create({
      customer: {
        name: bookingRes[0].first_name + " " + bookingRes[0].last_name,
        email: bookingRes[0].email
      },
      type: "link",
      view_less: 1,
      amount: 100 * newAmount,
      currency: "INR",
      description: "Payment Link for Maruti Mandir Hall Booking ID ",
      receipt: "TS1" + new Date().getTime(),
      sms_notify: 0,
      email_notify: 0, //Change this to rcv mobile notifs
      expire_by: null
      // "callback_url":'http://424a37cd4621.ngrok.io/marutiwebhook/',
      // "callback_method": "get"
    })
    .then(paymentLink => {
      console.log(paymentLink);
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "marutimandirdavorlim@gmail.com",
          pass: "crwtvizsvgvblhom"
        }
      });

      //   var mailBody = `Dear Sir/Madam,\nThis is with regards to your Hall Booking with booking id: ${bookingRes[0].booking_id}.\n
      //         Please find below the Payment Link to make the neccessary payment towards the membership.\n
      //         Total (inc taxes):Rs.${bookingRes[0].approved_amount}\n

      //         \n
      //         \n


      //         Payment Link: ${paymentLink.short_url}\n\n\n

      //         Please ignore if already paid.\n\n\n

      //         Please contact us for any further clarifications.\n\n
      //         Regards,\n
      //         Maruti Mandir Admin Team

      //         \n\n\nAUTOGENERATED EMAIL`;

      var mailOptions = {
        from: "marutimandirdavorlim@gmail.com",
        cc: 'marutimandirdavorlim@gmail.com',
        to: `${bookingRes[0].email}`,
        subject: `Payment for Booking ID ${bookingRes[0].booking_id}`,
        text: `Dear Sir/Madam,\nThis is with regards to your Hall Booking with booking id: ${bookingRes[0].booking_id}.\n
        Please find below the Payment to be made towards the hall booking:\n
        Total (inc taxes):Rs.${bookingRes[0].approved_amount}\n
       
        \n
        \n
        

        Please make the payment at the Maruti Temple.\n
        Supported Payment modes- Cash/Cheque/UPI.\n

        Please ignore if already paid.\n\n\n

        Please contact us for any further clarifications.\n\n
        Regards,\n
        Maruti Mandir Admin Team

        \n\n\nAUTOGENERATED EMAIL`
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          //Code to update payment link sent
          var pmtObject = {
            bookingid: bookingRes[0].booking_id,
            paymentid: paymentLink.id,
            status: "Payment Requested",
            issuedat: new Date().getTime() - 5.5 * 3600 * 1000,
            paidat: 0,
            totalamount: bookingRes[0].approved_amount,
            amountpaid: 0,
            tax: (bookingRes[0].approved_amount * 0.18) / 1.18
          };
          db.qb.insert("payments", pmtObject, function (err, results) {
            if (!err) {
              console.log("sent pmt link");
            } else {
              console.log(err);
            }
          });
          //Code to update payment link sent ends here
        }
      });
    })
    .catch(e => {
      console.log("rpay error", e);
    });
}
