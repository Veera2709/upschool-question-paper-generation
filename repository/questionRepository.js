const dynamoDbCon = require("../awsConfig");
const { TABLE_NAMES } = require("../constants/tables");
const indexName = require("../constants/indexes");
const { DATABASE_TABLE } = require("./baseRepository");
const { successResponse } = require("./baseRepository");
const helper = require("../helper/helper");
const constant = require("../constants/constant");


exports.REFfetchBulkQuestionsWithPublishStatusAndProjection = function (request, callback) {

    dynamoDbCon.getDB(async function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log(constant.messages.DATABASE_ERROR);
            console.log(DBErr);
            callback(500, constant.messages.DATABASE_ERROR);
        } else {
            let { IdArray, fetchIdName, TableName, projectionExp, questionStatus } = request;
            
            let filterExpDynamic = fetchIdName + "= :" + fetchIdName;
            let expAttributeVal = {};

            let docClient = dynamoDBCall;
            let FilterExpressionDynamic = "";
            let ExpressionAttributeValuesDynamic = {};

            IdArray = [...new Set(IdArray)];

            console.log("IdArray : ", IdArray);
            if (IdArray.length === 0) {
                console.log("EMPTY BULK ID");
                callback(0, { Items: [] });
            } 
            else if (IdArray.length === 1) 
            {
                expAttributeVal[":" + fetchIdName] = IdArray[0];
                expAttributeVal[":question_status"] = questionStatus;
                expAttributeVal[":question_source0"] = "71416d29-c96b-5889-9b90-580567446dbc";
                expAttributeVal[":question_source1"] = "71416d29-c96b-5889-9b90-580567446dc";

                let read_params = {
                    TableName: TableName,
                    FilterExpression: "" + fetchIdName + " = :" + fetchIdName + " AND question_status = :question_status AND (question_source = :question_source0 OR question_source = :question_source1)",
                    ExpressionAttributeValues: expAttributeVal,
                    ProjectionExpression: projectionExp,
                };

                console.log("READ PARAMS : ", read_params);

                DATABASE_TABLE.scanRecord(docClient, read_params, callback);
            } 
            else {
                IdArray.forEach((element, index) => {
                    if (index < IdArray.length - 1) {
                        FilterExpressionDynamic = FilterExpressionDynamic + filterExpDynamic + index + " AND question_status = :question_status" + index + " OR ";
                        ExpressionAttributeValuesDynamic[":" + fetchIdName + "" + index] = element + "";
                        ExpressionAttributeValuesDynamic[":question_status" + index] = questionStatus + "";
                    } else {
                        FilterExpressionDynamic = FilterExpressionDynamic + filterExpDynamic + index + " AND question_status = :question_status" + index;
                        ExpressionAttributeValuesDynamic[":" + fetchIdName + "" + index] = element;
                        ExpressionAttributeValuesDynamic[":question_status" + index] = questionStatus;
                    }
                });

                let read_params = {
                    TableName: TableName,
                    FilterExpression: FilterExpressionDynamic,
                    ExpressionAttributeValues: ExpressionAttributeValuesDynamic,
                    ProjectionExpression: projectionExp,
                };

                console.log("READ PARAMETER : ", read_params);

                DATABASE_TABLE.scanRecord(docClient, read_params, callback);
            }
        }
    });
}

exports.fetchBulkQuestionsWithPublishStatusAndProjection = function (request, callback) {

    dynamoDbCon.getDB(async function (DBErr, dynamoDBCall) {
        if (DBErr) {
            console.log(constant.messages.DATABASE_ERROR);
            console.log(DBErr);
            callback(500, constant.messages.DATABASE_ERROR);
        } else {
            let { IdArray, fetchIdName, TableName, projectionExp, questionStatus, sourceIds } = request;
            
            let filterExpDynamic = fetchIdName + "= :" + fetchIdName;
            let expAttributeVal = {};

            let docClient = dynamoDBCall;
            let FilterExpressionDynamic = "";
            let ExpressionAttributeValuesDynamic = {};

            IdArray = [...new Set(IdArray)];

            console.log("IdArray : ", IdArray);
            if (IdArray.length === 0) {
                console.log("EMPTY BULK ID");
                callback(0, { Items: [] });
            } 
            else if (IdArray.length === 1) 
            {
                /** SINGLE DATA **/
                expAttributeVal[":" + fetchIdName] = IdArray[0];
                expAttributeVal[":question_status"] = questionStatus;
                let singleSourceFilter = " AND (";
                await sourceIds.forEach((sId, sIndex) => {
                    expAttributeVal[":question_source" + sIndex] = sId;

                    singleSourceFilter += (sIndex === sourceIds.length-1) ? "question_source = :question_source" + sIndex + ")" : "question_source = :question_source" + sIndex + " OR ";

                })

                singleSourceFilter = sourceIds.length > 0 ? singleSourceFilter : "";

                let read_params = {
                    TableName: TableName,
                    FilterExpression: "" + fetchIdName + " = :" + fetchIdName + " AND question_status = :question_status" + singleSourceFilter,
                    ExpressionAttributeValues: expAttributeVal,
                    ProjectionExpression: projectionExp,
                };

                // console.log("SINGLE READ PARAMS : ", read_params);

                DATABASE_TABLE.scanRecord(docClient, read_params, callback);
                
                /** END SINGLE DATA **/
            } 
            else {
                let multiSourceFilter = "";
                async function multiset(index)
                {
                    if(index < IdArray.length)
                    {
                        multiSourceFilter = " AND (";
                        await sourceIds.forEach((mId, mIndex) => {
                            ExpressionAttributeValuesDynamic[":question_source" + mIndex +""+ index] = mId;
        
                            multiSourceFilter += (mIndex === sourceIds.length-1) ? "question_source = :question_source" + mIndex+""+ index + ")" : "question_source = :question_source" + mIndex+""+ index + " OR ";
        
                        })

                        multiSourceFilter = sourceIds.length > 0 ? multiSourceFilter : "";

                        if (index < IdArray.length - 1) {
                            FilterExpressionDynamic = FilterExpressionDynamic + filterExpDynamic + index + " AND question_status = :question_status" + index + "" + multiSourceFilter +" OR ";
                            ExpressionAttributeValuesDynamic[":" + fetchIdName + "" + index] = IdArray[index] + "";
                            ExpressionAttributeValuesDynamic[":question_status" + index] = questionStatus + "";
                        } else {
                            FilterExpressionDynamic = FilterExpressionDynamic + filterExpDynamic + index + " AND question_status = :question_status" + index + "" + multiSourceFilter;
                            ExpressionAttributeValuesDynamic[":" + fetchIdName + "" + index] = IdArray[index];
                            ExpressionAttributeValuesDynamic[":question_status" + index] = questionStatus;
                        }

                        index++;
                        multiset(index);
                    }
                    else
                    {
                        /** THE END **/
                        let read_params = {
                            TableName: TableName,
                            FilterExpression: FilterExpressionDynamic,
                            ExpressionAttributeValues: ExpressionAttributeValuesDynamic,
                            ProjectionExpression: projectionExp,
                        };
                        
                        // console.log("READ PARAMETER : ", read_params);
                        
                        DATABASE_TABLE.scanRecord(docClient, read_params, callback);
                        /** END THE END **/
                    }
                }
                multiset(0);
            }
        }
    });
}
