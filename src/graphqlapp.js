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
    console.log("ok can start");
    preparePage();
    displayLogin();
}

function preparePage() {
    loginSection = document.getElementById("login");
    logoutSection = document.getElementById("logout");
    infoSection = document.getElementById("info_text");
    graphSection = document.getElementById("graph_view");

    //graphSection.innerHtml = "";
    infoSection.innerText = "";
    graphSection.style.display = "none";
    logoutSection.style.display = "none";
}

function displayLogin() {
    loginButton = document.getElementById("submit_login");
    loginButton.addEventListener("click", createInfoPage)

}

async function createInfoPage() {
    let token = await initiateLogin()
    let graphData = null;
    let rawUserData = await getUserData(token);
    if (rawUserData === null) {
        infoSection.innerText = "Login Expired. Please log in again."
    } else {
        graphData = organizeUserData(rawUserData);
    }
    fillAppPage(graphData);
}

async function initiateLogin() {
    infoSection.innerText = "";
    user = document.getElementById("name_input").value;
    pwd = document.getElementById("passwd_input").value;

    //let login = btoa(`${user}:${pwd}`);
    let login = btoa(user + ":" + pwd);
    console.log("login", login);
    if (user !== "" && pwd !== "") {
        let response = await fetch(authEndpoinint, {
            method: "POST",
            //headers: {'Authorization': `Basic ${login}`}
            headers: { 'Authorization': "Basic " + login }
        }).catch(handleCredentialsError);
        console.log("response", response);
        if (response.status === 200) {

            let token = await response.json();
            if (token) {
                console.log("in if: ", token)
                //document.cookie = `jwtToken=${String(token)}; path=/; max-age=3600; SameSite=None`;
                //document.cookie = "jwtToken=test"
                //setCookie("jwtToken", "test");
            }
            console.log(document.cookie);
            return token;
            /*
            let graphData = getUserData(token);
            if (graphData === null){
                infoSection.innerText = "Login Expired. Please log in again."
            } else{
                return graphData;
            }
            fillAppPage(graphData);
            */
        } else {
            infoSection.innerText = "Wrong credentials. Please provide both your correct KOOD/JÕHVI username or email address, and KOOD/JÕHVI password"
        }
    } else {
        infoSection.innerText = "Please provide both your KOOD/JÕHVI username or email address, and KOOD/JÕHVI password"
    }

}

function handleCredentialsError(error) {
    console.log("handling errors");
    infoSection.innerText = error;
    console.log(error);
}

async function getUserData(token) {
    console.log("get user data start", token);
    let userData = null;
    //let jwtToken = getCookie("jwtToken");
    //console.log("get user data: ", jwtToken);
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
    console.log(userDataForText);

    let userId = userDataForText.data.user[0].id

    //query = "query GetPassFailRatio($userId: Int!) {progress(where: { userId: { _eq: $userId } }, order_by: { createdAt: desc }) {grade}}";
    query = "query GetTransactions($userId: Int!) {transaction(where: { userId: { _eq: $userId } }, order_by: { createdAt: asc }) {createdAt type objectId amount}}";


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
    console.log("raw user data: ", rawUserData);
    let tempProgArray = rawUserData.progress;
    let userInfo = {}

    let expArray = [];
    let auditArray = [];
    let levelArray = [];
    let skillArray = [];
    let wutArray = [];

    let startIndex = null;
    let startTime = null;
    let endTime = null;

    for (let i = 0; i < tempProgArray.length; i++) {
        if (tempProgArray[i].type === "up" || tempProgArray[i].type === "down") {
            startIndex = i;
            break
        }
    }
    tempProgArray = tempProgArray.slice(startIndex);
    console.log("after slicing, before formatting:", tempProgArray);
    startTime = new Date(tempProgArray[0].createdAt).valueOf();
    for (let i = 0; i < tempProgArray.length; i++) {
        tempProgArray[i].createdAt = new Date(tempProgArray[i].createdAt).valueOf() - startTime;
        if (tempProgArray[i].type === "up") {
            expArray.push(tempProgArray[i]);
        } else if (tempProgArray[i].type === "down") {
            auditArray.push(tempProgArray[i]);
        } else if (tempProgArray[i].type === "level") {
            levelArray.push(tempProgArray[i]);
        } else if (tempProgArray[i].type.startsWith("skill_")) {
            skillArray.push(tempProgArray[i]);
            skillArray[skillArray.length - 1].type = skillArray[skillArray.length - 1].type.substring(6);
        } else {
            wutArray.push(tempProgArray[i])
        }
        
        if(i === tempProgArray.length-1){
            endTime = tempProgArray[i].createdAt
        }
    }
    console.log(expArray, auditArray, levelArray, skillArray, wutArray);
    userInfo = {
        "name": rawUserData.user.firstName + " " + rawUserData.user.lasttName,
        "e-mail": rawUserData.user.email,
        "login": rawUserData.user.login,
        "exp": rawUserData.user.totalUp,
        "level": levelArray[levelArray.length - 1].amount
    }
    console.log(userInfo)
    return {
        "user": userInfo,
        "rawUser": rawUserData.user,
        "endTime":endTime ,
        "exp": expArray,
        "audits": auditArray,
        "levels": levelArray,
        "skills": skillArray
    }
};


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
    let normalizedExp = {};
    let normalizedAudits = {};
    let normalizedLevels = {};

    if (graphData.rawUser.auditRatio <= 1) {
        normalizedExp = normalizeGraphValues(graphData.exp, graphData.rawUser.totalUp, graphData.endTime, graphWidth, graphHeight * graphData.rawUser.auditRatio);
        normalizedAudits = normalizeGraphValues(graphData.audits, graphData.rawUser.totalDown, graphData.endTime, graphWidth, graphHeight);
    } else {
        normalizedExp = normalizeGraphValues(graphData.exp, graphData.rawUser.totalUp, graphData.endTime, graphWidth, graphHeight);
        normalizedAudits = normalizeGraphValues(graphData.audits, graphData.rawUser.totalDown, graphData.endTime, graphWidth, graphHeight / graphData.rawUser.auditRatio);
    }

    normalizedLevels = normalizeGraphValues(graphData.levels, 60, graphData.endTime, graphWidth, graphHeight)
    let svg = '<svg width="'+(graphWidth+10)+'" height="'+(graphHeight+10)+'" version="1.1" xmlns="http://www.w3.org/2000/svg">';
    svg += '<rect x="0" y="0" width="'+graphWidth+'" height="'+graphHeight+'" stroke="#aaaaaa" fill="transparent" stroke-width="4"/>';
    svg += createLineGraph(normalizedExp, graphHeight, "#ff0000", "STUDENT EXP");
    
    
    
    svg +='</svg>'
    return svg;
}

function normalizeGraphValues(array, maxValue, endTime, graphWidth, graphHeight) {
    let timeStep = graphWidth/endTime;
    let valueStep = graphHeight/maxValue;
    for (let i = 0; i < array.length; i++) {
        array[i].createdAt = array[i].createdAt*timeStep;
        array[i].amount = array[i].amount*valueStep;
    }
    console.log(array);
    return array;
}

function createLineGraph(array, graphHeight, color, infoText){
    //<polyline points="60, 110 65, 120 70, 115 75, 130 80, 125 85, 140 90, 135 95, 150 100, 145"/>
    let svg ='<polyline points="';
    //let startY = -graphHeight;
    let xAccumulator = 0;
    let yAccumulator = graphHeight;
    for(let i = 0; i<array.length;i++){
        svg+=String(xAccumulator)+" "+String(yAccumulator)
        if(i < array.length-1){
            svg+=" , "
        }
        xAccumulator+=array[i].createdAt;
        yAccumulator-=array[i].amount;
    }
    svg+='"stroke="'+color+'" fill="transparent" stroke-width="2"/>'


    xAccumulator = 0;
    yAccumulator = graphHeight;
    for(let i = 0; i<array.length;i++){
        svg+='<ellipse cx="'+xAccumulator+'" cy="'+yAccumulator+'" rx="4" ry="4" fill="'+color+'"stroke="'+color+'" stroke-width="2"/>'
        xAccumulator+=array[i].createdAt;
        yAccumulator-=array[i].amount;
    }

    /*
    <text>
    This is
    <tspan font-weight="bold" fill="red">bold and red</tspan>
  </text>

  <style>
    <![CDATA[
      text{
        dominant-baseline: hanging;
        font: 28px Verdana, Helvetica, Arial, sans-serif;
      }
    ]]>
  </style>
    */
    return svg;
}

function getAuthentication() {

}

function displayError(error) {

}