const dynamoDbCon = require('../awsConfig');
const { TABLE_NAMES } = require('../constants/tables');
const indexName = require('../constants/indexes');
const { DATABASE_TABLE } = require('./baseRepository');
const { successResponse } = require('./baseRepository');
const helper = require('../helper/helper');
const constant = require('../constants/constant');


exports.fetchUserDataByEmail = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("User Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.USER_DATA_DATABASE_ERROR);
        } else {
            let docClient = dynamoDBCall;
            console.log("request : ", request);
            
            let read_params = {
                TableName: TABLE_NAMES.upschool_teacher_info,
                IndexName: indexName.Indexes.common_id_index,
                KeyConditionExpression: "common_id = :common_id",
                FilterExpression: "user_email = :user_email",
                ExpressionAttributeValues: {
                    ":common_id": constant.constValues.common_id,
                    ":user_email": request.data.user_email.toLowerCase() 
                },
            }

            DATABASE_TABLE.queryRecord(docClient, read_params, callback);

        }
    });
}

exports.fetchUserDataByPhoneNo = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("User Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.USER_DATA_DATABASE_ERROR)
        } else {

            let docClient = dynamoDBCall;

            let read_params = {
                TableName: TABLE_NAMES.upschool_teacher_info,
                // IndexName: indexName.Indexes.user_phone_no_index,
                // KeyConditionExpression: "user_phone_no = :user_phone_no",
                // ExpressionAttributeValues: {
                //     ":user_phone_no": request.data.user_email
                // }
                IndexName: indexName.Indexes.common_id_index,
                KeyConditionExpression: "common_id = :common_id",
                FilterExpression: "user_phone_no = :user_phone_no",
                ExpressionAttributeValues: {
                    ":common_id": constant.constValues.common_id,
                    ":user_phone_no": request.data.user_email 
                },
            }

            DATABASE_TABLE.queryRecord(docClient, read_params, callback);

        }
    });
}

exports.fetchUserDataByUserName = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("User Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.USER_DATA_DATABASE_ERROR)
        } else {

            let docClient = dynamoDBCall;

            let read_params = {
                TableName: TABLE_NAMES.upschool_teacher_info,
                // IndexName: indexName.Indexes.user_name_index,
                // KeyConditionExpression: "user_name = :user_name",
                // ExpressionAttributeValues: {
                //     ":user_name": request.data.user_email
                // } 
                IndexName: indexName.Indexes.common_id_index,
                KeyConditionExpression: "common_id = :common_id",
                FilterExpression: "user_name = :user_name",
                ExpressionAttributeValues: { 
                    ":common_id": constant.constValues.common_id,
                    ":user_name": request.data.user_email 
                },
            }

            DATABASE_TABLE.queryRecord(docClient, read_params, callback);

        }
    });
}

exports.fetchUserDataByUserId = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("User Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.USER_DATA_DATABASE_ERROR)
        } else {
            
            let docClient = dynamoDBCall;

            let read_params = {
                TableName: TABLE_NAMES.upschool_teacher_info,
                KeyConditionExpression: "teacher_id = :teacher_id",
                ExpressionAttributeValues: {
                    ":teacher_id": request.teacher_id
                }
            }

            DATABASE_TABLE.queryRecord(docClient, read_params, callback);

        }
    });
}

exports.updateJwtToken = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("User Login Database Error");
            console.log(DBErr);
            callback(500, constant.messages.USER_LOGIN_DATABASE_ERROR)
        } else {

            let docClient = dynamoDBCall;

            let update_params = {
                TableName: TABLE_NAMES.upschool_teacher_info,
                Key: {
                    "teacher_id": request.teacher_id
                },
                UpdateExpression: "set user_jwt = :user_jwt, updated_ts = :updated_ts",
                ExpressionAttributeValues: {
                    ":user_jwt": request.user_jwt,
                    ":updated_ts": helper.getCurrentTimestamp(),
                },
            };

            DATABASE_TABLE.updateRecord(docClient, update_params, callback);

        }
    });
}

exports.updateUserOtp = function (request, callback) {
    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("User Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.USER_DATA_DATABASE_ERROR)
        } else {

            let docClient = dynamoDBCall;

            let update_params = {
                TableName: TABLE_NAMES.upschool_teacher_info,
                Key: {
                    "teacher_id": request.data.teacher_id
                },
                UpdateExpression: "set user_otp = :user_otp, updated_ts = :updated_ts",
                ExpressionAttributeValues: {
                    ":user_otp": request.data.user_otp,
                    ":updated_ts": helper.getCurrentTimestamp(),
                },
            };

            DATABASE_TABLE.updateRecord(docClient, update_params, callback);
        }
    });
}

exports.resetUserOtp = function (request, callback) {
    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("User Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.USER_DATA_DATABASE_ERROR)
        } else {

            let docClient = dynamoDBCall;

            let update_params = {
                TableName: TABLE_NAMES.upschool_teacher_info,
                Key: {
                    "teacher_id": request.data.teacher_id
                },
                UpdateExpression: "set user_otp = :user_otp, updated_ts = :updated_ts",
                ExpressionAttributeValues: {
                    ":user_otp": request.data.user_reset_otp,
                    ":updated_ts": helper.getCurrentTimestamp()
                },
            };

            DATABASE_TABLE.updateRecord(docClient, update_params, callback);

        }
    });
}
exports.resetPassword = function (request, callback) {
    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("User Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.USER_DATA_DATABASE_ERROR)
        } else {

            let docClient = dynamoDBCall;

            let update_params = {
                TableName: TABLE_NAMES.upschool_teacher_info,
                Key: {
                    "teacher_id": request.data.teacher_id
                },
                UpdateExpression: "set user_jwt = :user_jwt, user_salt = :user_salt, user_pwd = :user_pwd, updated_ts = :updated_ts",
                ExpressionAttributeValues: {
                    ":user_jwt": request.data.user_jwt,
                    ":user_salt": request.data.user_salt, 
                    ":user_pwd": request.data.user_pwd, 
                    ":updated_ts": helper.getCurrentTimestamp()
                },
            };

            DATABASE_TABLE.updateRecord(docClient, update_params, callback);

        }
    });
}
exports.fetchTeacherEmailById = function (request, callback) {

    dynamoDbCon.getDB(function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log("User Data Database Error");
            console.log(DBErr);
            callback(500, constant.messages.USER_DATA_DATABASE_ERROR)
        } else {
            
            let docClient = dynamoDBCall;

            let read_params = {
                TableName: TABLE_NAMES.upschool_teacher_info,
                KeyConditionExpression: "teacher_id = :teacher_id",
                ExpressionAttributeValues: {
                    ":teacher_id": request.data.teacher_id
                }, 
                ProjectionExpression: ["teacher_id", "user_email"], 
            }

            DATABASE_TABLE.queryRecord(docClient, read_params, callback);

        }
    });
}