
//Investor Portfolio Calculator
//Author: Orkun AKALAN
//orkunakalan@gmail.com

//Params: 
//token:STRING(Optional), date:TIMESTAMP(Optional)
//Example usage: node index.js --token=BTC --date=1571965053

const api_key = "ee8be2a5be2979dff3b4f4619b6ab9bcc9f5961d9ab90b5ac978b6cec51f5cd9";
const fs = require('fs'); 
const csv = require('csv-parser');
var rp = require('request-promise');
const ora = require('ora');
const path = require('path');
const filePath = path.join(__dirname, 'transactions_small_for_test.csv');
var tokensArray = []
var tokens = {};
var tokensPortfolio = {};
var apiRestUrlArray = [];
var argv = require('minimist')(process.argv.slice(2));
const throbber = ora('Processing the transaction data').start();

fs.createReadStream(filePath).pipe(csv()).on('data', function(data){
    try {
		
		//if date is bigger; don't process
		if(("date" in argv) && (parseInt(data.timestamp) > parseInt(argv["date"]))) 
			return;
		
		if(!tokensArray.includes(data.token)) 
			tokensArray.push(data.token);
		
		//create initial balance, first time
		if(!(data.token in tokens)) 
			tokens[data.token] = 0.0;
		
		//add or substract
		if(data.transaction_type == "DEPOSIT")
			tokens[data.token] += parseFloat(data.amount);
		else if(data.transaction_type == "WITHDRAWAL")
			tokens[data.token] -= parseFloat(data.amount);
		
    }
    catch(err) {
        //do nothing
    }
})
.on('end',function(){
		
	tokensArray = Object.keys(tokens);
	tokensArray.forEach(token => {
		var thisApiUrl = (("date" in argv)) ? (getHistoricalAPIURL(token, api_key, parseInt(argv["date"]))) : (getAPIURL(token, api_key));
		apiRestUrlArray.push(thisApiUrl);
	});
	
	getFromApiRest(apiRestUrlArray).then(function (result) {
		
		var i=0;
		result.forEach(resultEach => {
			var apiResponse = JSON.parse(resultEach);
			var tokenPrice = (("date" in argv)) ? (apiResponse.Data.Data[1].close) : (apiResponse.USD);
			tokensPortfolio[tokensArray[i]] = tokens[tokensArray[i]]*parseFloat(tokenPrice);
			i++;
		});
		
		throbber.stop();
		
		//Params: No token
		if( !("token" in argv) ) {
			console.log(tokensPortfolio);
		//Params: token
		} else if( ("token" in argv) ) {
			var singleTokenPortfolio = {};
			if( (argv["token"] in tokensPortfolio) ) {
				singleTokenPortfolio[argv["token"]] = tokensPortfolio[argv["token"]];
				console.log(singleTokenPortfolio);
			} else {
				console.log("Token does not exist in portfolio!");
			}
		}
		
	}).catch(function (e) {
		console.log('Exception: ' + e);
	});
	
	
});  

//Get API Url for current time price for 'token'
function getAPIURL(token, api_key) {
	var api_url = "https://min-api.cryptocompare.com/data/price?fsym=";
	api_url+=token;
	api_url+="&tsyms=USD&api_key=";
	api_url+=api_key;
	return api_url;
}

//Get API Url for historical price of 'token' in 'timestamp'
function getHistoricalAPIURL(token, api_key, timestamp) {
	var api_url = "https://min-api.cryptocompare.com/data/v2/histoday?fsym=";
	api_url+=token;
	api_url+="&tsym=USD&api_key=";
	api_url+=api_key;
	api_url+="&limit=1&toTs=";
	api_url+=timestamp;
	return api_url;
}

//Https get request
function getFromApiRest(apiRestUrlArray) {
    let ps = [];
    for (let i = 0; i < apiRestUrlArray.length; i++) {
        let ops = {
            method: 'GET',
            uri:apiRestUrlArray[i],
        };
        ps.push(rp.get(ops));
    }
    return Promise.all(ps.map(p => p.catch(e => e)))
}




