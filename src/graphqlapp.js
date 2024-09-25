const graphqlEndpoint = "https://01.kood.tech/api/graphql-engine/v1/graphql";
const authEndpoinint = "https://01.kood.tech/api/auth/signin";

let user = null;
let pwd = null;

let JWToken = null;

let statsData = null;

let loginSection = null;
let graphSection = null; 
let logoutSection = null; 

let app = init();

function init() {
    console.log("ok can start");
    preparePage();
    displayLogin();
}

function preparePage(){
    
}

function displayLogin() {

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