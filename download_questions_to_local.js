const fs = require('fs');
const request = require("request");
const _ = require('lodash');
const store_path = './all_questions-ntp-staging/';
const store_path_error_files = './error_questions-ntp-staging/';
var envUrl = 'https://staging.ntp.net.in';
var compositeSearchResultFile = './composite_search_result_NTP_STAGING.json';
var options_base = {
    method: 'GET',
    url: envUrl + '/action/assessment/v3/items/read/',
    headers:
    {
        'postman-token': '18ae520d-cb5a-6c6c-bae0-0663babeaf25',
        'cache-control': 'no-cache'
    }
};

fs.readFile(compositeSearchResultFile, function (err, data) {
    if (err) {
        console.log(err);
        console.log('Error While Reading question');
        process.exit();
    }
    const items = JSON.parse(data);
    _.each(items, function (question) {
        var path = store_path + question.identifier + '.json';
        if (!fs.existsSync(path)) {
            var req_data = _.cloneDeep(options_base);
            req_data.url = req_data.url + question.identifier;
            request(req_data, function (error, response, body) {
                if (error) throw new Error(error);
                if(JSON.parse(body).result.assessment_item == undefined){
                    fs.writeFile(store_path_error_files +  question.identifier +  '.json', JSON.stringify(JSON.parse(body).result), function (err) {
                        if (err) {
                            console.log(chalk.red('Error Save Failed'));
                            console.log(err);
                        }
                        console.log('Error save Successful of '+ question.identifier);
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