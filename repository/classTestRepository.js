const dynamoDbCon = require('../awsConfig');
const { TABLE_NAMES } = require('../constants/tables');
const indexName = require('../constants/indexes');
const { DATABASE_TABLE } = require('./baseRepository');
const helper = require('../helper/helper');
const constant = require('../constants/constant');

exports.getClassTestsBasedonStatus = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("Blue Print Database Error");
            console.log(DBErr);
            callback(500, constant.messages.DATABASE_ERROR)
        } else {

            let docClient = dynamoDBCall;

            let read_params = {
                TableName: TABLE_NAMES.upschool_class_test_table,
                IndexName: indexName.Indexes.common_id_index,
                KeyConditionExpression: "common_id = :common_id",
                FilterExpression: "class_test_status = :class_test_status AND client_class_id = :client_class_id AND section_id = :section_id AND subject_id = :subject_id",
                ExpressionAttributeValues: {
                    ":common_id": constant.constValues.common_id,
                    ":client_class_id": request.data.client_class_id,
                    ":section_id": request.data.section_id,
                    ":subject_id": request.data.subject_id,
                    ":class_test_status": request.data.class_test_status
                },
                ProjectionExpression: ["class_test_id", "class_test_name", "class_test_mode"],  
            }
            DATABASE_TABLE.queryRecord(docClient, read_params, callback);
        }
    });
}

exports.insertClassTest = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("DB ERROR : QUIZ TABLE");
            console.log(DBErr);
            callback(500, constant.messages.DATABASE_ERROR);
        } else {

            let docClient = dynamoDBCall;

            let insert_standard_params = {
                TableName: TABLE_NAMES.upschool_class_test_table,
                Item: {
                    "class_test_id": request.data.class_test_id, 
                    "question_paper_id" : request.data.question_paper_id,
                    "client_class_id": request.data.client_class_id, 
                    "section_id": request.data.section_id, 
                    "subject_id": request.data.subject_id,
                    "class_test_name": request.data.class_test_name,
                    "lc_class_test_name": request.data.class_test_name.toLowerCase().replace(/ /g,''),
                    "class_test_mode": request.data.class_test_mode,
                    "test_start_date": request.data.test_start_date === "N.A." ? "N.A." : { yyyy_mm_dd : request.data.test_start_date, dd_mm_yyyy : helper.change_dd_mm_yyyy(request.data.test_start_date)},
                    "test_end_date" : request.data.test_end_date === "N.A." ? "N.A." : { yyyy_mm_dd : request.data.test_end_date, dd_mm_yyyy : helper.change_dd_mm_yyyy(request.data.test_end_date)},
                    "test_start_time" : request.data.test_start_time,
                    "test_end_time" : request.data.test_end_time,
                    "answer_sheet_template" : request.data.answer_sheet_template,
                    "question_paper_template" : request.data.question_paper_template,
                    "class_test_status": "Active",
                    "common_id": constant.constValues.common_id,                    
                    "created_ts": helper.getCurrentTimestamp(), 
                    "updated_ts": helper.getCurrentTimestamp(), 
                }
            }

            DATABASE_TABLE.putRecord(docClient, insert_standard_params, callback);
        }
    });
}
exports.fetchClassTestByName = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.DATABASE_ERROR)
        } else {
            let docClient = dynamoDBCall;

            let read_params = {
                TableName: TABLE_NAMES.upschool_class_test_table,

                IndexName: indexName.Indexes.common_id_index,
                KeyConditionExpression: "common_id = :common_id",
                FilterExpression: "lc_class_test_name = :lc_class_test_name AND client_class_id = :client_class_id AND section_id = :section_id AND subject_id = :subject_id", 
                ExpressionAttributeValues: {
                    ":lc_class_test_name": request.data.class_test_name.toLowerCase().replace(/ /g,''), 
                    ":client_class_id": request.data.client_class_id,
                    ":section_id": request.data.section_id,
                    ":subject_id": request.data.subject_id,
                    ":common_id": constant.constValues.common_id,
                }
            }

            DATABASE_TABLE.queryRecord(docClient, read_params, callback);
        }
    });
}
exports.getClassTestIdAndName = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("Class Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.DATABASE_ERROR);
        } else {
            let docClient = dynamoDBCall;

            let read_params = {
                TableName: TABLE_NAMES.upschool_class_test_table,

                KeyConditionExpression: "class_test_id = :class_test_id",
                ExpressionAttributeValues: {
                    ":class_test_id": request.data.class_test_id
                },
                ProjectionExpression: ["class_test_id", "class_test_name", "question_paper_id", "answer_sheet_template", "question_paper_template"] 
            }

            DATABASE_TABLE.queryRecord(docClient, read_params, callback);
        }
    });
}