const scanData = (docClient, params, callback) => {
    docClient.scan(params, (err, data) => {
        if (err) {
            console.log(err);
            callback(err, data);
        } else {
            callback(err, data);
        }
    });
};

const queryData = (docClient, params, callback) => {
    docClient.query(params, (err, data) => {
        if (err) {
            console.log(err);
            callback(err, data);
        } else {
            callback(err, data);
        }
    });
};

const putData = (docClient, params, callback) => {
    docClient.put(params, (err, data) => {
        if (err) {
            console.log(err);
            callback(err, data);
        } else {
            callback(0, 200);
        }
    });
};

const updateData = (docClient, params, callback) => {
    docClient.update(params, (err, data) => {
        if (err) {
            callback(err, data);
        } else {
            callback(0, 200);
        }
    });
};

const deleteData = (docClient, params, callback) => {
    docClient.delete(params, (err, data) => {
        if (err) {
            console.log(err);
            callback(err, data);
        } else {
            callback(0, 200);
        }
    });
};
const deleteMultiData = (docClient, params, callback) => {
    docClient.delete(params, (err, data) => {
        if (err) {
            console.log(err);
            callback(err, data);
        } else {
            // callback(0, 200);
        }
    });
};
const batchReadData = (docClient, params, callback) => {
    docClient.batchGet(params, (err, data) => {
        if (err) {
            console.log(err);
            callback(err, data);
        } else {
            // callback(0, 200);
        }
    });
};
exports.DATABASE_TABLE = {
    scanRecord: scanData,
    queryRecord: queryData,
    putRecord: putData,
    updateRecord: updateData,
    deleteRecord: deleteData,
    deleteMultiRecord: deleteMultiData,
    batchReadRecord: batchReadData
}