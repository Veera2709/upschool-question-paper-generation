const dynamoDbCon = require('../awsConfig');
const { TABLE_NAMES } = require('../constants/tables');
const indexName = require('../constants/indexes');
const { DATABASE_TABLE } = require('./baseRepository');
const helper = require('../helper/helper');
const constant = require('../constants/constant');

exports.fetchQuizData = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("DB ERROR : QUIZ TABLE");
            console.log(DBErr);
            callback(500, constant.messages.DATABASE_ERROR);
        } else {

            let docClient = dynamoDBCall;

            let read_params = {
                TableName: TABLE_NAMES.upschool_quiz_table,
                IndexName: indexName.Indexes.common_id_index,
                KeyConditionExpression: "common_id = :common_id",
                FilterExpression: "client_class_id = :client_class_id AND section_id = :section_id AND subject_id = :subject_id AND quiz_status = :quiz_status AND chapter_id = :chapter_id AND learningType = :learningType",
                ExpressionAttributeValues: {
                    ":common_id": constant.constValues.common_id,
                    ":client_class_id": request.data.client_class_id,
                    ":section_id": request.data.section_id,
                    ":subject_id": request.data.subject_id,
                    ":chapter_id": request.data.chapter_id,
                    ":learningType": request.data.learningType,
                    ":quiz_status": "Active"
                }
            }

            DATABASE_TABLE.queryRecord(docClient, read_params, callback);
        }
    });
}

exports.fetchQuizBasedonID = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("DB ERROR : QUIZ TABLE");
            console.log(DBErr);
            callback(500, constant.messages.DATABASE_ERROR);
        } else {

            let docClient = dynamoDBCall;

            let read_params = {
                TableName: TABLE_NAMES.upschool_quiz_table,
                KeyConditionExpression: "quiz_id = :quiz_id",
                ExpressionAttributeValues: {
                    ":quiz_id": request.data.quiz_id
                },
            }

            DATABASE_TABLE.queryRecord(docClient, read_params, callback);

        }
    });
}

exports.addQuiz = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("DB ERROR : QUIZ TABLE");
            console.log(DBErr);
            callback(500, constant.messages.DATABASE_ERROR);
        } else {

            let docClient = dynamoDBCall;

            let insert_standard_params = {
                TableName: TABLE_NAMES.upschool_quiz_table,
                Item: {
                    "quiz_id": helper.getRandomString(), 
                    "client_class_id": request.data.client_class_id, 
                    "section_id": request.data.section_id, 
                    "subject_id": request.data.subject_id,
                    "chapter_id": request.data.chapter_id,
                    "quizMode": request.data.quizMode,
                    "quizType": request.data.quizType,
                    "quizStartDate": { yyyy_mm_dd : request.data.quizStartDate, dd_mm_yyyy : helper.change_dd_mm_yyyy(request.data.quizStartDate)},
                    "quizEndDate" : { yyyy_mm_dd : request.data.quizEndDate, dd_mm_yyyy : helper.change_dd_mm_yyyy(request.data.quizEndDate)},
                    "quizStartTime" : request.data.quizStartTime,
                    "quizEndTime" : request.data.quizEndTime,
                    "noOfQuestionsForAuto": request.data.noOfQuestionsForAuto,
                    "selectedTopics": request.data.selectedTopics,
                    "varient": request.data.varient,
                    "learningType": request.data.learningType,
                    "quiz_question_details": request.data.quiz_question_details,
                    "quiz_status": "Active",
                    "common_id": constant.constValues.common_id,                    
                    "created_ts": helper.getCurrentTimestamp(), 
                    "updated_ts": helper.getCurrentTimestamp(), 
                }
            }

            DATABASE_TABLE.putRecord(docClient, insert_standard_params, callback);
        }
    });
}
exports.updateQuizTemplateDetails = function(request, callback){
    dynamoDbCon.getDB(async function (DBErr, dynamoDBCall) {
    if (DBErr) {
        console.log("Error : updating class test Status!");
        callback(500, constant.messages.DATABASE_ERROR);
    }
    else {

        let docClient = dynamoDBCall;

        let update_params = {
            TableName : TABLE_NAMES.upschool_quiz_table,
            Key : {
                "quiz_id" : request.data.quiz_id
            },
            UpdateExpression : "SET quiz_template_details = :quiz_template_details, updated_ts = :updated_ts",
            ExpressionAttributeValues: {
                ":quiz_template_details" : request.data.quiz_template_details, 
                ":updated_ts" : helper.getCurrentTimestamp() 
            }
        }

        await DATABASE_TABLE.updateRecord(docClient, update_params, callback);
    }
    })
}