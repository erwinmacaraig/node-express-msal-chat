// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication(msalConfig);

function signIn() {
    myMSALObj.loginPopup({})
        .then(() => {
          const myAccounts = myMSALObj.getAllAccounts();
          console.log(myAccounts[0]);
          localStorage.setItem('myAccount', JSON.stringify(myAccounts[0]));
          document.querySelector('#login-section').style.display = "none";
          document.getElementById('my-loader').classList.add("loader");
          processChatLogin();
          
          // this.account = myAccounts[0];          
        })
        .catch(error => {
          console.error(`error during authentication: ${error}`);
        });
}

function signOut() {
  
  myMSALObj.logoutRedirect({
    account: JSON.parse(localStorage.getItem('myAccount')),
    postLogoutRedirectUri: "/chat/logout", 
    mainWindowRedirectUri: "/" 
  });
  
}