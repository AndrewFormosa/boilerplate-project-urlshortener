require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});


//MY CODE START

//create a link to the mongoDB data base and configure if it is not already configured.
let mongoose = require("mongoose");


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

let UrlRecord = mongoose.model('urlRecord', urlSchema);

//need to use dns to verify the web address with lookup function.
const dns = require("dns");
const { URL } = require('url');


//need to use the body parser middlewear
const bodyParser = require("body-parser");
app.use('/api/shorturl', bodyParser.urlencoded({ extended: false }));



//on visit to /api/shorturl/<short_url>
app.get('/api/shorturl/:url', function (req, res) {

  shortURL = req.params['url'];

  UrlRecord.find({short_url:shortURL}).then(
    resp=>{
      var directURL=resp[0].original_url;
      console.log(directURL);

      res.status(301).redirect(directURL);
    },
    erro=>{
      console.log(erro);
    }

  );

//  res.json({ url: shortURL });



});



//on post to /api/shorturl
app.route('/api/shorturl').post(function (req, res) {
 
  fullURL = req.body.url; //read the url from the post request

  //look up the URL with dns.lookup to check that it is valid.
  const domain = new URL(fullURL).host;
  
  dns.lookup(domain, (error, address, family) => {

    // if an error occurs, eg. the hostname is incorrect!
    if (error) {
      console.error(error);
      res.json({ error: 'invalid url' });
    } else {
      // if no error exists and the URL is valid.
      console.log(`The ip address is ${address} and the ip version is ${family}`);

      //check to see if the url is currently within the database
    

      UrlRecord.find({original_url:fullURL}).then(
        resp => {
          if(resp==""){
            console.log("NONE");
             //if it isnt then add to the database and create a number to go with it.
            createAndSaveNewRecord(fullURL, function (err, data) {
                 console.log(data);
                let shortURL=data.short_url;
                 console.log(shortURL);
                 res.json({ original_url: fullURL, short_url: shortURL });
               });
          }else{
               //if it is then return the short url
            console.log(resp);
            let shortURL=resp[0].short_url;
            console.log(shortURL);
              res.json({ original_url: fullURL, short_url: shortURL });
          }},
        err => console.log('not found' + fullURL)
      );
      
    
    }
  });


});


//create newRecord
const createAndSaveNewRecord = (newFullURL, done) => {

  UrlRecord.countDocuments({}).then(
    res => {
      console.log("Number of documents:" + res);
      let newRecord = new UrlRecord({
        original_url: newFullURL,
        short_url: res
      });
      newRecord.save().then(
        res => done(null, res),
        err => done(err, null)
      );
    },
    err => done(err,null)
  )


}




//MY CODE END

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
