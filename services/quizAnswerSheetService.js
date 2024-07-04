const classRepository = require("../repository/classRepository");  
const sectionRepository = require("../repository/sectionRepository");
const subjectRepository = require("../repository/subjectRepository"); 
const pdfMakerServices = require("./pdfMakerServices"); 
const constant = require('../constants/constant');
const helper = require('../helper/helper');
const dynamoDbCon = require('../awsConfig');
const fs = require('fs');
const Pdfmake = require('pdfmake');
var Promise = require('bluebird');

exports.createQuizAnserSheet = (quizData, questionData, callback) => {

    let requestData = {
        data: {
            client_class_id: quizData.client_class_id,
            section_id: quizData.section_id,
            subject_id: quizData.subject_id,
        }
    };

    classRepository.getIndividualClientClassById(requestData, function (classData_err, classData_res) {
        if (classData_err) {
            console.log(classData_err);
            callback(classData_err, classData_res);
        } else {
            console.log("CLIENT CLASS DATA: ", classData_res);

            sectionRepository.getSectionDetailsById(requestData, async function (sectionData_err, sectionData_res) {
                if (sectionData_err) {
                    console.log(sectionData_err);
                    callback(sectionData_err, sectionData_res);
                } else {
                    console.log("SECTION DATA: ", sectionData_res);

                    subjectRepository.getSubjetById(requestData, function (subjectData_err, subjectData_res) {
                        if (subjectData_err) {
                            console.log(subjectData_err);
                            callback(subjectData_err, subjectData_res);
                        } else {
                            console.log("SUBJECT DATA: ", subjectData_res);

                            /** DESIGN ANSWER SHEET **/
                            exports.designQuizAnswerSheetPdf(classData_res.Items[0], sectionData_res.Items[0], subjectData_res.Items[0], quizData, questionData, async(ansSheetErr, ansSheetRes) => {
                                if(ansSheetErr)
                                {
                                    console.log(ansSheetErr);
                                    callback(ansSheetErr, ansSheetRes)
                                }
                                else
                                {
                                    console.log(ansSheetRes);
                                    callback(ansSheetErr, ansSheetRes)
                                }
                            })
                            /** END DESIGN ANSWER SHEET **/
                        }
                    })
                }
            })
        }
    })
}

exports.designQuizAnswerSheetPdf = async (classData, sectionData, subjectData, quizData, questionData, callback) => {
    let quizQuestionDetails = quizData.quiz_question_details;
    let quizSetDetails = constant.quizSets;
    let overAllQuestions = [];
    
    let styles =  {
        sections: {
            fontSize: 13,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 0]
        },
        headerStyle: {
            margin: [40, 40, 0, 40]
        },
        questions: {
            margin: [0, 10, 0, 10]
        }
    };

    let pageMargins = [40, 150, 40, 40];
    let content = [];
    let setQuestionIds;
    let pdfRequires = {};
    let oneQuestion = "";
    let answerBlanks = "";
    let headerText = "";
    async function setLoop(i)
    {   
        setQuestionIds = [];
        content = [];
        if(i < quizSetDetails.length)
        {
            setQuestionIds = quizQuestionDetails[quizSetDetails[i].setKey];
            async function quesLoop(j)
            {
                if(j < setQuestionIds.length)
                {
                    oneQuestion = "";
                    answerBlanks = "";                    
                    oneQuestion = await questionData.filter(ques => ques.question_id === setQuestionIds[j]);

                    if(oneQuestion.length > 0)
                    {
                        answerBlanks = await pdfMakerServices.getAnsBlanks(oneQuestion[0]);
                        content.push({start: j+1, ol: ['Ans: ' + answerBlanks], style: 'questions'});
                        j++;
                        quesLoop(j);
                    }
                    else
                    {
                        j++;
                        quesLoop(j);
                    }                    
                }
                else
                {
                    /** QUESTION LOOP END **/
                    
                    headerText = 'Set: '+ quizSetDetails[i].setName +'\nQuiz ID: '+ quizData.quiz_id +'\nQuiz Name: '+ quizData.quiz_name +'\nClass: '+ classData.client_class_name +'\nSection: '+ sectionData.section_name +'\nSubject Name: '+ subjectData.subject_title +'\nRoll No:' + constant.answerSheet.studtIdBlank;

                    pdfRequires = {
                        headerText: headerText,
                        styles: styles,
                        content: content,
                        pageMargins: pageMargins,
                    }
                    await createPdfContent(pdfRequires).then(async (contentPdf) => {
                        overAllQuestions.push({
                            pdfContent: contentPdf,
                            pdfPath: quizSetDetails[i].setFolder,
                            fieldName: quizSetDetails[i].fieldName,
                        })
                        i++;                    
                        setLoop(i);
                    })
                    /** QUESTION LOOP END **/
                }
            }
            quesLoop(0);             
        }
        else
        {           
            /** UPLOAD TO S3 **/
            console.log("GOT THREE SETS!");
            await exports.uploadAnswerSheetsToS3(quizData, overAllQuestions).then(async (uploadRes) => {
                callback(0, uploadRes);
            })
        }
    }
    setLoop(0);
}

const createPdfContent = (pdfRequires) => {
    return new Promise(async (resolve, reject) => {
        let conPdf = {
            header: function(currentPage, pageCount) {
                return [
                    {                
                        columns: [
                            {
                                width: 400,
                                text: pdfRequires.headerText,                           
                            },
                            {
                                width: '*',
                                text: 'Page No: ' + currentPage + '/' + pageCount,                                 
                            },
                        ],
                        style: 'headerStyle'
                    }
                ]
            },
            styles: pdfRequires.styles,
            content: pdfRequires.content,
            pageMargins: pdfRequires.pageMargins
        }

        resolve(conPdf);
    })
}

exports.uploadAnswerSheetsToS3 = (quizData, pdfContent) => {

    return new Promise(async (resolve, reject) => {
        let fonts = {
            Roboto: {
                normal: './pdfFonts/Roboto-Regular.ttf',
                bold: './pdfFonts/Roboto-Medium.ttf',
                italics: './pdfFonts/Roboto-Italic.ttf',
                bolditalics: './pdfFonts/Roboto-MediumItalic.ttf'
            }
        };
        
        let pdfmake = new Pdfmake(fonts);
        
        let pdf_file, fileKey, pdfDoc;
        let answerSheetPath = {};       

        async function contentLoop(i)
        {            
            if(i < pdfContent.length)
            {
                pdf_file = helper.getRandomString() + '.pdf';
                fileKey = pdfContent[i].pdfPath.replace("**REPLACE**", quizData.quiz_id) + pdf_file;
                pdfDoc = pdfmake.createPdfKitDocument(pdfContent[i].pdfContent);
                
                await exports.uploadPdfToS3(fileKey, pdfDoc).then(async (resKey) => {
                    // answerSheetPath.push(resKey);
                    answerSheetPath[pdfContent[i].fieldName] = resKey;
                    i++;
                    contentLoop(i);
                })            
            }
            else
            {
                console.log("ANSWER SHEET GENERATED");
                resolve(answerSheetPath);
            }
        }
        contentLoop(0);
    })    
}

exports.uploadPdfToS3 = (fileKey, pdfDoc) => {
    return new Promise(async (resolve, reject) => {

        /** LOCAL UPLOAD **/
        // const folderName = "./pdfsMade";
        // if (!fs.existsSync(folderName)) {
        //     fs.mkdirSync(folderName);
        // }
        
        // let pdf_file = helper.getRandomString() + '.pdf';
        // await pdfDoc.pipe(fs.createWriteStream('./pdfsMade/' + pdf_file));
        // pdfDoc.end()
        // console.log("PDF UPLOADED!");
        // resolve(fileKey);
        /** END LOCAL UPLOAD **/
        
        /** TO S3 **/
        let chunks = [];

        pdfDoc.on("data", chunk => {
            chunks.push(chunk);
        });
    
        pdfDoc.on("end", () => {
            const result = Buffer.concat(chunks);

            dynamoDbCon.s3.putObject(
                {
                    Bucket: process.env.BUCKET_NAME,
                    Key: fileKey,
                    Body: result,
                    ContentType: helper.getMimeType(".pdf"),
                    ACL: 'public-read'
                },
                function (resp) {
                    console.log("QUIZ ANSWER SHEET UPLOADED RESPONSE : ", resp);
                    resolve(fileKey);
                }
            );
        });
    
        pdfDoc.end();
        /** END TO S3 **/
    })        
}