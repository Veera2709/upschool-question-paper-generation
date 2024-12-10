const dynamoDbCon = require('../awsConfig');  
const quizAnswerSheetService = require("./quizAnswerSheetService");  
const testQuestionPaperRepository = require("../repository/testQuestionPaperRepository");
const commonRepository = require("../repository/commonRepository");
const blueprintRepository = require("../repository/blueprintRepository");  
const classRepository = require("../repository/classRepository");  
const subjectRepository = require("../repository/subjectRepository");  
const quizRepository = require("../repository/quizRepository");
const sectionRepository = require("../repository/sectionRepository");  
const userRepository = require("../repository/userRepository");  
const pdfMaker = require("./pdfMakerServices");
const pdfMakerServices = require("./pdfMakerServices");
const { TABLE_NAMES } = require('../constants/tables');
const constant = require('../constants/constant');
const helper = require('../helper/helper');

exports.createQuestionAndAnswerPapers = (request, callback) => {
    console.log("TIME : ", helper.getCurrentTimestamp());
    pdfMaker.createAnserSheet(request, (anserSheet_err, answerSheet_data) => {
        if(anserSheet_err)
        {
            console.log(anserSheet_err, answerSheet_data);
            callback(anserSheet_err, answerSheet_data);
        }
        else
        {
            exports.fetchQuestionsAndCreateQuestionPaper(request, (questionSheet_err, questionSheet_data) => {
              if(questionSheet_err){
                callback(questionSheet_err, questionSheet_data); 
              }else{

                console.log("FINAL INSERT REQUEST : ", request.data);
                let pdf_files = {
                  answer_sheet_template: answerSheet_data, 
                  question_paper_template: questionSheet_data
                }
                callback(questionSheet_err, pdf_files); 
              }
            })
        }
    })
}

exports.fetchQuestionsAndCreateQuestionPaper = (request, callback) => {
    
  // Request : 
  //Test ID and Question Paper ID : 
  let finalQuestionPaper = {}; 

      finalQuestionPaper.class_test_name = request.data.class_test_name; 
      finalQuestionPaper.class_test_id = request.data.class_test_id; 
      
      testQuestionPaperRepository.fetchTestQuestionPaperByID(request, async function (fetch_question_paper_err, fetch_question_paper_res) {
      if (fetch_question_paper_err) {
          console.log(fetch_question_paper_err);
          callback(fetch_question_paper_err, fetch_question_paper_res);
      } else {  
          console.log("fetch_question_paper_res : ", fetch_question_paper_res.Items); 

          // callback(fetch_question_paper_err, fetch_question_paper_res.Items);
          let questionArray = []; 
          await fetch_question_paper_res.Items[0].questions.forEach((e) => questionArray.push(...e.question_id)) 
          console.log("questionArray : ", questionArray); 
          request.data.blueprint_id = fetch_question_paper_res.Items[0].blueprint_id; 

          /** FETCH CATEGORY DATA **/
          let fetchBulkQtnReq = {
            IdArray : questionArray,
            fetchIdName : "question_id",
            TableName : TABLE_NAMES.upschool_question_table,
            projectionExp : ["question_id", "question_label", "answers_of_question","question_content", "question_disclaimer", "question_type"] 
        }
        console.log(fetchBulkQtnReq)
        const get_questions_res = await commonRepository.fetchBulkDataWithProjection3(fetchBulkQtnReq)
        // commonRepository.fetchBulkDataWithProjection3(fetchBulkQtnReq, async function (fetch_questions_err, get_questions_res) {
        //   if (fetch_questions_err) {
        //       console.log(fetch_questions_err);
        //       callback(fetch_questions_err, get_questions_res);
        //   } else {  
            console.log({get_questions_res})
            exports.generateSignedURLsforImageAns(get_questions_res, (fetch_questions_err, fetch_questions_res) => {
              if(fetch_questions_err){
                callback(400, fetch_questions_res); 
              }else{
                console.log("data",fetch_questions_res)
                // Fetch BluePrint : 
                blueprintRepository.fetchBlueprintById(request, async function (fetch_blueprint_err, fetch_blueprint_res) {
                  if (fetch_blueprint_err) {
                      console.log(fetch_blueprint_err);
                      callback(fetch_blueprint_err, fetch_blueprint_res);
                  } else {  
                      // Client Class Name : 
                      request.data.client_class_id = fetch_question_paper_res.Items[0].client_class_id; 
                      finalQuestionPaper.test_duration = fetch_blueprint_res.Items[0].test_duration; 
                      let maxMarks = 0; 

                      await fetch_blueprint_res.Items[0].sections.forEach((e) => {
                        e.questions.forEach((a) => maxMarks += Number(a.marks)); 
                      })
                      console.log("maxMarks ; ", maxMarks);
                      finalQuestionPaper.max_marks = maxMarks; 

                        // Section and Question Arranging : 
                        await fetch_question_paper_res.Items[0].questions.forEach((e, i) => {

                          let sectionDescriptionCheck = fetch_blueprint_res.Items[0].sections.filter((a) => a.section_name === e.section_name); 

                          if(sectionDescriptionCheck.length > 0){
                            fetch_question_paper_res.Items[0].questions[i].section_description = sectionDescriptionCheck[0].section_description; 
                          } 
                        }); 
                        
                        finalQuestionPaper.question_paper_name = fetch_question_paper_res.Items[0].question_paper_name; 
                        // console.log("check!",fetch_question_paper_res.Items[0].questions)
                        finalQuestionPaper.questions = fetch_question_paper_res.Items[0].questions; 

                        await finalQuestionPaper.questions.forEach((a, i) => {

                          a.question_id.forEach((b, j) => {
                            
                            let questionCheck = fetch_questions_res.filter((c, k) => c.question_id === b); 
                            questionCheck.length > 0 && ( finalQuestionPaper.questions[i].question_id[j] = questionCheck[0] )
                            // console.log("check",questionCheck[0])
                          })

                        })
                        let section_marks = 0; 

                        await finalQuestionPaper.questions.forEach(async (questionPaper, k) => {
                          
                          await fetch_blueprint_res.Items[0].sections.forEach((bluePrint) => {
                            console.log()
                            if(questionPaper.section_name === bluePrint.section_name){ 
                              section_marks = 0; 
                              questionPaper.question_id.forEach((Qns, i) => {
                                
                                bluePrint.questions.forEach((BPrint, j) => {
                                  
                                  if(i === j){
                                    finalQuestionPaper.questions[k].question_id[i].marks  = BPrint.marks; 
                                    section_marks += Number(BPrint.marks); 

                                  }
                                })
                              })
                              console.log(questionPaper.question_id)
                              finalQuestionPaper.questions[k].section_marks = section_marks; 
                            }
                          })

                        })

                        classRepository.getClientClassIdAndName(request, async function (fetch_client_class_err, fetch_client_class_res) {
                          if (fetch_client_class_err) {
                              console.log(fetch_client_class_err);
                              callback(fetch_client_class_err, fetch_client_class_res);
                          } else {  
                            
                            finalQuestionPaper.client_class_name = fetch_client_class_res.Items[0].client_class_name; 
                            request.data.section_id = fetch_question_paper_res.Items[0].section_id; 
                    
                            sectionRepository.getSectionIdAndName(request, async function (fetch_section_err, fetch_section_res) {
                              if (fetch_section_err) {
                                  console.log(fetch_section_err);
                                  callback(fetch_section_err, fetch_section_res);
                              } else {  
                              
                                finalQuestionPaper.section_name = fetch_section_res.Items[0].section_name; 
                                request.data.subject_id = fetch_question_paper_res.Items[0].subject_id; 

                                subjectRepository.getSubjetByIdAndName(request, async function (fetch_subject_err, fetch_subject_res) {
                                  if (fetch_subject_err) {
                                      console.log(fetch_subject_err);
                                      callback(fetch_subject_err, fetch_subject_res);
                                  } else {  
                                    
                                    finalQuestionPaper.subject_title = fetch_subject_res.Items[0].subject_title; 
                                  
                                        console.log("finalQuestionPaper : ", (finalQuestionPaper)); 
                                        // callback(200, finalQuestionPaper); 

                                        pdfMakerServices.QuestionPaperService(request, finalQuestionPaper, async function (create_question_paper_err, create_question_paper_res) {
                                          if (create_question_paper_err) {
                                              console.log(create_question_paper_err);
                                              callback(create_question_paper_err, create_question_paper_res);
                                          } else {  
                                            // call
                                              callback(create_question_paper_err, create_question_paper_res)
                                          }
                                        }) 
                                      }
                                    })

                                  }
                                })

                              }
                            })

                          }
                        })
              }
            })
          
            //   }
            // })

          }
        })
    //   }
    // }) 
}

exports.generateSignedURLsforImageAns = async (request, callback) => {
    console.log({request})
  await request.forEach((ele, i) => {
    ele.answers_of_question.forEach(async (ans, j) => {
      if(ans.answer_type === "Image"){
        let signedURL = await helper.getS3SignedUrl(ans.answer_content);
        request[i].answers_of_question[j].answer_content_url = signedURL; 
      }
    })
  })

  callback(0, request); 
}

exports.createQuizQuestionAndAnswerPapers = (request, callback) => {
  console.log("TIME : ", helper.getCurrentTimestamp());
  
  let finalQuestionPaper = {}; 
  // Fetch Based on Quiz ID : 


  quizRepository.fetchQuizBasedonID(request, async function (fetch_quiz_err, fetch_quiz_res) {
    if (fetch_quiz_err) {
        console.log(fetch_quiz_err);
        callback(fetch_quiz_err, fetch_quiz_res);
    } else {  

      finalQuestionPaper.quiz_duration = fetch_quiz_res.Items[0].quiz_duration; 
      finalQuestionPaper.quiz_name = fetch_quiz_res.Items[0].quiz_name; 
      
      console.log("set A ; ", JSON.stringify(fetch_quiz_res.Items[0].quiz_question_details.qp_set_a))
      console.log("set B ; ", JSON.stringify(fetch_quiz_res.Items[0].quiz_question_details.qp_set_b))
      console.log("set C ; ", JSON.stringify(fetch_quiz_res.Items[0].quiz_question_details.qp_set_c))

      let questionArray = fetch_quiz_res.Items[0].quiz_question_details.qp_set_a.concat(fetch_quiz_res.Items[0].quiz_question_details.qp_set_b, fetch_quiz_res.Items[0].quiz_question_details.qp_set_c); 
      console.log("questionArray : ", questionArray);
      
      classRepository.getClientClassIdAndName(request, async function (fetch_client_class_err, fetch_client_class_res) {
        if (fetch_client_class_err) {
            console.log(fetch_client_class_err);
            callback(fetch_client_class_err, fetch_client_class_res);
        } else {  
          
          finalQuestionPaper.client_class_name = fetch_client_class_res.Items[0].client_class_name; 
  
          sectionRepository.getSectionIdAndName(request, async function (fetch_section_err, fetch_section_res) {
            if (fetch_section_err) {
                console.log(fetch_section_err);
                callback(fetch_section_err, fetch_section_res);
            } else {  
            
              finalQuestionPaper.section_name = fetch_section_res.Items[0].section_name; 

              subjectRepository.getSubjetByIdAndName(request, async function (fetch_subject_err, fetch_subject_res) {
                if (fetch_subject_err) {
                    console.log(fetch_subject_err);
                    callback(fetch_subject_err, fetch_subject_res);
                } else {  
                  
                  finalQuestionPaper.subject_title = fetch_subject_res.Items[0].subject_title; 
                
                  // Should Fetch Quiz Name Also : but after it gets added to Table. 

                  let fetchBulkQtnReq = {
                      IdArray : questionArray,
                      fetchIdName : "question_id",
                      TableName : TABLE_NAMES.upschool_question_table,
                      projectionExp : ["question_id", "question_label", "answers_of_question","question_content", "question_disclaimer", "question_type", "marks", "question_status"] 
                  }
                  commonRepository.fetchBulkDataWithProjection(fetchBulkQtnReq, async function (fetch_questions_err, get_questions_res) {
                    if (fetch_questions_err) {
                        console.log(fetch_questions_err);
                        callback(fetch_questions_err, get_questions_res);
                    } else {  
                      exports.generateSignedURLsforImageAns(get_questions_res, async (fetch_questions_err, fetch_questions_res) => {
                        if(fetch_questions_err){
                          callback(400, fetch_questions_res); 
                        }else{
                          console.log("fetch_questions_res.Items : ", fetch_questions_res.Items);

                          let listOfSets = [];

                          let setA = []; 
                          let setB = []; 
                          let setC = []; 

                          await fetch_quiz_res.Items[0].quiz_question_details.qp_set_a.forEach(async (qtn) => {
                            let qtnCheck = await fetch_questions_res.Items.filter((ele) => ele.question_id === qtn); 
                            qtnCheck.length > 0 && setA.push(...qtnCheck); 
                          })
                          await fetch_quiz_res.Items[0].quiz_question_details.qp_set_b.forEach(async (qtn) => {
                            let qtnCheck = await fetch_questions_res.Items.filter((ele) => ele.question_id === qtn); 
                            qtnCheck.length > 0 && setB.push(...qtnCheck); 
                          })
                          await fetch_quiz_res.Items[0].quiz_question_details.qp_set_c.forEach(async (qtn) => {
                            let qtnCheck = await fetch_questions_res.Items.filter((ele) => ele.question_id === qtn); 
                            qtnCheck.length > 0 && setC.push(...qtnCheck); 
                          }) 
                          
                          console.log("setA : ", setA); 
                          console.log("setB : ", setB); 
                          console.log("setC : ", setC); 

                          listOfSets.push(setA); 
                          listOfSets.push(setB); 
                          listOfSets.push(setC); 
                          
                          // Create Question Paper here : 
                          pdfMakerServices.QuizQuestionPaperService(request, finalQuestionPaper, listOfSets, async function (create_question_paper_err, create_question_paper_res) {
                            if (create_question_paper_err) {
                                console.log(create_question_paper_err);
                                callback(create_question_paper_err, create_question_paper_res);
                            } else {  
                                quizAnswerSheetService.createQuizAnserSheet(fetch_quiz_res.Items[0], get_questions_res.Items, async function (quiz_answersheet_err, quiz_answersheet_res) {
                                    if (quiz_answersheet_err) {
                                        console.log(quiz_answersheet_err);
                                        callback(quiz_answersheet_err, quiz_answersheet_res);
                                    } else {
                                        create_question_paper_res = { ...create_question_paper_res, ...quiz_answersheet_res };
                                        // Update Table and Send Mail : 
                                        request.data.quiz_template_details = {
                                          set_a : {
                                              question_sheet : create_question_paper_res.questionPapersSetA,
                                              answer_sheet : create_question_paper_res.answerPapersSetA
                                          },
                                          set_b : {
                                              question_sheet : create_question_paper_res.questionPapersSetB,
                                              answer_sheet : create_question_paper_res.answerPapersSetB
                                          },
                                          set_c : {
                                              question_sheet : create_question_paper_res.questionPapersSetC,
                                              answer_sheet : create_question_paper_res.answerPapersSetC
                                          }
                                      }
                                      
                                        console.log("FINAL URL'S UPDATE REQUEST : ", request.data); 
                                        quizRepository.updateQuizTemplateDetails(request, function (update_quiz_template_details_err, update_quiz_template_details_res) {
                                          if (update_quiz_template_details_err) {
                                              console.log(update_quiz_template_details_err);
                                              callback(update_quiz_template_details_err, update_quiz_template_details_res);
                                          } else {
                                              userRepository.fetchTeacherEmailById(request, function (fetch_teacher_email_err, fetch_teacher_email_res) {
                                                if (fetch_teacher_email_err) {
                                                    console.log(fetch_teacher_email_err);
                                                    callback(fetch_teacher_email_err, fetch_teacher_email_res);
                                                } else {

                                                  // Send Mail to the User : 
                                                  var mailPayload = {
                                                    "quiz_name": request.data.quiz_name, 
                                                    "toMail": fetch_teacher_email_res.Items[0].user_email,
                                                    "subject": constant.mailSubject.quizGeneration,
                                                    "mailFor": "quizGeneration",
                                                };
                                                  console.log("MAIL PAYLAOD : ", mailPayload);
                                                  /** PUBLISH SNS **/
                                                  let mailParams = {
                                                      Message: JSON.stringify(mailPayload),
                                                      TopicArn: process.env.SEND_OTP_ARN
                                                  };
                                                  console.log("mailParams : ", mailParams); 
                                                  
                                                  dynamoDbCon.sns.publish(mailParams, function (err, data) {
                                                      if (err) {
                                                          console.log("SNS PUBLISH ERROR");
                                                          console.log(err, err.stack);
                                                          callback(400, "SNS ERROR");
                                                      }
                                                      else {
                                                          console.log("SNS PUBLISH SUCCESS");
                                                          callback(err, constant.messages.QUIZ_GENERATED);
                                                      }
                                                  });
                                                  /** END PUBLISH SNS **/
                                              }
                                            })
                                           
                                          }
                                      })
                                    }
                                }) 
                            }
                          }) 

                        }
                      })

                    }
                  })

                }
              })
            }
          })
        }
      })

    }
  })
}