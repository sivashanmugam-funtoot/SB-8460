var request = require("request");
var chalk = require('chalk');
var fs = require('fs');
var envUrl = 'https://diksha.gov.in';
var saveFileName = 'composite_search_result_DIKSHA_PROD.json'
var options = { method: 'POST',
  url: envUrl + '/action/composite/v3/search',
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
           createdOn: { 'min': '2018-10-14T00:00:00.000+0530', 'max' : '2018-10-27T00:00:00.000+0530'},

           status: [ ],
           version : 2,
           },
        fields: [ 'identifier' ],
        limit: 8000 } },
  json: true };

request(options, function (error, response, body) {
  if (error) throw new Error(error);
  console.log(chalk.green('get Successful'));
  fs.writeFile(saveFileName, JSON.stringify(body.result.items) ,function(err, data){
      if(err){
          throw err;
      } 
      console.log(chalk.green('File Store Successfule'));
  })
  
});