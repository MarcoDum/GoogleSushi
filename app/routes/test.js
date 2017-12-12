fs = require('fs');
path = require('path');



fs.readFile(path.join(__dirname, 'products.json'), 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
  var products = JSON.parse(data).filter(el => {return el.price_ttc_vae == 3.5;});
  console.log(products);
}

