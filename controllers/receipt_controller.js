var express = require("express");
var db = require("../utils/db_config");
var app = express();
var bodyParser = require("body-parser");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const moment = require("moment");

module.exports = app;
app.use(bodyParser.json());

var first_name, last_name, activities, amount, receiptId, imageData;

//RECEIPT
function checkUserAuthentication(req, res) {
  if (req.user) {
    return true;
  } else {
    res.redirect("/admin/login");
  }
}

app.post("/add-receipt", function (req, res) {
  
  var activityName;
  if (req.body.activities == "") {
    activityName = "CUSTOM";
  } else {
    activityName = req.body.activities;
  }

 
    if (checkUserAuthentication(req, res)) {

      var receiptIdSQL = "select max(receipt_id)+1 as receipt_id from receipt_details";
      db.qb.query(receiptIdSQL, function (err, receiptRes) {
        receiptId = receiptRes[0]["receipt_id"];
        var insert_receipt = {
          receipt_id: receiptId,
          first_name: req.body.firstName,
          last_name: req.body.lastName,
          total_amount: parseInt(req.body.amount),
          signature: req.body.imageData,
          services: activityName
        };
        first_name = req.body.firstName;
        last_name = req.body.lastName;
        activities = activityName;
        amount = req.body.amount;
        imageData = req.body.imageData;
  
        
        // insert outlet
        db.qb.insert("receipt_details", insert_receipt, function (error, results) {
          console.log(results);
        });
  
        res.send({ some: JSON.stringify({ response: "json" }) });
      })
    }
    else{
      res.send('Not Logged In');
    }

  

  
});
app.get("/create_receipt", function (req, res) {
  if (checkUserAuthentication(req, res)) {
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
          servicesList: serviceResponse,
      
        };
        res.render("receipt_home", data);
      });
    });
  }
});

app.get("/createinvoice", function (req, res) {
  if (typeof (imageData) != 'undefined') {
    var base64Data = imageData.replace(/^data:image\/png;base64,/, "");
  }
  fs.writeFile("signature.png", base64Data, "base64", function (err) {
    console.log(err);
  });
  setTimeout(function () {
    createInvoice(res);
  }, 2000);
});

//Reports
app.get("/reports", (req, res, next) => {
  return res.render("reports-home");
});

app.get("/detailed-report", (req, res, next) => {
  return res.render("generate-detailed");
});

app.get("/summary-report", (req, res, next) => {
  return res.render("generate-summary");
});

app.post("/detailed-report", (req, res, next) => {
  const fromDate = req.body.fromDate;
  const toDate = req.body.toDate;
  console.log(fromDate, toDate);
  if (fromDate > toDate) {
    return res.redirect("/reports/detailed");
  }

  const query =
    "SELECT * FROM receipt_details WHERE receipt_created_at BETWEEN'" +
    fromDate +
    " 00:00:00" +
    "' AND  '" +
    toDate +
    " 23:59:59" +
    "'";

  db.qb.query(query, (err, resp) => {
    resp.forEach(curr => {
      curr.ISTCreatedAt = new Date(
        new Date(curr.receipt_created_at).getTime() + 5.5 * 60 * 60 * 1000
      ).toLocaleString();

    });
    return res.render("detailed-report", {
      fromDate: fromDate,
      toDate: toDate,
      receipts: resp
    });
  });
});

app.post("/summary-report", (req, res, next) => {
  const fromDate = req.body.fromDate;
  const toDate = req.body.toDate;
  console.log(fromDate, toDate);
  if (fromDate > toDate) {
    return res.redirect("/reports/summary");
  }

  const query =
    "SELECT SUM(total_amount) AS total FROM receipt_details WHERE receipt_created_at BETWEEN'" +
    fromDate +
    "' AND  '" +
    toDate +
    "'";

  db.qb.query(query, (err, resp) => {
    return res.render("summary-report", {
      fromDate: fromDate,
      toDate: toDate,
      totalAmount: resp[0].total
    });
  });
});

function createInvoice(res) {
  let doc = new PDFDocument({ size: "A7", margin: 10 });
  console.log("1212");
  generateHeader(doc);
  generateCustomerInformation(doc);
  //generateInvoiceTable(doc, invoice);
  // generateFooter(doc);

  doc.end();
  //doc.pipe(fs.createWriteStream("invoice1.pdf"));
  //const file = fs.createWriteStream(path)
  //res.setHeader('Content-disposition', 'attachment; filename=' + 'receipt' + new Date().toISOString() + '.pdf')

  doc.pipe(res);
  // return res.render('index2');
  // return res.redirect('/')
}

function generateHeader(doc) {
  doc
    .image("newmaruti7899.png", 79, 13, { fit: [65, 65] })
    // .fillColor("#444444")
    // .image("Maruti2.png", 65, 10, { fit: [70,70]})

    .fontSize(10)
    .text("Receipt No.:" + receiptId, 25, 85)

    .moveDown();
}

function generateCustomerInformation(doc) {
  doc
    // .fillColor("#444444")
    .fontSize(10)
    .text("Date:" + formatDate(new Date()), 25, 74);

  //generateHr(doc, 185);

  const customerInformationTop = 105;

  doc
    .fontSize(10)
    .text("Received from:", 25, customerInformationTop)
    // .font("Helvetica-Bold")
    // .text('Devotee', 125, customerInformationTop)
    // .image('signature.png', {
    //   fit: [80, 80],
    //   align: 'right',
    //   valign: 'center'
    // })
    .image("signature.png", 93, customerInformationTop - 10, { fit: [60, 60] })
    .font("Samanata.ttf")
    .text("For Services:", 25, customerInformationTop + 28)
    .fontSize(8)
    .text(activities, 100, customerInformationTop + 25)
    .fontSize(10)
    .text("Payment Amount:", 25, customerInformationTop + 55)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Rs. " + parseInt(amount), 125, customerInformationTop + 57);

  //.image("signature.png", 50, 50, { align: "right" })

  /*.font("Helvetica-Bold")
    .text(invoice.shipping.name, 300, customerInformationTop)
    .font("Helvetica")
    .text(invoice.shipping.address, 300, customerInformationTop + 15)
    .text(
      invoice.shipping.city +
      ", " +
      invoice.shipping.state +
      ", " +
      invoice.shipping.country,
      300,
      customerInformationTop + 30
    )
    .moveDown();*/

  generateHr(doc, 177);
}

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(25, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(cents) {
  return "$" + (cents / 100).toFixed(2);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  return day + "/" + month + "/" + year;
}
