const fs = require('fs');
const _ = require('lodash');
const express = require('express');
const chalk = require('chalk');
var app = express(),
    server = app.listen(8080);

let questionsAffected = [];
let inValid = [];
let qTypeCount = {}
let creatorsOfAffectedQs = {};
app.get('/getjson', function (req, res) {
    res.send(questionsAffected);
})

app.get('/readjson', function (req, res) {
    res.send(creatorsOfAffectedQs);
})

app.get('/json', function (req, res) {
    res.send(qTypeCount);
})



const questionDirective = './all_questions-ntp-staging/';
fs.readdir(questionDirective, (err, files) => {
    _.each(files, function (file) {
        fs.readFile(questionDirective + file, function (err, data) {
            if (err) {
                throw err;
            }
            try {
                data = JSON.parse(data);
            } catch (err) {
                inValid.push(file);
                return;
            }

            var body;
            try {
                body = JSON.parse(data.result.assessment_item.body);
            } catch (err) {
                inValid.push(file);
                return;
            }
            if (!body) { return };
            const questionData = body.data.data;
            let affected = false;
            //checks question title is affected

            if (checkAffected(questionData.question.image) || checkAffected(questionData.question.audio)) {
                affected = true;
            } else {
                qTypeCount[body.data.plugin.id] ? qTypeCount[body.data.plugin.id]++ : qTypeCount[body.data.plugin.id] = 1;
                switch (body.data.plugin.id) {
                    case 'org.ekstep.questionunit.ftb':
                        //there is no options for ftb
                        break;
                    case 'org.ekstep.questionunit.mcq':
                        _.each(questionData.options, function (o) {
                            if (checkAffected(o.image) || checkAffected(o.audio)) {
                                console.log
                                affected = true;
                            }
                        })
                        break;
                    case 'org.ekstep.questionunit.mtf':
                        _.each(questionData.option.optionsLHS, function (o) {
                            if (checkAffected(o.image) || checkAffected(o.audio)) {
                                affected = true;
                            }
                        })
                        if (!affected) {
                            _.each(questionData.option.optionsRHS, function (o) {
                                if (checkAffected(o.image) || checkAffected(o.audio)) {
                                    affected = true;
                                }
                            })
                        }
                        break;
                    case 'org.ekstep.questionunit.sequence':
                        _.each(questionData.options, function (o) {
                            if (checkAffected(o.image) || checkAffected(o.audio)) {
                                affected = true;
                            }
                        })
                        break;
                    case 'org.ekstep.questionunit.reorder':
                        //there is no options in reorder
                        break;
                }
            }
            if (affected) {
                creatorsOfAffectedQs[data.result.assessment_item.createdBy] = 0;
                console.log(chalk.yellow(JSON.stringify({ 'plugin': body.data.plugin.id, 'id': file, 'createBy' : data.result.assessment_item.createdBy })));
                questionsAffected.push(file.split('.')[0])
            }
        })
    })

})

function checkAffected(string) {
    if (string) {
        if (string.indexOf('http') != -1 || string.indexOf('https') != -1) {
            console.log(chalk.red(string));
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}