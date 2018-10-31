var request = require("request");
var chalk = require('chalk');
var fs = require('fs');
var options = { method: 'POST',
  url: 'https://staging.open-sunbird.org/action/composite/v3/search',
  headers: 
   { 'Postman-Token': '3abec6eb-400c-4e69-8caf-290f35e482b0',
     'cache-control': 'no-cache',
     'Accept-Encoding': 'UTF-8',
     'user-id': 'ilimi',
     'Content-Type': 'application/json' },
  body: 
   { request: 
      { filters: 
         { objectType: [ 'AssessmentItem' ],
           createdOn: { '>': '2018-10-14T00:00:00.000+0530' },
           status: [ 'Live' ] },
        fields: [ 'identifier' ],
        limit: 8000 } },
  json: true };

request(options, function (error, response, body) {
  if (error) throw new Error(error);
  console.log(chalk.green('get Successful'));
  fs.writeFile('composite_search_result_SUNBIRD_STAGING.json', JSON.stringify(body) ,function(err, data){
      if(err){
          throw err;
      } 
      console.log(chalk.green('File Store Successfule'));
  })
  
});