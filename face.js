/**
*
*  Servidor que se comunica com twitter  
*
*
*/

var   express     = require('express')
    , MemoryStore = require('connect/lib/middleware/session/memory')
    , TwitterNode = require('twitter-node').TwitterNode
    , sys         = require('sys')
    , nowjs       = require('now')
    , strstr 	 = require('strstr');    


var app = express.createServer();



app.configure('development', function(){
  app.set("views", __dirname + "/views");
  app.register(".html", require("ejs"));
  app.set("view engine", "html");
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.session({ secret :"samuel",store: new MemoryStore({ reapInterval: 60000 * 10 }) }));
 
});


app.dynamicHelpers({
  session: function(req, res){
    return req.session;
  }
});

app.get('/', function(req, res){
  res.render('index',{    
    
  });  
  
  
});


app.post('/', function(req, res){
  res.render('index',{
  });  
  
  
});


app.listen(80);


//twitter configs to connect to the twitter stream.
var twit = new TwitterNode({
    user: 'twitterusername', //set your twitter user here
    password: 'twitterpasword', //set your twitter pass here
    action:'filter',
    track: ['amor','odio'],  
    
});

var onTweetListener = function(tweet){
   if( strstr(tweet.text, "love")!=false ||  strstr(tweet.text, "amor")!=false)  
   {
    //console.log('tweet: '+ '@' + tweet.user.screen_name + ': ' + tweet.text);
    everyone.now.renderStream(tweet.user.profile_image_url , tweet.user.screen_name, tweet.text,"1");
    everyone.now.updateLove(++everyone.now.love);
   }
   if( strstr(tweet.text, "hate")!=false ||  strstr(tweet.text, "odio")!=false)  
   {
     //console.log('tweet: '+ '@' + tweet.user.screen_name + ': ' + tweet.text);
     everyone.now.renderStream(tweet.user.profile_image_url , tweet.user.screen_name, tweet.text,"2");
     everyone.now.updateHate(++everyone.now.hate);
   }
   
};


twit
    .on('error', function(error){
        //console.log('error: ' + error.message);
    })
    .on('tweet', onTweetListener)
    .on('end', function(resp){
        //console.log('end:' + resp.statusCode);
    });
twit.setMaxListeners(500);

//Now.js initialization
everyone  = nowjs.initialize(app);
everyone.now.totalConnected = 0;
everyone.now.love = 0;
everyone.now.hate = 0;



everyone.connected(function(){
  everyone.now.goStreaming(); 
  //console.log('user connected: ' + this.user.clientId);
  everyone.now.updateTotalConnected(++everyone.now.totalConnected,everyone.now.love,everyone.now.hate);
  
  
});
everyone.disconnected(function(){
  //console.log('user disconnected: ' + this.user.clientId);
  everyone.now.updateTotalConnected(--everyone.now.totalConnected);
  if(everyone.now.totalConnected==0)
    everyone.now.stopStreaming();
});



everyone.now.stopStreaming = function(){
  //console.log('stoping the streaming: ' + this.user.clientId);
  twit.removeListener('tweet', onTweetListener);
};

everyone.now.goStreaming = function(){
  twit.stream();
  twit.on('tweet', onTweetListener);
};
