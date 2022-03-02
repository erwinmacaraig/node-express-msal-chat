var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/log-to-chat', async (req, res) => {
  console.log(req.session);  
  res.render('join_to_chat');
});

module.exports = router;
