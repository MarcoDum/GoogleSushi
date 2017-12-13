var express = require('express');
var router = express.Router();
var request = require('request');
fs = require('fs');
path = require('path');


var Geonames = require('geonames.js');
geonames = new Geonames({username: 'plesiosaure', lan: 'fr', encoding: 'JSON'});

const SUSHISHOP_API_PLACE = 'https://www.sushishop.fr/api/fr/place/';

const SUSHISHOP_API_STORE = 'https://www.sushishop.fr/api/store/';

var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyB7yg97AAryFBNfWYk29RWdnhgNsxvo00Q',
  Promise: Promise // 'Promise' is the native constructor.
});

router.all('*', function (req, res, next) {
  console.log(req.body.result.parameters);
  
  switch (req.body.result.action) {
    case 'location':
    let search = '';
    if (req.body.result.parameters['street-address'] && req.body.result.parameters['geo-city']) {
      search = req.body.result.parameters['street-address'] + ', ' + req.body.result.parameters['geo-city'];
    }
    else {
      search = req.body.result.parameters['geo-city-fr'];
    }
    console.log(search);
    googleMapsClient.geocode({address: search}).asPromise()
    .then((response) => {
      var address = encodeURIComponent(response.json.results[0].formatted_address);
    // console.log(response.json.results[0].formatted_address, response.json.results[0].place_id);
     
      var url = SUSHISHOP_API_PLACE + `/${response.json.results[0].place_id}/estimations/${address}`;
      
      request(url, function (error, response, body) {
        //console.log('error:', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        var shop = JSON.parse(body);
        //console.log('body:', shop.id_postcode); // Print the HTML for the Google homepage.
       
        fs.readFile(path.join(__dirname, 'stores.json'), 'utf8', function (err,data) {
          if (err) {
            return console.log(err);
          }
        var cities = JSON.parse(data).filter(el => {return el.id_postcode == shop.id_postcode;});
        if (cities.length) {
          res.json({
            speech: 'Le plus proche est à  ' + cities[0].name,
            source: 'webhook'
          });
        }
        else {
          res.json({
            speech: 'je n\'ai pas trouvé de sushi shop à proximité, donnez-moi une adresse plus précise',
            source: 'webhook'
          });
        }
        
         
        });
        /* request(SUSHISHOP_API_STORE, function (error, response, body) {
              console.log('body:', body.length); // Print the HTML for the Google homepage.
        }); */
      });

      
      
    })
    .catch((err) => {
      console.log(err);
    });
            
      break;
    case 'price':
      // Sur le site de sushi shop -> cheerio -> récupérer le prix 
      var price_max = 15;
      var price_min = 11;
      console.log(req.body.result.parameters.product);
      fs.readFile(path.join(__dirname, 'products.json'), 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }
      var products = JSON.parse(data).filter(el => {return el.price_ttc_vae > price_min && el.price_ttc_vae < price_max;});
      if (products.length) {
          let text = products.length 
          + ' correspondent à votre budget : ' 
          + products.map(p => { return p.name + ' à ' + p.price_ttc_vae + ' euros';}).join(', ').slice(0, 5);
        console.log(text); 
            
        res.json({
          speech: text,
          source: 'webhook'
        }); 
      }
      else {
        res.json({
          speech: 'je n\'ai pas trouvé de produit dans cette fourchette de prix',
          source: 'webhook'
        }); 
      }
    });
      break;

    default:
      res.json({
        speech: 'Je n\'ai pas compris',
        source: 'webhook'
      });
  }
});

module.exports = router;