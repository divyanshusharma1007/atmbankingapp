
// requirements for the server and initialsing them
const express = require('express');
const hbs = require('hbs');
const path = require('path')
const math = require('math')
const app = express();
const port = process.env.port || 3000;
const validator = require('validator');
const mongoose = require("mongoose");
const async = require('hbs/lib/async');
const { request } = require('http');
const { createReadStream } = require('fs');
const e = require('express');



// establishing the connection with the database
mongoose
     .connect("mongodb://localhost:27017/atm", {})
     .then(() => {
          console.log("connection is successfull");
     })
     .catch(() => {
          console.log("some errosr is occured ");
     });




// creating our schema for the registeration of the user
const card = new mongoose.Schema({
     name: {
          type: String,
          max: 50,
          required: true
     },

     adharnumber: {
          type: String,
          max: 12,
          min: 12,
          required: true,
     },
     pannumber: {
          type: String,
          max: 12,
          min: 12,
          required: true
     },
     contactnumber: {
          type: String,
          max: 10,
          min: 10,
          required: true
     },
     accountnumber: {
          type: String,
          max: 10,
          min: 10,
          unique: true
     },
     pin: {
          type: String,
          max: 4,
          min: 4,
          required: true
     },
     balance: {
          type: Number,
          required: true
     },
     cardnumber: {
          type: Number,
          required: true,
          unique: true
     }
})



// converting our schema into the model 
let Card = new mongoose.model("Card", card)



// variables used for the transations 

let cardid = 100000000000000;
let cap;
let logdetails;


// seting partials and view engine 
app.set('view engine', 'hbs');
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
hbs.registerPartials(path.join(__dirname, "../templates/partials"))
app.set("views", path.join(__dirname, "../templates/views"))



// function used to genrate the capche 
let cap1 = () => {
     cap = math.floor(math.random(0, 10) * 10000)
     cap.toString().length < 4 ? cap + 10 : cap;
     return cap
}



// our router 

app.get("/", (req, res) => {
     res.render("home")
})
app.get("/genratecard", (req, res) => {
     res.render("genratecard")
})





// log in for the futher work

app.post("/login", async (req, res) => {
     if ((Number(req.body.cap) !== cap)) {
          cap = cap1();
          res.render("carddetails", { capche: cap, dis: "error is invalid capche" })
     }
     else {
          try {
               logdetails = await Card.find({ cardnumber: req.body.cdno, pin: `${req.body.pin}` });
               res.render("top", { name: logdetails[0].name, bal: logdetails[0].balance })
          }
          catch {
               res.render("carddetails", { capche: cap, dis: "Error is invalid capche or nanother error" })
          }
     }
})




// write your backend here
app.post("/cashdeposit", async (req, res) => {
     try {
          let card = await Card.updateOne({ cardnumber: logdetails[0].cardnumber }, { $set: { balance: Number(req.body.dep) + logdetails[0].balance } })
          res.render("home")
     }
     catch {
          res.send("some error occured")
     }
})



// changing the pin when loged in 
app.post("/changepin", async (req, res) => {
     try {
          let card = await Card.updateOne({ cardnumber: logdetails[0].cardnumber }, { $set: { pin: req.body.pin1 } })
          res.render("home")
     }
     catch {
          res.send("some error occured")
     }
})



// cash withdrawal 
app.post("/cashwithdraWL", async (req, res) => {
     try {
          if (logdetails[0].balance > req.body.bal) {
               let card = await Card.updateOne({ cardnumber: logdetails[0].cardnumber }, { $set: { balance: logdetails[0].balance - Number(req.body.bal) } })
               res.render("home")
          }
          else { res.send("some error occured") }
     }
     catch {
          res.send("some error occured")
     }
})



// geting the details form the user to genrate the card
let cardgenrateid = {}
app.post("/genratecard", async (req, res) => {
     cardgenrateid = {
          name: req.body.name,
          adharnumber: req.body.Adharnumber,
          pannumber: req.body.pannumber,
          accountnumber: req.body.accountnumber,
          contactnumber: req.body.contactnumber
     }
     // console.log(cardgenrateid)
     cap = math.floor(math.random(0, 10) * 10000)
     cap.toString().length < 4 ? cap + 10 : cap
     res.render("gp", { capche: cap })
})


// asking for the carddetails

app.get("/carddetails", (req, res) => {
     cap = cap1();
     res.render("carddetails", { capche: cap, dis: "" })
})



// making the card
app.post("/gencard", async (req, res) => {
     let count = 0;
     let er = [];
     if (!(req.body.pin1 === req.body.pin2)) {
          er.concat([" enter the same pins"])
     }
     if (Number(req.body.bal < 500)) {
          count++;
          er.concat(["balance must be greater than 500 rs"])
     }
     if ((Number(req.body.cap) !== cap)) {
          er.concat(["invalid capche"])
     }
     if (count === 0) {
          try {
               const docs = await Card.find({ adharnumber: `${cardgenrateid.adharnumber}` }).count();
               if (!(docs > 0)) {
                    cardid++;
                    const cardcc = new Card({
                         name: cardgenrateid.name,
                         adharnumber: cardgenrateid.adharnumber,
                         pannumber: cardgenrateid.pannumber,
                         contactnumber: cardgenrateid.contactnumber,
                         accountnumber: cardgenrateid.accountnumber,
                         pin: req.body.pin1,
                         balance: req.body.bal,
                         cardnumber: cardid
                    });
                    let date_ob = new Date();
                    await cardcc.save();
                    res.status(201).render("card", {
                         cardnumber: cardid,
                         issueddate: ("0" + date_ob.getDate()).slice(-2) + "/" + ("0" + (date_ob.getMonth() + 1)).slice(-2) + "/" + date_ob.getFullYear(),
                         name: cardgenrateid.name
                    });
               }
               else {
                    res.send("you are already register")
               }
          } catch (e) {
               res.send("some error occured")
          }
     }
     else {
          res.send();
     }
})





// listening the server 
app.listen(port, () => { console.log(`server is listend at localhost:/${port}`) });
