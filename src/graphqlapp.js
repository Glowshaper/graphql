const graphqlEndpoint = "https://01.kood.tech/api/graphql-engine/v1/graphql";
const authEndpoinint = "https://01.kood.tech/api/auth/signin";

let user = null;
let pwd = null;

let JWToken = null;

let statsData = null;

let loginSection = null;
let graphSection = null;
let logoutSection = null;
let infoSection = null;

let loginButton = null;
let logoutButton = null;

let app = init();

function init() {
    prepareLogin();
    preparePage();
}

async function preparePage() {
    
    loginSection = document.getElementById("login");
    logoutSection = document.getElementById("logout");
    infoSection = document.getElementById("info_text");
    graphSection = document.getElementById("graph_view");

    graphSection.innerText = "";
    infoSection.innerText = "";

    let token = localStorage.getItem("jwtToken");

    if(token){
        loginSection.style.display = "none";
        logoutSection.style.display = "";
        graphSection.style.display = "";
        createInfoPage(token);
    }else{
        loginSection.style.display = "";
        logoutSection.style.display = "none";
        graphSection.style.display = "none";
    }
}

function prepareLogin() {
    loginButton = document.getElementById("submit_login");
    loginButton.addEventListener("click", initiateLogin)
    logoutButton = document.getElementById("submit_logout");
    logoutButton.addEventListener("click", initiateLogout)
}

async function createInfoPage(token) {
    let graphData = null;
    let rawUserData = await getUserData(token);
    if (rawUserData === null) {
        infoSection.innerText = "Login Expired. Please log in again."
    } else {
        graphData = organizeUserData(rawUserData);
    }
    fillAppPage(graphData);
}

function initiateLogout(){
    console.log("LOGOUT!")
    localStorage.removeItem("jwtToken")
    preparePage();
}

async function initiateLogin() {
    infoSection.innerText = "";
    user = document.getElementById("name_input").value;
    pwd = document.getElementById("passwd_input").value;
    let login = btoa(user + ":" + pwd);
    if (user !== "" && pwd !== "") {
        let response = await fetch(authEndpoinint, {
            method: "POST",
            headers: { 'Authorization': "Basic " + login }
        }).catch(handleCredentialsError);
        if (response.status === 200) {

            let token = await response.json();
            if (token) {
                localStorage.setItem('jwtToken', token); 
            }
            preparePage();
        } else {
            infoSection.innerText = "Wrong credentials. Please provide both your correct KOOD/JÕHVI username or email address, and KOOD/JÕHVI password"
        }
    } else {
        infoSection.innerText = "Please provide both your KOOD/JÕHVI username or email address, and KOOD/JÕHVI password"
    }

}

function handleCredentialsError(error) {
    infoSection.innerText = error;
}

async function getUserData(token) {
    let userData = null;
    //let jwtToken = getCookie("jwtToken");
    if (token === null) {
        return userData;
    }

    let headers = {
        "Content-type": "application/json",
        Authorization: "Bearer " + token
    };

    let query = "query {user { id login createdAt auditRatio campus email firstName lastName totalUp totalDown }}";

    let userDataRequest = {
        "method": "POST",
        "headers": headers,
        "body": JSON.stringify({ "query": query }),
    };

    let userDataResponse = await fetch(graphqlEndpoint, userDataRequest);
    let userDataForText = await userDataResponse.json();

    let userId = userDataForText.data.user[0].id

    query = "query GetTransactions($userId: Int!) {transaction(where: { userId: { _eq: $userId } }, order_by: { createdAt: asc }) {createdAt type objectId amount path}}";


    userDataRequest = {
        "method": "POST",
        "headers": headers,
        "body": JSON.stringify({ query, variables: { userId } })
    };

    userDataResponse = await fetch(graphqlEndpoint, userDataRequest);
    let userDataForChart = await userDataResponse.json();
    return { "user": userDataForText.data.user[0], "progress": userDataForChart.data.transaction }
}

function organizeUserData(rawUserData) {
    let tempProgArray = rawUserData.progress;
    let userInfo = {}

    let piscineExpTempArray = [];
    let piscineExpArray = [];
    let progressArray = [];
    let expArray = [];
    let auditGivenArray = [];
    let auditReceivedArray = [];
    let levelArray = [];
    let skillArray = [];
    let wutArray = [];

    let startIndex = null;
    let startTime = null;
    let endTime = null;

    for (let i = 0; i < tempProgArray.length; i++) {
        if (tempProgArray[i].path.includes("piscine")) {
            piscineExpTempArray.push(tempProgArray[i]);
        } else if (tempProgArray[i].path.includes("div-01")) {
            progressArray.push(tempProgArray[i]);
        } else {
            wutArray.push(tempProgArray[i])
        }
    }

    piscineExpArray = dividePiscines(piscineExpTempArray);

    startTime = new Date(tempProgArray[0].createdAt).valueOf();
    endTime = Date.now().valueOf() - startTime;

    let moduleProgress = organizeModuleArray(progressArray, startTime);

    userInfo = {
        "name": rawUserData.user.firstName + " " + rawUserData.user.lastName,
        "e-mail": rawUserData.user.email,
        "login": rawUserData.user.login,
        "audits given": rawUserData.user.totalUp,
        "audits received": rawUserData.user.totalDown,
        "level": moduleProgress.levels[moduleProgress.levels.length - 1].amount,
        "auditRatio": rawUserData.user.auditRatio
    }

    for (let i = 0; i < piscineExpArray.length; i++) {
        for (let [key, value] of Object.entries(piscineExpArray[i])) {
            piscineExpArray[i][key] = organizeModuleArray(value, startTime);
        }
    }

    retObject = {
        "user": userInfo,
        "rawUser": rawUserData.user,
        "startTime": startTime,
        "endTime": endTime,
        "exp": moduleProgress,
        "piscineExp": piscineExpArray
    }
    return retObject;
};

function organizeModuleArray(array, startTime) {
    let auditGivenArray = [];
    let auditReceivedArray = [];
    let expArray = [];
    let levelArray = [];
    let skillArray = [];
    for (let i = 0; i < array.length; i++) {
        array[i].createdAt = new Date(array[i].createdAt).valueOf() - startTime;
        if (array[i].type === "up") {
            auditGivenArray.push(array[i]);
        } else if (array[i].type === "down") {
            auditReceivedArray.push(array[i]);
        } else if (array[i].type === "xp") {
            expArray.push(array[i]);
        } else if (array[i].type === "level") {
            levelArray.push(array[i]);
        } else if (array[i].type.startsWith("skill_")) {
            skillArray.push(array[i]);
            skillArray[skillArray.length - 1].type = skillArray[skillArray.length - 1].type.substring(6);
        }
    }
    return { "auditsGiven": auditGivenArray, "auditsReceived": auditReceivedArray, "exp": expArray, "levels": levelArray, "skillProg": skillArray }
}

function dividePiscines(allPiscinesArray) {
    let returnArrays = [];

    for (let i = 0; i < allPiscinesArray.length; i++) {
        let piscName = allPiscinesArray[i].path.match(/piscine-([^/]+)/)[1];
        if (returnArrays.length > 0) {
            let arrayIndex = null
            for (let a = 0; a < returnArrays.length; a++) {
                if (Object.hasOwn(returnArrays[a], piscName)) {
                    arrayIndex = a;
                }
            }
            if (arrayIndex !== null) {
                returnArrays[arrayIndex][piscName].push(allPiscinesArray[i])
            } else {
                let arr = [];
                arr.push(allPiscinesArray[i])
                let obj = {}
                obj[piscName] = arr;
                returnArrays.push(obj);
            }
        } else {
            let arr = [];
            arr.push(allPiscinesArray[i])
            let obj = {}
            obj[piscName] = arr;
            returnArrays.push(obj);
        }
    }
    return returnArrays;
}

function fillAppPage(graphData) {
    displayGraphPage(graphData);
    displayInfoText(graphData.user);
    displayLogout();
}

function displayInfoText(userInfo) {
    let htmlFragment = "";
    for (const [key, value] of Object.entries(userInfo)) {
        htmlFragment += "<p>" + key.toUpperCase() + ": " + value + "</p>";
    }
    document.getElementById("info_text").innerHTML = htmlFragment;
}

function displayLogout() {

}

function displayGraphPage(graphData) {
    let graphWidth = (window.innerWidth || document.documentElement.clientWidth) * 0.8;
    let graphHeight = (window.innerHeight || document.documentElement.clientHeight) * 0.8;
    let graphSVG = constructGraph(graphData, graphWidth, graphHeight);
    document.getElementById("graph_view").innerHTML = graphSVG;
    document.getElementById("graph_view").style.display = "block";
}

function constructGraph(graphData, graphWidth, graphHeight) {
    let totalValues = calculateAllExpValues(graphData);
    graphData.exp = normalizeAllGraphValues(graphData.exp, graphData.startTime, graphData.endTime, graphWidth, graphHeight, graphData.user)

    for (let i = 0; i < graphData.piscineExp.length; i++) {
        for (let [key, value] of Object.entries(graphData.piscineExp[i])) {
            graphData.piscineExp[i][key] = normalizeAllGraphValues(value, graphData.startTime, graphData.endTime, graphWidth, graphHeight, graphData.user)
        }
    }
    let svg = '<svg width="' + (graphWidth + 10) + '" height="' + (graphHeight + 10) + '" version="1.1" xmlns="http://www.w3.org/2000/svg">';
    svg += '<rect x="0" y="0" width="' + graphWidth + '" height="' + graphHeight + '" stroke="#444444" fill="transparent" stroke-width="1"/>';
    svg += createCumulativeLineGraph(graphData.exp.exp, graphHeight, graphWidth, "#ffffff", "STUDENT MODULE EXP: "+totalValues.totalModuleExp);
    svg += createCumulativeLineGraph(graphData.exp.auditsGiven, graphHeight, graphWidth, "#999999", "AUDITS GIVEN: "+totalValues.totalAuditsGiven);
    svg += createCumulativeLineGraph(graphData.exp.auditsReceived, graphHeight, graphWidth, "#999999", "AUDITS RECEIVED: "+totalValues.totalAuditsReceived);
    svg += createLineGraph(graphData.exp.levels, graphHeight, graphWidth, "#666666"," MODULE LEVEL PROGRESSION: "+totalValues.totalModuleLevel);
    //I am assuming no-one is crazy enough to do over 6 piscines
    let expColors = ["#ffccaa","#ccffaa","#aaccff","#ffffaa","#ffaaff","#aaffff"];
    let levelColors = ["#aa7755","#77aa55","#5577aa","#aaaa55","#aa55aa","#55aaaa"];
    for (let i = 0; i < graphData.piscineExp.length; i++) {
        let colors
        for (let [key, value] of Object.entries(graphData.piscineExp[i])) {
            let totalValue = null
            for (let [tVkey, tVvalue] of Object.entries(totalValues)) {
                if(tVkey.startsWith(key)&&tVkey.endsWith("_exp")){
                    totalValue = tVvalue;
                }
            }
            svg += createCumulativeLineGraph(value.exp, graphHeight, graphWidth, expColors[i], key.toUpperCase() + " PISCINE EXP: "+totalValue);
        }
    }

    for (let i = 0; i < graphData.piscineExp.length; i++) {
        for (let [key, value] of Object.entries(graphData.piscineExp[i])) {
            let totalValue = null
            for (let [tVkey, tVvalue] of Object.entries(totalValues)) {
                if(tVkey.startsWith(key)&&tVkey.endsWith("_level")){
                    totalValue = tVvalue;
                }
            }
            svg += createLineGraph(value.levels, graphHeight, graphWidth, levelColors[i], key.toUpperCase() + " PISCINE LEVEL PROGRESSION: "+totalValue);
        }
    }
    svg += '</svg>'
    return svg;
}

function calculateAllExpValues(graphData){
    console.log(graphData)
    let retObj = {};
    let totalModuleExp = 0;
    let totalAuditsGiven = graphData.user["audits given"]; 
    let totalAuditsReceived = graphData.user["audits received"];
    let totalModuleLevel = graphData.exp.levels[graphData.exp.levels.length-1].amount;

    for(let i = 0; i<graphData.exp.exp.length;i++){
        totalModuleExp += graphData.exp.exp[i].amount;
    }
    retObj = {"totalModuleExp":totalModuleExp, "totalAuditsGiven":totalAuditsGiven, "totalModuleLevel":totalModuleLevel, "totalAuditsReceived":totalAuditsReceived }

    for (let i = 0; i < graphData.piscineExp.length; i++) {
        for (let [key, value] of Object.entries(graphData.piscineExp[i])) {
            console.log("object:",key,value)
            retObj[key+"_level"] = value.levels[value.levels.length-1].amount
            console.log("levels:",value.levels[value.levels.length-1].amount)
            let acc = 0;
            for(let i = 0; i < value.exp.length; i++){
                acc+=value.exp[i].amount
            }
            console.log("exp",acc)
            retObj[key+"_exp"] = acc;
        }
    }
    console.log(retObj);
    return retObj;
}

function normalizeAllGraphValues(graphData, startTime, endTime, graphWidth, graphHeight, userInfo) {
    let normalizedExp = [];
    let normalizedAuditsGiven = [];
    let normalizedAuditsReceived = [];
    let normalizedLevels = [];
    let normalizedSkills = [];

    let maxExp = 0
    for (let i = 0; i < graphData.exp.length; i++) {
        maxExp += graphData.exp[i].amount;
    }
    //this just shows the exp lower - what would be the maximum value here anyway ? 
    normalizedExp = normalizeGraphValues(graphData.exp, maxExp, endTime, graphWidth, graphHeight / 2);
    if (graphData.auditsGiven.length > 0 && graphData.auditsReceived.length > 0) {
        if (userInfo["audits given"] < userInfo["audits received"]) {
            normalizedAuditsGiven = normalizeGraphValues(graphData.auditsGiven, userInfo["audits given"], endTime, graphWidth, (graphHeight * userInfo.auditRatio) * 0.9);
            normalizedAuditsReceived = normalizeGraphValues(graphData.auditsReceived, userInfo["audits received"], endTime, graphWidth, graphHeight * 0.9);
        } else {
            normalizedAuditsGiven = normalizeGraphValues(graphData.auditsGiven, userInfo["audits given"], endTime, graphWidth, graphHeight * 0.9);
            normalizedAuditsReceived = normalizeGraphValues(graphData.auditsReceived, userInfo["audits received"], endTime, graphWidth, (graphHeight / userInfo.auditRatio) * 0.9);
        }
    }
    if (graphData.skillProg.length > 0) {
        normalizedSkills = normalizeGraphValues(graphData.skillProg, 100, endTime, graphWidth, graphHeight)
    }
    if (graphData.levels.length > 0) {
        normalizedLevels = normalizeGraphValues(graphData.levels, 60, endTime, graphWidth, graphHeight)
    }

    graphData.exp = normalizedExp;
    graphData.auditsGiven = normalizedAuditsGiven;
    graphData.auditsReceived = normalizedAuditsReceived;
    graphData.skillProg = normalizedSkills;
    graphData.levels = normalizedLevels;
    return graphData;
}

function normalizeGraphValues(array, maxValue, endTime, graphWidth, graphHeight) {
    let timeStep = graphWidth / endTime;
    let valueStep = graphHeight / maxValue;
    for (let i = 0; i < array.length; i++) {
        array[i].createdAt = array[i].createdAt * timeStep;
        array[i].amount = array[i].amount * valueStep;
    }
    return array;
}

function createLineGraph(array, graphHeight, graphWidth, color, infoText) {
    let svg = '<polyline points="';
    let yAccumulator = graphHeight;
    let svgCircles =""
    svg += String(array[0].createdAt) + " " + String(yAccumulator) + " , ";
    for (let i = 0; i < array.length; i++) {
        if(i > 0 && array[i].amount > array[i-1].amount){
            yAccumulator -= (array[i].amount-array[i-1].amount);
            svg += String(array[i].createdAt) + " " + String(yAccumulator)
            svgCircles += '<ellipse cx="' + array[i].createdAt + '" cy="' + String(yAccumulator) + '" rx="4" ry="4" fill="' + color + '33' + '" stroke="transparent" stroke-width="0"/>'
            if (i < array.length - 1) {
                svg += " , "
            } 
        }else if(i === 0){
            yAccumulator -= array[i].amount;
            svg += String(array[i].createdAt) + " " + String(yAccumulator)
            svgCircles += '<ellipse cx="' + array[i].createdAt + '" cy="' + String(yAccumulator) + '" rx="4" ry="4" fill="' + color + '33' + '" stroke="transparent" stroke-width="0"/>'
                svg += " , "
        }

        
    }
    svg += '"stroke="' + color + '" fill="transparent" stroke-width="2"/>'
    svg += svgCircles;
    if(array[array.length - 1].createdAt > graphWidth/2){
        svg += '<text text-anchor="end" x="' + (array[array.length - 1].createdAt - 20) + '"y="' + (yAccumulator - 10) + '" ><tspan font-weight="regular" fill="' + color + '">' + infoText + '</tspan></text><style><![CDATA[text{dominant-baseline: hanging; font: 13px Verdana, Helvetica, Arial, sans-serif;}]]></style>'
    } else {
        svg += '<text text-anchor="start" x="' + (array[array.length - 1].createdAt + 20) + '"y="' + (yAccumulator - 10) + '" ><tspan font-weight="regular" fill="' + color + '">' + infoText + '</tspan></text><style><![CDATA[text{dominant-baseline: hanging; font: 13px Verdana, Helvetica, Arial, sans-serif;}]]></style>'
    }
    return svg;
}

function createCumulativeLineGraph(array, graphHeight, graphWidth, color, infoText) {
    let svg = '<polyline points="';
    let yAccumulator = graphHeight;
    svg += String(array[0].createdAt) + " " + String(yAccumulator)+ " , ";
    for (let i = 0; i < array.length; i++) {
        yAccumulator -= array[i].amount;
        svg += String(array[i].createdAt) + " " + String(yAccumulator)
        if (i < array.length - 1) {
            svg += " , "
        }
        
    }
    svg += '"stroke="' + color + '" fill="transparent" stroke-width="2"/>'
    yAccumulator = graphHeight;
    for (let i = 0; i < array.length; i++) {
        yAccumulator -= array[i].amount;
        svg += '<ellipse cx="' + array[i].createdAt + '" cy="' + yAccumulator + '" rx="4" ry="4" fill="' + color + '33' + '" stroke="transparent" stroke-width="0"/>' 
    }

    if(array[array.length - 1].createdAt > graphWidth/2){
        svg += '<text text-anchor="end" x="' + (array[array.length - 1].createdAt - 20) + '"y="' + (yAccumulator - 10) + '" ><tspan font-weight="regular" fill="' + color + '">' + infoText + '</tspan></text><style><![CDATA[text{dominant-baseline: hanging; font: 13px Verdana, Helvetica, Arial, sans-serif;}]]></style>'
    } else {
        svg += '<text text-anchor="start" x="' + (array[array.length - 1].createdAt + 20) + '"y="' + (yAccumulator - 10) + '" ><tspan font-weight="regular" fill="' + color + '">' + infoText + '</tspan></text><style><![CDATA[text{dominant-baseline: hanging; font: 13px Verdana, Helvetica, Arial, sans-serif;}]]></style>'
    }
    return svg;
}
