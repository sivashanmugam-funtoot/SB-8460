const fs = require('fs');
const request = require("request");
const _ = require('lodash');
const store_path = './all_questions-sunbird-staging/';
let errorCount = 0;
var options_base = {
    method: 'GET',
    url: 'https://staging.open-sunbird.org/action/assessment/v3/items/read/',
    headers:
    {
        'postman-token': '18ae520d-cb5a-6c6c-bae0-0663babeaf25',
        'cache-control': 'no-cache'
    }
};

fs.readFile('./composite_search_result_SUNBIRD_STAGING.json', function (err, data) {
    if (err) {
        console.log(err);
        console.log('Error While Reading question');
        process.exit();
    }
    data = JSON.parse(data);
    const items = data.items;
    _.each(items, function (question) {
        var path = store_path + question.identifier + '.json';
        if (!fs.existsSync(path)) {
            var req_data = _.cloneDeep(options_base);
            req_data.url = req_data.url + question.identifier;
            request(req_data, function (error, response, body) {
                if (error) throw new Error(error);
                if(JSON.parse(body).result.assessment_item == undefined){
                    fs.writeFile('error' + ++errorCount +  '.json', JSON.stringify(JSON.parse(body).result), function (err) {
                        if (err) {
                            console.log(chalk.red('Error Save Failed'));
                            console.log(err);
                        }
                        console.log('Error save Successful');
                    });
                } else{
                    fs.writeFile(store_path + JSON.parse(body).result.assessment_item.identifier + '.json', body, function (err) {
                        if (err) {
                            throw err;
                        }
                        console.log('Succesfully saved ' + JSON.parse(body).result.assessment_item.identifier + '.json')
                    })
                }
            });
        }
    })
})