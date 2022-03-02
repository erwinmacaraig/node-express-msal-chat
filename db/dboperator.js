const sql = require('mssql');
const dotenv = require("dotenv");
dotenv.config();
const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 3000
    },
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function selectConversationSubGroups(){
    try {
        const pool = await sql.connect(sqlConfig);
        let request = pool.request();
        request.input('intTimeZone', sql.Int, null);
        
        const result = await request.execute('spSelectConversationSubGroups');
        pool.close();
        if (result.recordset.length > 0) {
            return result.recordset;
        } else {
            throw new Error('No records found');
        }
        
        
    } catch(e) {
        throw new Error(e);

    }
}
async function loadConversationSubGroups(chvConversationSubGroupUID) {
    try {
        const pool = await sql.connect(sqlConfig);
        let request = pool.request();
        request.input('chvConversationSubGroupUID', sql.NVarChar, chvConversationSubGroupUID);
        const result = await request.query(`SELECT * FROM tblConversationSubGroups WHERE chvConversationSubGroupUID = @chvConversationSubGroupUID`);
        pool.close();
        if(result.recordset.length > 0) {
            return result.recordset[0];
        } else {            
            throw new Error('No group/thread found corresponding to that ID');
        }
    } catch(e) {
        console.log(e);
        throw new Error(e.message);
    }
}
async function checkConversationMemberInGroup(intConversationSubGroupID = 0, intConversationUserID = 0) {
    try {
        const pool = await sql.connect(sqlConfig);
        const request = pool.request();
        request.input('intConversationSubGroupID', sql.Int, intConversationSubGroupID);
        request.input('intConversationUserID', sql.Int, intConversationUserID);
        const query = `SELECT * FROM tblConversationMembers WHERE intConversationSubGroupID = @intConversationSubGroupID AND intConversationUserID = @intConversationUserID`;        
        const result = await request.query(query);
        pool.close();
        if(result.recordset.length > 0) {
            return result.recordset[0];
        } else {            
            throw 'User is not a member of the group';
        }

    } catch(e) {
        throw e;
    }
}
async function loadPerson(intPersonID=0){
    try {
        const pool = await sql.connect(sqlConfig);
        let request = pool.request();
        request.input('intPersonID', sql.Int, intPersonID);
        const result = await request.query(`SELECT * FROM tblPersons LEFT JOIN tblConversationUsers
        ON tblPersons.intPersonID = tblConversationUsers.intConversationUserID
        WHERE tblPersons.intPersonID = @intPersonID`);
        pool.close();
        if(result.recordset.length > 0) {
            return result.recordset[0];
        } else {            
            throw new Error('No user found corresponding that ID');
        }
    } catch(e) {
        console.log(e);
        throw new Error(e.message);
    }
}

async function loadPersonByEmail(email=''){
    try {
        const pool = await sql.connect(sqlConfig);
        let request = pool.request();
        request.input('email', sql.NVarChar, email);
        const result = await request.query(`SELECT * FROM tblPersons LEFT JOIN tblConversationUsers
        ON tblPersons.intPersonID = tblConversationUsers.intConversationUserID
        WHERE tblPersons.chvEmailAddress = @email`);
        pool.close();
        if(result.recordset.length > 0) {
            return result.recordset[0];
        } else {            
            throw new Error('No user found corresponding that ID');
        }
    } catch(e) {
        console.log(e);
        throw new Error(e.message);
    }
}

async function loadUsersGroup(intPersonID=0){
    try {
        const pool = await sql.connect(sqlConfig);
        let request = pool.request();
        request.input('intPersonID', sql.Int, intPersonID);
        let sqlQuery = `SELECT * FROM tblConversationMembers INNER JOIN tblConversationSubGroups 
        ON tblConversationMembers.intConversationSubGroupID = tblConversationSubGroups.intConversationSubGroupID 
        WHERE tblConversationMembers.intConversationUserID = @intPersonID`;
        const result = await request.query(sqlQuery);
        pool.close();
        if(result.recordset.length > 0) {
            return result.recordset;
        } else {            
            throw new Error('No available groups');
        }
    } catch(e) {
        console.log(e);
        throw new Error(e.message);
    }
}

module.exports = { selectConversationSubGroups, loadConversationSubGroups, checkConversationMemberInGroup, loadPerson, loadPersonByEmail, loadUsersGroup };