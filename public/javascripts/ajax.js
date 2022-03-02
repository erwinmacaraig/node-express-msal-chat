function processChatLogin(){
    // AJAX CALL HERE
    let xmlHttpRequestObj = new XMLHttpRequest();
    xmlHttpRequestObj.open("POST", "/chat/process-chat-login", true);           
    xmlHttpRequestObj.setRequestHeader('Content-type', 'application/json');
    xmlHttpRequestObj.onreadystatechange = function(){
        if(xmlHttpRequestObj.readyState == 4 && xmlHttpRequestObj.status === 200) {
          const resObj = JSON.parse(xmlHttpRequestObj.responseText);
          console.log(resObj);
          window.location.replace('/chat/select-chat-group');
        } else if (xmlHttpRequestObj.readyState == 4 && xmlHttpRequestObj.status !== 200) {
          signOut();          
        }
    }
    xmlHttpRequestObj.send(localStorage.getItem('myAccount'));

}