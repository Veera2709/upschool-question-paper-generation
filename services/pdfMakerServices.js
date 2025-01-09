const classRepository = require("../repository/classRepository");  
const sectionRepository = require("../repository/sectionRepository");
const subjectRepository = require("../repository/subjectRepository"); 
const testQuestionPaperRepository = require("../repository/testQuestionPaperRepository");  
const commonRepository = require("../repository/commonRepository");
const constant = require('../constants/constant');
const { TABLE_NAMES } = require('../constants/tables');
const helper = require('../helper/helper');
const dynamoDbCon = require('../awsConfig');
const fs = require('fs');
const Pdfmake = require('pdfmake');
var Promise = require('bluebird');
const chromium = require('chrome-aws-lambda');


exports.createAnserSheet = (request, callback) => {
    classRepository.getIndividualClientClassById(request, function (classData_err, classData_res) {
        if (classData_err) {
            console.log(classData_err);
            callback(classData_err, classData_res);
        } else {
            console.log("CLIENT CLASS DATA: ", classData_res);

            sectionRepository.getSectionDetailsById(request, async function (sectionData_err, sectionData_res) {
                if (sectionData_err) {
                    console.log(sectionData_err);
                    callback(sectionData_err, sectionData_res);
                } else {
                    console.log("SECTION DATA: ", sectionData_res);

                    subjectRepository.getSubjetById(request, function (subjectData_err, subjectData_res) {
                        if (subjectData_err) {
                            console.log(subjectData_err);
                            callback(subjectData_err, subjectData_res);
                        } else {
                            console.log("SUBJECT DATA: ", subjectData_res);

                            testQuestionPaperRepository.getTestQuestionPaperById(request, async function (QuestionPaper_err, QuestionPaper_res) {
                                if (QuestionPaper_err) {
                                    console.log(QuestionPaper_err);
                                    callback(QuestionPaper_err, QuestionPaper_res);
                                } else {
                                    console.log("QUESTION PAPER DATA: ", QuestionPaper_res);
                                    let allQuestionId = [];
                                    await QuestionPaper_res.Items[0].questions.forEach(qIds => {
                                        allQuestionId =  [...allQuestionId, ...qIds.question_id];
                                    });

                                    /** FETCH QUESTION DATA **/
                                    let fetchBulkQueReq = {
                                        IdArray : allQuestionId,
                                        fetchIdName : "question_id",
                                        TableName : TABLE_NAMES.upschool_question_table,
                                        projectionExp : [ "question_id", "answers_of_question", "question_content", "question_type"]
                                    }
                                    const quesData_res = await commonRepository.fetchBulkDataWithProjection3(fetchBulkQueReq)
                                    // commonRepository.fetchBulkDataWithProjection(fetchBulkQueReq, async function (quesData_err, quesData_res) {
                                    //     if (quesData_err) {
                                    //         console.log(quesData_err);
                                    //         callback(quesData_err, quesData_res);
                                    //     } else {
                                            console.log("QUESTION DATA : ", quesData_res);

                                            exports.designAnswerSheetPdf(request, classData_res.Items[0], sectionData_res.Items[0], subjectData_res.Items[0], QuestionPaper_res.Items[0], quesData_res, (designErr, designRes) => {
                                                if(designErr)
                                                {
                                                    console.log("ANSWER SHEET DESIGN ERROR");
                                                    callback(designErr, designRes);
                                                }
                                                else
                                                {
                                                    console.log("ANSWER SHEET DESIGN READY");
                                                    callback(designErr, designRes);
                                                }
                                            })
                                    //     }
                                    // })
                                    /** END FETCH QUESTION DATA **/
                                }
                            }) 
                        }
                    })   
                }
            })
        }
    })
}

exports.designAnswerSheetPdf = (request, classData, sectionData, subjectData, questinoPaper, questionData, callback) => {
    let fonts = {
        Roboto: {
            normal: './pdfFonts/Roboto-Regular.ttf',
            bold: './pdfFonts/Roboto-Medium.ttf',
            italics: './pdfFonts/Roboto-Italic.ttf',
            bolditalics: './pdfFonts/Roboto-MediumItalic.ttf'
        }
    };
    
    let pdfmake = new Pdfmake(fonts);

    // let pdfHeader = [
    //     {
    //         text: 'Test ID: '+ questinoPaper.question_paper_id +'\nClass: '+ classData.client_class_name +'\nSection: '+ sectionData.section_name +'\nSubject Name: '+ subjectData.subject_title +'\nStudent ID:' + constant.answerSheet.studtIdBlank,
    //         style: 'headerStyle'
    //     }
    // ]

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

    let pageMargins = [40, 140, 40, 40];
    let content = [];

    let sections = questinoPaper.questions;
    let questionArr = [];
    let oneQuestion = "";
    let answerBlanks = "";

    let questionNumber = 1;
    async function sectionLoop(i)
    {
        questionArr = [];
        if(i < sections.length)
        {
            content.push({text: sections[i].section_name, style: 'sections'});            
            questionArr = sections[i].question_id;

            async function quesLoop(j)
            {
                if(j < questionArr.length)
                {
                    oneQuestion = "";
                    answerBlanks = "";                    
                    oneQuestion = await questionData.filter(ques => ques.question_id === questionArr[j]);

                    if(oneQuestion.length > 0)
                    {
                        answerBlanks = await exports.getAnsBlanks(oneQuestion[0]);
                        content.push({start: questionNumber++, ol: ['Ans: ' + answerBlanks], style: 'questions'});
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
                    /** J LOOP END **/
                    i++;
                    sectionLoop(i);
                    /** J LOOP END **/
                }
            }
            quesLoop(0);            
        }
        else
        {
            /** GENERATE PDF **/
            let pdfContent = {
                header: function(currentPage, pageCount) {
                    return [
                        {                
                            columns: [
                                {
                                    width: 400,
                                    text: 'Test ID: '+ request.data.class_test_id +'\nTest Name: '+ request.data.class_test_name +'\nClass: '+ classData.client_class_name +'\nSection: '+ sectionData.section_name +'\nSubject Name: '+ subjectData.subject_title +'\nRoll No: ' + constant.answerSheet.studtIdBlank,                           
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
                styles: styles,
                content: content,
                pageMargins: pageMargins
            }

            /** LOCAL UPLOAD **/
            // const folderName = "./pdfsMade";
            // if (!fs.existsSync(folderName)) {
            //     fs.mkdirSync(folderName);
            // }

            // pdfDoc = pdfmake.createPdfKitDocument(pdfContent, {});
            // pdfDoc.pipe(fs.createWriteStream('./pdfsMade/questionPaper.pdf'));
            // pdfDoc.end()
            // console.log("PDF UPLOADED!");
            /** END LOCAL UPLOAD **/

            /** UPLOAD TO S3 **/
            let pdfDoc = pdfmake.createPdfKitDocument(pdfContent);
            exports.uploadPdfToS3(request, pdfDoc, "answerSheets", (uploadErr, uploadRes) => {
                if(uploadErr)
                {
                    console.log("ANSWER SHEET S3 UPLOAD ERROR");
                    callback(uploadErr, uploadRes);
                }
                else
                {
                    console.log("ANSWER SHEET UPLOADED TO S3");

                    callback(uploadErr, uploadRes);
                }
            })
            /** END UPLOAD TO S3 **/         
            
            /** GENERATE PDF **/
        }
    }
    sectionLoop(0)
}

exports.uploadPdfToS3 = (request, pdfDoc, folderName, callback) => {

    const pdf_file = helper.getRandomString() + '.pdf';

    let fileKey = ""; 
    if(request.data.exam_type === "quiz"){
        fileKey = constant.quizFolder[folderName].replace("**REPLACE**", request.data.quiz_id) + pdf_file;
    }else{
        fileKey = constant.testFolder[folderName].replace("**REPLACE**", request.data.class_test_id) + pdf_file;
    }

    if(folderName === "questionPapers" || folderName === "questionPapersSetA" || folderName === "questionPapersSetB" || folderName === "questionPapersSetC"){ 
        console.log("questionPapers : ");

        dynamoDbCon.s3.putObject(
            {
                Bucket: process.env.BUCKET_NAME,
                Key: fileKey,
                Body: pdfDoc,
                ContentType: helper.getMimeType(".pdf"),
                ACL: 'public-read'
            },
            function (resp) {
                console.log("FILE UPLOAD RESPONSE : ", resp);
                callback(0, fileKey);
            }
        );

    }else{
        let chunks = [];

        pdfDoc.on("data", chunk => {
            chunks.push(chunk);
        });
    
        pdfDoc.on("end", () => {
            // console.log({ chunks })
            const result = Buffer.concat(chunks);
            console.log({ result })
    
            dynamoDbCon.s3.putObject(
                {
                    Bucket: process.env.BUCKET_NAME,
                    Key: fileKey,
                    Body: result,
                    ContentType: helper.getMimeType(".pdf"),
                    ACL: 'public-read'
                },
                function (resp) {
                    console.log("FILE UPLOAD RESPONSE : ", resp);
                    callback(0, fileKey);
                }
            );
        });
    
        pdfDoc.end();

    }
   
}

exports.getAnsBlanks = async (qData) => {
    let blankCount = 0;
    let finalBlanks = "";

    if(qData.question_type === constant.questionKeys.objective)
    {
        await qData.answers_of_question.forEach(ans => {
            if(ans.answer_display === "Yes")
            {
                blankCount++;
            }
        })

        finalBlanks = await helper.getAnswerBlanks(blankCount);
        return finalBlanks;
    }
    else if(qData.question_type === constant.questionKeys.subjective)
    {
        let reg = new RegExp((constant.answerSheet.findBlank) + ("(.*?)") + (constant.answerSheet.findBlank), 'g');
        blankCount = (qData.question_content.match(reg) || []).length; // find $$
        finalBlanks = await helper.getAnswerBlanks(blankCount);
        return finalBlanks;
    }
    else
    {
        return constant.answerSheet.descriptiveSpace;
    }
}

exports.QuestionPaperService = (request, questionPaper, callback) => {
    // console.log("here",questionPaper)
    fs.readFile('./HTML/htmlFormat.html', function(err, pdfHTML){
        if(err){ 
            callback(400, err)
        }else{
            let questionNumber = 1;
            pdfHTML = pdfHTML.toString('utf8'); 
            
            let Header = `<div class="container">
                            <div class="row" style="line-height: 0.5em;">

                                <div class="col-md-12" style="text-align:left;">
                                    <p >Class : ${questionPaper.client_class_name}</p>
                                    <p >Section : ${questionPaper.section_name}</p>
                                    <p >Subject : ${questionPaper.subject_title}</p>
                                    <p >Test : ${questionPaper.class_test_name}</p>
                                </div>

                            </div>
                            <div class="row">
                            <div class="col-md-12" style="display: flex; justify-content: space-between;">
                              <p  >Time Allocated : ${questionPaper.test_duration} min</p>
                              <p  >Max Marks : ${questionPaper.max_marks} </p>
                            </div>
                          </div>
                          <hr>`;   

            pdfHTML += Header;

            // console.log("questionPaper.questions : ", questionPaper.questions); 

            
            async function sectionLoop(m){
                // console.log("functionloop",questionPaper.questions.length)
                if(m < questionPaper.questions.length){

                    let sectionHeader = `
                    <div class="row" >
                    <div class="col-md-10">
                      <p style="text-align: center; font-weight: bold">${questionPaper.questions[m].section_name}</p>
                    </div>
                    <div class="col-md-2" style="display:flex">
                        <p style="position: absolute;right:0;">[ ${questionPaper.questions[m].section_marks} ]</p>
                      <p>${questionPaper.questions[m].section_description}</p> 
                    </div>
                    </div>
                  </div>`; 
                    pdfHTML += sectionHeader; 

                    async function qtnLoop(n){
                        if(n < questionPaper.questions[m].question_id.length){
                            // console.log("questionssection",questionPaper.questions[m])
                            let e = questionPaper.questions[m].question_id[n]; 

                            let answerOfQuestion = e.answers_of_question;
                            // console.log("e",e.answers_of_question)
                            if (e.question_type === "Subjective") {
                                if (e.question_content.includes("$$")) {
                                    let splitArray = e.question_content.split("$$");
                                    splitArray.forEach((a, j) => {
                                        if (j % 2 !== 0) {
                                            splitArray[j] = `_____`
                                        }
                                    }); 
                                    let joinArray = ""; 
                                    await splitArray.forEach((e) => { joinArray += e }); 

                                    e.question_content = joinArray;
                                }
                                pdfHTML += `<div class="row" style="display:flex">
                                                <div class="col-md-1">
                                                    <p >${questionNumber++}.&nbsp </p> 
                                                </div>
                                                <div class="col-md-10">
                                                    <div>
                                                        ${e.question_content}
                                                    </div> 
                                                </div>
                                                <div class="col-md-1" style="position: absolute;right:0;">
                                                    <p >[ ${ e.marks } ]</p>
                                                </div>
                                            </div>`; 

                                n++; 
                                qtnLoop(n); 
                            }
                            else if (e.question_type === "Objective") {
                                console.log("content",e.question_content)
                                pdfHTML = pdfHTML + `<div class="row" style="display:flex">
                                                        <div class="col-md-1">
                                                            <p >${questionNumber++}.&nbsp </p> 
                                                        </div>
                                                        <div class="col-md-10">
                                                            <div>
                                                                ${e.question_content}
                                                            </div> 
                                                        </div>
                                                        <div class="col-md-1" style="position: absolute;right:0;">
                                                            <p >[ ${ e.marks } ]</p>
                                                        </div>
                                                    </div>`; 

                                let ansOptions = `<div class="row" style="padding-left: 30px;">`; 
            
                                async function ansOption(l){
                                    if(l < answerOfQuestion.length){
                                        console.log(answerOfQuestion[l])
                                        let k = answerOfQuestion[l]; 
            
                                         if(k.answer_type === "Equation"){
            
                                            let htmlMathJax = await helper.convertMathJax(k.answer_content); 
                                            console.log("htmlMathJax : ", htmlMathJax);
            
                                            ansOptions += `<div class="col-md-${12/answerOfQuestion.length}" style="text-align:left;">
                                                            <p style="word-wrap: break-word">${String.fromCharCode(97+l)}. </p>${htmlMathJax}
                                                        </div>`;
                                        }
                                        else if(k.answer_type === "Image"){
                                            const bucketName = process.env.BUCKET_NAME;
                                            const region = process.env.REGION;

                                            ansOptions += `<div class="col-md-${12/answerOfQuestion.length}" style="text-align:left;">
                                                                <p style="word-wrap: break-word">${String.fromCharCode(97+l)}. </p> <img src="https://${bucketName}.s3.${region}.amazonaws.com/${k.answer_content}" style="width: 100px;" alt="Image Option">
                                                            </div>`; 
                                        }
                                        else{
                                            ansOptions += `<div class="col-md-${12/answerOfQuestion.length}" style="text-align:left;">
                                                                <p style="word-wrap: break-word">${String.fromCharCode(97+l)}. ${k.answer_content}</p>
                                                            </div>`; 
                                        }
                                        
                                        
                                        l++
                                        ansOption(l); 
                                    }else{
                                        // Answers Processed : 
                                         ansOptions += `</div>`; 
                                         console.log(ansOptions)
                                        pdfHTML += ansOptions; 
            
                                        n++; 
                                        qtnLoop(n); 
                                    }
                                }
                                ansOption(0);  
                          }else if(e.question_type === "Descriptive"){
                            pdfHTML += `<div class="row" style="display:flex">
                                            <div class="col-md-1">
                                                <p >${questionNumber++}.&nbsp </p> 
                                            </div>
                                            <div class="col-md-10">
                                                <div>
                                                    ${e.question_content}
                                                </div> 
                                            </div>
                                            <div class="col-md-1" style="position: absolute;right:0;">
                                                <p >[ ${ e.marks } ]</p>
                                            </div>
                                        </div>`; 

                            n++; 
                            qtnLoop(n); 
                          }
                          
                        }else{
                            // Questions Processed 
                            console.log("questions processed")
                            // Display HTML : 
                            pdfHTML += `</div></body></html>`;
                                
                            m++
                            sectionLoop(m); 
                        }
                    }
                    qtnLoop(0)
                
                }else{
                    // Final PDF Creation : 
                   // Puppeteer : 
                   console.log("final")
                    const browser = await chromium.puppeteer.launch({
                        headless: 'new',
                        args: ['--no-sandbox'],
                    });
                    const page = await browser.newPage();
                    const options = {
                        // path: outputFilePath,
                        format: 'A4',
                        margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" }, 
                        displayHeaderFooter: true,
                        headerTemplate: "<div><p></p></div>", 
                        footerTemplate: "<div style=\"text-align: right;width: 297mm;font-size: 8px;  white-space: normal;\"><span style=\"margin-right: 1cm\"><span class=\"pageNumber\"></span> of <span class=\"totalPages\"></span></span></div>"
                    }
                    await page.setContent(pdfHTML, { waitUntil: 'networkidle0' }); 

                    await page.emulateMediaType('screen');

                    Promise.props( await page.pdf(options) ) 
                        .then(async function (data) {
                
                            await browser.close();
                            let pdfBuffer = Buffer.from(Object.values(data));
                            request.data.exam_type = "test"; 
                            /** UPLOAD TO S3 **/
                            exports.uploadPdfToS3(request, pdfBuffer, "questionPapers", (uploadErr, uploadRes) => {
                                if(uploadErr)
                                {
                                    console.log("QUESTION SHEET S3 UPLOAD ERROR");
                                    callback(uploadErr, uploadRes);
                                }
                                else
                                {
                                    console.log("QUESTION SHEET UPLOADED TO S3", uploadErr, uploadRes);
                                    callback(uploadErr, uploadRes);
                                }
                            })
                            /** END UPLOAD TO S3 **/  

                        }).catch((err) => {
                            callback(400, err); 
                        })
                }
            }
            sectionLoop(0); 
        }
    });
}


exports.QuizQuestionPaperService = (request, questionPaper, listOfSets, callback) => {
    
    let setAContent = ""; 
    let setBContent = ""; 
    let setCContent = ""; 

    fs.readFile('./HTML/htmlFormat.html', async function(err, rawHTML){
        if(err){ 
            callback(400, err)
        }else{
            rawHTML = rawHTML.toString('utf8'); 
         
            async function sectionLoop(m){
                
                if(m < listOfSets.length){

                    let pdfHTML = rawHTML; 

                    let max_marks = 0; 
                    await listOfSets[m].forEach((Qns) => { max_marks += Number(Qns.marks) }); 

                    let Header = `<div class="container">
                    <div class="row" style="line-height: 0.5em;">

                        <div class="col-md-12" style="text-align:left;">
                            <p >Set : ${m === 0 ? "A" : m === 1 ? "B" : "C"}</p>
                            <p >Class : ${questionPaper.client_class_name}</p>
                            <p >Section : ${questionPaper.section_name}</p>
                            <p >Subject : ${questionPaper.subject_title}</p>
                            <p >Quiz : ${questionPaper.quiz_name}</p>
                        </div>

                    </div>
                    <div class="row">
                        <div class="col-md-12" style="display: flex; justify-content: space-between;">
                        <p  >Time Allocated : ${questionPaper.quiz_duration} min</p>
                        <p  >Max Marks : ${max_marks} </p>
                        </div>
                    </div>
                    <hr> 
                    `;   

                  pdfHTML += Header;

                    async function qtnLoop(n){
                        if(n < listOfSets[m].length){

                            let e = listOfSets[m][n]; // Each Question 

                            let answerOfQuestion = e.answers_of_question;
            
                            if (e.question_type === "Subjective") {
                                if (e.question_content.includes("$$")) {
                                    let splitArray = e.question_content.split("$$");
                                    splitArray.forEach((a, j) => {
                                        if (j % 2 !== 0) {
                                            splitArray[j] = `_____`
                                        }
                                    }); 
                                    let joinArray = ""; 
                                    await splitArray.forEach((e) => { joinArray += e }); 

                                    e.question_content = joinArray;
                                }
                                pdfHTML += `<div class="row" style="display:flex">
                                                <div class="col-md-1">
                                                    <p >${n+1}.&nbsp </p> 
                                                </div>
                                                <div class="col-md-10">
                                                    <div>
                                                        ${e.question_content}
                                                    </div> 
                                                </div>
                                                <div class="col-md-1" style="position: absolute;right:0;">
                                                    <p >[ ${ e.marks } ]</p>
                                                </div>
                                            </div>`; 
                                n++; 
                                qtnLoop(n); 
                            }
                            else if (e.question_type === "Objective") {
                        
                                pdfHTML = pdfHTML + `<div class="row" style="display:flex">
                                                        <div class="col-md-1">
                                                            <p >${n+1}.&nbsp </p> 
                                                        </div>
                                                        <div class="col-md-10">
                                                            <div>
                                                                ${e.question_content}
                                                            </div> 
                                                        </div>
                                                        <div class="col-md-1" style="position: absolute;right:0;">
                                                            <p >[ ${ e.marks } ]</p>
                                                        </div>
                                                    </div>`; 

                                let ansOptions = `<div class="row" style="padding-left: 30px;">`; 
            
                                async function ansOption(l){
                                    if(l < answerOfQuestion.length){
                                        let k = answerOfQuestion[l]; 
            
                                         if(k.answer_type === "Equation"){
            
                                            let htmlMathJax = await helper.convertMathJax(k.answer_content); 
                                            console.log("htmlMathJax : ", htmlMathJax);
            
                                            ansOptions += `<div class="col-md-${12/answerOfQuestion.length}" style="text-align:left;">
                                                            <p style="word-wrap: break-word">${String.fromCharCode(97+l)}. </p>${htmlMathJax}
                                                        </div>`;
                                        }
                                        else if(k.answer_type === "Image"){
                                            const bucketName = process.env.BUCKET_NAME;
                                            const region = process.env.REGION;
                                            ansOptions += `<div class="col-md-${12/answerOfQuestion.length}" style="text-align:left;">
                                                                <p style="word-wrap: break-word">${String.fromCharCode(97+l)}. </p> <img src="https://${bucketName}.s3.${region}.amazonaws.com/${k.answer_content}" style="width: 100px;" alt="Image Option">
                                                            </div>`; 
                                        }
                                        else{
                                            ansOptions += `<div class="col-md-${12/answerOfQuestion.length}" style="text-align:left;">
                                                                <p style="word-wrap: break-word">${String.fromCharCode(97+l)}. ${k.answer_content}</p>
                                                            </div>`; 
                                        }
                                        
                                        l++
                                        ansOption(l); 
                                    }else{
                                        // Answers Processed : 
                                         ansOptions += `</div>`; 
                                        console.log(ansOptions)
                                        pdfHTML += ansOptions; 
            
                                        n++; 
                                        qtnLoop(n); 
                                    }
                                }
                                ansOption(0);  
                          }else if(e.question_type === "Descriptive"){
                            pdfHTML += `<div class="row" style="display:flex">
                                            <div class="col-md-1">
                                                <p >${n+1}.&nbsp </p> 
                                            </div>
                                            <div class="col-md-10">
                                                <div>
                                                    ${e.question_content}
                                                </div> 
                                            </div>
                                            <div class="col-md-1" style="position: absolute;right:0;">
                                                <p >[ ${ e.marks } ]</p>
                                            </div>
                                        </div>`; 

                            n++; 
                            qtnLoop(n); 
                          }
                          
                        }else{
                            // Questions Processed 
                            // Display HTML : 
                            pdfHTML += `</div></body></html>`;

                            m === 0 && (setAContent = pdfHTML); 
                            m === 1 && (setBContent = pdfHTML); 
                            m === 2 && (setCContent = pdfHTML); 

                            m++
                            sectionLoop(m); 
                        }
                    }
                    qtnLoop(0)

                }else{
                    // Final PDF Creation : 
                   // Puppeteer : 
                   const options = {
                        // path: outputFilePath,
                        format: 'A4',
                        margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" }, 
                        displayHeaderFooter: true,
                        headerTemplate: "<div><p></p></div>", 
                        footerTemplate: "<div style=\"text-align: right;width: 297mm;font-size: 8px;  white-space: normal;\"><span style=\"margin-right: 1cm\"><span class=\"pageNumber\"></span> of <span class=\"totalPages\"></span></span></div>"
                    } 
                    let folderName = ""; 
                    let finalRespose = {}; 

                    async function qpUploadLoop(b){
                        if(b < listOfSets.length){

                            b === 0 && (pdfHTML = setAContent) && ( folderName = "questionPapersSetA" ); 
                            b === 1 && (pdfHTML = setBContent) && ( folderName = "questionPapersSetB" ); 
                            b === 2 && (pdfHTML = setCContent) && ( folderName = "questionPapersSetC" ); 

                            const browser = await chromium.puppeteer.launch({
                                headless: 'new',
                                args: ['--no-sandbox'],
                            });
                            const page = await browser.newPage();
                           
                            await page.setContent(pdfHTML, { waitUntil: 'networkidle0' }); 
        
                            await page.emulateMediaType('screen');
        
                            Promise.props( await page.pdf(options) ) 
                                .then(async function (data) {
                        
                                    await browser.close();
                                    let pdfBuffer = Buffer.from(Object.values(data));
        
                                    request.data.exam_type = "quiz"; 
                                    request.data.index = b; 
                                    /** UPLOAD TO S3 **/
                                    await exports.uploadPdfToS3(request, pdfBuffer, folderName, (uploadErr, uploadRes) => {
                                        if(uploadErr)
                                        {
                                            console.log("QUESTION SHEET S3 UPLOAD ERROR");
                                            callback(uploadErr, uploadRes);
                                        }
                                        else
                                        {
                                            console.log("QUESTION SHEET UPLOADED TO S3", uploadErr, uploadRes);
                                            // callback(uploadErr, uploadRes);
                                            finalRespose[folderName] = uploadRes; 
                                            b++; 
                                            qpUploadLoop(b); 
                                        }
                                    })
                                    /** END UPLOAD TO S3 **/  
        
                                }).catch((err) => {
                                    callback(400, err); 
                                })

                       
                        }else{
                            // Final Callback : 
                            console.log("finalRespose : ", finalRespose);
                            callback(0, finalRespose); 

                        }

                    }
                    qpUploadLoop(0); 

                }
            }
            sectionLoop(0); 
        }
    });
}
