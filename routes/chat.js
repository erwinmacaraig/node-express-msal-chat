const express = require('express');
const router = express.Router();
const axios = require('axios');
const dbOperator = require('../db/dboperator');

router.get('/', (req, res) => {
    res.send('<h1>this is the chat page</h1>');
});

router.get('/send-message', async (req, res) => {
    let person = await dbOperator.loadPerson(60366);
    res.send(`<h1>${person['chvFirstName']} ${person['chvLastName']}</h2>`);
});

router.post('/process-chat-login', async (req, res) => {
    console.log(req.body.username);
    let person;
    try {
        person = await dbOperator.loadPersonByEmail(req.body.username);

        if (!person['chvConversationUserUID']) {
            try {
                // todo CREATE IDENTITY
                // 
                // http://localhost:7071/api/create-identity
                const accessAPIResult = await axios.post('https://acs-chat-fnc.azurewebsites.net/api/create-identity?code=FpADU5NyxR2vEsGc1doeiFJ9SFQdidc6yVdqNmQJuKNd08GvEGgUMw==', {
                    "intPersonID": person['intPersonID']
                });
                console.log(accessAPIResult);
                req.session.chatIdentity = accessAPIResult.communicationUserId; 
                
            } catch(e) {
                console.log(e);
                return res.status(400).send({
                    message: 'Unable to create identity for the user'
                });
            }
        } else {
            req.session.chatIdentity = person['chvConversationUserUID'];
        }
        req.session.personId = person['intPersonID'];
        return res.status(200).send({
            "message": "Successful"
        });
    } catch(e) {
        return res.status(400).send({
            message: "No user found"
        });
    }    
});

router.get('/select-chat-group', async (req, res) => {
    console.log(req.session);
    let person;
    let groups = [];
    if (!req.session.chatIdentity && !req.session.personId) {
        // redirect 
        return res.redirect('/');
    }   

    // provide data 
    // 1 load person details 
    // 2 get chat group

    try {
        person = await dbOperator.loadPerson(req.session.personId);
        try {
            groups = await dbOperator.loadUsersGroup(req.session.personId);
        } catch(e) {
            console.log(e);
            groups = [];
        }
    } catch(e) {
        console.log(e);
        return res.status(400).send({
            message: e
        })
    }
    return res.status(200).render('join_group_chat_selection', {groups: groups, person: person});
});

router.post('/rejoin-chat-group', async (req, res) => {
    console.log(req.session);
    let token;
    let expiresOn;
    let person;
    let groupDetails;
    if (!req.session.chatIdentity && !req.session.personId) {
        // redirect 
        return res.redirect('/');
    }   
    try {
        person = await dbOperator.loadPerson(req.session.personId);
        groupDetails = await dbOperator.loadConversationSubGroups(req.body.group);
    } catch(e) {
        console.log(e);
        // return res.status(400).send({
        //     message: e
        // })
    }
    if (req.session.accessToken) {
        token = req.session.accessToken;
        expiresOn = req.session.expiresOn;
    } else {
        try {
            // https://acs-chat-fnc.azurewebsites.net/api/request-access-token?code=dh2XYqzWMseCwFxxjVWHdy/h6p2kT4GevWIBW9XJWzK7yalBNwtq0A==
            // http://localhost:7071/api/request-access-token
            const accessAPIResult = await axios.post('https://acs-chat-fnc.azurewebsites.net/api/request-access-token?code=dh2XYqzWMseCwFxxjVWHdy/h6p2kT4GevWIBW9XJWzK7yalBNwtq0A==', {
                "intPersonID": req.session.personId
            });

            console.log(accessAPIResult.data);            
            
            token = accessAPIResult.data.accessToken.token;
            expiresOn = accessAPIResult.data.accessToken.expiresOn;
            req.session.accessToken = token;
            req.session.expiresOn = expiresOn;
        } catch(e) {
            console.log(e);
            res.send('<h1>Error: Cannot grant access token</h2>');
            res.end();
        }
    }

    res.render('chat', {
        groupName: groupDetails['chvConversationSubGroupName'],
        communicationUserId: person['chvConversationUserUID'],
        communicationUserName: person['chvFirstName'] + " " + person['chvLastName'],
        accessToken: token,
        threadId: req.body.group,
        intConversationUserID: req.session.personId,
        accessexpiry: expiresOn

    });

});


router.post('/echo', async (req, res) => {    
    console.log(req.body);
    // http://localhost:7071/api/send-group-message
    // https://acs-chat-fnc.azurewebsites.net/api/send-group-message?code=bxUANeftE/LqzNa4KvG0pc32cPRL6zHar8hAVxaPZUNGeJ1gh1aMag==
    try {
		const result = await axios.post(' https://acs-chat-fnc.azurewebsites.net/api/send-group-message?code=bxUANeftE/LqzNa4KvG0pc32cPRL6zHar8hAVxaPZUNGeJ1gh1aMag==',{
				"threadId": req.body.threadId,
				"intConversationUserID": req.body.intConversationUserID,
				"message": req.body.message
			},{
				"headers": {					
					"Content-Type": "application/json",
					"accesstoken": req.headers.accesstoken,
					"accessexpiry": req.headers.accessexpiry
				}
		});        
        return res.status(200).send({
            message: "OK"
        });
	} catch(e) {
        console.log('=============================================================');
		console.log(e.message);
        return res.status(400).send({
            message: e.message
        });
        
	}
    
});

router.post('/join', async (req, res) => {
    // check first if user is member of the group (done in db)
    let groupDetails;
    let memberInGroupDetails;
    let objHeaders = {
        headers: {
            accessToken: null,
            accessexpiry: null
        }
    }
   
    let token;
    let expiresOn;
    let person;
    person = await dbOperator.loadPerson(req.body.user);
    try {
        groupDetails = await dbOperator.loadConversationSubGroups(req.body.groups);
        memberInGroupDetails = await dbOperator.checkConversationMemberInGroup(groupDetails['intConversationSubGroupID'], req.body.user);
        
    } catch(e){
        console.log('()()()()()()', e);
        return res.send('<h1>You are not a member of the group<h1>');

        // if (e == 'User is not a member of the group') {
        //     try {  
        //         //  
        //         // http://localhost:7071/api/add-chat-members
        //         const apiResponse = await axios.post('https://acs-chat-fnc.azurewebsites.net/api/add-chat-members?code=ESzJL4n2Yom5Lqhw82vU6XPcotM4hflXBWobBrmqozIaZwLCwcYx/w==', {
        //             "threadId": req.body.groups,
        //             "intConversationUserID": req.body.user
        //            });
        //         // console.log('*********', apiResponse, '**********************' ); 
                
        //     } catch(e) {
        //         console.log(e);
        //         return res.send('<h1>Error: Cannot create membership</h2>');
                
        //     }
        // }


    }
    // access token
    if (req.session.accessToken) {
        token = req.session.accessToken;
    } else {
        try {
            // 
            // http://localhost:7071/api/request-access-token
            const accessAPIResult = await axios.post('https://acs-chat-fnc.azurewebsites.net/api/request-access-token?code=dh2XYqzWMseCwFxxjVWHdy/h6p2kT4GevWIBW9XJWzK7yalBNwtq0A==', {
                "intPersonID": req.body.user
            });
            console.log(accessAPIResult.data);            
            token = accessAPIResult.data.accessToken.token;
            expiresOn = accessAPIResult.data.accessToken.expiresOn;
            req.session.accessToken = token;
        } catch(e) {
            console.log(e);
            res.send('<h1>Error: Cannot grant access token</h2>');
            res.end();
        }
    }
    res.render('chat', {
        groupName: groupDetails['chvConversationSubGroupName'],
        communicationUserId: person['chvConversationUserUID'],
        communicationUserName: person['chvFirstName'] + " " + person['chvLastName'],
        accessToken: token,
        threadId: req.body.groups,
        intConversationUserID: req.body.user,
        accessexpiry: expiresOn

    });

    // load page else join user to the group
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Unable to destroy session');
            console.log(err);
            return res.status(400).send('<h3>There was an error logging you out</h3>');
        }
        console.log("session destroyed");
        return res.status(200).send(`
            <script>
                localStorage.clear(); 
                setTimeout(() => {
                    window.location.replace("/");
                }, 800)
            </script>
            <h3>Logout Successful. Redirecting...</h3>        
        `);
    });
    
});

module.exports = router;