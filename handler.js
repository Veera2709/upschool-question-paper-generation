const http = require("http");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();
const cors = require('cors');

const classTestController = require('./controller/classTestController');

app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 100000,
}));

app.use(bodyParser.json({
    limit: '50mb'
}));

app.use(bodyParser.json({
    type: "application/vnd.api+json",
}));

app.use(cors());

// CLASS TEST : 
app.post("/v1/createQuestionAndAnswerPapers", classTestController.createQuestionAndAnswerPapers); //  validator.validUser,
app.post("/v1/createQuizQuestionAndAnswerPapers", classTestController.createQuizQuestionAndAnswerPapers); //  validator.validUser,

// local test:
// app.post("/v1/generateQuizPdf", classTestController.generateQuizPdf);

const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'dev') {
    app.set("port", process.env.PORT || 3001);
} else if (NODE_ENV === 'testing') {
    app.set("port", process.env.PORT || 3002);
} else if (NODE_ENV === 'uat') {
    app.set("port", process.env.PORT || 3003);
}
else {
    app.set("port", process.env.PORT || 3004);
}

let server = http.createServer(app);
server.listen(app.get("port"), "0.0.0.0", () => {
    console.log(`Express server listening on Port: ${app.get("port")}`);
});
