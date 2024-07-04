const uuid = require("uuidv4");
const crypto = require('crypto');
// const jwt = require('jsonwebtoken');
// const jwt_decode = require('jwt-decode');
const dynamoDbCon = require('../awsConfig');
// const { constants } = require("buffer");
const constant = require('../constants/constant');

const excelEpoc = new Date(1900, 0, 0).getTime();
const msDay = 86400000;

exports.getCurrentTimestamp = () => new Date().toISOString();

exports.getRandomString = function () {
    let group_random_user_id = crypto.randomBytes(20).toString("hex");
    return uuid.fromString(group_random_user_id);
}

exports.getRandomOtp = function () {
    return Math.floor(100000 + Math.random() * 900000);
}

exports.getEncryptedPassword = function (password) {
    let encrypt_key = crypto.createCipher('aes-128-cbc', process.env.SECRET_KEY);
    let encrypted_password = encrypt_key.update(password, 'utf8', 'hex')
    encrypted_password += encrypt_key.final('hex');
    return encrypted_password;
}

exports.getDecryptedPassword = function (password) {
    let decrypt_key = crypto.createDecipher('aes-128-cbc', process.env.SECRET_KEY);
    let decrypted_password = decrypt_key.update(password, 'hex', 'utf8')
    decrypted_password += decrypt_key.final('utf8');
    return decrypted_password;
}

// exports.getJwtToken = function (request) {
//     return jwt.sign({ teacher_id: request.teacher_id, user_role: request.user_role, user_name: request.user_firstname }, process.env.SECRET_KEY);
// }

// exports.getJwtTokenForScanner = function (request) {
//     return jwt.sign({ teacher_id: request.teacher_id, test_id: request.test_id }, process.env.SECRET_KEY);
// }

// exports.decodeJwtToken = function (token) {
//     return jwt_decode(token);
// }

exports.hashingPassword = function (hashReq) {
    let givenPassword = hashReq.salt + hashReq.password;
    let hashedPassword = crypto.createHash('sha256').update(givenPassword).digest('base64');
    return hashedPassword;
}

exports.change_dd_mm_yyyy = function (givenDate) {
    if (givenDate.toString().includes('-')) {
        let splitedDate = givenDate.split("-");
        let dd_mm_yyyy = splitedDate[2] + "-" + splitedDate[1] + "-" + splitedDate[0];
        return dd_mm_yyyy;
    }
    else {
        return "00-00-0000";
    }
}

exports.getS3SignedUrl = async function (fileKey) {

    let Key = fileKey;
    let URL_EXPIRATION_SECONDS = 600;
    // Get signed URL from S3
    let s3Params = {
        Bucket: process.env.BUCKET_NAME,
        Key,
        Expires: URL_EXPIRATION_SECONDS,
    }

    let signedS3URL = await dynamoDbCon.s3.getSignedUrlPromise('getObject', s3Params)

    return signedS3URL;
}

exports.sortDataBasedOnTimestamp = function (j, data) {
    let orderedData = data;
    function getSortedData(i) {
        if (i < data.Items.length) {
            let today = new Date(data.Items[i].case_created_ts);
            let y = today.getFullYear();
            let m = today.getMonth() + 1;
            let newM = m < 12 ? '0' + m : m;
            let d = today.getDate();
            let newD = d < 10 ? '0' + d : d;
            let h = today.getHours();
            let newH = h < 10 ? '0' + h : h;
            let mt = today.getMinutes();
            let newMt = mt < 10 ? '0' + mt : mt;
            let sec = today.getSeconds();
            let newSec = sec < 10 ? '0' + sec : sec;
            let ts = y + "" + newM + "" + newD + "" + newH + "" + newMt + "" + newSec;
            let timeerds = parseInt(ts);
            data.Items[i].order_id = timeerds;
            i++;
            getSortedData(i);
        } else {
            data.Items.sort(function (a, b) {
                return b.order_id - a.order_id;
            });
            return orderedData;
        }
    }
    getSortedData(j);
    return orderedData;
}

exports.findDuplicatesInArrayOfObjects = function (reqArray, checkField) {
    console.log(reqArray);
    const lookup = reqArray.reduce((a, e) => {
        a[e[checkField]] = ++a[e[checkField]] || 0;
        return a;
    }, {});

    let duplicates = reqArray.filter(e => lookup[e[checkField]]);

    return duplicates;
}

exports.strToLowercase = (str) => str.toLowerCase();

const isNullOrEmpty = (str) => !str;

exports.isNullOrEmpty = isNullOrEmpty;

exports.isEmptyObject = (val) => isNullOrEmpty(val) || (val && Object.keys(val).length === 0);

exports.isEmptyArray = (val) => val && !val.length;

const removeDuplicates = (arr) => [...new Set(arr)];

exports.removeDuplicates = removeDuplicates;

exports.reverse = (arr) => [...arr].reverse();

exports.extractValue = (arr, prop) => removeDuplicates(arr.map(item => item[prop]));

exports.parseStr = (str, replaceStr = "") => isNullOrEmpty(str) ? replaceStr : str;

exports.hasText = (str) => !!(str && str.trim() !== "");

exports.hasNoText = (str) => !(str && str.trim() !== "");

exports.sortArrayOfObjects = (arr, keyToSort, direction) => {
    if (direction === 'none') return arr;

    const compare = (objectA, objectB) => {
        const valueA = objectA[keyToSort]
        const valueB = objectB[keyToSort]

        if (valueA === valueB) return 0;

        if (valueA > valueB) {
            return direction === 'ascending' ? 1 : -1
        } else {
            return direction === 'ascending' ? -1 : 1
        }
    }

    return arr.slice().sort(compare)
}

exports.sortByDate = (arr, keyToSort) => arr.sort((a, b) => new Date(b[keyToSort]) - new Date(a[keyToSort]));

exports.getExtType = function (file_type) {
    let file_ext;
    switch (file_type) {
        case 'image/jpeg':
            file_ext = '.jpg';
            break;

        case 'text/plain':
            file_ext = '.txt';
            break;

        case 'text/html':
            file_ext = '.html';
            break;

        case 'text/css':
            file_ext = '.css';
            break;

        case 'image/png':
            file_ext = '.png';
            break;

        case 'application/pdf':
            file_ext = '.pdf';
            break;

        case 'application/json':
            file_ext = '.json';
            break;

        case 'application/octet-stream':
            file_ext = '.docx';
            break;

        case 'application/msword':
            file_ext = '.doc';
            break;

        case 'application/vnd.ms-excel':
            file_ext = '.xls';
            break;

        case 'application/vnd.ms-powerpoint':
            file_ext = '.ppt';
            break;

        case "application/zip":
            file_ext = ".zip";
            break;

        case "application/x-zip-compressed":
            file_ext = ".zip";
            break;

        case "multipart/x-zip":
            file_ext = ".zip"
            break;
    }
    return file_ext;
}

exports.getMimeType = function (file_ext) {
    let file_mime;
    switch (file_ext) {
        case '.jpg':
            file_mime = 'image/jpeg';
            break;

        case '.jpeg':
            file_mime = 'image/jpeg';
            break;

        case '.txt':
            file_mime = 'text/plain';
            break;

        case '.html':
            file_mime = 'text/html';
            break;

        case '.css':
            file_mime = 'text/css';
            break;

        case '.png':
            file_mime = 'image/png';
            break;

        case '.pdf':
            file_mime = 'application/pdf';
            break;

        case '.json':
            file_mime = 'application/json';
            break;

        case '.docx':
            file_mime = 'application/octet-stream';
            break;

        case '.doc':
            file_mime = 'application/msword';
            break;

        case '.xls':
            file_mime = 'application/vnd.ms-excel';
            break;

        case '.xlsx':
            file_mime = 'application/vnd.ms-excel';
            break;

        case '.ppt':
            file_mime = 'application/vnd.ms-powerpoint';
            break;

        case '.zip':
            file_mime = 'application/zip';
            break;
    }
    return file_mime;
}

exports.excelDateToJavascriptDate = function (excelDate) {
    return new Date(excelEpoc + excelDate * msDay);
}

exports.convertNumberToAlphabet = function (number) {
    return (number + 9).toString(36).toUpperCase();
}

exports.compareAndFindDuplicateObj = function (arrayOfId, arrayOfObj) {
    console.log("arrayOfId : ", arrayOfId);
    console.log("arrayOfObj : ", arrayOfObj);
    function comparer(otherArray) {
        return function (current) {
            return otherArray.filter(function (other) {
                return other == current.chapter_id
            }).length != 0;
        }
    }

    var onlyInB = arrayOfObj.filter(comparer(arrayOfId));
    return onlyInB
}

exports.giveindextoList = function (listToCompare, listToChange, key) {
    // Adding Index to List given
    var count = 1;
    listToChange.length > 0 && listToCompare.map(ele1 => {
        listToChange.map(ele2 => {
            if (ele1 === ele2[key]) {
                ele2.index = count;
                count++;
            }
        })
    })
    // Sorting List based on index key value 
    listToChange.sort((a, b) => a.index - b.index);
    return listToChange;
}

exports.getDifferenceValueFromTwoArray = async function (arrayOne, arrayTwo) {
    // const result = arrayOne.filter(item => !arrayTwo.includes(item)).concat(arrayTwo.filter(item => !arrayOne.includes(item)));
    let result = [];
    await arrayOne.map(aOne => {
        if (!arrayTwo.includes(aOne)) {
            result.push(aOne);
        }
    })

    return result;
}
exports.checkOneArrayElementsinAnother = function (arrayOne, arrayTwo) {
    const result = arrayOne.every(function (elem) {
        return arrayTwo.indexOf(elem) > -1;
    });
    return result;
};
exports.sortOneArrayBasedonAnother = function (arrayToBeSorted, arrayAsIndex, Key) {
    arrayToBeSorted = arrayAsIndex.map((a) => arrayToBeSorted.filter((e) => e[Key] === a)[0]);
    return arrayToBeSorted;
};
exports.PutObjectS3SigneUdrl = async function (requestFileName, folderName) {

    let file_type = requestFileName.split(".");
    let file_ext = '.' + file_type[file_type.length - 1];

    let URL_EXPIRATION_SECONDS = 300;
    let randomID = exports.getRandomString();
    let Key = `${folderName}/${randomID}` + file_ext;

    // Get signed URL from S3
    let s3Params = {
        Bucket: process.env.BUCKET_NAME,
        Key,
        Expires: URL_EXPIRATION_SECONDS,
        ContentType: exports.getMimeType(file_ext),
        ACL: 'public-read'
    }

    let uploadURL = await dynamoDbCon.s3.getSignedUrlPromise('putObject', s3Params);

    return { uploadURL: uploadURL, Key: Key };
}

exports.removeDuplicatesFromArrayOfObj = async function (reqArray, checkField) {

    const uniqueArr = reqArray.filter((obj, index) => {
        return index === reqArray.findIndex(o => obj[checkField] === o[checkField]);
    });

    return uniqueArr;
}
exports.shuffleArray = async function (reqArray) {

    let shuffled = await reqArray
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)

    return shuffled;
}


exports.removeExistObject = async (idArray, checkObjArr, idName) => {
    let finalArr = [];

    await checkObjArr.forEach(oQues => {
        if (!idArray.find(qId => qId === oQues[idName])) {
            finalArr.push(oQues);
        }
    })

    return finalArr;
}

exports.getAnswerContentFileUrl = async (answerArr) => {

    return new Promise(async (resolve, reject) => {

        async function contentUrl(i) {
            if (i < answerArr.length) {
                answerArr[i].answer_content_url = (JSON.stringify(answerArr[i].answer_content).includes("question_uploads/")) ? await exports.getS3SignedUrl(answerArr[i].answer_content) : "N.A.";
                i++;
                contentUrl(i);
            }
            else {
                resolve(answerArr);
            }
        }
        contentUrl(0)

    })
}

exports.checkPriorityQuestions = async (quesDetails) => {
    let priorityOrder = [];
    return new Promise(async (resolve, reject) => {
        async function secLoop(i) {
            if (i < quesDetails.length) {
                await quesDetails[i].questions.forEach((qes, j) => {
                    priorityOrder.push(
                        {
                            "sec": i,
                            "que": j,
                            "pre": (qes.concept_ids.length > 0) ? 0 : (qes.concept_ids.length == 0 && quesDetails[i].topic_ids.length > 0) ? 1 : 2,
                            "qStatus": "No"
                        }
                    )
                });
                i++;
                secLoop(i);
            }
            else {
                resolve(priorityOrder);
            }
        }
        secLoop(0)
    })
}

exports.formattingAnswer = async (answer) => {
    answer = answer.split("\n");
    let regexp = /.*Ans: /;
    let array;
    await answer.forEach((words, i) => {
        answer[i] = words.replace(regexp, "");
        answer[i] = answer[i].replace(/\\\(/g, "");
        answer[i] = answer[i].replace(/\\\)/g, "");
        answer[i] = answer[i].trim();

        array = answer[i].match(/[^\\]+/g);
        if (array.length === 1) {
            answer[i] = answer[i].replace(/\s/g, "");
            answer[i] = answer[i].replace(/\./g, "");
            answer[i] = answer[i].replace(/\,/g, "");
            // answer[i] = answer[i].replace(/\:/g, "");
            answer[i] = answer[i].replace(/\;/g, "");
            answer[i] = answer[i].toLowerCase();
        }
    })
    answer[0] = answer[0].replace(/\s/g, "");

    return answer;
}

exports.getAnswerBlanks = async (blankCount) => {

    let blank = "";
    let dashes = constant.answerSheet;
    let iCount = 0;
    for (let i = 0; i < blankCount; i++) {
        iCount = i + 1;
        blank += (iCount == 1) ? dashes.first : (iCount == 2) ? dashes.second : (iCount > 2 && iCount % 2 != 0) ? dashes.odd : (iCount > 2 && iCount % 2 == 0) ? dashes.even : "";

        blank += (iCount % 2 == 0 && iCount != blankCount) ? "\n\n" : "";
    }

    return blank.slice(0, -1);
}

exports.convertMathJax = (mathEquation) => {

    return new Promise((resolve, reject) => {

        require('mathjax').init({

            loader: { load: ['input/tex', 'output/svg'] }

        }).then((MathJax) => {

            const svg = MathJax.tex2svg(mathEquation, { display: true });
            const finalHTML = MathJax.startup.adaptor.outerHTML(svg);

            console.log("finalHTML : ", MathJax.startup.adaptor.outerHTML(svg));           
             // return svg;
            console.log("finalHTML ---: ", finalHTML);

            if (finalHTML) {
                resolve(finalHTML)
            } else {
                reject(new Error("Error: In Converting MathJax"));
            }
        }).catch((err) => console.log(err.message));

    })

}