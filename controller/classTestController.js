const classTestServices = require("../services/classTestServices");
// const quizAnswerSheetService = require("../services/quizAnswerSheetService");

exports.createQuestionAndAnswerPapers = (req, res, next) => {
    console.log("createQuestionAndAnswerPapers");
    let request = req.body;  
    console.log("REQUEST : ", request);  

    classTestServices.createQuestionAndAnswerPapers(request, function (class_test_err, class_test_response) {
        if (class_test_err) { 
            res.status(class_test_err).json(class_test_response);
        } else {
            console.log("Class Test Scheduled Successfully!"); 
            res.json(class_test_response);
        }
    });
};

exports.createQuizQuestionAndAnswerPapers = (req, res, next) => {
    console.log("createQuizQuestionAndAnswerPapers");
    let request = req.body;  
    console.log("REQUEST : ", request);  

    classTestServices.createQuizQuestionAndAnswerPapers(request, function (class_test_err, class_test_response) {
        if (class_test_err) { 
            res.status(class_test_err).json(class_test_response);
        } else {
            console.log("Quiz Scheduled Successfully!"); 
            res.json(class_test_response);
        }
    });
};

// exports.generateQuizPdf = (req, res, next) => {
//     console.log("generateQuizPdf");
//     let request = req.body;  
//     console.log("REQUEST : ", request);  

//     quizAnswerSheetService.createQuizAnserSheet(request.data.quizData, request.data.questionData, function (class_test_err, class_test_response) {
//         if (class_test_err) { 
//             res.status(class_test_err).json(class_test_response);
//         } else {
//             console.log("CHECK YOUR LOCAL FILE"); 
//             res.json(class_test_response);
//         }
//     });
// };