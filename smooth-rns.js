/***********************************************************************
 smooth-rns.js
 Kris McConkey
 smoothimpact.net
 @smoothimpact
 June 2012
 **********************************************************************/

/***********************************************************************
 Preparatory code
 **********************************************************************/
var twitter = require('ntwitter');
var http    = require('http');
var nodeio  = require('node.io');
var cronJob = require('cron').CronJob;
var Bitly   = require('bitly');

var bitly   = new Bitly('[username]', '[api key]');
var nano    = require('nano')('http://[user]:[password]@[your subdomain].iriscouch.com:5984');
var dbName = '[db name]';
var db      = nano.use(dbName);

var twitterAccess = new twitter({
  consumer_key: '[consumer key]',
  consumer_secret: '[consumer secret]',
  access_token_key: '[access token key]',
  access_token_secret: '[access token secret]'
});

var twitterUser = '[twitter username to DM]';
var stockTickers = [ 'RBS', 'KMR', 'BP.', 'RKH' ];

/***********************************************************************
 Check what mode we should operate in 
 **********************************************************************/

if( process.argv[2] )
{
  switch( process.argv[2] )
  {
    case 'test':
      console.log('no test code defined.');
      break;
    default:
      console.log( 'Error: ' + process.argv[2] + ' is not a valid argument.' );
      console.log('Usage: node rns-scraper.js [test]');
      process.exit(code=0);
  }
}
else {
  console.log( 'Running in capture mode to gather new RNS.');

  //var cronStr = '0 * * * * *'; // debug only
  //Runs every 2 minutes, Monday-Friday 7am-6pm. Does not run on Saturday or Sunday.
  var cronStr = '0 * 7-18 * * 2-6';
  cronJob(cronStr, function runCronJob() {
    var currentDate = new Date();
    var dd = currentDate.getDate().toString();
    var mm = (currentDate.getMonth() + 1).toString();
    var yyyy = currentDate.getFullYear().toString();
    var hh = currentDate.getHours().toString();
    var mins = currentDate.getMinutes().toString();

    var myDate = yyyy + (mm[1]?mm:'0'+mm[0]) + (dd[1]?dd:'0'+dd[0]) + ' ' + hh + ':' + mins;

    Scrape();
    console.log('Beginning RNS cron check (' + cronStr + ') at ' +  myDate);
  });
}

/***********************************************************************
 Core code
 **********************************************************************/

// TODO: add paging support (needed if more than 200 RNS are released at 7am)
function Scrape() {

  var methods = {
    input: false,
    run: function() {
      var url = 'http://www.londonstockexchange.com/exchange/news/market-news/market-news-home.html?newsSource=RNS&nameCode=&headlineId=&ftseIndex=&sectorCode=&text=&newsPerPage=200&rbDate=released&preDate=Today';
      this.getHtml(url, HandleScrape);
    }
  }

  var job = new nodeio.Job( methods );

  nodeio.start(job, { 'auto_retry':true }, 
    function (err, output) {
      if( err ) {
        console.log(err);
        return;
      }
      // now that node.io has scraped what we want, let's use it
      if( output.length > 0 ) {
        HandleRNS(output);
      }	
    }, 
  true);
}

function HandleScrape(err, $) {

  console.log('Entering HandleScrape()');

  //Handle any request / parsing errors
  // TODO: some better error handling here
  if( err ) {
    this.exit(err);
  }

  var rns = [];
  var output = [];

  /*
    TBODY
      TR
        TD (datetime)
        TD (ticker symbol)
        TD (ticker name)
        TD (link to announcement)
        .....
  */

  try {
    $('tbody.table_datinews').each(function parseRNS(rnsItem) {

      // this is correct for names which aren't contained within <A> tags
      //console.log(rnsItem.children[1].children[2].children[0].data);

      var rnsDate = rnsItem.children[1].children[0].children[0].data;
      var rnsTicker = rnsItem.children[1].children[1].children[0].data;
      var rnsTickerName = '';

      if( rnsItem.children[1].children[2].children[0].children ) {
        rnsTickerName = rnsItem.children[1].children[2].children[0].children[0].data;
      }
      else {
        rnsTickerName = rnsItem.children[1].children[2].children[0].data;
      }

      var rnsLink = rnsItem.children[1].children[3].children[0].data;

      rnsTickerName = rnsTickerName.replace(/(\r\n|\n|\r|\t)/gm,'');
      rnsLink = rnsLink.replace(/(\r\n|\n|\r|\t)/gm,'');

      var regex = /[^\?]*(announcementId=([^\']+))/;
      var regOut = rnsLink.match(regex);

      // if we get a dud rns, don't include it
      if( regOut && regOut[2] ) {

        var announcementId = regOut[2]; 

        console.log( 'RNS ID: ' + announcementId );
        console.log( 'RNS Date: ' + rnsDate );
        console.log( 'RNS Ticker: ' + rnsTicker );
        console.log( 'RNS TickerName: ' + rnsTickerName );

        rns.push( { 'rnsId':announcementId, 'rnsDate':rnsDate, 'rnsTicker':rnsTicker, 'rnsTickerName':rnsTickerName, 'rnsLink':rnsLink } ); 
      }
    });
  }
  catch( error ) {
    console.log('Caught: ' + error.message);
  }

  for( var i = 0; i < rns.length; i++ ) {
    output.push( rns[i] );
  }

  this.emit(output);
}
 
 /* eventually I'll pull my current stocks from Google Finance */
function HandleRNS(rnsAlerts)
{
  console.log('Entering HandleRNS()');

  for( var i = 0; i < rnsAlerts.length; i++ ) {
    var rns = rnsAlerts[i];

    if( stockTickers.indexOf( rns.rnsTicker ) != -1 ) {
      console.log('Found relevant RNS for ' + rns.rnsTicker);
      InsertRNS(rns);
    }
  }
}

/* let's store a copy of the RNS details in our CouchDB */
function InsertRNS(rns)
{
  // check if the current rns is already in the database
  var existingRns = db.get( rns.rnsId,
    function (error, r, h) {
      if( error ) { 
        if( error.message == 'missing' || error.message == 'deleted'  ) {
          // we don't have one so let's insert
          console.log( 'Inserting RNS with ID ' + rns.rnsId );

          db.insert(rns, rns.rnsId,
            function (error, httpBody, httpHeaders) {
              if( error ) { return console.log('Checkpoint 2: ' + error.message); }
              else { 
                console.log('Result from inserting RNS ID ' + rns.rnsId + ':'); 
                console.log(httpBody); 

                bitly.shorten('http://www.londonstockexchange.com/exchange/news/market-news/market-news-detail.html?announcementId=' + rns.rnsId, function(err, response) {
                  if( err ) throw err;

                  // See http://code.google.com/p/bitly-api/wiki/ApiDocumentation for format of returned object
                  var shortUrl = response.data.url

                  // send ourselves a DM on Twitter to let us know about the new RNS
                  SelfDM('Recorded RNS for ' + rns.rnsTickerName + '. ' + shortUrl  );
                });
              }
            }
          );
        }
        else {
          console.log('Error: ' + error.message);
        }
      }
      else { 
        // we do, somehow, already have an RNS with this ID
        console.log('RNS already exists with id ' + rns.rnsId);
      }
    }
  );
}


function Sleep(milliSeconds) {
  var startTime = new Date().getTime();
  while (new Date().getTime() < startTime + milliSeconds);
}

// TODO: length checking
function SelfDM(text) {
  twitterAccess.newDirectMessage(twitterUser, text, function(err, data) {
    if( err ) {
      console.log('Unable to send DM confirmation:');
      console.log(err);
    }
    else {
      console.log('Sent DM confirmation of new RNS at ' + data.created_at);
    }
  }	
  );
}
  
