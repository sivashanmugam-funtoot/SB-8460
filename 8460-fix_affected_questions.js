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

var patch_options_base = {
    method: 'PATCH',
    url: 'https://staging.ntp.net.in/action/assessment/v3/items/update/',
    headers:
    {
        'postman-token': '3e0d37c1-432a-e8e3-7948-fc22ad1800e6',
        'cache-control': 'no-cache',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br',
        connection: 'keep-alive',
        'user-id': 'content-editor',
        cookie: 's%3ACWXH_r4TVtGzM9-g5T0CHRxqrcBLMOj2.h6M5CkNPVY0VP8rr6xFXRnbRjrij0n4rRGObYRc3xAo',
        'content-type': 'application/json'
    },
    body: {
        request:{
            assessment_item:{
                objectType: "AssessmentItem",
                metadata : {

                },
                outRelations: []
            }
        }
    },
    json: true
};


/* root Variables */

//production
// var affectedQuestions_array = [  "do_31261154763329536017", "do_3126123112810086402315",  "do_3126123459680419842333",  "do_3126124420247306242392",  "do_3126124452034396162394",  "do_3126124461015040001169",  "do_3126131206189383681377",  "do_3126143826225807362863",  "do_3126144952384143361646",  "do_3126145614745354242900",  "do_3126154294925639682959",  "do_31261733687835033621189",  "do_31261737144285593621266",  "do_31261737149480960021267",  "do_31261760945611571221326",  "do_31261801896700313621404",  "do_31261805208440012811288",  "do_31261809156578508811364",  "do_31261819121567334411387",  "do_31261819141911347221580",  "do_31261871550495129621667",  "do_31261944670597120011862",  "do_31261945875849216022042",  "do_31261962212418355212016",  "do_31261962239151308822105"]
// var affectedQuestions = [affectedQuestions_array[8]];
// const affectedQuestionsFolder = './all_questions-diksha/' //production
// const removeAbsolutePath = "https://ntpproductionall.blob.core.windows.net/ntp-content-production" //production

//staging
var affectedQuestions_array = ["do_2126137977184419841464", "do_2126137983756124161465", "do_2126138045472194561468", "do_212617294054375424176", "do_2126173757774888961125", "do_2126173758173757441126", "do_2126179376205742081203", "do_2126181846292643841318"]
var affectedQuestions = [affectedQuestions_array[6]];
const affectedQuestionsFolder = './all_questions-ntp-staging/' //staging
const removeAbsolutePath = 'https://ntpstagingall.blob.core.windows.net/ntp-content-staging';  //staging
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
        var questionMedia = body.data.media;
        var mediaGeneratedFromQuestion = [];
        value.before = _.cloneDeep(questionData);

        // Checking whether media urls inside question data present inside media, If not present adding them inside
        if (questionData.question.image) mediaGeneratedFromQuestion.push({ 'type': 'image', 'url': questionData.question.image })
        if (questionData.question.audio) mediaGeneratedFromQuestion.push({ 'type': 'audio', 'url': questionData.question.audio })

        switch (body.data.plugin.id) {
            case 'org.ekstep.questionunit.mcq':
                _.each(questionData.options, function (o) {
                    if (o.image) mediaGeneratedFromQuestion.push({ 'type': 'image', 'url': o.image })
                    if (o.audio) mediaGeneratedFromQuestion.push({ 'type': 'audio', 'url': o.audio })
                })
                break;
            case 'org.ekstep.questionunit.mtf':
                _.each(questionData.option.optionsLHS, function (o) {
                    if (o.image) mediaGeneratedFromQuestion.push({ 'type': 'image', 'url': o.image })
                    if (o.audio) mediaGeneratedFromQuestion.push({ 'type': 'audio', 'url': o.audio })
                })
                _.each(questionData.option.optionsRHS, function (o) {
                    if (o.image) mediaGeneratedFromQuestion.push({ 'type': 'image', 'url': o.image })
                    if (o.audio) mediaGeneratedFromQuestion.push({ 'type': 'audio', 'url': o.audio })
                })
                break;
        }

        // comparing generated media and actual media
        _.each(mediaGeneratedFromQuestion, function (mG) {
            var url = mG.url;
            var mediaExist = _.find(questionMedia, function (m) {
                return m.src == url;
            })

            if (!mediaExist) {
                //https://ntpstagingall.blob.core.windows.net/ntp-content-staging/content/do_2126003259960442881130/artifact/download-size_1538125732087.jpeg
                var assetId = url.split('/')[5];
                var valid = false;
                if (assetId != undefined) {
                    // This is to exclude cases /assets/public/content/do_hen_536_1475732756_1475732769795.png
                    if (assetId.indexOf('.') == -1 && assetId.indexOf('do_') != -1) {
                        valid = true;
                    }

                    else {
                        var assetId = url.split('/')[4];
                        if (assetId != undefined) {
                            // This is to exclude cases /assets/public/content/do_hen_536_1475732756_1475732769795.png
                            if (assetId.indexOf('.') == -1 && assetId.indexOf('do_') != -1) {
                                valid = true;
                            }
                        } else {
                            console.log(url)
                            console.log(chalk.yellow('Asset Id is undefined'));
                            questionMedia.push({
                                "id": Math.floor(Math.random() * 1000000000),
                                "src": url,
                                "assetId": Math.floor(Math.random() * 100000000000), //when asset id not able retrieve from url
                                "type": mG.type,
                                "preload": false
                            })
                        }
                    }

                    if (valid) {
                        questionMedia.push({
                            "id": Math.floor(Math.random() * 1000000000),
                            "src": url,
                            "assetId": assetId,
                            "type": mG.type,
                            "preload": false
                        })
                    }
                } else {
                    console.log(url)
                    console.log(chalk.yellow('Asset Id is undefined'));
                    questionMedia.push({
                        "id": Math.floor(Math.random() * 1000000000),
                        "src": url,
                        "assetId": Math.floor(Math.random() * 100000000000), //when asset id not able retrieve from url
                        "type": mG.type,
                        "preload": false
                    })
                }

            }
        })

        _.each(questionMedia, qM => {
            if (checkAffected(qM.src, true)) {
                qM.src = fixAffected(qM.src);
            }
        })

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
                _.each(questionData.option.optionsLHS, function (o) {
                    if (checkAffected(o.image)) {
                        o.image = fixAffected(o.image);
                    }
                    if (checkAffected(o.audio)) {
                        o.audio = fixAffected(o.audio);
                    }
                })
                _.each(questionData.option.optionsRHS, function (o) {
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
        questionData.media = questionMedia;
        value.after = _.cloneDeep(questionData);
        console.log(chalk.green(`file fix ${a} over`));
        console.log(chalk.yellow(`media inside question ${mediaCount} and media inside media ${questionMedia.length}`))

        data.result.assessment_item.body = JSON.stringify(body);
        removeUnwantedPropertiesForPatch(data.result.assessment_item)
        addPropertiesForPatch(data.result.assessment_item);
        patchStart(data.result, body)


    })
})


function patchStart(data) {
    var patchOption = _.cloneDeep(patch_options_base);
    patchOption.url = patchOption.url + data.assessment_item.identifier;
    patchOption.body.request.assessment_item.metadata = data.assessment_item;
    value = patchOption;
    requestPromise(patchOption).then(function (data) {
        value = data;
        console.log('over');
    }).catch(function (err) {
        console.log(err);
    })
}

function checkAffected(string, dontCountMedia) {
    if (string) {
        if (!dontCountMedia) mediaCount++;
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
        // org.ekstep.contenteditor.mediaManager.getMediaOriginURL("https://ntpstagingall.blob.core.windows.net/ntp-content-staging/content/do_212624191128977408136/artifact/upload-document-icon-red-square-button-stock-illustrations_csp50693370_1541038956345.jpg")
        // /assets/public/content/do_212624191128977408136/artifact/upload-document-icon-red-square-button-stock-illustrations_csp50693370_1541038956345.jpg
        return '/assets/public' + result;
    }
}

function removeUnwantedPropertiesForPatch(Obj) {
    var propertiesToRemove = ["status", "versionKey", "consumerId", "lastUpdatedOn", "appId", "createdOn"];
    _.each(propertiesToRemove, function (prop) {
        delete Obj[prop];
    })
    return Obj;
}

function addPropertiesForPatch(Obj) {
    var newProperty = "questionTitle";
    Obj[newProperty] = Obj.title;
    return Obj;
}
