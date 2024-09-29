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
            })
         console.log("response",response);
    }else{
        infoSection.innerText = "Please provide both your KOOD/JÕHVI username or email address, and KOOD/JÕHVI password"
    }

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