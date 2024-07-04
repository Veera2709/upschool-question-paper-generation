const dynamoDbCon = require('../awsConfig');
const { TABLE_NAMES } = require('../constants/tables');
const indexName = require('../constants/indexes');
const { DATABASE_TABLE } = require('./baseRepository');
const helper = require('../helper/helper');
const constant = require('../constants/constant');

exports.getClientClassIdAndName = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("Class Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.DATABASE_ERROR);
        } else {
            let docClient = dynamoDBCall;

            let read_params = {
                TableName: TABLE_NAMES.upschool_client_class_table,

                KeyConditionExpression: "client_class_id = :client_class_id",
                ExpressionAttributeValues: {
                    ":client_class_id": request.data.client_class_id
                },
                ProjectionExpression: ["client_class_id", "client_class_name"]
            }

            DATABASE_TABLE.queryRecord(docClient, read_params, callback);
        }
    });
}
exports.getIndividualClientClassById = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("Class Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.DATABASE_ERROR);
        } else {
            let docClient = dynamoDBCall;

            let read_params = {
                TableName: TABLE_NAMES.upschool_client_class_table,

                KeyConditionExpression: "client_class_id = :client_class_id",
                ExpressionAttributeValues: {
                    ":client_class_id": request.data.client_class_id
                } 
            }

            DATABASE_TABLE.queryRecord(docClient, read_params, callback);
        }
    });
}