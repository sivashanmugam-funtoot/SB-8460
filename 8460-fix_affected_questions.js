/* modules */
var request = require("request");
var fs = require('fs');
var express = require("express");
var app = express();
var _ = require('lodash');
var chalk = require('chalk');
var server = app.listen(8080);
var value = {
    'before': {},
    'after': {}
}
/* root Variables */

//production
var affectedQuestions_array = [  "do_31261154763329536017", "do_3126123112810086402315",  "do_3126123459680419842333",  "do_3126124420247306242392",  "do_3126124452034396162394",  "do_3126124461015040001169",  "do_3126131206189383681377",  "do_3126143826225807362863",  "do_3126144952384143361646",  "do_3126145614745354242900",  "do_3126154294925639682959",  "do_31261733687835033621189",  "do_31261737144285593621266",  "do_31261737149480960021267",  "do_31261760945611571221326",  "do_31261801896700313621404",  "do_31261805208440012811288",  "do_31261809156578508811364",  "do_31261819121567334411387",  "do_31261819141911347221580",  "do_31261871550495129621667",  "do_31261944670597120011862",  "do_31261945875849216022042",  "do_31261962212418355212016",  "do_31261962239151308822105"]
var affectedQuestions = [affectedQuestions_array[8]];
const affectedQuestionsFolder = './all_questions/' //production
const removeAbsolutePath = "https://ntpproductionall.blob.core.windows.net/ntp-content-production" //production

//staging
// var affectedQuestions_array = ["do_2126137977184419841464"]// "do_2126137983756124161465", "do_2126138045472194561468", "do_212617294054375424176", "do_2126173757774888961125", "do_2126173758173757441126", "do_2126179376205742081203", "do_2126181846292643841318"]
// var affectedQuestions = [affectedQuestions_array[0]];
//const affectedQuestionsFolder = './all_questions-ntp-staging/' //staging
//const removeAbsolutePath = 'https://ntpstagingall.blob.core.windows.net/ntp-content-staging';  //staging
global.mediaCount = 0;


app.get('/getjson', function (req, res) {
    res.send(value);
})


/* function definitions */
function requestPromise(urlOptions) {
    return new Promise(function (resolve, reject) { request(urlOptions, function (err, response) { if (err) reject(err); else resolve(response) }) })
}

function readFilePromise(file) {
    return new Promise(function (resolve, reject) { fs.readFile(file, function (err, data) { if (err) reject(err); else resolve(data) }) })
}


_.each(affectedQuestions, function (a) {
    readFilePromise(affectedQuestionsFolder + a + '.json').then(function (data) {
        data = JSON.parse(data);
        var body = JSON.parse(data.result.assessment_item.body);
        var questionData = body.data.data;
        var questionDataMedia = body.data.data.media;
        var questionMedia = body.data.media;
        value.before = _.cloneDeep(questionData);

        // _.each(questionDataMedia, qM => {
        //     if(checkAffected(qM.src)){
        //         qM.src = fixAffected(qM.src);
        //     }
        // })

        // _.each(questionMedia, qM => {
        //     if(checkAffected(qM.src)){
        //         qM.src = fixAffected(qM.src);
        //     }
        // })
        //check question contains absolute url in image and audio
        
        if (checkAffected(questionData.question.image)) {
            questionData.question.image = fixAffected(questionData.question.image);
        }
        if (checkAffected(questionData.question.audio)) {
            questionData.question.audio = fixAffected(questionData.question.audio)
        }
        switch (body.data.plugin.id) {
            case 'org.ekstep.questionunit.ftb':
                //no media other than question title
                break;
            case 'org.ekstep.questionunit.mcq':
                _.each(questionData.options, function (o) {
                    if (checkAffected(o.image)) {
                        o.image = fixAffected(o.image);
                    }
                    if (checkAffected(o.audio)) {
                        o.audio = fixAffected(o.audio);
                    }
                })
                break;
            case 'org.ekstep.questionunit.mtf':
                _.each(questionData.option.optionLHS, function (o) {
                    if (checkAffected(o.image)) {
                        o.image = fixAffected(o.image);
                    }
                    if (checkAffected(o.audio)) {
                        o.audio = fixAffected(o.audio);
                    }
                })
                _.each(questionData.option.optionRHS, function (o) {
                    if (checkAffected(o.image)) {
                        o.image = fixAffected(o.image);
                    }
                    if (checkAffected(o.audio)) {
                        o.audio = fixAffected(o.audio);
                    }
                })
                break;
            case 'org.ekstep.questionunit.sequence':
                //no media other than question title
                break;
            case 'org.ekstep.questionunit.reorder':
                //no media other than question title
                break;
        }
        value.after = _.cloneDeep(questionData);
        console.log(chalk.green(`file fix ${a} over`));
        console.log(chalk.yellow(`media inside question ${mediaCount} and media inside media ${questionMedia.length}`))

    })
})

function checkAffected(string) {
    if (string) {
        mediaCount++;
        if (string.indexOf('http') != -1 || string.indexOf('https') != -1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function fixAffected(string) {
    if (string.indexOf(removeAbsolutePath) == -1) {
        throw `${string} contains other absolute path than ${removeAbsolutePath}`
    } else {
        console.log(`Before fixing string ${chalk.red(string)}`);
        var result = string.split(removeAbsolutePath)[1];
        console.log(`After fixing string ${chalk.yellow(result)}`);
        return result;
    }

}
