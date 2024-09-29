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

function preparePage(){
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
    loginButton.addEventListener("click", initiateLogin)

}

async function initiateLogin(){
    infoSection.innerText = "";
    user = document.getElementById("name_input").value;
    pwd = document.getElementById("passwd_input").value;

    //let login = btoa(`${user}:${pwd}`);
    let login = btoa(user+":"+pwd);
    console.log("login", login);
    if(user !== "" && pwd !==""){
        let response = await fetch(authEndpoinint, {
            method: "POST",
            //headers: {'Authorization': `Basic ${login}`}
            headers: {'Authorization': "Basic "+login}
            }).catch(handleCredentialsError);
         console.log("response",response);
        if(response.status = 200){
            let token = await response.json();
            console.log(token);
            let graphData = getUserData(token);
            fillAppPage(graphData);
        }
    }else{
        infoSection.innerText = "Please provide both your KOOD/JÕHVI username or email address, and KOOD/JÕHVI password"
    }

}

function handleCredentialsError(error){
    console.log("handling errors");
    infoSection.innerText = error;
    console.log(error);
}

async function getUserData(token){
    let userData = null;
    let headers = {
        "Content-type": "application/json",
        Authorization: "Bearer "+token
    };
    
    let query = "{ user {id login transaction}}";

    let userDataRequest = {
        "method": "POST",
        "headers": headers,
        "body": JSON.stringify({ "query": query }),
    };

    let userDataResponse = await fetch(graphqlEndpoint, requestOptions);
    userData = await userDataResponse.json();
    console.log(userData);
}

function fillAppPage(graphData){

}

function displayLogout(){
    
}

function getAuthentication() {

}

function displayError(error) {

}

function displayGraphPage() {

}

function createProgressGraph(data) {
    let graph = null;
    return graph;
}

function createAuditGraph(data) {
    let graph = null;
    return graph;
}