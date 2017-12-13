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

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

router.all('*', function (req, res, next) {
  console.log('action : ',req.body.result.action);
  console.log('parameters : ', req.body.result.parameters);
  console.log('context : ', req.body.result.contexts);
  
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
          //"time":{"vae":{"now":[{"time_deb_am":"12:00","time_end_am":"15:00","time_deb_pm":"17:30","time_end_pm":"22:00"},
        var cities = JSON.parse(data).filter(el => {return el.id_postcode == shop.id_postcode;});
        if (cities.length) {
          res.json({
            speech: 'Le plus proche est Sushi Shop ' + cities[0].name + '. Quel est votre budget ?',
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
    case 'budget':
      // Sur le site de sushi shop -> cheerio -> récupérer le prix 
      
      var price_max = Number(req.body.result.parameters['price-max']);
      var price_min = Number(req.body.result.parameters['price-min']);
      console.log(req.body.result.parameters);
      fs.readFile(path.join(__dirname, 'products.json'), 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }
      var products = JSON.parse(data).filter(el => {return el.price_ttc_vae > price_min && el.price_ttc_vae < price_max;});
      if (products.length) {
          let text = products.length 
          + ' produits correspondent à votre budget : ' 
          + shuffle(products).map(p => { return p.name + ' à ' + p.price_ttc_vae + ' euros';}).slice(0, 5).join(', ');
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
    case 'budget.budget-custom' :
      var price_max = Number(req.body.result.context.parameters['price-max']);
      var price_min = Number(req.body.result.context.parameters['price-min']);
      var product = Number(req.body.result.parameters['product']);
      console.log(price_max, price_min, product);
      fs.readFile(path.join(__dirname, 'products.json'), 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }
      var products = JSON.parse(data).filter(el => {return el.price_ttc_vae > price_min && el.price_ttc_vae < price_max && (el.name.toLowerCase().includes(product) || (el.description_short && el.description_short.toLowerCase().includes(product)));});
      if (products.length) {
          let text = products.length 
          + product + ' correspondent à votre budget : ' 
          + shuffle(products).map(p => { return p.name + ' à ' + p.price_ttc_vae + ' euros';}).slice(0, 5).join(', ');
        console.log(text); 
        
            
        res.json({
          speech: text,
          source: 'webhook'
        }); 
      }
      else {
        res.json({
          speech: 'je n\'ai pas trouvé de ' + product + ' dans cette fourchette de prix',
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